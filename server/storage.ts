import { 
  users, organizations, contracts, complianceItems, billableEvents, evidence, auditLog, emailAlerts,
  quickbooksConnections, quickbooksInvoices, systemSettings,
  objectives, keyResults, checkIns,
  type User, type InsertUser, type Organization, type InsertOrganization, type Contract, type InsertContract,
  type ComplianceItem, type InsertComplianceItem, type BillableEvent, type InsertBillableEvent,
  type Evidence, type InsertEvidence, type AuditLog, type InsertAuditLog,
  type EmailAlert, type InsertEmailAlert,
  type QuickbooksConnection, type InsertQuickbooksConnection,
  type QuickbooksInvoice, type InsertQuickbooksInvoice,
  type SystemSetting, type InsertSystemSetting,
  type Objective, type InsertObjective,
  type KeyResult, type InsertKeyResult,
  type CheckIn, type InsertCheckIn
} from "../shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, or, gte, lte, like, count, sql } from "drizzle-orm";
import session, { Store, MemoryStore } from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  
  // Organization methods
  getOrganizations(): Promise<Organization[]>;
  getOrganization(id: string): Promise<Organization | undefined>;
  createOrganization(organization: InsertOrganization): Promise<Organization>;
  updateOrganization(id: string, updates: Partial<InsertOrganization>): Promise<Organization>;
  deleteOrganization(id: string): Promise<void>;
  
  // Contract methods
  getContracts(organizationId?: string): Promise<Contract[]>;
  getContract(id: string): Promise<Contract | undefined>;
  createContract(contract: InsertContract): Promise<Contract>;
  updateContract(id: string, updates: Partial<InsertContract>): Promise<Contract>;
  deleteContract(id: string): Promise<void>;
  
  // Compliance methods
  getComplianceItems(filters?: {
    organizationId?: string;
    category?: string;
    status?: string;
    dueDateFrom?: Date;
    dueDateTo?: Date;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ items: ComplianceItem[]; total: number }>;
  getComplianceItem(id: string): Promise<ComplianceItem | undefined>;
  createComplianceItem(item: InsertComplianceItem): Promise<ComplianceItem>;
  updateComplianceItem(id: string, updates: Partial<InsertComplianceItem>): Promise<ComplianceItem>;
  deleteComplianceItem(id: string): Promise<void>;
  getUpcomingComplianceItems(days: number): Promise<ComplianceItem[]>;
  getOverdueComplianceItems(): Promise<ComplianceItem[]>;
  getComplianceMetrics(): Promise<{
    totalItems: number;
    completedItems: number;
    overdueItems: number;
    upcomingItems: number;
    complianceRate: number;
  }>;
  
  // Billable events methods
  getBillableEvents(organizationId?: string): Promise<BillableEvent[]>;
  getBillableEvent(id: string): Promise<BillableEvent | undefined>;
  createBillableEvent(event: InsertBillableEvent): Promise<BillableEvent>;
  updateBillableEvent(id: string, updates: Partial<InsertBillableEvent>): Promise<BillableEvent>;
  deleteBillableEvent(id: string): Promise<void>;
  
  // Evidence methods
  getEvidence(complianceItemId?: string, billableEventId?: string): Promise<Evidence[]>;
  getEvidenceById(id: string): Promise<Evidence | undefined>;
  createEvidence(evidence: InsertEvidence): Promise<Evidence>;
  updateEvidence(id: string, updates: Partial<InsertEvidence>): Promise<Evidence>;
  deleteEvidence(id: string): Promise<void>;
  
  // Audit log methods
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(entityId?: string, limit?: number): Promise<AuditLog[]>;
  getAuditLogsWithFilters(filters: {
    userId?: string;
    action?: string;
    entityType?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ logs: AuditLog[]; total: number; }>;
  
  // Email alert methods
  createEmailAlert(alert: InsertEmailAlert): Promise<EmailAlert>;
  getPendingEmailAlerts(): Promise<EmailAlert[]>;
  updateEmailAlertStatus(id: string, status: string, errorMessage?: string): Promise<void>;
  
  // QuickBooks methods
  getAllQuickbooksConnections(): Promise<QuickbooksConnection[]>;
  getQuickbooksConnection(organizationId: string): Promise<QuickbooksConnection | undefined>;
  createQuickbooksConnection(connection: InsertQuickbooksConnection): Promise<QuickbooksConnection>;
  updateQuickbooksConnection(organizationId: string, updates: Partial<InsertQuickbooksConnection>): Promise<QuickbooksConnection>;
  deleteQuickbooksConnection(organizationId: string): Promise<void>;
  getQuickbooksInvoices(organizationId: string): Promise<QuickbooksInvoice[]>;
  upsertQuickbooksInvoice(invoice: InsertQuickbooksInvoice): Promise<QuickbooksInvoice>;
  deleteOrganizationInvoices(organizationId: string): Promise<void>;
  
  // System Settings methods
  getSystemSetting(key: string): Promise<SystemSetting | undefined>;
  getAllSystemSettings(): Promise<SystemSetting[]>;
  upsertSystemSetting(setting: InsertSystemSetting): Promise<SystemSetting>;
  deleteSystemSetting(key: string): Promise<void>;
  
  // Import/Export methods
  exportDatabase(): Promise<any>;
  importDatabase(data: any): Promise<{
    imported: {
      users: number;
      organizations: number;
      contracts: number;
      complianceItems: number;
      billableEvents: number;
      evidence: number;
      emailAlerts: number;
    };
    total: number;
  }>;
  resetDatabase(): Promise<void>;
  
  sessionStore: Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: Store;

  constructor() {
    // Check if using Neon serverless or standard PostgreSQL
    const isNeon = process.env.DATABASE_URL?.includes('neon.tech') || false;
    
    if (isNeon) {
      // Use MemoryStore for Neon serverless (connect-pg-simple doesn't work well with Neon)
      // Sessions will be lost on server restart in Replit, but this is acceptable for development
      console.log('[Session] Using MemoryStore for Neon serverless database');
      this.sessionStore = new MemoryStore();
    } else {
      // Use PostgreSQL session store for standard PostgreSQL (Docker)
      console.log('[Session] Using PostgreSQL session store for standard PostgreSQL');
      this.sessionStore = new PostgresSessionStore({ 
        pool, 
        createTableIfMissing: true 
      });
    }
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(asc(users.username));
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Organization methods
  async getOrganizations(): Promise<Organization[]> {
    return await db.select().from(organizations).orderBy(asc(organizations.name));
  }

  async getOrganization(id: string): Promise<Organization | undefined> {
    const [organization] = await db.select().from(organizations).where(eq(organizations.id, id));
    return organization;
  }

  async createOrganization(organization: InsertOrganization): Promise<Organization> {
    const [newOrganization] = await db.insert(organizations).values(organization).returning();
    return newOrganization;
  }

  async updateOrganization(id: string, updates: Partial<InsertOrganization>): Promise<Organization> {
    const [updatedOrganization] = await db
      .update(organizations)
      .set(updates)
      .where(eq(organizations.id, id))
      .returning();
    return updatedOrganization;
  }

  async deleteOrganization(id: string): Promise<void> {
    await db.delete(organizations).where(eq(organizations.id, id));
  }

  // Contract methods
  async getContracts(organizationId?: string): Promise<Contract[]> {
    if (organizationId) {
      return await db.select().from(contracts)
        .where(eq(contracts.customerId, organizationId))
        .orderBy(desc(contracts.createdAt));
    }
    return await db.select().from(contracts).orderBy(desc(contracts.createdAt));
  }

  async getContract(id: string): Promise<Contract | undefined> {
    const [contract] = await db.select().from(contracts).where(eq(contracts.id, id));
    return contract;
  }

  async createContract(contract: InsertContract): Promise<Contract> {
    const [newContract] = await db.insert(contracts).values(contract).returning();
    return newContract;
  }

  async updateContract(id: string, updates: Partial<InsertContract>): Promise<Contract> {
    const [updatedContract] = await db
      .update(contracts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(contracts.id, id))
      .returning();
    return updatedContract;
  }

  async deleteContract(id: string): Promise<void> {
    await db.delete(contracts).where(eq(contracts.id, id));
  }

  // Compliance methods
  async getComplianceItems(filters: {
    organizationId?: string;
    category?: string;
    status?: string;
    dueDateFrom?: Date;
    dueDateTo?: Date;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ items: ComplianceItem[]; total: number }> {
    let whereConditions: any[] = [];

    if (filters.organizationId) {
      whereConditions.push(eq(complianceItems.customerId, filters.organizationId));
    }
    if (filters.category) {
      whereConditions.push(eq(complianceItems.category, filters.category as any));
    }
    if (filters.status) {
      // Special handling for "overdue" status - it's actually pending items with past due dates
      if (filters.status === "overdue") {
        whereConditions.push(
          and(
            eq(complianceItems.status, "pending"),
            lte(complianceItems.dueDate, new Date())
          )
        );
      } else {
        whereConditions.push(eq(complianceItems.status, filters.status as any));
      }
    }
    if (filters.dueDateFrom) {
      whereConditions.push(gte(complianceItems.dueDate, filters.dueDateFrom));
    }
    if (filters.dueDateTo) {
      whereConditions.push(lte(complianceItems.dueDate, filters.dueDateTo));
    }
    if (filters.search) {
      whereConditions.push(
        or(
          like(complianceItems.commitment, `%${filters.search}%`),
          like(complianceItems.description, `%${filters.search}%`),
          like(complianceItems.responsibleParty, `%${filters.search}%`)
        )
      );
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Get total count
    const [{ total }] = await db
      .select({ total: count() })
      .from(complianceItems)
      .where(whereClause);

    // Get items
    let query = db.select().from(complianceItems).where(whereClause).orderBy(asc(complianceItems.dueDate)) as any;
    
    if (filters.limit !== undefined) {
      query = query.limit(filters.limit);
    }
    if (filters.offset !== undefined) {
      query = query.offset(filters.offset);
    }

    const items = await query;

    return { items, total };
  }

  async getComplianceItem(id: string): Promise<ComplianceItem | undefined> {
    const [item] = await db.select().from(complianceItems).where(eq(complianceItems.id, id));
    return item;
  }

  async createComplianceItem(item: InsertComplianceItem): Promise<ComplianceItem> {
    const [newItem] = await db.insert(complianceItems).values(item).returning();
    return newItem;
  }

  async updateComplianceItem(id: string, updates: Partial<InsertComplianceItem>): Promise<ComplianceItem> {
    const [updatedItem] = await db
      .update(complianceItems)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(complianceItems.id, id))
      .returning();
    return updatedItem;
  }

  async deleteComplianceItem(id: string): Promise<void> {
    await db.delete(complianceItems).where(eq(complianceItems.id, id));
  }

  async getUpcomingComplianceItems(days: number): Promise<ComplianceItem[]> {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    return await db
      .select()
      .from(complianceItems)
      .where(
        and(
          eq(complianceItems.status, "pending"),
          gte(complianceItems.dueDate, new Date()),
          lte(complianceItems.dueDate, endDate)
        )
      )
      .orderBy(asc(complianceItems.dueDate));
  }

  async getOverdueComplianceItems(): Promise<ComplianceItem[]> {
    return await db
      .select()
      .from(complianceItems)
      .where(
        and(
          eq(complianceItems.status, "pending"),
          lte(complianceItems.dueDate, new Date())
        )
      )
      .orderBy(asc(complianceItems.dueDate));
  }

  async getComplianceMetrics(): Promise<{
    totalItems: number;
    completedItems: number;
    overdueItems: number;
    upcomingItems: number;
    complianceRate: number;
  }> {
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const [total] = await db.select({ count: count() }).from(complianceItems);
    const [completed] = await db
      .select({ count: count() })
      .from(complianceItems)
      .where(eq(complianceItems.status, "complete"));
    const [overdue] = await db
      .select({ count: count() })
      .from(complianceItems)
      .where(
        or(
          eq(complianceItems.status, "overdue"),
          and(
            eq(complianceItems.status, "pending"),
            lte(complianceItems.dueDate, now)
          )
        )
      );
    const [upcoming] = await db
      .select({ count: count() })
      .from(complianceItems)
      .where(
        and(
          sql`${complianceItems.status} != 'complete'`,
          gte(complianceItems.dueDate, now),
          lte(complianceItems.dueDate, nextWeek)
        )
      );

    // For compliance rate: only count items that should be completed by now
    const [itemsDueByNow] = await db
      .select({ count: count() })
      .from(complianceItems)
      .where(lte(complianceItems.dueDate, now));
    
    const [completedDueByNow] = await db
      .select({ count: count() })
      .from(complianceItems)
      .where(
        and(
          eq(complianceItems.status, "complete"),
          lte(complianceItems.dueDate, now)
        )
      );

    const totalItems = total.count;
    const completedItems = completed.count;
    const overdueItems = overdue.count;
    const upcomingItems = upcoming.count;
    const itemsDueTodayOrPast = itemsDueByNow.count;
    const completedDueTodayOrPast = completedDueByNow.count;
    const complianceRate = itemsDueTodayOrPast > 0 ? (completedDueTodayOrPast / itemsDueTodayOrPast) * 100 : 0;

    return {
      totalItems,
      completedItems,
      overdueItems,
      upcomingItems,
      complianceRate,
    };
  }

  // Billable events methods
  async getBillableEvents(organizationId?: string): Promise<BillableEvent[]> {
    if (organizationId) {
      return await db.select().from(billableEvents)
        .where(eq(billableEvents.customerId, organizationId))
        .orderBy(desc(billableEvents.billingDate));
    }
    return await db.select().from(billableEvents).orderBy(desc(billableEvents.billingDate));
  }

  async getBillableEvent(id: string): Promise<BillableEvent | undefined> {
    const [event] = await db.select().from(billableEvents).where(eq(billableEvents.id, id));
    return event;
  }

  async createBillableEvent(event: InsertBillableEvent): Promise<BillableEvent> {
    const [newEvent] = await db.insert(billableEvents).values(event).returning();
    return newEvent;
  }

  async updateBillableEvent(id: string, updates: Partial<InsertBillableEvent>): Promise<BillableEvent> {
    const [updatedEvent] = await db
      .update(billableEvents)
      .set(updates)
      .where(eq(billableEvents.id, id))
      .returning();
    return updatedEvent;
  }

  async deleteBillableEvent(id: string): Promise<void> {
    await db.delete(billableEvents).where(eq(billableEvents.id, id));
  }

  // Evidence methods
  async getEvidence(complianceItemId?: string, billableEventId?: string): Promise<Evidence[]> {
    let whereConditions: any[] = [];
    
    if (complianceItemId) {
      whereConditions.push(eq(evidence.complianceItemId, complianceItemId));
    }
    if (billableEventId) {
      whereConditions.push(eq(evidence.billableEventId, billableEventId));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    return await db
      .select()
      .from(evidence)
      .where(whereClause)
      .orderBy(desc(evidence.createdAt));
  }

  async getEvidenceById(id: string): Promise<Evidence | undefined> {
    const [result] = await db.select().from(evidence).where(eq(evidence.id, id));
    return result;
  }

  async createEvidence(evidenceData: InsertEvidence): Promise<Evidence> {
    const [newEvidence] = await db.insert(evidence).values(evidenceData).returning();
    return newEvidence;
  }

  async updateEvidence(id: string, updates: Partial<InsertEvidence>): Promise<Evidence> {
    const [updatedEvidence] = await db
      .update(evidence)
      .set(updates)
      .where(eq(evidence.id, id))
      .returning();
    return updatedEvidence;
  }

  async deleteEvidence(id: string): Promise<void> {
    await db.delete(evidence).where(eq(evidence.id, id));
  }

  // Audit log methods
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [newLog] = await db.insert(auditLog).values(log).returning();
    return newLog;
  }

  async getAuditLogs(entityId?: string, limit: number = 100): Promise<AuditLog[]> {
    if (entityId) {
      return await db.select().from(auditLog)
        .where(eq(auditLog.entityId, entityId))
        .orderBy(desc(auditLog.timestamp))
        .limit(limit);
    }
    return await db.select().from(auditLog).orderBy(desc(auditLog.timestamp)).limit(limit);
  }

  async getAuditLogsWithFilters(filters: {
    userId?: string;
    action?: string;
    entityType?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ logs: AuditLog[]; total: number; }> {
    const { userId, action, entityType, startDate, endDate, page = 1, pageSize = 50 } = filters;
    
    const whereConditions: any[] = [];
    
    if (userId) {
      whereConditions.push(eq(auditLog.userId, userId));
    }
    if (action) {
      whereConditions.push(eq(auditLog.action, action));
    }
    if (entityType) {
      whereConditions.push(eq(auditLog.entityType, entityType));
    }
    if (startDate) {
      whereConditions.push(sql`${auditLog.timestamp} >= ${startDate}`);
    }
    if (endDate) {
      whereConditions.push(sql`${auditLog.timestamp} <= ${endDate}`);
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Get total count
    const [{ count: totalCount }] = await db
      .select({ count: count() })
      .from(auditLog)
      .where(whereClause);

    // Get paginated logs
    const logs = await db
      .select()
      .from(auditLog)
      .where(whereClause)
      .orderBy(desc(auditLog.timestamp))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return {
      logs,
      total: totalCount
    };
  }

  // Email alert methods
  async createEmailAlert(alert: InsertEmailAlert): Promise<EmailAlert> {
    const [newAlert] = await db.insert(emailAlerts).values(alert).returning();
    return newAlert;
  }

  async getPendingEmailAlerts(): Promise<EmailAlert[]> {
    return await db
      .select()
      .from(emailAlerts)
      .where(eq(emailAlerts.status, "pending"))
      .orderBy(asc(emailAlerts.createdAt));
  }

  async updateEmailAlertStatus(id: string, status: string, errorMessage?: string): Promise<void> {
    const updates: any = { status };
    if (status === "sent") {
      updates.sentAt = new Date();
    }
    if (errorMessage) {
      updates.errorMessage = errorMessage;
    }
    
    await db
      .update(emailAlerts)
      .set(updates)
      .where(eq(emailAlerts.id, id));
  }

  // QuickBooks methods
  async getAllQuickbooksConnections(): Promise<QuickbooksConnection[]> {
    return await db.select().from(quickbooksConnections);
  }

  async getQuickbooksConnection(organizationId: string): Promise<QuickbooksConnection | undefined> {
    const [connection] = await db
      .select()
      .from(quickbooksConnections)
      .where(eq(quickbooksConnections.organizationId, organizationId));
    return connection;
  }

  async createQuickbooksConnection(connection: InsertQuickbooksConnection): Promise<QuickbooksConnection> {
    const [newConnection] = await db
      .insert(quickbooksConnections)
      .values(connection)
      .returning();
    return newConnection;
  }

  async updateQuickbooksConnection(organizationId: string, updates: Partial<InsertQuickbooksConnection>): Promise<QuickbooksConnection> {
    const [updated] = await db
      .update(quickbooksConnections)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(quickbooksConnections.organizationId, organizationId))
      .returning();
    return updated;
  }

  async deleteQuickbooksConnection(organizationId: string): Promise<void> {
    await db
      .delete(quickbooksConnections)
      .where(eq(quickbooksConnections.organizationId, organizationId));
  }

  async getQuickbooksInvoices(organizationId: string): Promise<QuickbooksInvoice[]> {
    return await db
      .select()
      .from(quickbooksInvoices)
      .where(eq(quickbooksInvoices.organizationId, organizationId))
      .orderBy(desc(quickbooksInvoices.txnDate));
  }

  async upsertQuickbooksInvoice(invoice: InsertQuickbooksInvoice): Promise<QuickbooksInvoice> {
    // Try to find existing invoice by qbInvoiceId and organizationId
    const [existing] = await db
      .select()
      .from(quickbooksInvoices)
      .where(
        and(
          eq(quickbooksInvoices.qbInvoiceId, invoice.qbInvoiceId),
          eq(quickbooksInvoices.organizationId, invoice.organizationId)
        )
      );

    if (existing) {
      // Update existing invoice
      const [updated] = await db
        .update(quickbooksInvoices)
        .set({ ...invoice, lastSyncedAt: new Date() })
        .where(eq(quickbooksInvoices.id, existing.id))
        .returning();
      return updated;
    } else {
      // Insert new invoice
      const [newInvoice] = await db
        .insert(quickbooksInvoices)
        .values(invoice)
        .returning();
      return newInvoice;
    }
  }

  async deleteOrganizationInvoices(organizationId: string): Promise<void> {
    await db
      .delete(quickbooksInvoices)
      .where(eq(quickbooksInvoices.organizationId, organizationId));
  }

  // System Settings methods
  async getSystemSetting(key: string): Promise<SystemSetting | undefined> {
    const [setting] = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, key));
    return setting;
  }

  async getAllSystemSettings(): Promise<SystemSetting[]> {
    return await db.select().from(systemSettings);
  }

  async upsertSystemSetting(setting: InsertSystemSetting): Promise<SystemSetting> {
    const [result] = await db
      .insert(systemSettings)
      .values({
        ...setting,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: {
          value: setting.value,
          isEncrypted: setting.isEncrypted ?? false,
          description: setting.description,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  async deleteSystemSetting(key: string): Promise<void> {
    await db
      .delete(systemSettings)
      .where(eq(systemSettings.key, key));
  }

  // Import/Export methods
  async exportDatabase(): Promise<any> {
    const allUsers = await db.select().from(users);
    const allOrganizations = await db.select().from(organizations);
    const allContracts = await db.select().from(contracts);
    const allComplianceItems = await db.select().from(complianceItems);
    const allBillableEvents = await db.select().from(billableEvents);
    const allEvidence = await db.select().from(evidence);
    const allAuditLogs = await db.select().from(auditLog);
    const allEmailAlerts = await db.select().from(emailAlerts);

    return {
      appName: "BizGov",
      appVersion: "1.0",
      version: "1.0",
      timestamp: new Date().toISOString(),
      data: {
        users: allUsers,
        organizations: allOrganizations,
        contracts: allContracts,
        complianceItems: allComplianceItems,
        billableEvents: allBillableEvents,
        evidence: allEvidence,
        auditLogs: allAuditLogs,
        emailAlerts: allEmailAlerts,
      }
    };
  }

  private convertDatesToObjects(records: any[]): any[] {
    return records.map(record => {
      const converted: any = {};
      for (const [key, value] of Object.entries(record)) {
        // Convert ISO date strings to Date objects
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
          converted[key] = new Date(value);
        } else {
          converted[key] = value;
        }
      }
      return converted;
    });
  }

  async importDatabase(data: any): Promise<{
    imported: {
      users: number;
      organizations: number;
      contracts: number;
      complianceItems: number;
      billableEvents: number;
      evidence: number;
      emailAlerts: number;
    };
    total: number;
  }> {
    const imported = {
      users: 0,
      organizations: 0,
      contracts: 0,
      complianceItems: 0,
      billableEvents: 0,
      evidence: 0,
      emailAlerts: 0,
    };

    console.log("Starting database import...");
    console.log("Import data structure:", Object.keys(data));
    console.log("Import data.data structure:", data.data ? Object.keys(data.data) : 'no data key');

    // Validate backup format
    if (!data.data) {
      throw new Error("Invalid backup format: missing 'data' property");
    }

    // Check if this is a BizGov backup by checking the appName identifier
    if (data.appName !== "BizGov") {
      const actualTables = Object.keys(data.data);
      const capTableTables = ['companies', 'equityHoldings', 'stakeholders', 'securityTypes', 'userCompanies'];
      const hasCapTableTables = capTableTables.some(table => actualTables.includes(table));
      
      if (hasCapTableTables) {
        throw new Error(
          "This backup file is from a Cap Table application and cannot be imported into BizGov. " +
          "BizGov is a compliance and billing management system, not a cap table manager. " +
          "Please export data from BizGov using the Export Database button on this page."
        );
      } else {
        throw new Error(
          "This backup file is not from BizGov (missing 'appName: BizGov' identifier). " +
          "Please use a backup file exported from BizGov's Export/Import page."
        );
      }
    }

    // Validate BizGov backup has required tables
    const requiredTables = ['users', 'organizations'];
    const actualTables = Object.keys(data.data);
    const missingTables = requiredTables.filter(table => !actualTables.includes(table));
    
    if (missingTables.length > 0) {
      throw new Error(
        `Invalid BizGov backup: missing required tables: ${missingTables.join(', ')}. ` +
        "The backup file may be corrupted."
      );
    }

    // Import users with date conversion
    if (data.data?.users?.length) {
      console.log(`Importing ${data.data.users.length} users...`);
      const convertedUsers = this.convertDatesToObjects(data.data.users);
      const result = await db.insert(users).values(convertedUsers).onConflictDoNothing().returning();
      imported.users = result.length;
      console.log(`Imported ${imported.users} users (skipped ${data.data.users.length - imported.users} duplicates)`);
    }
    
    // Import organizations with date conversion
    if (data.data?.organizations?.length) {
      console.log(`Importing ${data.data.organizations.length} organizations...`);
      const convertedOrgs = this.convertDatesToObjects(data.data.organizations);
      const result = await db.insert(organizations).values(convertedOrgs).onConflictDoNothing().returning();
      imported.organizations = result.length;
      console.log(`Imported ${imported.organizations} organizations (skipped ${data.data.organizations.length - imported.organizations} duplicates)`);
    }
    
    // Import contracts with date conversion
    if (data.data?.contracts?.length) {
      console.log(`Importing ${data.data.contracts.length} contracts...`);
      const convertedContracts = this.convertDatesToObjects(data.data.contracts);
      const result = await db.insert(contracts).values(convertedContracts).onConflictDoNothing().returning();
      imported.contracts = result.length;
      console.log(`Imported ${imported.contracts} contracts (skipped ${data.data.contracts.length - imported.contracts} duplicates)`);
    }
    
    // Import compliance items with date conversion
    if (data.data?.complianceItems?.length) {
      console.log(`Importing ${data.data.complianceItems.length} compliance items...`);
      const convertedItems = this.convertDatesToObjects(data.data.complianceItems);
      const result = await db.insert(complianceItems).values(convertedItems).onConflictDoNothing().returning();
      imported.complianceItems = result.length;
      console.log(`Imported ${imported.complianceItems} compliance items (skipped ${data.data.complianceItems.length - imported.complianceItems} duplicates)`);
    }
    
    // Import billable events with date conversion
    if (data.data?.billableEvents?.length) {
      console.log(`Importing ${data.data.billableEvents.length} billable events...`);
      const convertedEvents = this.convertDatesToObjects(data.data.billableEvents);
      const result = await db.insert(billableEvents).values(convertedEvents).onConflictDoNothing().returning();
      imported.billableEvents = result.length;
      console.log(`Imported ${imported.billableEvents} billable events (skipped ${data.data.billableEvents.length - imported.billableEvents} duplicates)`);
    }
    
    // Import evidence with date conversion
    if (data.data?.evidence?.length) {
      console.log(`Importing ${data.data.evidence.length} evidence items...`);
      const convertedEvidence = this.convertDatesToObjects(data.data.evidence);
      const result = await db.insert(evidence).values(convertedEvidence).onConflictDoNothing().returning();
      imported.evidence = result.length;
      console.log(`Imported ${imported.evidence} evidence items (skipped ${data.data.evidence.length - imported.evidence} duplicates)`);
    }
    
    // Import email alerts with date conversion
    if (data.data?.emailAlerts?.length) {
      console.log(`Importing ${data.data.emailAlerts.length} email alerts...`);
      const convertedAlerts = this.convertDatesToObjects(data.data.emailAlerts);
      const result = await db.insert(emailAlerts).values(convertedAlerts).onConflictDoNothing().returning();
      imported.emailAlerts = result.length;
      console.log(`Imported ${imported.emailAlerts} email alerts (skipped ${data.data.emailAlerts.length - imported.emailAlerts} duplicates)`);
    }

    const total = Object.values(imported).reduce((sum, count) => sum + count, 0);
    console.log(`Database import complete. Total records imported: ${total}`);

    return { imported, total };
  }

  async resetDatabase(): Promise<void> {
    // Delete all data from all tables except users
    // Order matters due to foreign key constraints - delete in reverse order of dependencies
    await db.delete(checkIns);
    await db.delete(keyResults);
    await db.delete(objectives);
    await db.delete(emailAlerts);
    await db.delete(auditLog);
    await db.delete(evidence);
    await db.delete(billableEvents);
    await db.delete(complianceItems);
    await db.delete(contracts);
    await db.delete(organizations);
    // Users table is NOT deleted to preserve admin access
  }

  // OKR Methods
  async getObjectives(filters?: { timeframe?: string; isActive?: boolean }): Promise<Objective[]> {
    let query = db.select().from(objectives);
    const conditions = [];
    
    if (filters?.timeframe) {
      conditions.push(eq(objectives.timeframe, filters.timeframe));
    }
    if (filters?.isActive !== undefined) {
      conditions.push(eq(objectives.isActive, filters.isActive));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(desc(objectives.createdAt));
  }

  async getObjective(id: string): Promise<Objective | undefined> {
    const [objective] = await db.select().from(objectives).where(eq(objectives.id, id));
    return objective;
  }

  async createObjective(objective: InsertObjective): Promise<Objective> {
    const [newObjective] = await db.insert(objectives).values(objective).returning();
    return newObjective;
  }

  async updateObjective(id: string, updates: Partial<InsertObjective>): Promise<Objective> {
    const [updated] = await db.update(objectives).set({ ...updates, updatedAt: new Date() }).where(eq(objectives.id, id)).returning();
    return updated;
  }

  async deleteObjective(id: string): Promise<void> {
    await db.delete(objectives).where(eq(objectives.id, id));
  }

  async getKeyResults(objectiveId?: string): Promise<KeyResult[]> {
    if (objectiveId) {
      return await db.select().from(keyResults).where(eq(keyResults.objectiveId, objectiveId)).orderBy(asc(keyResults.createdAt));
    }
    return await db.select().from(keyResults).orderBy(asc(keyResults.createdAt));
  }

  async getKeyResult(id: string): Promise<KeyResult | undefined> {
    const [kr] = await db.select().from(keyResults).where(eq(keyResults.id, id));
    return kr;
  }

  async createKeyResult(keyResult: InsertKeyResult): Promise<KeyResult> {
    const [newKR] = await db.insert(keyResults).values(keyResult).returning();
    return newKR;
  }

  async updateKeyResult(id: string, updates: Partial<InsertKeyResult>): Promise<KeyResult> {
    const [updated] = await db.update(keyResults).set({ ...updates, updatedAt: new Date() }).where(eq(keyResults.id, id)).returning();
    return updated;
  }

  async deleteKeyResult(id: string): Promise<void> {
    await db.delete(keyResults).where(eq(keyResults.id, id));
  }

  async getCheckIns(objectiveId: string): Promise<CheckIn[]> {
    return await db.select().from(checkIns).where(eq(checkIns.objectiveId, objectiveId)).orderBy(desc(checkIns.weekOf));
  }

  async createCheckIn(checkIn: InsertCheckIn): Promise<CheckIn> {
    const [newCheckIn] = await db.insert(checkIns).values(checkIn).returning();
    return newCheckIn;
  }

  async calculateAutoMetrics(): Promise<{
    onTimeRate: number;
    lateFees: number;
    leadTime: number;
    contractCoverage: number;
  }> {
    const now = new Date();
    
    // On-time rate: completed items on or before due date / total items with due dates
    const [completedOnTime] = await db.select({ count: count() })
      .from(complianceItems)
      .where(
        and(
          eq(complianceItems.status, "complete"),
          lte(complianceItems.completedAt, complianceItems.dueDate)
        )
      );
    
    const [totalWithDueDates] = await db.select({ count: count() })
      .from(complianceItems)
      .where(sql`${complianceItems.dueDate} IS NOT NULL`);
    
    const onTimeRate = totalWithDueDates.count > 0 
      ? (completedOnTime.count / totalWithDueDates.count) * 100 
      : 0;
    
    // Late fees: sum of billable events where description contains "late fee" or "penalty"
    const lateFeeEvents = await db.select()
      .from(billableEvents)
      .where(
        or(
          like(billableEvents.description, '%late fee%'),
          like(billableEvents.description, '%penalty%'),
          like(billableEvents.description, '%interest%')
        )
      );
    
    const lateFees = lateFeeEvents.reduce((sum: number, event: any) => 
      sum + parseFloat(event.totalAmount?.toString() || '0'), 0
    );
    
    // Lead time: average days from creation to completion for completed items this quarter
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(now.getMonth() - 3);
    
    const recentCompleted = await db.select()
      .from(complianceItems)
      .where(
        and(
          eq(complianceItems.status, "complete"),
          gte(complianceItems.completedAt, threeMonthsAgo)
        )
      );
    
    let totalDays = 0;
    recentCompleted.forEach((item: any) => {
      if (item.completedAt && item.createdAt) {
        const days = Math.ceil((item.completedAt.getTime() - item.createdAt.getTime()) / (1000 * 60 * 60 * 24));
        totalDays += days;
      }
    });
    
    const leadTime = recentCompleted.length > 0 
      ? totalDays / recentCompleted.length 
      : 0;
    
    // Contract coverage: percentage of contracts with at least one compliance item
    const [totalContracts] = await db.select({ count: count() }).from(contracts);
    const [contractsWithCompliance] = await db.select({ count: sql`COUNT(DISTINCT ${complianceItems.contractId})` })
      .from(complianceItems)
      .where(sql`${complianceItems.contractId} IS NOT NULL`);
    
    const contractCoverage = totalContracts.count > 0
      ? (Number(contractsWithCompliance.count) / totalContracts.count) * 100
      : 0;
    
    return {
      onTimeRate: Math.round(onTimeRate * 10) / 10,
      lateFees: Math.round(lateFees * 100) / 100,
      leadTime: Math.round(leadTime * 10) / 10,
      contractCoverage: Math.round(contractCoverage * 10) / 10
    };
  }
}

export const storage = new DatabaseStorage();
