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

  /**
   * Health check - verify QB OAuth service is configured correctly
   * Returns basic connectivity test without requiring active tokens
   */
  async healthCheck(): Promise<{
    credentialsConfigured: boolean;
    clientId: string;
    environment: string;
    redirectUri: string;
  }> {
    return {
      credentialsConfigured: !!(this.config.clientId && this.config.clientSecret),
      clientId: this.config.clientId ? `${this.config.clientId.substring(0, 8)}...` : 'Not configured',
      environment: this.config.environment,
      redirectUri: this.config.redirectUri,
    };
  }
}

/**
 * Create QuickBooks OAuth service from environment variables
 */
export async function createQuickBooksOAuthService(storage?: any): Promise<QuickBooksOAuthService> {
  let clientId = '';
  let clientSecret = '';
  let redirectUri = '';
  let environment = '';
  let activeConfig = 'dev'; // default to dev

  // Priority 1: Load from database (if storage provided)
  if (storage) {
    try {
      const allSettings = await storage.getAllSystemSettings();
      const settingsMap = allSettings.reduce((acc: Record<string, string>, setting: { key: string; value: string | null }) => {
        acc[setting.key] = setting.value || '';
        return acc;
      }, {} as Record<string, string>);

      // Check which config is active
      activeConfig = settingsMap.qb_active_config || 'dev';
      
      // Load credentials based on active config
      const prefix = activeConfig === 'prod' ? 'qb_prod_' : 'qb_dev_';
      
      clientId = settingsMap[`${prefix}client_id`] || settingsMap.qb_client_id || '';
      clientSecret = settingsMap[`${prefix}client_secret`] || settingsMap.qb_client_secret || '';
      redirectUri = settingsMap[`${prefix}redirect_uri`] || settingsMap.qb_redirect_uri || '';
      
      // Environment is always based on active config
      environment = activeConfig === 'prod' ? 'production' : 'sandbox';
    } catch (error) {
      console.error('Failed to load QB settings from database:', error);
    }
  }

  // Priority 2: Fall back to environment variables if database values not set
  clientId = clientId || process.env.QB_CLIENT_ID || '';
  clientSecret = clientSecret || process.env.QB_CLIENT_SECRET || '';
  redirectUri = redirectUri || process.env.QB_REDIRECT_URI || '';
  environment = environment || process.env.QB_ENVIRONMENT || '';

  // Priority 3: Auto-detect redirect URI based on environment
  if (!redirectUri) {
    // Check if running on Replit
    if (process.env.REPLIT_DEV_DOMAIN) {
      // Replit development environment - use the .repl.co domain
      redirectUri = `https://${process.env.REPLIT_DEV_DOMAIN}/api/quickbooks/callback`;
    } else if (process.env.REPLIT_DOMAINS) {
      // Replit deployment - use published domain
      const domain = process.env.REPLIT_DOMAINS.split(',')[0];
      redirectUri = `https://${domain}/api/quickbooks/callback`;
    } else {
      // Local development fallback
      redirectUri = 'http://localhost:5000/api/quickbooks/callback';
    }
  }
  
  const finalEnvironment = (environment as 'sandbox' | 'production') || 'sandbox';

  if (!clientId || !clientSecret) {
    throw new Error('QuickBooks OAuth credentials not configured. Set QB_CLIENT_ID and QB_CLIENT_SECRET environment variables or configure in Admin panel.');
  }

  return new QuickBooksOAuthService({
    clientId,
    clientSecret,
    redirectUri,
    environment: finalEnvironment,
  });
}
