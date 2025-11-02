# BizGov - Compliance + Billing + Contracts Hub

## Overview

BizGov is an internal application for Health Trixss LLC, centralizing compliance, billing, and contract lifecycle management. It tracks compliance obligations, manages billable events, maintains contract milestones, stores audit evidence, and syncs invoice data from QuickBooks Online. The system prioritizes audit readiness, automated alerting, data portability via JSON export/restore, and collaborative features like timestamped comments on compliance items.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions

The frontend uses React with TypeScript, Vite, and Wouter for routing. UI is built with shadcn/ui components on Radix UI primitives and Tailwind CSS, adhering to the "new-york" style. State is managed by TanStack Query for server state and a custom AuthContext for authentication. React Hook Form with Zod handles form validation.

**Navigation Layout**: The application uses a fixed left sidebar navigation (position: fixed, 256px width) that remains in place while page content scrolls independently. All pages have a consistent layout structure with Header, fixed Sidebar, and main content area with 256px left margin (ml-64). The sidebar contains links to all major sections: Dashboard, Organizations, Contracts, Compliance, Billable Events, Evidence Locker, Admin (admin-only), and Help.

### Technical Implementations

**Frontend**: React with TypeScript, Vite, Wouter, shadcn/ui (Radix UI + Tailwind CSS), TanStack Query, React Hook Form, Zod.
**Backend**: Express.js with TypeScript (ESM mode). Authentication uses Passport.js with a local strategy (scrypt hashing). Drizzle ORM supports both Neon serverless PostgreSQL (Replit) and standard PostgreSQL (Docker). RESTful APIs manage resources with audit logging for all mutations. Multer handles file uploads (10MB limit).
**Data Storage**: Primary database is PostgreSQL (Neon for Replit, standard for Docker) with UUIDs for primary keys. Core tables include `users`, `customers` (exposed as "organizations" in the API and UI with orgType classification), `contracts`, `compliance_items`, `billable_events`, `evidence`, `organization_notes`, `compliance_comments`, and `audit_log`. Session storage is memory-based for Replit and PostgreSQL-backed for Docker. PostgreSQL enums enforce data integrity (including org_type: customer, vendor, contractor, internal, state_govt, federal_govt).
**Authentication & Authorization**: Local username/password authentication with session-based auth (express-session). Passwords are scrypt-hashed. Role-based access control (RBAC) supports 'Admin' and 'User' roles. Admins have a dedicated panel for user management and database resets. Session security includes httpOnly, secure, and sameSite="lax" cookie settings.

### Feature Specifications

*   **Compliance Tracking**: Manages obligations, evidence, and audit trails with calendar views, inline status updates, and organization column visibility. Compliance rate is calculated based on items due today or earlier (completed items with dueDate ≤ today / all items with dueDate ≤ today × 100), providing a meaningful metric of current compliance status. The compliance form features a **Type dropdown** with 11 predefined compliance types (Regulatory Filing, Audit, Certification, License Renewal, Training, Report Submission, Inspection, Review, Assessment, Documentation, Other) for consistent categorization. **Contract linking** allows compliance items to be associated with both an organization and a specific contract, with smart filtering that shows contracts for the selected organization while preserving any already-linked contract. The system automatically updates compliance item status to **"overdue"** when the due date is before the current date (using UTC date comparison to avoid timezone issues), ensuring accurate real-time compliance status across all views.
*   **Billing Management**: Tracks billable events and integrates with QuickBooks.
*   **Contract Lifecycle**: Manages contract milestones and associated data.
*   **Audit Readiness**: Comprehensive end-to-end audit logging for all system activities including user authentication (login/logout), data mutations (create/update/delete), and administrative actions. Admins can review audit logs with advanced filtering by user, action type, entity type, and date range, with full pagination support.
*   **Data Portability**: Unified export/import system that packages database data AND evidence files together in a single ZIP archive. This ensures evidence files remain properly linked to their database records after restoration, solving the critical issue where separate exports created orphaned records due to UUID regeneration. The restore process includes duplicate detection to prevent re-importing evidence that already exists in the database. Legacy database-only JSON export/restore with SHA-256 hash manifests is still available but not recommended for complete system backups. **Cascade Delete Protection**: Evidence items are automatically deleted when their parent compliance items, contracts, or billable events are deleted, preventing orphaned evidence records.
*   **User Collaboration**: Timestamped comments on compliance items and organization notes for providing context about each organization.
*   **Admin Panel**: User management, database reset functionality, system configuration, and audit log review interface.
*   **CSV Import**: Bulk import of compliance items with validation, duplicate detection, and handling options. CSV column header is "Organization" (legacy "Customer" still supported for backward compatibility).
*   **Help System**: In-app searchable help center and external documentation (USER_GUIDE.md, DOCKER_SETUP.md).
*   **Table Customization**: Users can toggle column visibility in compliance tables with preferences persisted in localStorage. All compliance columns (Due Date, Commitment, Type, Category, Organization, Contract, Responsible, Status) are available in the column visibility controls, with Due Date and Commitment always visible as required fields.
*   **Dashboard KPIs**: Four key performance indicators displayed on the dashboard - Compliance Rate (ClipboardCheck icon), Overdue Items (AlertTriangle icon), Due This Week (Calendar icon), and Total Items (ListChecks icon).
*   **Organization Details**: Expandable rows in the Organizations table allow users to view all associated contracts and compliance items by clicking a chevron button. Each expanded view shows comprehensive contract details in card format including title, full description, start/end dates, max amount, and status. Compliance items display title, due date, and status with badges indicating counts and statuses.
*   **Detail View Dialogs**: Quick-access detail dialogs for contracts, compliance items, and evidence that appear when clicking on list items. Each dialog shows comprehensive information including metadata, associations, and timestamps, with edit buttons for quick modifications without page navigation. Evidence dialogs include file download/view options. All dialogs handle missing data gracefully (e.g., null timestamps display "Not available").

### System Design Choices

The architecture prioritizes a component-based UI, robust backend with type-safe ORM, and dual-database support for flexible deployment. Session-based authentication offers better security than JWT for this application. An immutable audit log is central to compliance. The dual configuration for external services allows for separate development and production settings.

## External Dependencies

*   **Microsoft Graph API**: For sending compliance email alerts, using MSAL (client credentials flow). Configurable via Admin Panel or environment variables (`AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `SENDER_EMAIL`). Requires `Mail.Send` permissions.
*   **QuickBooks Online API**: OAuth 2.0 for secure authentication and invoice synchronization. Supports per-organization connections, customer mapping, and automatic token refresh. Configurable via Admin Panel or environment variables (`QB_CLIENT_ID`, `QB_CLIENT_SECRET`, `QB_REDIRECT_URI`).
*   **PapaParse**: Library for CSV parsing, used for bulk compliance item imports with detailed validation and duplicate handling.
*   **Radix UI primitives**: Used as the foundation for accessible UI components, styled by shadcn/ui and Tailwind CSS.
*   **Local Filesystem**: Currently used for storing uploaded evidence documents (tracked via database metadata).