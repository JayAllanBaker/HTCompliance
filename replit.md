# BizGov - Compliance + Billing + Contracts Hub

## Overview

BizGov is an internal compliance, billing, and contract lifecycle management application for Health Trixss LLC. The system provides a centralized hub for tracking compliance obligations, managing billable events, maintaining contract milestones, storing audit evidence, and syncing invoice data from QuickBooks Online. Built with a React frontend and Express backend, the application emphasizes audit readiness, automated alerting, data portability through JSON export/restore capabilities, and collaborative features including timestamped comments on compliance items for team communication and audit trails.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack**: React with TypeScript, using Vite as the build tool and Wouter for client-side routing.

**UI Framework**: The application uses shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling. This provides a consistent, accessible component library with the "new-york" style variant.

**State Management**: TanStack Query (React Query) handles server state management with aggressive caching (staleTime: Infinity) to minimize unnecessary API calls. Authentication state is managed through a custom AuthContext provider.

**Form Handling**: React Hook Form with Zod schema validation provides type-safe form management across all data entry points.

**Design Rationale**: The component-based architecture with shadcn/ui was chosen for rapid development with accessible, customizable components. React Query eliminates the need for additional state management libraries while providing built-in caching and optimistic updates.

### Backend Architecture

**Server Framework**: Express.js with TypeScript running in ESM mode, providing a lightweight and flexible API layer.

**Authentication**: Passport.js with local strategy using scrypt for password hashing. Session storage is environment-aware: MemoryStore for Neon (Replit), PostgreSQL sessions for Docker. The system supports role-based access control (admin/user roles).

**Database Layer**: Drizzle ORM with dual database support - Neon serverless driver for Replit, standard PostgreSQL driver for Docker. The schema-first approach uses Drizzle Kit for migrations stored in the `/migrations` directory.

**API Design**: RESTful endpoints organized by resource (customers, contracts, compliance-items, billable-events, evidence, audit-log). All mutations create audit log entries for compliance tracking.

**File Handling**: Multer middleware manages file uploads for CSV imports and evidence documents with a 10MB size limit.

**Design Rationale**: Express was chosen for its simplicity and middleware ecosystem. Passport provides battle-tested authentication with multiple strategy support. Drizzle ORM offers type safety without the complexity of heavier ORMs while maintaining good performance with serverless PostgreSQL.

### Data Storage

**Primary Database**: Dual database support with automatic detection:
- **Replit**: Neon serverless PostgreSQL with WebSocket support
- **Docker**: Standard PostgreSQL 16 with persistent volumes

**Schema Design**: The database uses UUID primary keys with the following core tables:
- `users`: Authentication and RBAC
- `customers`: Client/customer records
- `contracts`: Contract lifecycle management
- `compliance_items`: Compliance obligations and tracking
- `compliance_comments`: Timestamped comments on compliance items with user attribution
- `billable_events`: Billing records linked to contracts/compliance
- `evidence`: Immutable document storage
- `audit_log`: Comprehensive activity tracking
- `email_alerts`: Alert history and tracking

**Session Storage**: Environment-aware session persistence:
- **Replit (Neon)**: MemoryStore - sessions lost on restart (acceptable for development)
- **Docker (PostgreSQL)**: PostgreSQL-backed sessions using connect-pg-simple for persistence

**Enums**: PostgreSQL enums enforce data integrity for roles, statuses, categories, and evidence types.

**Design Rationale**: PostgreSQL provides ACID compliance critical for financial and compliance data. UUIDs prevent enumeration attacks and support distributed systems. The audit log table creates an immutable trail for compliance requirements. The dual database setup enables seamless deployment on both Replit (Neon) and Docker (standard PostgreSQL) without code changes.

### Authentication & Authorization

**Authentication Method**: Local username/password authentication with session-based auth using express-session. Passwords are hashed using Node.js crypto scrypt with random salts.

**Session Management**: Environment-aware session storage with configurable secrets and security settings (secure cookies in production, trust proxy enabled). Uses MemoryStore for Neon/Replit, PostgreSQL sessions for Docker deployments.

**Authorization Model**: Role-based access control (RBAC) with two roles:
- Admin: Full system access including user management and database operations
- User: Standard operational access

**Admin Functionality**: Admin users have access to a dedicated admin panel (`/admin` route) with:
- User Management: Create, update, and delete user accounts. All password operations use scrypt hashing with per-user salts. Passwords are never exposed in API responses.
- Database Reset: Ability to clear all business data (customers, contracts, compliance items, billable events, evidence, audit logs) while preserving user accounts. Requires explicit confirmation due to destructive nature.
- All admin operations are protected by `requireAdmin` middleware and create audit log entries.

**Session Security**: Sessions use hardened cookie settings including httpOnly, secure (in production), sameSite="lax" for CSRF mitigation, and 7-day expiration. Session secrets are validated at startup.

**Design Rationale**: Session-based auth was chosen over JWT for better security (server-side revocation) and simpler implementation. The two-role model keeps authorization straightforward while meeting current business needs. sameSite cookie attribute provides baseline CSRF protection. Future enhancements could add CSRF tokens for additional protection and OAuth2 support for Microsoft/Google SSO.

### External Dependencies

**Email Service Integration**: Microsoft Graph API integration using MSAL (Microsoft Authentication Library) for sending compliance alerts. The system uses client credentials flow with configured Azure AD app registration (tenant, client ID, and secret in environment variables).

**CSV Import Service**: PapaParse library handles CSV parsing for bulk compliance item imports with validation against existing customer records and intelligent duplicate detection. The system includes a comprehensive JSON format specification (`compliance-import-spec.json`) that documents all CSV columns, validation rules, valid values, error handling, duplicate handling, and best practices. Two API endpoints serve this specification:
- `GET /api/csv/spec` - Returns the complete JSON format specification with validation rules, examples, and error handling
- `GET /api/csv/template` - Downloads a ready-to-use CSV template with sample data

The specification includes detailed documentation for:
- Required vs optional columns (Category, Commitment, Responsible Party, Status are required)
- Valid enum values (Category: Marketing Agreement, Billing, Deliverable, Compliance, End-of-Term; Status: pending, complete, overdue, na)
- Date format requirements (MM/DD/YYYY or YYYY-MM-DD)
- Organization lookup behavior (auto-creates new organizations if not found)
- **Duplicate Detection**: Matches items based on Category + Commitment (case-insensitive) + Customer + Due Date (date only)
- **Duplicate Handling Options**: User chooses between "Skip" (recommended, leaves existing items unchanged) or "Update" (overwrites existing items with CSV data)
- **Import Results**: Detailed reporting showing counts for imported, updated, and skipped items with specific row information for skipped duplicates
- Comprehensive error messages with row numbers for validation failures

**File Storage**: Currently uses local filesystem storage (uploads directory) for evidence documents. The system tracks file metadata in the database with references to filesystem paths.

**Export/Import Service**: Custom JSON export service with SHA-256 hash manifests for data integrity verification. Supports full database backup and restore operations.

**UI Components**: Extensive use of Radix UI primitives (@radix-ui/*) for accessible, unstyled components that are styled with Tailwind CSS via shadcn/ui configuration.

**Design Rationale**: Microsoft Graph API integration leverages existing Health Trixss infrastructure for email. PapaParse provides robust CSV handling with error recovery. The JSON export format enables simple backup/restore without database-specific tools. Local file storage keeps the initial deployment simple but should be migrated to cloud storage (S3/Azure Blob) for production scalability.

### QuickBooks Online Integration

**OAuth 2.0 Authentication**: Integration uses OAuth 2.0 for secure authentication with QuickBooks Online. Each organization can connect to a separate QuickBooks company. The system stores access tokens (1-hour expiry) and refresh tokens (100-day expiry) in the database, with automatic token refresh on 401 errors.

**Customer Mapping**: Organizations must be mapped to a QuickBooks customer before invoices can be synced. The system provides a search interface to find and map QuickBooks customers by name or company.

**Invoice Synchronization**: Once connected and mapped, invoices can be synced from QuickBooks to the local database. Invoices are cached locally and can be updated by re-syncing.

**Environment Configuration**: The integration supports dual development/production configuration with multiple setup methods:

1. **Dev/Prod Dual Configuration** (recommended):
   - Separate credentials for Development (Sandbox) and Production environments
   - Active config selector (`qb_active_config`) determines which credentials to use
   - Database fields: `qb_dev_client_id`, `qb_dev_client_secret`, `qb_dev_redirect_uri` for development
   - Database fields: `qb_prod_client_id`, `qb_prod_client_secret`, `qb_prod_redirect_uri` for production
   - Admin panel provides tabbed UI to configure both environments and switch between them
   - OAuth service automatically loads credentials based on active configuration

2. **Admin Panel Settings** (primary configuration method):
   - Admins configure QB credentials via `/admin` route → QuickBooks Online Settings
   - Tabbed interface for Development (Sandbox) and Production configurations
   - Switching tabs changes the active configuration
   - Settings stored in `system_settings` table with write-only secret handling
   - Client secrets masked in all API responses for security (never exposed in cleartext)
   - Write-only secret updates (leave empty to keep existing value)
   - Redirect URI auto-detection for Replit deployments via `REPLIT_DEV_DOMAIN`
   - Visual badge indicates which configuration is currently active

3. **Environment Variables** (legacy fallback):
   - `QB_CLIENT_ID` - QuickBooks application client ID
   - `QB_CLIENT_SECRET` - QuickBooks application client secret  
   - `QB_REDIRECT_URI` - OAuth callback URL
   - OAuth service falls back to env vars if database settings not configured

**Security Features**:
- CSRF protection via state parameter in OAuth flow
- Query string escaping to prevent QuickBooks Query Language injection
- Automatic token refresh with 401 error handling
- OAuth callback upsert logic to handle reconnections
- **Admin settings security**: Client secret masked in GET responses, write-only updates, validation on POST
- Audit trail for all settings changes

**Design Rationale**: Separate quickbooks_connections table isolates OAuth credentials from organization data for better security. The sync service caches invoices locally to reduce API calls and provide offline access to invoice data. Per-organization connections enable multi-company scenarios where different organizations use different QuickBooks companies.

### Help & Documentation System

**In-App Help Center** (`/help` route): Comprehensive, searchable help system with end-to-end user instructions and examples. Features:
- **Quick Start Guide**: Step-by-step onboarding for new users
- **Searchable FAQ**: Full-text search across all help topics
- **Category-Based Organization**: Help organized by feature (Organizations, Contracts, Compliance, Billable Events, Evidence, Export/Import, Admin)
- **Interactive Examples**: Real-world examples with code samples and data formats
- **Accordion UI**: Clean, expandable Q&A format for easy navigation
- **Contextual Alerts**: Important warnings, tips, and security notices highlighted

**External Documentation**:
- `USER_GUIDE.md`: Complete end-to-end user manual with detailed workflows and examples
- `DOCKER_SETUP.md`: Docker deployment guide with default credentials and troubleshooting
- `design_guidelines.md`: UI/UX design system and component guidelines

**Design Rationale**: The in-app help system ensures users have immediate access to guidance without leaving the application. Material Design-inspired documentation patterns with clear visual hierarchy make complex compliance workflows easy to understand. Searchable, categorized content helps users find answers quickly, reducing support burden and improving user self-sufficiency.