import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertCustomerSchema, insertContractSchema, insertComplianceItemSchema, insertBillableEventSchema, insertEvidenceSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import { parseCSV, validateComplianceCSV } from "./services/csv-import";
import { sendEmailAlert } from "./services/email-service";
import { exportService } from "./services/export-service";

// Setup multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

export function registerRoutes(app: Express): Server {
  // Setup authentication routes
  setupAuth(app);

  // Customer routes
  app.get("/api/customers", async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customers" });
    }
  });

  app.post("/api/customers", async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(validatedData);
      
      // Audit log
      await storage.createAuditLog({
        userId: req.user?.id,
        action: "CREATE",
        entityType: "customer",
        entityId: customer.id,
        newValues: JSON.stringify(customer),
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      res.status(201).json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid input", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create customer" });
      }
    }
  });

  // Contract routes
  app.get("/api/contracts", async (req, res) => {
    try {
      const customerId = req.query.customerId as string;
      const contracts = await storage.getContracts(customerId);
      res.json(contracts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contracts" });
    }
  });

  app.post("/api/contracts", async (req, res) => {
    try {
      // Convert date strings to Date objects before validation
      const data = {
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
      };
      const validatedData = insertContractSchema.parse(data);
      const contract = await storage.createContract(validatedData);
      
      // Audit log
      await storage.createAuditLog({
        userId: req.user?.id,
        action: "CREATE",
        entityType: "contract",
        entityId: contract.id,
        newValues: JSON.stringify(contract),
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      res.status(201).json(contract);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid input", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create contract" });
      }
    }
  });

  // Compliance item routes
  app.get("/api/compliance-items", async (req, res) => {
    try {
      const filters: {
        customerId?: string;
        category?: string;
        status?: string;
        search?: string;
        limit?: number;
        offset?: number;
        dueDateFrom?: Date;
        dueDateTo?: Date;
      } = {
        customerId: req.query.customerId as string,
        category: req.query.category as string,
        status: req.query.status as string,
        search: req.query.search as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      };

      if (req.query.dueDateFrom) {
        filters.dueDateFrom = new Date(req.query.dueDateFrom as string);
      }
      if (req.query.dueDateTo) {
        filters.dueDateTo = new Date(req.query.dueDateTo as string);
      }

      const result = await storage.getComplianceItems(filters);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch compliance items" });
    }
  });

  app.get("/api/compliance-items/:id", async (req, res) => {
    try {
      const item = await storage.getComplianceItem(req.params.id);
      if (!item) {
        return res.status(404).json({ error: "Compliance item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch compliance item" });
    }
  });

  app.post("/api/compliance-items", async (req, res) => {
    try {
      // Convert date strings to Date objects before validation
      const data = {
        ...req.body,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
      };
      const validatedData = insertComplianceItemSchema.parse(data);
      const item = await storage.createComplianceItem(validatedData);
      
      // Audit log
      await storage.createAuditLog({
        userId: req.user?.id,
        action: "CREATE",
        entityType: "compliance_item",
        entityId: item.id,
        newValues: JSON.stringify(item),
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid input", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create compliance item" });
      }
    }
  });

  app.put("/api/compliance-items/:id", async (req, res) => {
    try {
      const oldItem = await storage.getComplianceItem(req.params.id);
      if (!oldItem) {
        return res.status(404).json({ error: "Compliance item not found" });
      }

      const validatedData = insertComplianceItemSchema.partial().parse(req.body);
      const updatedItem = await storage.updateComplianceItem(req.params.id, validatedData);
      
      // Audit log
      await storage.createAuditLog({
        userId: req.user?.id,
        action: "UPDATE",
        entityType: "compliance_item",
        entityId: updatedItem.id,
        oldValues: JSON.stringify(oldItem),
        newValues: JSON.stringify(updatedItem),
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      res.json(updatedItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid input", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update compliance item" });
      }
    }
  });

  app.delete("/api/compliance-items/:id", async (req, res) => {
    try {
      const item = await storage.getComplianceItem(req.params.id);
      if (!item) {
        return res.status(404).json({ error: "Compliance item not found" });
      }

      await storage.deleteComplianceItem(req.params.id);
      
      // Audit log
      await storage.createAuditLog({
        userId: req.user?.id,
        action: "DELETE",
        entityType: "compliance_item",
        entityId: req.params.id,
        oldValues: JSON.stringify(item),
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete compliance item" });
    }
  });

  // CSV import route
  app.post("/api/compliance-items/import-csv", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const csvData = await parseCSV(req.file.path);
      const validatedItems = await validateComplianceCSV(csvData);
      
      const createdItems = [];
      for (const item of validatedItems) {
        const createdItem = await storage.createComplianceItem(item);
        createdItems.push(createdItem);
        
        // Audit log for each imported item
        await storage.createAuditLog({
          userId: req.user?.id,
          action: "IMPORT",
          entityType: "compliance_item",
          entityId: createdItem.id,
          newValues: JSON.stringify(createdItem),
          ipAddress: req.ip,
          userAgent: req.get("User-Agent"),
        });
      }
      
      res.json({ 
        message: `Successfully imported ${createdItems.length} compliance items`,
        items: createdItems 
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to import CSV";
      res.status(500).json({ error: message });
    }
  });

  // Billable events routes
  app.get("/api/billable-events", async (req, res) => {
    try {
      const customerId = req.query.customerId as string;
      const events = await storage.getBillableEvents(customerId);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch billable events" });
    }
  });

  app.post("/api/billable-events", async (req, res) => {
    try {
      // Convert date strings to Date objects before validation
      const data = {
        ...req.body,
        billingDate: req.body.billingDate ? new Date(req.body.billingDate) : undefined,
      };
      const validatedData = insertBillableEventSchema.parse(data);
      const event = await storage.createBillableEvent(validatedData);
      
      // Audit log
      await storage.createAuditLog({
        userId: req.user?.id,
        action: "CREATE",
        entityType: "billable_event",
        entityId: event.id,
        newValues: JSON.stringify(event),
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      res.status(201).json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid input", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create billable event" });
      }
    }
  });

  // Evidence routes
  app.get("/api/evidence", async (req, res) => {
    try {
      const complianceItemId = req.query.complianceItemId as string;
      const billableEventId = req.query.billableEventId as string;
      const evidence = await storage.getEvidence(complianceItemId, billableEventId);
      res.json(evidence);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch evidence" });
    }
  });

  app.post("/api/evidence", upload.single("file"), async (req, res) => {
    try {
      const evidenceData = {
        ...req.body,
        uploadedBy: req.user?.id,
        filePath: req.file?.path,
        fileHash: req.file ? "hash_placeholder" : undefined, // In production, calculate actual hash
      };
      
      const validatedData = insertEvidenceSchema.parse(evidenceData);
      const evidence = await storage.createEvidence(validatedData);
      
      // Audit log
      await storage.createAuditLog({
        userId: req.user?.id,
        action: "CREATE",
        entityType: "evidence",
        entityId: evidence.id,
        newValues: JSON.stringify(evidence),
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      res.status(201).json(evidence);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid input", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create evidence" });
      }
    }
  });

  // Dashboard metrics
  app.get("/api/dashboard/metrics", async (req, res) => {
    try {
      const metrics = await storage.getComplianceMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard metrics" });
    }
  });

  // Email alerts
  app.post("/api/email-alerts/send", async (req, res) => {
    try {
      const upcomingItems = await storage.getUpcomingComplianceItems(7);
      const overdueItems = await storage.getOverdueComplianceItems();
      
      let alertsSent = 0;
      
      // Send alerts for upcoming items
      for (const item of upcomingItems) {
        try {
          await sendEmailAlert(item, "upcoming");
          alertsSent++;
        } catch (error) {
          console.error(`Failed to send alert for item ${item.id}:`, error);
        }
      }
      
      // Send alerts for overdue items
      for (const item of overdueItems) {
        try {
          await sendEmailAlert(item, "overdue");
          alertsSent++;
        } catch (error) {
          console.error(`Failed to send alert for item ${item.id}:`, error);
        }
      }
      
      res.json({ message: `Sent ${alertsSent} email alerts` });
    } catch (error) {
      res.status(500).json({ error: "Failed to send email alerts" });
    }
  });

  // Export/Import routes
  app.get("/api/export/database", async (req, res) => {
    try {
      const exportData = await storage.exportDatabase();
      
      // Audit log
      await storage.createAuditLog({
        userId: req.user?.id,
        action: "EXPORT",
        entityType: "database",
        entityId: "full_export",
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=bizgov-export-${new Date().toISOString().split('T')[0]}.json`);
      res.json(exportData);
    } catch (error) {
      res.status(500).json({ error: "Failed to export database" });
    }
  });

  app.post("/api/import/database", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      const fileContent = require('fs').readFileSync(req.file.path, 'utf8');
      const importData = JSON.parse(fileContent);
      
      await storage.importDatabase(importData);
      
      // Audit log
      await storage.createAuditLog({
        userId: req.user?.id,
        action: "IMPORT",
        entityType: "database",
        entityId: "full_import",
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      res.json({ message: "Database imported successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to import database" });
    }
  });

  // Audit log routes
  app.get("/api/audit-logs", async (req, res) => {
    try {
      const entityId = req.query.entityId as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const logs = await storage.getAuditLogs(entityId, limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
