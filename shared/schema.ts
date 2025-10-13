import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, decimal, uuid, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const roleEnum = pgEnum("role", ["admin", "user"]);
export const statusEnum = pgEnum("status", ["pending", "complete", "overdue", "na"]);
export const categoryEnum = pgEnum("category", ["Marketing Agreement", "Billing", "Deliverable", "Compliance", "End-of-Term"]);
export const evidenceTypeEnum = pgEnum("evidence_type", ["document", "email", "screenshot", "report", "other"]);

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
  complianceItemId: varchar("compliance_item_id").references(() => complianceItems.id),
  billableEventId: varchar("billable_event_id").references(() => billableEvents.id),
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

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  evidence: many(evidence),
  auditLog: many(auditLog),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  contracts: many(contracts),
  complianceItems: many(complianceItems),
  billableEvents: many(billableEvents),
}));

export const contractsRelations = relations(contracts, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [contracts.customerId],
    references: [organizations.id],
  }),
  complianceItems: many(complianceItems),
  billableEvents: many(billableEvents),
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

export const evidenceRelations = relations(evidence, ({ one }) => ({
  complianceItem: one(complianceItems, {
    fields: [evidence.complianceItemId],
    references: [complianceItems.id],
  }),
  billableEvent: one(billableEvents, {
    fields: [evidence.billableEventId],
    references: [billableEvents.id],
  }),
  uploadedByUser: one(users, {
    fields: [evidence.uploadedBy],
    references: [users.id],
  }),
}));

export const emailAlertsRelations = relations(emailAlerts, ({ one }) => ({
  complianceItem: one(complianceItems, {
    fields: [emailAlerts.complianceItemId],
    references: [complianceItems.id],
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
  maxAmount: z.union([z.string(), z.number()]).optional().transform(val => val?.toString()),
});

export const insertComplianceItemSchema = createInsertSchema(complianceItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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
});

export const insertAuditLogSchema = createInsertSchema(auditLog).omit({
  id: true,
  timestamp: true,
});

export const insertEmailAlertSchema = createInsertSchema(emailAlerts).omit({
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
export type BillableEvent = typeof billableEvents.$inferSelect;
export type InsertBillableEvent = z.infer<typeof insertBillableEventSchema>;
export type Evidence = typeof evidence.$inferSelect;
export type InsertEvidence = z.infer<typeof insertEvidenceSchema>;
export type AuditLog = typeof auditLog.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type EmailAlert = typeof emailAlerts.$inferSelect;
export type InsertEmailAlert = z.infer<typeof insertEmailAlertSchema>;
