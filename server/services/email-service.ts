import { ConfidentialClientApplication } from '@azure/msal-node';
import axios from 'axios';
import { ComplianceItem } from '../../shared/schema';
import { storage } from '../storage';

const clientApp = new ConfidentialClientApplication({
  auth: {
    clientId: process.env.AZURE_CLIENT_ID || '3a4ad2ca-55a1-4ceb-a786-2b0fe30f0b2c',
    clientSecret: process.env.AZURE_CLIENT_SECRET || 'WRr8Q~D5VDZzWwQNXf7DiAJwLYqRYMCt3pTbcaGu',
    authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID || 'd676934a-eb4a-495f-8608-5efe266912ff'}`,
  },
});

async function getAccessToken(): Promise<string> {
  try {
    const response = await clientApp.acquireTokenByClientCredential({
      scopes: ['https://graph.microsoft.com/.default'],
    });
    
    if (!response?.accessToken) {
      throw new Error('Failed to acquire access token');
    }
    
    return response.accessToken;
  } catch (error) {
    console.error('Error acquiring token:', error);
    throw error;
  }
}

export async function sendEmailAlert(
  complianceItem: ComplianceItem, 
  alertType: 'upcoming' | 'overdue'
): Promise<void> {
  try {
    const accessToken = await getAccessToken();
    
    // Determine recipient email based on responsible party or default
    const recipientEmail = getRecipientEmail(complianceItem.responsibleParty);
    
    const subject = alertType === 'overdue' 
      ? `🚨 OVERDUE: ${complianceItem.commitment}`
      : `⏰ UPCOMING: ${complianceItem.commitment}`;
    
    const body = generateEmailBody(complianceItem, alertType);
    
    // Create email alert record
    const emailAlert = await storage.createEmailAlert({
      complianceItemId: complianceItem.id,
      recipientEmail,
      subject,
      body,
      status: 'pending',
    });
    
    try {
      // Send email via Microsoft Graph
      await sendEmail(accessToken, recipientEmail, subject, body);
      
      // Update alert status to sent
      await storage.updateEmailAlertStatus(emailAlert.id, 'sent');
      
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
      const errorMessage = emailError instanceof Error ? emailError.message : 'Unknown error';
      await storage.updateEmailAlertStatus(
        emailAlert.id, 
        'failed', 
        errorMessage
      );
      throw emailError;
    }
    
  } catch (error) {
    console.error('Error in sendEmailAlert:', error);
    throw error;
  }
}

async function sendEmail(
  accessToken: string,
  to: string,
  subject: string,
  body: string
): Promise<void> {
  const senderEmail = process.env.SENDER_EMAIL || 'noreply@healthtrixss.com';
  
  const message = {
    message: {
      subject,
      body: {
        contentType: 'HTML',
        content: body,
      },
      toRecipients: [
        {
          emailAddress: {
            address: to,
          },
        },
      ],
    },
  };
  
  try {
    const response = await axios.post(
      `https://graph.microsoft.com/v1.0/users/${senderEmail}/sendMail`,
      message,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (response.status !== 202) {
      throw new Error(`Email send failed with status ${response.status}`);
    }
    
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Microsoft Graph API error: ${error.response?.data?.error?.message || error.message}`);
    }
    throw error;
  }
}

function getRecipientEmail(responsibleParty: string): string {
  // Map responsible parties to email addresses
  const emailMap: Record<string, string> = {
    'Jay Baker': 'jay@healthtrixss.com',
    'Health Trixss Finance': 'finance@healthtrixss.com',
    'Laura Gleason': 'laura@healthtrixss.com',
    'Health Trixss / CCAH': 'jay@healthtrixss.com',
  };
  
  return emailMap[responsibleParty] || process.env.DEFAULT_ALERT_EMAIL || 'admin@healthtrixss.com';
}

function generateEmailBody(complianceItem: ComplianceItem, alertType: 'upcoming' | 'overdue'): string {
  const formatDate = (date: Date | null) => {
    if (!date) return 'No due date';
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date));
  };
  
  const urgencyColor = alertType === 'overdue' ? '#dc3545' : '#ffc107';
  const urgencyText = alertType === 'overdue' ? 'OVERDUE' : 'UPCOMING';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Open Sans', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2E456B 0%, #277493 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .logo { display: flex; align-items: center; margin-bottom: 10px; }
        .logo-icon { width: 40px; height: 40px; background: #FEA002; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; margin-right: 12px; }
        .content { background: white; padding: 30px; border: 1px solid #e0e0e0; }
        .alert-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; color: white; font-weight: bold; font-size: 14px; margin-bottom: 20px; background-color: ${urgencyColor}; }
        .compliance-card { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .field { margin-bottom: 12px; }
        .field-label { font-weight: 600; color: #2E456B; margin-bottom: 4px; }
        .field-value { color: #666; }
        .footer { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; color: #666; font-size: 14px; }
        .cta-button { display: inline-block; background: #2E456B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">
            <div class="logo-icon">HT</div>
            <div>
              <h2 style="margin: 0; font-size: 24px;">BizGov Compliance Alert</h2>
              <p style="margin: 0; opacity: 0.9;">Health Trixss Compliance Hub</p>
            </div>
          </div>
        </div>
        
        <div class="content">
          <div class="alert-badge">${urgencyText}</div>
          
          <h3>Compliance Item Requires Attention</h3>
          <p>The following compliance item ${alertType === 'overdue' ? 'is overdue' : 'is due soon'} and requires your immediate attention:</p>
          
          <div class="compliance-card">
            <div class="field">
              <div class="field-label">Commitment</div>
              <div class="field-value">${complianceItem.commitment}</div>
            </div>
            
            <div class="field">
              <div class="field-label">Category</div>
              <div class="field-value">${complianceItem.category}</div>
            </div>
            
            <div class="field">
              <div class="field-label">Description</div>
              <div class="field-value">${complianceItem.description || 'No description provided'}</div>
            </div>
            
            <div class="field">
              <div class="field-label">Due Date</div>
              <div class="field-value" style="color: ${urgencyColor}; font-weight: 600;">${formatDate(complianceItem.dueDate)}</div>
            </div>
            
            <div class="field">
              <div class="field-label">Responsible Party</div>
              <div class="field-value">${complianceItem.responsibleParty}</div>
            </div>
            
            <div class="field">
              <div class="field-label">Status</div>
              <div class="field-value">${complianceItem.status.toUpperCase()}</div>
            </div>
          </div>
          
          <a href="${process.env.APP_URL || 'https://compliance.healthtrixss.com'}/compliance?item=${complianceItem.id}" class="cta-button">
            View in BizGov Dashboard
          </a>
          
          <p><strong>Action Required:</strong> Please log into the BizGov Compliance Hub to update the status of this item or mark it as complete.</p>
        </div>
        
        <div class="footer">
          <p>This is an automated alert from the BizGov Compliance Hub.</p>
          <p>Health Trixss LLC | Compliance Management System</p>
          <p style="font-size: 12px; margin-top: 10px;">
            Generated on ${new Date().toLocaleString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              timeZoneName: 'short'
            })}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}
