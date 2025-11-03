import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, decimal, uuid, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const roleEnum = pgEnum("role", ["admin", "user"]);
export const statusEnum = pgEnum("status", ["pending", "complete", "overdue", "na"]);
export const categoryEnum = pgEnum("category", ["Marketing Agreement", "Billing", "Deliverable", "Compliance", "End-of-Term", "Accounts Payable"]);
export const evidenceTypeEnum = pgEnum("evidence_type", ["document", "email", "screenshot", "report", "contract-and-amendment", "other"]);
export const qbConnectionStatusEnum = pgEnum("qb_connection_status", ["connected", "disconnected", "error", "token_expired"]);
export const orgTypeEnum = pgEnum("org_type", ["customer", "vendor", "contractor", "internal", "state_govt", "federal_govt"]);
export const confidenceEnum = pgEnum("confidence", ["green", "yellow", "red"]);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: roleEnum("role").notNull().default("user"),
  email: text("email"),
  fullName: text("full_name"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Organizations table (database table name: customers)
export const organizations = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  contactEmail: text("contact_email"),
  orgType: orgTypeEnum("org_type").notNull().default("customer"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Contracts table
export const contracts = pgTable("contracts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().references(() => organizations.id),
  title: text("title").notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  maxAmount: decimal("max_amount", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Compliance Items table
export const complianceItems = pgTable("compliance_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().references(() => organizations.id),
  contractId: varchar("contract_id").references(() => contracts.id),
  category: categoryEnum("category").notNull(),
  type: text("type").notNull(),
  commitment: text("commitment").notNull(),
  description: text("description"),
  responsibleParty: text("responsible_party").notNull(),
  status: statusEnum("status").notNull().default("pending"),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Compliance Comments table
export const complianceComments = pgTable("compliance_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  complianceItemId: varchar("compliance_item_id").notNull().references(() => complianceItems.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Organization Notes table
export const organizationNotes = pgTable("organization_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  note: text("note").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Billable Events table
export const billableEvents = pgTable("billable_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().references(() => organizations.id),
  contractId: varchar("contract_id").references(() => contracts.id),
  complianceItemId: varchar("compliance_item_id").references(() => complianceItems.id),
  description: text("description").notNull(),
  rate: decimal("rate", { precision: 10, scale: 2 }).notNull(),
  units: decimal("units", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  billingDate: timestamp("billing_date").notNull(),
  invoiceNumber: text("invoice_number"),
  isPaid: boolean("is_paid").notNull().default(false),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Evidence table for audit trail
export const evidence = pgTable("evidence", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  complianceItemId: varchar("compliance_item_id").references(() => complianceItems.id, { onDelete: "cascade" }),
  billableEventId: varchar("billable_event_id").references(() => billableEvents.id, { onDelete: "cascade" }),
  contractId: varchar("contract_id").references(() => contracts.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  evidenceType: evidenceTypeEnum("evidence_type").notNull(),
  filePath: text("file_path"),
  fileHash: text("file_hash"),
  originalFilename: text("original_filename"),
  mimeType: text("mime_type"),
  uploadedBy: varchar("uploaded_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Evidence Comments table
export const evidenceComments = pgTable("evidence_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  evidenceId: varchar("evidence_id").notNull().references(() => evidence.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Audit Log table (immutable)
export const auditLog = pgTable("audit_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: varchar("entity_id").notNull(),
  oldValues: text("old_values"), // JSON string
  newValues: text("new_values"), // JSON string
  timestamp: timestamp("timestamp").notNull().default(sql`now()`),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
});

// Email Alerts table
export const emailAlerts = pgTable("email_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  complianceItemId: varchar("compliance_item_id").notNull().references(() => complianceItems.id),
  recipientEmail: text("recipient_email").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  sentAt: timestamp("sent_at"),
  status: text("status").notNull().default("pending"), // pending, sent, failed
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// QuickBooks Connections table
export const quickbooksConnections = pgTable("quickbooks_connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id).unique(), // One QB connection per organization
  realmId: text("realm_id").notNull(), // QuickBooks company ID
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  accessTokenExpiresAt: timestamp("access_token_expires_at").notNull(),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at").notNull(),
  qbCustomerId: text("qb_customer_id"), // Mapped QB customer ID
  qbCustomerName: text("qb_customer_name"), // Mapped QB customer name
  status: qbConnectionStatusEnum("status").notNull().default("connected"),
  lastSyncAt: timestamp("last_sync_at"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// QuickBooks Invoices table (cached QB data)
export const quickbooksInvoices = pgTable("quickbooks_invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id),
  qbInvoiceId: text("qb_invoice_id").notNull(), // QB Invoice ID
  qbDocNumber: text("qb_doc_number"), // QB Invoice number (user-facing)
  qbCustomerId: text("qb_customer_id").notNull(),
  balance: decimal("balance", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  dueDate: timestamp("due_date"),
  txnDate: timestamp("txn_date").notNull(), // Invoice/transaction date
  emailStatus: text("email_status"), // QB email status
  privateNote: text("private_note"),
  qbRawData: text("qb_raw_data").notNull(), // Full JSON from QB API
  syncToken: text("sync_token"), // QB sync token for updates
  lastSyncedAt: timestamp("last_synced_at").notNull().default(sql`now()`),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// System Settings table - stores QuickBooks and other system configuration
export const systemSettings = pgTable("system_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(), // Setting key (e.g., 'qb_client_id', 'qb_environment')
  value: text("value"), // Setting value (encrypted for sensitive data)
  isEncrypted: boolean("is_encrypted").notNull().default(false), // Whether value is encrypted
  description: text("description"), // Human-readable description
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  evidence: many(evidence),
  auditLog: many(auditLog),
}));

export const organizationsRelations = relations(organizations, ({ many, one }) => ({
  contracts: many(contracts),
  complianceItems: many(complianceItems),
  billableEvents: many(billableEvents),
  notes: many(organizationNotes),
  quickbooksConnection: one(quickbooksConnections, {
    fields: [organizations.id],
    references: [quickbooksConnections.organizationId],
  }),
  quickbooksInvoices: many(quickbooksInvoices),
}));

export const contractsRelations = relations(contracts, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [contracts.customerId],
    references: [organizations.id],
  }),
  complianceItems: many(complianceItems),
  billableEvents: many(billableEvents),
  evidence: many(evidence),
}));

export const complianceItemsRelations = relations(complianceItems, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [complianceItems.customerId],
    references: [organizations.id],
  }),
  contract: one(contracts, {
    fields: [complianceItems.contractId],
    references: [contracts.id],
  }),
  billableEvents: many(billableEvents),
  evidence: many(evidence),
  emailAlerts: many(emailAlerts),
  comments: many(complianceComments),
}));

export const complianceCommentsRelations = relations(complianceComments, ({ one }) => ({
  complianceItem: one(complianceItems, {
    fields: [complianceComments.complianceItemId],
    references: [complianceItems.id],
  }),
  user: one(users, {
    fields: [complianceComments.userId],
    references: [users.id],
  }),
}));

export const organizationNotesRelations = relations(organizationNotes, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationNotes.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [organizationNotes.userId],
    references: [users.id],
  }),
}));

export const billableEventsRelations = relations(billableEvents, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [billableEvents.customerId],
    references: [organizations.id],
  }),
  contract: one(contracts, {
    fields: [billableEvents.contractId],
    references: [contracts.id],
  }),
  complianceItem: one(complianceItems, {
    fields: [billableEvents.complianceItemId],
    references: [complianceItems.id],
  }),
  evidence: many(evidence),
}));

export const evidenceRelations = relations(evidence, ({ one, many }) => ({
  complianceItem: one(complianceItems, {
    fields: [evidence.complianceItemId],
    references: [complianceItems.id],
  }),
  billableEvent: one(billableEvents, {
    fields: [evidence.billableEventId],
    references: [billableEvents.id],
  }),
  contract: one(contracts, {
    fields: [evidence.contractId],
    references: [contracts.id],
  }),
  uploadedByUser: one(users, {
    fields: [evidence.uploadedBy],
    references: [users.id],
  }),
  comments: many(evidenceComments),
}));

export const evidenceCommentsRelations = relations(evidenceComments, ({ one }) => ({
  evidence: one(evidence, {
    fields: [evidenceComments.evidenceId],
    references: [evidence.id],
  }),
  user: one(users, {
    fields: [evidenceComments.userId],
    references: [users.id],
  }),
}));

export const emailAlertsRelations = relations(emailAlerts, ({ one }) => ({
  complianceItem: one(complianceItems, {
    fields: [emailAlerts.complianceItemId],
    references: [complianceItems.id],
  }),
}));

export const quickbooksConnectionsRelations = relations(quickbooksConnections, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [quickbooksConnections.organizationId],
    references: [organizations.id],
  }),
}));

export const quickbooksInvoicesRelations = relations(quickbooksInvoices, ({ one }) => ({
  organization: one(organizations, {
    fields: [quickbooksInvoices.organizationId],
    references: [organizations.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
});

export const insertContractSchema = createInsertSchema(contracts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  maxAmount: z.union([z.string(), z.number(), z.null()]).optional().transform(val => val ? val.toString() : null),
});

export const insertComplianceItemSchema = createInsertSchema(complianceItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertComplianceCommentSchema = createInsertSchema(complianceComments).omit({
  id: true,
  createdAt: true,
});

export const insertOrganizationNoteSchema = createInsertSchema(organizationNotes).omit({
  id: true,
  createdAt: true,
});

export const insertBillableEventSchema = createInsertSchema(billableEvents).omit({
  id: true,
  createdAt: true,
}).extend({
  rate: z.coerce.string(),
  units: z.coerce.string(),
  totalAmount: z.coerce.string(),
});

export const insertEvidenceSchema = createInsertSchema(evidence).omit({
  id: true,
  createdAt: true,
}).extend({
  filePath: z.string().optional(),
  fileHash: z.string().optional(),
  originalFilename: z.string().optional(),
  mimeType: z.string().optional(),
});

export const insertAuditLogSchema = createInsertSchema(auditLog).omit({
  id: true,
  timestamp: true,
});

export const insertEmailAlertSchema = createInsertSchema(emailAlerts).omit({
  id: true,
  createdAt: true,
});

export const insertQuickbooksConnectionSchema = createInsertSchema(quickbooksConnections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertQuickbooksInvoiceSchema = createInsertSchema(quickbooksInvoices).omit({
  id: true,
  createdAt: true,
  lastSyncedAt: true,
}).extend({
  balance: z.union([z.string(), z.number()]).transform(val => val?.toString()),
  totalAmount: z.union([z.string(), z.number()]).transform(val => val?.toString()),
});

export const insertSystemSettingSchema = createInsertSchema(systemSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEvidenceCommentSchema = createInsertSchema(evidenceComments).omit({
  id: true,
  createdAt: true,
});

// OKR Tables
export const objectives = pgTable("objectives", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  timeframe: text("timeframe").notNull(), // e.g., "Q1 FY26"
  ownerId: varchar("owner_id").references(() => users.id),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const keyResults = pgTable("key_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  objectiveId: varchar("objective_id").notNull().references(() => objectives.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  target: decimal("target", { precision: 10, scale: 2 }).notNull(),
  current: decimal("current", { precision: 10, scale: 2 }).notNull().default("0"),
  baseline: decimal("baseline", { precision: 10, scale: 2 }),
  unit: text("unit").notNull(), // e.g., "percent", "dollars", "days", "count"
  scoring: decimal("scoring", { precision: 3, scale: 2 }).default("0.0"), // 0.0 to 1.0
  isAutoCalculated: boolean("is_auto_calculated").notNull().default(false),
  autoMetricType: text("auto_metric_type"), // e.g., "on_time_rate", "late_fees", "lead_time"
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const checkIns = pgTable("check_ins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  objectiveId: varchar("objective_id").notNull().references(() => objectives.id, { onDelete: "cascade" }),
  weekOf: timestamp("week_of").notNull(),
  confidence: confidenceEnum("confidence").notNull(),
  progressNotes: text("progress_notes"),
  risks: text("risks"),
  nextWeekPlan: text("next_week_plan"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertObjectiveSchema = createInsertSchema(objectives).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertKeyResultSchema = createInsertSchema(keyResults).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  target: z.coerce.string(),
  current: z.coerce.string(),
  baseline: z.coerce.string().optional(),
  scoring: z.coerce.string().optional(),
});

export const insertCheckInSchema = createInsertSchema(checkIns).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type Contract = typeof contracts.$inferSelect;
export type InsertContract = z.infer<typeof insertContractSchema>;
export type ComplianceItem = typeof complianceItems.$inferSelect;
export type InsertComplianceItem = z.infer<typeof insertComplianceItemSchema>;
export type ComplianceComment = typeof complianceComments.$inferSelect;
export type InsertComplianceComment = z.infer<typeof insertComplianceCommentSchema>;
export type OrganizationNote = typeof organizationNotes.$inferSelect;
export type InsertOrganizationNote = z.infer<typeof insertOrganizationNoteSchema>;
export type BillableEvent = typeof billableEvents.$inferSelect;
export type InsertBillableEvent = z.infer<typeof insertBillableEventSchema>;
export type Evidence = typeof evidence.$inferSelect;
export type InsertEvidence = z.infer<typeof insertEvidenceSchema>;
export type AuditLog = typeof auditLog.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type EmailAlert = typeof emailAlerts.$inferSelect;
export type InsertEmailAlert = z.infer<typeof insertEmailAlertSchema>;
export type QuickbooksConnection = typeof quickbooksConnections.$inferSelect;
export type InsertQuickbooksConnection = z.infer<typeof insertQuickbooksConnectionSchema>;
export type QuickbooksInvoice = typeof quickbooksInvoices.$inferSelect;
export type InsertQuickbooksInvoice = z.infer<typeof insertQuickbooksInvoiceSchema>;
export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;
export type EvidenceComment = typeof evidenceComments.$inferSelect;
export type InsertEvidenceComment = z.infer<typeof insertEvidenceCommentSchema>;
export type Objective = typeof objectives.$inferSelect;
export type InsertObjective = z.infer<typeof insertObjectiveSchema>;
export type KeyResult = typeof keyResults.$inferSelect;
export type InsertKeyResult = z.infer<typeof insertKeyResultSchema>;
export type CheckIn = typeof checkIns.$inferSelect;
export type InsertCheckIn = z.infer<typeof insertCheckInSchema>;
