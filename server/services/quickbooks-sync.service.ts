import axios, { AxiosError } from 'axios';
import { QuickBooksOAuthService } from './quickbooks-oauth.service';
import { storage } from '../storage';
import type { QuickbooksConnection, InsertQuickbooksInvoice } from '../../shared/schema';

export interface QuickBooksCustomer {
  Id: string;
  DisplayName: string;
  CompanyName?: string;
  PrimaryEmailAddr?: {
    Address: string;
  };
  Active: boolean;
}

export interface QuickBooksInvoice {
  Id: string;
  DocNumber: string;
  TxnDate: string;
  DueDate?: string;
  CustomerRef: {
    value: string;
    name?: string;
  };
  TotalAmt: number;
  Balance: number;
  EmailStatus?: string;
  PrivateNote?: string;
  SyncToken?: string;
  Line?: any[];
  LinkedTxn?: any[];
}

export interface QuickBooksQueryResponse<T> {
  QueryResponse: {
    [key: string]: T[] | number | undefined;
  };
  time: string;
}

export class QuickBooksSyncService {
  private oauthService: QuickBooksOAuthService;

  constructor(oauthService: QuickBooksOAuthService) {
    this.oauthService = oauthService;
  }

  /**
   * Ensure access token is valid, refresh if needed
   */
  private async ensureValidToken(connection: QuickbooksConnection): Promise<string> {
    // Check if token is expired or about to expire
    if (this.oauthService.isTokenExpired(new Date(connection.accessTokenExpiresAt))) {
      console.log('Access token expired, refreshing...');
      
      try {
        const tokenResponse = await this.oauthService.refreshAccessToken(connection.refreshToken);
        
        // Update connection with new tokens
        const updatedConnection = await storage.updateQuickbooksConnection(connection.organizationId, {
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token,
          accessTokenExpiresAt: this.oauthService.calculateExpiryDate(tokenResponse.expires_in),
          refreshTokenExpiresAt: this.oauthService.calculateExpiryDate(tokenResponse.x_refresh_token_expires_in),
          status: 'connected',
          errorMessage: null,
        });
        
        return updatedConnection.accessToken;
      } catch (error) {
        // If refresh fails, mark connection as token_expired
        await storage.updateQuickbooksConnection(connection.organizationId, {
          status: 'token_expired',
          errorMessage: error instanceof Error ? error.message : 'Token refresh failed',
        });
        throw new Error('REFRESH_TOKEN_INVALID');
      }
    }
    
    return connection.accessToken;
  }

  /**
   * Make a QuickBooks API request with automatic token refresh
   */
  private async makeQBRequest<T>(
    connection: QuickbooksConnection,
    endpoint: string,
    params?: Record<string, string>
  ): Promise<T> {
    const accessToken = await this.ensureValidToken(connection);
    const baseUrl = this.oauthService.getApiBaseUrl();
    const url = `${baseUrl}/v3/company/${connection.realmId}/${endpoint}`;

    try {
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        params,
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Handle 401 - token might have expired between check and request
        if (error.response?.status === 401) {
          console.log('Got 401, attempting token refresh...');
          
          try {
            const tokenResponse = await this.oauthService.refreshAccessToken(connection.refreshToken);
            
            await storage.updateQuickbooksConnection(connection.organizationId, {
              accessToken: tokenResponse.access_token,
              refreshToken: tokenResponse.refresh_token,
              accessTokenExpiresAt: this.oauthService.calculateExpiryDate(tokenResponse.expires_in),
              refreshTokenExpiresAt: this.oauthService.calculateExpiryDate(tokenResponse.x_refresh_token_expires_in),
              status: 'connected',
            });
            
            // Retry request with new token
            const retryResponse = await axios.get(url, {
              headers: {
                'Authorization': `Bearer ${tokenResponse.access_token}`,
                'Accept': 'application/json',
              },
              params,
            });
            
            return retryResponse.data;
          } catch (refreshError) {
            await storage.updateQuickbooksConnection(connection.organizationId, {
              status: 'error',
              errorMessage: 'Authentication failed',
            });
            throw new Error('AUTHENTICATION_FAILED');
          }
        }

        // Handle 429 - rate limit
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'];
          throw new Error(`RATE_LIMIT_EXCEEDED: Retry after ${retryAfter || 60} seconds`);
        }

        throw new Error(`QuickBooks API error: ${error.response?.data?.Fault?.Error?.[0]?.Detail || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Escape single quotes in QuickBooks query strings
   */
  private escapeQBString(str: string): string {
    return str.replace(/'/g, "\\'");
  }

  /**
   * Search QuickBooks customers
   */
  async searchCustomers(organizationId: string, searchTerm: string): Promise<QuickBooksCustomer[]> {
    const connection = await storage.getQuickbooksConnection(organizationId);
    if (!connection) {
      throw new Error('QuickBooks not connected for this organization');
    }

    const query = searchTerm 
      ? `SELECT * FROM Customer WHERE DisplayName LIKE '%${this.escapeQBString(searchTerm)}%' OR CompanyName LIKE '%${this.escapeQBString(searchTerm)}%' MAXRESULTS 50`
      : 'SELECT * FROM Customer MAXRESULTS 50';

    const response = await this.makeQBRequest<QuickBooksQueryResponse<QuickBooksCustomer>>(
      connection,
      'query',
      { query, minorversion: '65' }
    );

    const customers = response.QueryResponse.Customer;
    return Array.isArray(customers) ? customers : [];
  }

  /**
   * Get QuickBooks customer by ID
   */
  async getCustomer(organizationId: string, customerId: string): Promise<QuickBooksCustomer> {
    const connection = await storage.getQuickbooksConnection(organizationId);
    if (!connection) {
      throw new Error('QuickBooks not connected for this organization');
    }

    const response = await this.makeQBRequest<{ Customer: QuickBooksCustomer }>(
      connection,
      `customer/${customerId}`,
      { minorversion: '65' }
    );

    return response.Customer;
  }

  /**
   * Fetch invoices for a specific QuickBooks customer
   */
  async fetchInvoicesForCustomer(organizationId: string, qbCustomerId: string): Promise<QuickBooksInvoice[]> {
    const connection = await storage.getQuickbooksConnection(organizationId);
    if (!connection) {
      throw new Error('QuickBooks not connected for this organization');
    }

    // Escape customer ID for QB query
    const escapedCustomerId = this.escapeQBString(qbCustomerId);
    const query = `SELECT * FROM Invoice WHERE CustomerRef = '${escapedCustomerId}' ORDERBY TxnDate DESC MAXRESULTS 500`;

    const response = await this.makeQBRequest<QuickBooksQueryResponse<QuickBooksInvoice>>(
      connection,
      'query',
      { query, minorversion: '65' }
    );

    const invoices = response.QueryResponse.Invoice;
    return Array.isArray(invoices) ? invoices : [];
  }

  /**
   * Sync invoices from QuickBooks to local database
   */
  async syncInvoices(organizationId: string): Promise<{ synced: number; errors: string[] }> {
    const connection = await storage.getQuickbooksConnection(organizationId);
    if (!connection) {
      throw new Error('QuickBooks not connected for this organization');
    }

    if (!connection.qbCustomerId) {
      throw new Error('QuickBooks customer not mapped for this organization');
    }

    const errors: string[] = [];
    let synced = 0;

    try {
      // Fetch invoices from QuickBooks
      const qbInvoices = await this.fetchInvoicesForCustomer(organizationId, connection.qbCustomerId);

      // Upsert each invoice to local database
      for (const qbInvoice of qbInvoices) {
        try {
          const invoiceData: InsertQuickbooksInvoice = {
            organizationId,
            qbInvoiceId: qbInvoice.Id,
            qbDocNumber: qbInvoice.DocNumber,
            qbCustomerId: qbInvoice.CustomerRef.value,
            balance: qbInvoice.Balance.toString(),
            totalAmount: qbInvoice.TotalAmt.toString(),
            dueDate: qbInvoice.DueDate ? new Date(qbInvoice.DueDate) : null,
            txnDate: new Date(qbInvoice.TxnDate),
            emailStatus: qbInvoice.EmailStatus || null,
            privateNote: qbInvoice.PrivateNote || null,
            qbRawData: JSON.stringify(qbInvoice),
            syncToken: qbInvoice.SyncToken || null,
          };

          await storage.upsertQuickbooksInvoice(invoiceData);
          synced++;
        } catch (error) {
          const errorMsg = `Failed to sync invoice ${qbInvoice.DocNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

      // Update last sync time
      await storage.updateQuickbooksConnection(organizationId, {
        lastSyncAt: new Date(),
        status: 'connected',
      });

      return { synced, errors };
    } catch (error) {
      await storage.updateQuickbooksConnection(organizationId, {
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Sync failed',
      });
      throw error;
    }
  }

  /**
   * Map a QuickBooks customer to an organization
   */
  async mapCustomer(organizationId: string, qbCustomerId: string): Promise<void> {
    const connection = await storage.getQuickbooksConnection(organizationId);
    if (!connection) {
      throw new Error('QuickBooks not connected for this organization');
    }

    // Fetch customer details from QuickBooks
    const customer = await this.getCustomer(organizationId, qbCustomerId);

    // Update connection with customer mapping
    await storage.updateQuickbooksConnection(organizationId, {
      qbCustomerId: customer.Id,
      qbCustomerName: customer.DisplayName,
    });
  }
}

/**
 * Create QuickBooks sync service
 */
export function createQuickBooksSyncService(oauthService: QuickBooksOAuthService): QuickBooksSyncService {
  return new QuickBooksSyncService(oauthService);
}
