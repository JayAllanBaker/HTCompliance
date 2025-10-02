import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupAuth, hashPassword } from "./auth";
import { storage } from "./storage";
import { insertOrganizationSchema, insertContractSchema, insertComplianceItemSchema, insertBillableEventSchema, insertEvidenceSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import { parseCSV, validateComplianceCSV } from "./services/csv-import";
import { sendEmailAlert } from "./services/email-service";
import { exportService } from "./services/export-service";

// Admin-only middleware
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

// Setup multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

export function registerRoutes(app: Express): Server {
  // Setup authentication routes
  setupAuth(app);

  // Organization routes (admin protected for mutations)
  app.get("/api/organizations", async (req, res) => {
    try {
      const organizations = await storage.getOrganizations();
      res.json(organizations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch organizations" });
    }
  });

  app.post("/api/organizations", async (req, res) => {
    try {
      const validatedData = insertOrganizationSchema.parse(req.body);
      const organization = await storage.createOrganization(validatedData);
      
      // Audit log
      await storage.createAuditLog({
        userId: req.user?.id,
        action: "CREATE",
        entityType: "organization",
        entityId: organization.id,
        newValues: JSON.stringify(organization),
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      res.status(201).json(organization);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid input", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create organization" });
      }
    }
  });

  app.patch("/api/organizations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertOrganizationSchema.partial().parse(req.body);
      const organization = await storage.updateOrganization(id, validatedData);
      
      // Audit log
      await storage.createAuditLog({
        userId: req.user?.id,
        action: "UPDATE",
        entityType: "organization",
        entityId: organization.id,
        newValues: JSON.stringify(organization),
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      res.json(organization);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid input", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update organization" });
      }
    }
  });

  app.delete("/api/organizations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const organization = await storage.getOrganization(id);
      
      if (!organization) {
        return res.status(404).json({ error: "Organization not found" });
      }
      
      // Audit log before deletion
      await storage.createAuditLog({
        userId: req.user?.id,
        action: "DELETE",
        entityType: "organization",
        entityId: id,
        oldValues: JSON.stringify(organization),
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      // Delete organization
      await storage.deleteOrganization(id);
      
      res.json({ message: "Organization deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete organization" });
    }
  });

  // Contract routes
  app.get("/api/contracts", async (req, res) => {
    try {
      const organizationId = req.query.organizationId as string;
      const contracts = await storage.getContracts(organizationId);
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
        organizationId?: string;
        category?: string;
        status?: string;
        search?: string;
        limit?: number;
        offset?: number;
        dueDateFrom?: Date;
        dueDateTo?: Date;
      } = {
        organizationId: req.query.organizationId as string,
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

      console.log("Update request body:", JSON.stringify(req.body, null, 2));
      
      // Convert date strings to Date objects before validation
      const data = {
        ...req.body,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
        completedAt: req.body.completedAt ? new Date(req.body.completedAt) : null,
      };
      
      console.log("Data after date conversion:", JSON.stringify(data, null, 2));
      const validatedData = insertComplianceItemSchema.partial().parse(data);
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
      console.error("Error updating compliance item:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid input", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update compliance item", message: error instanceof Error ? error.message : "Unknown error" });
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
      const organizationId = req.query.organizationId as string;
      const events = await storage.getBillableEvents(organizationId);
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
      console.log("Creating billable event with data:", JSON.stringify(data, null, 2));
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
      console.error("Error creating billable event:", error);
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", JSON.stringify(error.errors, null, 2));
        res.status(400).json({ error: "Invalid input", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create billable event", message: error instanceof Error ? error.message : "Unknown error" });
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
        originalFilename: req.file?.originalname,
        mimeType: req.file?.mimetype,
      };
      
      console.log("Evidence data before validation:", evidenceData);
      
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
      console.error("Error creating evidence:", error);
      if (error instanceof z.ZodError) {
        console.error("Zod validation errors:", JSON.stringify(error.errors, null, 2));
        res.status(400).json({ error: "Invalid input", details: error.errors });
      } else {
        console.error("Non-Zod error:", error instanceof Error ? error.message : error);
        res.status(500).json({ error: "Failed to create evidence" });
      }
    }
  });

  app.get("/api/evidence/:id/download", async (req, res) => {
    try {
      const evidenceList = await storage.getEvidence();
      const evidence = evidenceList.find(e => e.id === req.params.id);
      
      if (!evidence) {
        return res.status(404).json({ error: "Evidence not found" });
      }
      
      if (!evidence.filePath) {
        return res.status(404).json({ error: "No file attached to this evidence" });
      }
      
      const path = await import("path");
      const fs = await import("fs");
      const absolutePath = path.resolve(evidence.filePath);
      
      // Check if file exists
      if (!fs.existsSync(absolutePath)) {
        return res.status(404).json({ error: "File not found on disk" });
      }
      
      const isDownload = req.query.download === 'true';
      
      // Use stored MIME type or fallback to default
      const contentType = evidence.mimeType || 'application/octet-stream';
      
      // Use original filename if available, otherwise create one from title
      let filename: string;
      if (evidence.originalFilename) {
        filename = evidence.originalFilename;
      } else {
        // Fallback: create filename from title with generic extension
        const safeFilename = evidence.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const extension = contentType.includes('pdf') ? 'pdf' : 
                          contentType.includes('image') ? 'png' : 
                          contentType.includes('word') ? 'docx' :
                          contentType.includes('excel') ? 'xlsx' : 'bin';
        filename = `${safeFilename}.${extension}`;
      }
      
      res.setHeader('Content-Type', contentType);
      
      if (isDownload) {
        // Force download with proper filename
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      } else {
        // View inline in browser
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      }
      
      // Stream the file
      const fileStream = fs.createReadStream(absolutePath);
      fileStream.pipe(res);
      
      fileStream.on('error', (err) => {
        console.error("Error streaming file:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Failed to serve file" });
        }
      });
    } catch (error) {
      console.error("Error accessing evidence file:", error);
      res.status(500).json({ error: "Failed to access evidence file" });
    }
  });

  // Evidence export - creates a ZIP with all files and manifest
  app.get("/api/evidence/export", async (req, res) => {
    try {
      const archiver = (await import("archiver")).default;
      const path = await import("path");
      const fs = await import("fs");
      
      const evidenceList = await storage.getEvidence();
      
      // Create manifest with all evidence metadata
      const manifest = evidenceList.map(e => ({
        id: e.id,
        complianceItemId: e.complianceItemId,
        billableEventId: e.billableEventId,
        title: e.title,
        description: e.description,
        evidenceType: e.evidenceType,
        originalFilename: e.originalFilename,
        mimeType: e.mimeType,
        uploadedBy: e.uploadedBy,
        createdAt: e.createdAt?.toISOString(),
      }));
      
      // Create archive
      const archive = archiver('zip', {
        zlib: { level: 9 }
      });
      
      // Set response headers
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="evidence-export-${Date.now()}.zip"`);
      
      // Pipe archive to response
      archive.pipe(res);
      
      // Add manifest
      archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest.json' });
      
      // Add all files
      for (const evidence of evidenceList) {
        if (evidence.filePath && evidence.originalFilename) {
          const absolutePath = path.resolve(evidence.filePath);
          if (fs.existsSync(absolutePath)) {
            // Use evidence ID in filename to ensure uniqueness
            archive.file(absolutePath, { name: `files/${evidence.id}-${evidence.originalFilename}` });
          }
        }
      }
      
      // Audit log
      await storage.createAuditLog({
        userId: req.user?.id,
        action: "EXPORT",
        entityType: "evidence",
        entityId: "all",
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      archive.finalize();
    } catch (error) {
      console.error("Error exporting evidence:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to export evidence" });
      }
    }
  });

  // Evidence import - accepts ZIP with files and manifest
  app.post("/api/evidence/import", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      const AdmZip = (await import("adm-zip")).default;
      const path = await import("path");
      const fs = await import("fs");
      
      const zip = new AdmZip(req.file.path);
      const zipEntries = zip.getEntries();
      
      // Find and parse manifest
      const manifestEntry = zipEntries.find((entry: any) => entry.entryName === 'manifest.json');
      if (!manifestEntry) {
        return res.status(400).json({ error: "Invalid import file: manifest.json not found" });
      }
      
      const manifest = JSON.parse(manifestEntry.getData().toString('utf8'));
      
      const importedEvidence = [];
      const errors = [];
      
      for (const item of manifest) {
        try {
          // Find the corresponding file in the ZIP
          const fileEntry = zipEntries.find((entry: any) => 
            entry.entryName === `files/${item.id}-${item.originalFilename}`
          );
          
          let filePath: string | undefined;
          
          if (fileEntry) {
            // Extract file to uploads directory
            const filename = `${Date.now()}-${item.originalFilename}`;
            filePath = path.join('uploads', filename);
            fs.writeFileSync(filePath, fileEntry.getData());
          }
          
          // Create evidence record (use original reference IDs)
          const evidenceData = {
            complianceItemId: item.complianceItemId || null,
            billableEventId: item.billableEventId || null,
            title: item.title,
            description: item.description,
            evidenceType: item.evidenceType,
            filePath: filePath,
            fileHash: "imported",
            originalFilename: item.originalFilename,
            mimeType: item.mimeType,
            uploadedBy: req.user?.id,
          };
          
          const validatedData = insertEvidenceSchema.parse(evidenceData);
          const evidence = await storage.createEvidence(validatedData);
          importedEvidence.push(evidence);
        } catch (error) {
          errors.push({
            item: item.title,
            error: error instanceof Error ? error.message : "Unknown error"
          });
        }
      }
      
      // Clean up uploaded ZIP
      fs.unlinkSync(req.file.path);
      
      // Audit log
      await storage.createAuditLog({
        userId: req.user?.id,
        action: "IMPORT",
        entityType: "evidence",
        entityId: `imported_${importedEvidence.length}_items`,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      res.json({
        imported: importedEvidence.length,
        errors: errors.length,
        details: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error("Error importing evidence:", error);
      res.status(500).json({ error: "Failed to import evidence" });
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

  // Admin routes - User management
  app.get("/api/users", requireAdmin, async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      // Remove password hashes from response
      const sanitized = allUsers.map(({ password, ...user }) => user);
      res.json(sanitized);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.post("/api/users", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      // Hash password before storing
      const user = await storage.createUser({
        ...validatedData,
        password: await hashPassword(validatedData.password)
      });
      
      // Audit log
      await storage.createAuditLog({
        userId: req.user?.id,
        action: "CREATE",
        entityType: "user",
        entityId: user.id,
        newValues: JSON.stringify({ ...user, password: "[REDACTED]" }),
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      // Remove password hash from response
      const { password, ...sanitizedUser } = user;
      res.status(201).json(sanitizedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid input", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create user" });
      }
    }
  });

  app.patch("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Validate input - use partial schema to allow optional fields
      const updateSchema = insertUserSchema.partial();
      const validatedUpdates = updateSchema.parse(req.body);
      const updates: any = { ...validatedUpdates };
      
      // Only update password if provided and not empty
      if (updates.password && updates.password.trim() !== "") {
        updates.password = await hashPassword(updates.password);
      } else {
        // Don't update password if empty
        delete updates.password;
      }
      
      const updatedUser = await storage.updateUser(id, updates);
      
      // Audit log
      await storage.createAuditLog({
        userId: req.user?.id,
        action: "UPDATE",
        entityType: "user",
        entityId: id,
        newValues: JSON.stringify({ ...updates, password: updates.password ? "[REDACTED]" : undefined }),
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      // Remove password hash from response
      const { password, ...sanitizedUser } = updatedUser;
      res.json(sanitizedUser);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Prevent self-deletion
      if (id === req.user?.id) {
        return res.status(400).json({ error: "Cannot delete your own account" });
      }
      
      await storage.deleteUser(id);
      
      // Audit log
      await storage.createAuditLog({
        userId: req.user?.id,
        action: "DELETE",
        entityType: "user",
        entityId: id,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Admin routes - Database reset
  app.post("/api/admin/reset-database", requireAdmin, async (req, res) => {
    try {
      await storage.resetDatabase();
      
      // Audit log
      await storage.createAuditLog({
        userId: req.user?.id,
        action: "RESET",
        entityType: "database",
        entityId: "full_reset",
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      res.json({ message: "Database reset successfully. All data cleared except users." });
    } catch (error) {
      res.status(500).json({ error: "Failed to reset database" });
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
