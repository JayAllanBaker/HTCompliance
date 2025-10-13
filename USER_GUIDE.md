# BizGov User Guide - Complete End-to-End Instructions

## Table of Contents
1. [Getting Started](#getting-started)
2. [Organization Management](#organization-management)
3. [Contract Management](#contract-management)
4. [Compliance Tracking](#compliance-tracking)
5. [Billable Events](#billable-events)
6. [Evidence Locker](#evidence-locker)
7. [Email Alerts](#email-alerts)
8. [Data Export & Import](#data-export--import)
9. [Admin Functions](#admin-functions)

---

## Getting Started

### First Time Login

**Default Admin Credentials (Docker):**
- Username: `admin`
- Password: `admin123`

⚠️ **IMPORTANT:** Change this password immediately after first login!

### Dashboard Overview

After login, you'll see the main dashboard with:
- **Total Items**: All compliance obligations tracked
- **Completed**: Items marked as complete
- **Pending**: Items awaiting action
- **Overdue**: Items past their due date

---

## Organization Management

Organizations (also called "customers" in the database) are the foundation of your compliance tracking.

### Creating a New Organization

1. Click **"Organizations"** in the left sidebar
2. Click **"Add Organization"** button (top right)
3. Fill in the form:
   - **Name**: Full organization name (e.g., "The Alliance")
   - **Code**: Short identifier (e.g., "ALLIANCE")
   - **Contact Email**: Primary contact email
   - **Active Status**: Toggle on/off
4. Click **"Create Organization"**

**Example:**
```
Name: The Alliance Health Network
Code: ALLIANCE
Contact Email: admin@thealliance.health
Active: ✓ Yes
```

### Editing an Organization

1. Navigate to **Organizations**
2. Click the **pencil icon** next to the organization
3. Update fields as needed
4. Click **"Update Organization"**

### Deleting an Organization

⚠️ **Warning:** You cannot delete organizations with linked compliance items or contracts!

1. Click the **trash icon** next to the organization
2. Confirm deletion in the dialog

---

## Contract Management

Contracts define the agreements and obligations with each organization.

### Creating a Contract

1. Click **"Contracts"** in the sidebar
2. Click **"Add Contract"** button
3. Fill in the details:
   - **Organization**: Select from dropdown
   - **Title**: Contract name/description
   - **Description**: Additional details (optional)
   - **Start Date**: Contract effective date
   - **End Date**: Contract expiration (optional)
   - **Max Amount**: Financial cap if applicable
   - **Active**: Toggle contract status
4. Click **"Create Contract"**

**Example:**
```
Organization: The Alliance Health Network
Title: Professional Services Agreement - SOW1
Description: Marketing and consulting services for Q3-Q4 2025
Start Date: 07/01/2025
End Date: 12/31/2025
Max Amount: $251,160.00
Active: ✓ Yes
```

### Linking Compliance Items to Contracts

When creating or editing compliance items, you can optionally link them to a contract:
- Select the organization first
- The contract dropdown will show only contracts for that organization
- Choose the relevant contract or leave blank if not applicable

---

## Compliance Tracking

This is the core feature - tracking compliance obligations and deliverables.

### Adding a Compliance Item

1. Click **"Compliance"** in the sidebar
2. Click **"Add Compliance Item"** button
3. Complete the form:

**Required Fields:**
- **Organization**: Select the customer
- **Category**: Choose from:
  - Marketing Agreement
  - Billing
  - Deliverable
  - Compliance
  - End-of-Term
- **Type**: Specific obligation type (e.g., "Quarterly Commission")
- **Commitment**: What must be done
- **Responsible Party**: Who's accountable
- **Status**: Pending/Complete/Overdue/N/A
- **Due Date**: When it's due

**Optional Fields:**
- **Contract**: Link to a specific contract
- **Description**: Additional context
- **Notes**: Internal notes

4. Click **"Create Compliance Item"**

**Example - Commission Payment:**
```
Organization: ABC Healthcare Partners
Category: Marketing Agreement
Type: Quarterly commission calculation and payment
Commitment: Quarter 3 Commission Payment - Year 2025
Description: 5% commission on fees rendered and paid during Q3
Responsible Party: Health Trixss Finance
Status: Pending
Due Date: 10/01/2025
Contract: ABC Healthcare - Marketing Agreement 2025
```

**Example - Billing Obligation:**
```
Organization: The Alliance Health Network
Category: Billing
Type: Monthly Invoice Submission
Commitment: Submit monthly invoice with valid PO
Description: Invoice must include PO, detail services, send to ap@thealliance.health
Responsible Party: Jay Baker
Status: Pending
Due Date: 10/07/2025
```

### Bulk Import via CSV

1. Click **"Compliance"** → **"Import CSV"** button
2. Download the sample CSV template
3. Fill in your data following this format:

```csv
Customer Code,Category,Type,Commitment,Description,Responsible Party,Due Date,Status,Notes
ALLIANCE,Billing,Monthly Invoice,Submit invoice with PO,"Must include PO, detail services",Jay Baker,2025-10-07,pending,
ABC,Marketing Agreement,Commission,Q3 Commission Payment,5% of Q3 fees,HT Finance,2025-10-01,pending,
```

4. Upload your completed CSV
5. Review the validation results
6. Items are automatically created

### Updating Compliance Status

**Method 1 - Quick Status Toggle:**
1. Find the item in the list
2. Click the status badge
3. Select new status
4. Completion date auto-populates if marked "Complete"

**Method 2 - Full Edit:**
1. Click the **pencil icon** on the item
2. Update any fields needed
3. Change status if applicable
4. Add notes
5. Click **"Update"**

### Filtering and Searching

Use the filters at the top of the compliance list:
- **Organization**: Filter by customer
- **Category**: Filter by obligation type
- **Status**: Show only pending/complete/overdue
- **Search**: Free text search across all fields

---

## Billable Events

Track revenue and billing tied to compliance items.

### Creating a Billable Event

1. Click **"Billable Events"** in the sidebar
2. Click **"Add Event"** button
3. Fill in the details:
   - **Organization**: Select customer
   - **Contract**: (Optional) Link to contract
   - **Compliance Item**: (Optional) Link to compliance obligation
   - **Description**: What was billed
   - **Rate**: Price per unit
   - **Units**: Quantity (hours, items, etc.)
   - **Total Amount**: Auto-calculated (Rate × Units)
   - **Billing Date**: When invoiced
   - **Invoice Number**: Reference number
   - **Paid Status**: Toggle when payment received
   - **Paid Date**: Auto-set when marked paid

**Example:**
```
Organization: ABC Healthcare Partners
Contract: ABC - Professional Services 2025
Description: Consulting services - October 2025
Rate: $150.00 per hour
Units: 40 hours
Total Amount: $6,000.00 (auto-calculated)
Billing Date: 11/01/2025
Invoice Number: INV-2025-010
Paid: ☐ No
```

### Tracking Payments

1. Find the billable event
2. Click **"Mark as Paid"** button
3. Payment date auto-populates
4. Status updates to "Paid"

---

## Evidence Locker

Store audit trail documentation for compliance items.

### Uploading Evidence

1. Navigate to a compliance item
2. Click **"Add Evidence"** button
3. Complete the form:
   - **Title**: Brief description
   - **Description**: Additional context
   - **Evidence Type**: Document/Email/Screenshot/Report/Other
   - **File**: Upload the file (10MB max)
4. Click **"Upload Evidence"**

**Example:**
```
Title: Commission Calculation Spreadsheet Q3 2025
Description: Detailed breakdown of 5% commission on Q3 fees
Evidence Type: Document
File: Q3_Commission_Calc.xlsx
```

### Supported File Types
- Documents: PDF, DOCX, XLSX, TXT
- Images: PNG, JPG, JPEG
- Archives: ZIP
- Others: CSV, JSON

### Viewing Evidence

1. Go to the compliance item or billable event
2. Click the **"View Evidence"** link
3. See all uploaded documents
4. Download individual files as needed

---

## Email Alerts

Automated compliance deadline reminders via Microsoft 365.

### Setting Up Email Alerts

**Admin Configuration (Docker):**

Add to `.env` file:
```env
AZURE_CLIENT_ID=your-app-client-id
AZURE_CLIENT_SECRET=your-app-secret
AZURE_TENANT_ID=your-tenant-id
SENDER_EMAIL=noreply@healthtrixss.com
DEFAULT_ALERT_EMAIL=admin@healthtrixss.com
```

### Sending Manual Alerts

1. Go to **Compliance** page
2. Select items to alert on
3. Click **"Send Alert"** button
4. Email automatically sent with:
   - Due date
   - Commitment details
   - Responsible party
   - Organization info

**Email Preview:**
```
Subject: Compliance Alert: Q3 Commission Payment Due 10/01/2025

You have a compliance deadline approaching:

Organization: ABC Healthcare Partners
Category: Marketing Agreement
Commitment: Quarter 3 Commission Payment
Due Date: October 1, 2025
Responsible: Health Trixss Finance

Please ensure this obligation is completed on time.
```

---

## Data Export & Import

### Exporting All Data

1. Click **"Settings"** → **"Export Database"**
2. A JSON file downloads with:
   - All organizations
   - All contracts
   - All compliance items
   - All billable events
   - All evidence metadata
   - Audit logs
   - Email alert history

**File Format:**
```json
{
  "appName": "BizGov",
  "appVersion": "1.0",
  "version": "1.0",
  "timestamp": "2025-10-09T12:00:00Z",
  "data": {
    "organizations": [...],
    "contracts": [...],
    "complianceItems": [...],
    ...
  }
}
```

### Importing Data

⚠️ **Important:** Import merges data - existing records are skipped, new records are added.

1. Click **"Settings"** → **"Import Database"**
2. Select your exported JSON file
3. Review the import summary:
   - Shows new records to be added
   - Lists duplicates that will be skipped
4. Click **"Confirm Import"**
5. Wait for completion message

**Use Cases:**
- Migrate from Replit to Docker
- Restore from backup
- Clone data to another instance
- Share configuration with team

---

## Admin Functions

### User Management

**Creating Users:**
1. Go to **Admin Panel** → **Users**
2. Click **"Create User"**
3. Fill in:
   - Username (unique)
   - Password
   - Full Name
   - Email
   - Role: Admin or User
4. Click **"Create User"**

**Editing Users:**
1. Click **pencil icon** next to user
2. Update details
3. Change password if needed
4. Click **"Update User"**

**Deleting Users:**
1. Click **trash icon** next to user
2. Confirm deletion
3. User is permanently removed

### QuickBooks Online Settings

**Configuring QuickBooks OAuth Credentials:**

Administrators can configure QuickBooks integration credentials directly from the admin panel. This is especially useful for Docker deployments where environment variables aren't easily accessible.

**Setup Steps:**
1. Go to **Admin Panel** → **QuickBooks Online Settings**
2. Enter your QuickBooks application credentials:
   - **Client ID**: Your QuickBooks OAuth Client ID
   - **Client Secret**: Your QuickBooks OAuth Client Secret (write-only for security)
   - **Redirect URI**: OAuth callback URL (e.g., `http://localhost:5000/api/quickbooks/callback`)
   - **Environment**: Select "Sandbox (Development)" or "Production"
3. Click **"Save QuickBooks Settings"**

**Security Features:**
- ✅ **Client Secret is masked** - The API never exposes the actual secret value
- ✅ **Write-only secret field** - Leave empty to keep existing secret unchanged
- ✅ **Validation** - All inputs are validated before saving
- ✅ **Audit trail** - All settings changes are logged

**Updating Credentials:**
1. Go to **Admin Panel** → **QuickBooks Online Settings**
2. Update any field you want to change
3. For **Client Secret**:
   - Leave empty to keep current secret
   - Enter new value only if you want to update it
4. Click **"Save QuickBooks Settings"**

**Rotating Credentials:**
If you need to rotate your QuickBooks credentials for security:
1. Create new OAuth credentials in QuickBooks Developer Portal
2. Update settings in Admin Panel with new Client ID and Secret
3. Reconnect all organizations to QuickBooks using the new credentials
4. Revoke old credentials in QuickBooks Developer Portal

⚠️ **Note:** After updating credentials, existing QuickBooks connections will need to be re-authorized.

---

## QuickBooks Online Integration

### Getting QuickBooks OAuth Credentials

Before using the QuickBooks integration, you need to create OAuth credentials in the QuickBooks Developer Portal.

**Steps:**
1. Go to [developer.intuit.com](https://developer.intuit.com)
2. Sign in with your Intuit account (or create one)
3. Click **"Create an app"**
4. Select **"QuickBooks Online"** as the platform
5. Choose your scopes (accounting scope required for invoices)
6. Set your Redirect URI:
   ```
   http://localhost:5000/api/quickbooks/callback
   ```
7. Save and copy your **Client ID** and **Client Secret**

**Sandbox vs Production:**
- **Sandbox**: For testing with fake data (free, no approval required)
- **Production**: For real QuickBooks companies (requires Intuit approval process)

💡 **Tip:** Start with sandbox credentials to test the integration before going to production.

### Setting Up QuickBooks Integration

Once you have your OAuth credentials, configure them in BizGov:

**Option 1: Admin Panel (Recommended for Docker)**
1. Go to **Admin Panel** → **QuickBooks Online Settings**
2. Enter credentials:
   - Client ID
   - Client Secret  
   - Redirect URI
   - Environment (sandbox or production)
3. Click **"Save QuickBooks Settings"**

**Option 2: Environment Variables**
Add to your `.env` file:
```
QB_CLIENT_ID=your_client_id
QB_CLIENT_SECRET=your_client_secret
QB_REDIRECT_URI=http://localhost:5000/api/quickbooks/callback
QB_ENVIRONMENT=sandbox
```

### Connecting Organizations to QuickBooks

**Step-by-Step:**
1. Navigate to **Organizations** page
2. Find the organization you want to connect
3. Click **"Connect"** in the QuickBooks column
4. A popup window will open - sign in to QuickBooks
5. Select the QuickBooks company to connect
6. Authorize BizGov to access your QuickBooks data
7. Connection status updates to "Connected"

✅ **Success:** You'll see a green checkmark and connection details.

### Mapping QuickBooks Customers

After connecting, you must map each organization to a QuickBooks customer:

**Steps:**
1. Click **"Manage"** on the connected organization
2. Click **"Map Customer"** button
3. Use the search box to find your QuickBooks customer
4. Click on the customer to select and map them
5. The mapped customer name will appear in the dialog

**Why map customers?**
Mapping links your BizGov organization to a specific QuickBooks customer, enabling:
- Invoice synchronization
- Revenue tracking
- Customer-specific data queries

### Syncing QuickBooks Invoices

Once connected and mapped, you can sync invoices:

**Steps:**
1. Open the QuickBooks management dialog
2. Click **"Sync Invoices"** button
3. Wait for sync to complete
4. Success message shows number of invoices synced
5. Invoices appear in the list with details:
   - Invoice number
   - Date
   - Total amount
   - Balance due
   - Status (paid/unpaid)

**Sync Behavior:**
- ✅ Updates existing invoices
- ✅ Adds new invoices
- ✅ Preserves local data
- ✅ Idempotent (safe to run multiple times)

### Checking QuickBooks System Health

The Admin Panel includes a **System Health** card for monitoring QuickBooks integration status.

**Health Indicators:**

| Status | Color | Meaning |
|--------|-------|---------|
| Healthy | 🟢 Green | Credentials configured, system ready |
| Not Configured | 🟡 Yellow | No QB credentials set up |
| Error | 🔴 Red | Health check failed |

**Health Metrics:**
- **Client ID**: Masked for security (e.g., "ABbWvOcQ...")
- **Environment**: Sandbox or Production
- **Active Connections**: Total QB connections
- **Valid Connections**: Non-expired connections
- **Expired Connections**: Need reconnection
- **Last Check**: Timestamp of last health check

**Usage:**
1. Go to **Admin Panel**
2. Locate **System Health** card
3. Review status and metrics
4. Click **"Refresh"** to manually update
5. Auto-refreshes every 60 seconds

### Testing the QuickBooks Integration

Follow this complete test workflow:

#### Test 1: Verify Credentials
1. Go to Admin Panel → QuickBooks Online Settings
2. Verify Client ID and Environment are set
3. Check System Health shows "Healthy" (green status)

✅ **Pass:** Green status indicator appears

#### Test 2: Connect Test Organization
1. Create a test organization (e.g., "Test Company")
2. Click "Connect" in the QuickBooks column
3. Sign in to your QuickBooks sandbox/company
4. Authorize the connection
5. Verify status changes to "Connected"

✅ **Pass:** Status shows "Connected" with green checkmark

#### Test 3: Map Customer
1. Click "Manage" on the test organization
2. Click "Map Customer"
3. Search for a QuickBooks customer
4. Select a customer to map
5. Verify customer name appears in dialog

✅ **Pass:** Customer name displays correctly

#### Test 4: Sync Invoices
1. Click "Sync Invoices" in the management dialog
2. Wait for sync to complete
3. Verify success message shows invoice count
4. Check that invoices appear in the list

✅ **Pass:** Invoices display with correct data

#### Test 5: Verify Health Status
1. Return to Admin Panel
2. Check System Health shows 1 Active Connection
3. Verify Valid Connections count is 1
4. Confirm Expired Connections is 0

✅ **Pass:** All connection counts are correct

🎉 **Integration Working:** If all tests pass, your QuickBooks integration is fully operational!

### Handling Connection Expiration

QuickBooks access tokens expire after **1 hour** and refresh tokens after **100 days** of inactivity.

**If connection status shows "expired":**

1. Click **"Disconnect"** in the management dialog
2. Click **"Connect"** again to reauthorize
3. Sign in to QuickBooks and authorize again
4. Your customer mapping will be preserved

💡 **Tip:** The system automatically refreshes access tokens when possible, but refresh tokens require manual reconnection after 100 days.

### Disconnecting QuickBooks

**Steps:**
1. Click **"Manage"** on the organization
2. Scroll down and click **"Disconnect QuickBooks"**
3. Confirm disconnection
4. Connection removed and tokens revoked

**What Happens:**
- ✅ Connection removed
- ✅ Tokens revoked
- ✅ Synced invoices remain in database
- ✅ Customer mapping preserved (for reconnection)

---

### Database Reset

⚠️ **DANGER ZONE** - This deletes all business data!

**What it deletes:**
- All organizations/customers
- All contracts
- All compliance items
- All billable events
- All evidence files
- All audit logs
- All email alert history

**What it keeps:**
- User accounts and passwords

**To reset:**
1. Go to **Admin Panel** → **Database**
2. Click **"Reset Database"** button
3. Type "DELETE ALL DATA" to confirm
4. Click **"Confirm Reset"**
5. Database is cleared immediately

---

## Common Workflows

### Workflow 1: New Client Onboarding

1. **Add Organization**
   - Name: New Client LLC
   - Code: NEWCLIENT
   - Email: admin@newclient.com

2. **Create Contract**
   - Link to New Client LLC
   - Add terms and amounts
   - Set start/end dates

3. **Add Compliance Items**
   - Import via CSV or add manually
   - Link to the contract
   - Set due dates and responsible parties

4. **Set Up Alerts**
   - Configure email notifications
   - Test alert delivery

### Workflow 2: Monthly Billing

1. **Review Billable Events**
   - Filter by current month
   - Verify all hours/services logged

2. **Create Invoice**
   - Link to contract
   - Add invoice number
   - Set billing date

3. **Upload Evidence**
   - Attach timesheet
   - Add invoice PDF
   - Include any supporting docs

4. **Track Payment**
   - Mark as paid when received
   - Record payment date

### Workflow 3: Quarterly Compliance Review

1. **Filter by Quarter**
   - Set date range for Q1/Q2/Q3/Q4
   - View all items due in period

2. **Check Status**
   - Review overdue items
   - Update completed items
   - Add notes on progress

3. **Generate Report**
   - Export database
   - Use for executive reporting
   - Archive for audit trail

4. **Evidence Check**
   - Verify all obligations have evidence
   - Upload missing documentation
   - Review evidence quality

---

## Tips & Best Practices

### Organization Management
✓ Use consistent naming (e.g., "The Alliance" not "Alliance" and "THE ALLIANCE")
✓ Keep codes short and memorable (4-8 characters)
✓ Update contact emails when personnel changes

### Compliance Tracking
✓ Be specific in commitments - "Submit Q3 invoice" not just "Invoice"
✓ Set realistic due dates with buffer time
✓ Add detailed notes for context
✓ Link to contracts when applicable

### Billable Events
✓ Enter as soon as work is complete
✓ Use consistent rate structures
✓ Include detailed descriptions
✓ Track invoice numbers systematically

### Evidence Management
✓ Upload evidence immediately after completion
✓ Use descriptive filenames
✓ Include dates in document names
✓ Keep file sizes reasonable (<10MB)

### Data Management
✓ Export database weekly for backups
✓ Keep exports in secure location
✓ Test restore process periodically
✓ Review audit logs monthly

---

## Troubleshooting

### Can't Login
- Verify username/password
- Check caps lock
- Try default admin credentials (Docker)
- Contact admin to reset password

### Import Fails
- Verify CSV format matches template
- Check for special characters in data
- Ensure organization codes already exist
- Review error messages for details

### Email Alerts Not Sending
- Verify Azure credentials in .env
- Check sender email is valid
- Confirm recipient addresses
- Review SMTP/Graph API logs

### Evidence Upload Fails
- Check file size (must be <10MB)
- Verify file type is supported
- Ensure disk space available
- Try different browser

### Database Export Issues
- Ensure adequate disk space
- Check browser download settings
- Try different browser
- Use smaller date ranges if large dataset

### QuickBooks Integration Issues

**❌ Connection button doesn't open popup**
- Check that QuickBooks credentials are configured in Admin Panel
- Verify System Health shows "Healthy" status
- Check browser console for errors
- Disable popup blockers for this site

**❌ OAuth callback fails with "invalid_client"**
- Verify Client ID and Secret are correct
- Check Redirect URI matches exactly (including http/https)
- Ensure environment (sandbox/production) matches your QB app
- Verify credentials haven't expired or been revoked

**❌ Connection shows "expired"**
- Disconnect and reconnect the organization
- QuickBooks refresh tokens expire after 100 days of inactivity
- Customer mapping is preserved during reconnection

**❌ Invoice sync returns 0 invoices**
- Verify customer mapping is correct
- Check that the mapped customer has invoices in QuickBooks
- Ensure your QB app has "Accounting" scope enabled
- Check that connection hasn't expired

**❌ System Health shows "Not Configured"**
- Go to Admin Panel → QuickBooks Online Settings
- Enter Client ID, Client Secret, and Redirect URI
- Select correct environment (sandbox/production)
- Save settings and refresh health check

**❌ Customer mapping search returns no results**
- Verify QuickBooks connection is valid (not expired)
- Ensure you have customers in your QuickBooks company
- Check that you're searching the correct QB company
- Try reconnecting if search consistently fails

💡 **Still having issues?** Check the audit log in the Admin Panel for detailed error messages and timestamps.

---

## Support & Resources

### Docker Deployment
See: `DOCKER_SETUP.md` for deployment instructions

### Database Connection
Default PostgreSQL:
- Host: localhost
- Port: 5432
- Database: bizgov
- User: postgres
- Password: postgres

### Security
- Change default passwords immediately
- Use strong passwords (12+ characters)
- Enable HTTPS in production
- Rotate Azure secrets regularly
- Review audit logs weekly

### Getting Help
1. Check this user guide
2. Review error messages carefully
3. Check Docker logs: `docker-logs-verbose.bat`
4. Consult admin for access issues
5. Export data before major changes

---

**Last Updated:** October 2025  
**Version:** 1.0  
**Application:** BizGov - Compliance Hub
