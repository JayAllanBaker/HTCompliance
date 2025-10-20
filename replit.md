# BizGov - Compliance + Billing + Contracts Hub

## Overview

BizGov is an internal application for Health Trixss LLC, centralizing compliance, billing, and contract lifecycle management. It tracks compliance obligations, manages billable events, maintains contract milestones, stores audit evidence, and syncs invoice data from QuickBooks Online. The system prioritizes audit readiness, automated alerting, data portability via JSON export/restore, and collaborative features like timestamped comments on compliance items.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions

The frontend uses React with TypeScript, Vite, and Wouter for routing. UI is built with shadcn/ui components on Radix UI primitives and Tailwind CSS, adhering to the "new-york" style. State is managed by TanStack Query for server state and a custom AuthContext for authentication. React Hook Form with Zod handles form validation.

### Technical Implementations

**Frontend**: React with TypeScript, Vite, Wouter, shadcn/ui (Radix UI + Tailwind CSS), TanStack Query, React Hook Form, Zod.
**Backend**: Express.js with TypeScript (ESM mode). Authentication uses Passport.js with a local strategy (scrypt hashing). Drizzle ORM supports both Neon serverless PostgreSQL (Replit) and standard PostgreSQL (Docker). RESTful APIs manage resources with audit logging for all mutations. Multer handles file uploads (10MB limit).
**Data Storage**: Primary database is PostgreSQL (Neon for Replit, standard for Docker) with UUIDs for primary keys. Core tables include `users`, `customers`, `contracts`, `compliance_items`, `billable_events`, `evidence`, and `audit_log`. Session storage is memory-based for Replit and PostgreSQL-backed for Docker. PostgreSQL enums enforce data integrity.
**Authentication & Authorization**: Local username/password authentication with session-based auth (express-session). Passwords are scrypt-hashed. Role-based access control (RBAC) supports 'Admin' and 'User' roles. Admins have a dedicated panel for user management and database resets. Session security includes httpOnly, secure, and sameSite="lax" cookie settings.

### Feature Specifications

*   **Compliance Tracking**: Manages obligations, evidence, and audit trails.
*   **Billing Management**: Tracks billable events and integrates with QuickBooks.
*   **Contract Lifecycle**: Manages contract milestones and associated data.
*   **Audit Readiness**: Comprehensive audit logging for all system activities.
*   **Data Portability**: JSON export/restore with SHA-256 hash manifests.
*   **User Collaboration**: Timestamped comments on compliance items.
*   **Admin Panel**: User management, database reset functionality, and system configuration.
*   **CSV Import**: Bulk import of compliance items with validation, duplicate detection, and handling options.
*   **Help System**: In-app searchable help center and external documentation (USER_GUIDE.md, DOCKER_SETUP.md).

### System Design Choices

The architecture prioritizes a component-based UI, robust backend with type-safe ORM, and dual-database support for flexible deployment. Session-based authentication offers better security than JWT for this application. An immutable audit log is central to compliance. The dual configuration for external services allows for separate development and production settings.

## External Dependencies

*   **Microsoft Graph API**: For sending compliance email alerts, using MSAL (client credentials flow). Configurable via Admin Panel or environment variables (`AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `SENDER_EMAIL`). Requires `Mail.Send` permissions.
*   **QuickBooks Online API**: OAuth 2.0 for secure authentication and invoice synchronization. Supports per-organization connections, customer mapping, and automatic token refresh. Configurable via Admin Panel or environment variables (`QB_CLIENT_ID`, `QB_CLIENT_SECRET`, `QB_REDIRECT_URI`).
*   **PapaParse**: Library for CSV parsing, used for bulk compliance item imports with detailed validation and duplicate handling.
*   **Radix UI primitives**: Used as the foundation for accessible UI components, styled by shadcn/ui and Tailwind CSS.
*   **Local Filesystem**: Currently used for storing uploaded evidence documents (tracked via database metadata).