import axios from 'axios';
import crypto from 'crypto';

// QuickBooks OAuth 2.0 configuration
const QB_AUTH_URL = 'https://appcenter.intuit.com/connect/oauth2';
const QB_TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
const QB_REVOKE_URL = 'https://developer.api.intuit.com/v2/oauth2/tokens/revoke';

export interface QuickBooksConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  environment: 'sandbox' | 'production';
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  x_refresh_token_expires_in: number;
  token_type: string;
}

export interface AuthUrlResult {
  authUrl: string;
  state: string;
}

export class QuickBooksOAuthService {
  private config: QuickBooksConfig;

  constructor(config: QuickBooksConfig) {
    this.config = config;
  }

  /**
   * Generate OAuth authorization URL with CSRF protection
   */
  generateAuthUrl(): AuthUrlResult {
    // Generate random state for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');
    
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: 'com.intuit.quickbooks.accounting',
      state: state,
    });

    const authUrl = `${QB_AUTH_URL}?${params.toString()}`;
    
    return { authUrl, state };
  }

  /**
   * Exchange authorization code for access and refresh tokens
   */
  async exchangeCodeForTokens(code: string): Promise<TokenResponse> {
    const auth = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');
    
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: this.config.redirectUri,
    });

    try {
      const response = await axios.post(QB_TOKEN_URL, params.toString(), {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('QuickBooks token exchange error:', error.response?.data);
        throw new Error(`Failed to exchange code for tokens: ${error.response?.data?.error || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    const auth = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');
    
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });

    try {
      const response = await axios.post(QB_TOKEN_URL, params.toString(), {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('QuickBooks token refresh error:', error.response?.data);
        
        // If refresh token is expired or invalid, return a specific error
        if (error.response?.status === 400) {
          throw new Error('REFRESH_TOKEN_INVALID');
        }
        
        throw new Error(`Failed to refresh access token: ${error.response?.data?.error || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Revoke tokens (disconnect)
   */
  async revokeTokens(refreshToken: string): Promise<void> {
    const auth = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');
    
    const params = new URLSearchParams({
      token: refreshToken,
    });

    try {
      await axios.post(QB_REVOKE_URL, params.toString(), {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('QuickBooks token revoke error:', error.response?.data);
        throw new Error(`Failed to revoke tokens: ${error.response?.data?.error || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Check if access token is expired or about to expire (within 5 minutes)
   */
  isTokenExpired(expiresAt: Date): boolean {
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
    return expiresAt <= fiveMinutesFromNow;
  }

  /**
   * Calculate token expiry date from expires_in seconds
   */
  calculateExpiryDate(expiresInSeconds: number): Date {
    return new Date(Date.now() + expiresInSeconds * 1000);
  }

  /**
   * Get QuickBooks API base URL based on environment
   */
  getApiBaseUrl(): string {
    return this.config.environment === 'production'
      ? 'https://quickbooks.api.intuit.com'
      : 'https://sandbox-quickbooks.api.intuit.com';
  }
}

/**
 * Create QuickBooks OAuth service from environment variables
 */
export function createQuickBooksOAuthService(): QuickBooksOAuthService {
  const clientId = process.env.QB_CLIENT_ID || '';
  const clientSecret = process.env.QB_CLIENT_SECRET || '';
  const redirectUri = process.env.QB_REDIRECT_URI || 'http://localhost:5000/api/quickbooks/callback';
  const environment = (process.env.QB_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox';

  if (!clientId || !clientSecret) {
    throw new Error('QuickBooks OAuth credentials not configured. Set QB_CLIENT_ID and QB_CLIENT_SECRET environment variables.');
  }

  return new QuickBooksOAuthService({
    clientId,
    clientSecret,
    redirectUri,
    environment,
  });
}
