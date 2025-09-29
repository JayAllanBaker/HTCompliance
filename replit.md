# BizGov - Compliance + Billing + Contracts Hub

## Overview

BizGov is an internal compliance, billing, and contract lifecycle management application for Health Trixss LLC. The system provides a centralized hub for tracking compliance obligations, managing billable events, maintaining contract milestones, and storing audit evidence. Built with a React frontend and Express backend, the application emphasizes audit readiness, automated alerting, and data portability through JSON export/restore capabilities.

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

**Authentication**: Passport.js with local strategy using scrypt for password hashing. Sessions are persisted to PostgreSQL using connect-pg-simple. The system supports role-based access control (admin/user roles).

**Database Layer**: Drizzle ORM with the Neon serverless PostgreSQL driver. The schema-first approach uses Drizzle Kit for migrations stored in the `/migrations` directory.

**API Design**: RESTful endpoints organized by resource (customers, contracts, compliance-items, billable-events, evidence, audit-log). All mutations create audit log entries for compliance tracking.

**File Handling**: Multer middleware manages file uploads for CSV imports and evidence documents with a 10MB size limit.

**Design Rationale**: Express was chosen for its simplicity and middleware ecosystem. Passport provides battle-tested authentication with multiple strategy support. Drizzle ORM offers type safety without the complexity of heavier ORMs while maintaining good performance with serverless PostgreSQL.

### Data Storage

**Primary Database**: PostgreSQL via Neon serverless driver with WebSocket support for connection pooling.

**Schema Design**: The database uses UUID primary keys with the following core tables:
- `users`: Authentication and RBAC
- `customers`: Client/customer records
- `contracts`: Contract lifecycle management
- `compliance_items`: Compliance obligations and tracking
- `billable_events`: Billing records linked to contracts/compliance
- `evidence`: Immutable document storage
- `audit_log`: Comprehensive activity tracking
- `email_alerts`: Alert history and tracking

**Session Storage**: PostgreSQL-backed sessions using connect-pg-simple for persistence across server restarts.

**Enums**: PostgreSQL enums enforce data integrity for roles, statuses, categories, and evidence types.

**Design Rationale**: PostgreSQL provides ACID compliance critical for financial and compliance data. UUIDs prevent enumeration attacks and support distributed systems. The audit log table creates an immutable trail for compliance requirements.

### Authentication & Authorization

**Authentication Method**: Local username/password authentication with session-based auth using express-session. Passwords are hashed using Node.js crypto scrypt with random salts.

**Session Management**: Server-side sessions stored in PostgreSQL with configurable secrets and security settings (secure cookies in production, trust proxy enabled).

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

**CSV Import Service**: PapaParse library handles CSV parsing for bulk compliance item imports with validation against existing customer records.

**File Storage**: Currently uses local filesystem storage (uploads directory) for evidence documents. The system tracks file metadata in the database with references to filesystem paths.

**Export/Import Service**: Custom JSON export service with SHA-256 hash manifests for data integrity verification. Supports full database backup and restore operations.

**UI Components**: Extensive use of Radix UI primitives (@radix-ui/*) for accessible, unstyled components that are styled with Tailwind CSS via shadcn/ui configuration.

**Design Rationale**: Microsoft Graph API integration leverages existing Health Trixss infrastructure for email. PapaParse provides robust CSV handling with error recovery. The JSON export format enables simple backup/restore without database-specific tools. Local file storage keeps the initial deployment simple but should be migrated to cloud storage (S3/Azure Blob) for production scalability.