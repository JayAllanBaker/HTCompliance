import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupAuth, hashPassword } from "./auth";
import { storage } from "./storage";
import { insertOrganizationSchema, insertContractSchema, insertComplianceItemSchema, insertBillableEventSchema, insertEvidenceSchema, insertUserSchema } from "../shared/schema";
import { z } from "zod";
import multer from "multer";
import { parseCSV, validateComplianceCSV } from "./services/csv-import";
import { sendEmailAlert } from "./services/email-service";
import { exportService } from "./services/export-service";
import { createQuickBooksOAuthService } from "./services/quickbooks-oauth.service";
import { createQuickBooksSyncService } from "./services/quickbooks-sync.service";
import "./types"; // Import session type declarations

// Admin-only middleware
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  console.log('[requireAdmin] Checking admin access:', {
    hasUser: !!req.user,
    userId: req.user?.id,
    username: req.user?.username,
    role: req.user?.role,
    isAuthenticated: req.isAuthenticated?.(),
    path: req.path
  });
  
  if (!req.user || req.user.role !== "admin") {
    console.log('[requireAdmin] Access denied - user:', req.user?.username, 'role:', req.user?.role);
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
      console.log("=== POST /api/contracts ===");
      console.log("Request body:", JSON.stringify(req.body, null, 2));
      
      // Convert date strings to Date objects before validation
      const data = {
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
      };
      
      console.log("Data after date conversion:", JSON.stringify(data, null, 2));
      
      const validatedData = insertContractSchema.parse(data);
      console.log("Validated data:", JSON.stringify(validatedData, null, 2));
      
      const contract = await storage.createContract(validatedData);
      console.log("Created contract:", JSON.stringify(contract, null, 2));
      
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
        console.error("=== CONTRACT VALIDATION ERROR ===");
        console.error("Validation errors:", JSON.stringify(error.errors, null, 2));
        console.error("Failed request body:", JSON.stringify(req.body, null, 2));
        res.status(400).json({ error: "Invalid input", details: error.errors });
      } else {
        console.error("=== CONTRACT CREATION ERROR ===");
        console.error("Error:", error);
        console.error("Request body:", JSON.stringify(req.body, null, 2));
        res.status(500).json({ error: "Failed to create contract", message: error instanceof Error ? error.message : String(error) });
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
      let filesAdded = 0;
      for (const evidence of evidenceList) {
        if (evidence.filePath) {
          const absolutePath = path.resolve(evidence.filePath);
          console.log(`Checking file for evidence ${evidence.id}: ${absolutePath}, exists: ${fs.existsSync(absolutePath)}`);
          if (fs.existsSync(absolutePath)) {
            // Use original filename if available, otherwise create from evidence type
            const filename = evidence.originalFilename || 
                           `${evidence.title.replace(/[^a-z0-9]/gi, '_')}.${evidence.evidenceType}`;
            archive.file(absolutePath, { name: `files/${evidence.id}-${filename}` });
            filesAdded++;
            console.log(`Added file to archive: files/${evidence.id}-${filename}`);
          } else {
            console.log(`File not found: ${absolutePath}`);
          }
        } else {
          console.log(`Evidence ${evidence.id} has no filePath`);
        }
      }
      console.log(`Export complete: ${evidenceList.length} evidence items, ${filesAdded} files added to archive`);
      
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

  // CSV Import Specification and Template
  app.get("/api/csv/spec", async (req, res) => {
    try {
      const fs = await import("fs");
      const spec = JSON.parse(fs.readFileSync("compliance-import-spec.json", "utf8"));
      res.json(spec);
    } catch (error) {
      res.status(500).json({ error: "Failed to load CSV specification" });
    }
  });

  app.get("/api/csv/template", async (req, res) => {
    try {
      const csvTemplate = [
        "Category,Type,Commitment,Description,Responsible Party,Status,Due Date,Customer",
        "Marketing Agreement,Contract Review,Review marketing contract,Annual contract review,Legal Team,pending,12/31/2024,CCAH",
        "Billing,Invoice,Submit monthly invoice,Monthly billing submission,Finance Dept,pending,01/15/2025,CCAH",
        "Compliance,Audit,Complete annual audit,External compliance audit,Compliance Officer,pending,03/31/2025,CCAH",
        "Deliverable,Report,Quarterly report,Q4 performance report,Operations Manager,pending,01/31/2025,CCAH"
      ].join('\n');

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=compliance-import-template.csv");
      res.send(csvTemplate);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate CSV template" });
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
      
      console.log("Starting database import from file:", req.file.path);
      const fs = await import("fs");
      const fileContent = fs.readFileSync(req.file.path, 'utf8');
      const importData = JSON.parse(fileContent);
      
      console.log("Parsed import data, version:", importData.version);
      const result = await storage.importDatabase(importData);
      
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      
      // Audit log
      await storage.createAuditLog({
        userId: req.user?.id,
        action: "IMPORT",
        entityType: "database",
        entityId: "full_import",
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      console.log("Database import completed successfully");
      res.json({ 
        message: "Database imported successfully",
        ...result
      });
    } catch (error) {
      console.error("Database import error:", error);
      console.error("Error details:", error instanceof Error ? error.message : String(error));
      if (error instanceof Error && error.stack) {
        console.error("Stack trace:", error.stack);
      }
      
      // Send specific error message to user
      const errorMessage = error instanceof Error ? error.message : "Failed to import database";
      res.status(500).json({ error: errorMessage });
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

  // Admin routes - QuickBooks Settings
  app.get("/api/admin/qb-settings", requireAdmin, async (req: Request, res: Response) => {
    try {
      // Get all QB-related settings
      const allSettings = await storage.getAllSystemSettings();
      const qbSettings = allSettings.filter(s => s.key.startsWith('qb_'));
      
      // Convert to object for easier consumption
      const settingsObj = qbSettings.reduce((acc, setting) => {
        // SECURITY: Never expose client secrets in cleartext
        const isSecret = setting.key.includes('client_secret');
        const value = isSecret && setting.value 
          ? '••••••••' // Masked value for security
          : setting.value || '';
        
        acc[setting.key] = {
          value,
          description: setting.description,
        };
        return acc;
      }, {} as Record<string, { value: string; description?: string | null }>);
      
      res.json(settingsObj);
    } catch (error) {
      console.error('Error fetching QB settings:', error);
      res.status(500).json({ error: 'Failed to fetch QuickBooks settings' });
    }
  });

  app.post("/api/admin/qb-settings", requireAdmin, async (req: Request, res: Response) => {
    try {
      // Validate request body - support both dev and prod configs
      const qbSettingsSchema = z.object({
        qb_active_config: z.enum(['dev', 'prod']).optional(),
        // Dev config
        qb_dev_client_id: z.string().optional(),
        qb_dev_client_secret: z.string().optional(),
        qb_dev_redirect_uri: z.string().url().optional().or(z.literal('')),
        // Prod config
        qb_prod_client_id: z.string().optional(),
        qb_prod_client_secret: z.string().optional(),
        qb_prod_redirect_uri: z.string().url().optional().or(z.literal('')),
      });
      
      const validationResult = qbSettingsSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid QuickBooks settings', 
          details: validationResult.error.errors 
        });
      }
      
      const data = validationResult.data;
      
      // Upsert active config
      if (data.qb_active_config !== undefined) {
        await storage.upsertSystemSetting({
          key: 'qb_active_config',
          value: data.qb_active_config,
          isEncrypted: false,
          description: 'Active QuickBooks configuration (dev or prod)',
        });
      }
      
      // Upsert dev settings
      if (data.qb_dev_client_id !== undefined) {
        await storage.upsertSystemSetting({
          key: 'qb_dev_client_id',
          value: data.qb_dev_client_id,
          isEncrypted: false,
          description: 'QuickBooks Dev Client ID',
        });
      }
      
      if (data.qb_dev_client_secret !== undefined && data.qb_dev_client_secret !== '') {
        await storage.upsertSystemSetting({
          key: 'qb_dev_client_secret',
          value: data.qb_dev_client_secret,
          isEncrypted: true,
          description: 'QuickBooks Dev Client Secret (encrypted)',
        });
      }
      
      if (data.qb_dev_redirect_uri !== undefined) {
        await storage.upsertSystemSetting({
          key: 'qb_dev_redirect_uri',
          value: data.qb_dev_redirect_uri,
          isEncrypted: false,
          description: 'QuickBooks Dev Redirect URI',
        });
      }
      
      // Upsert prod settings
      if (data.qb_prod_client_id !== undefined) {
        await storage.upsertSystemSetting({
          key: 'qb_prod_client_id',
          value: data.qb_prod_client_id,
          isEncrypted: false,
          description: 'QuickBooks Production Client ID',
        });
      }
      
      if (data.qb_prod_client_secret !== undefined && data.qb_prod_client_secret !== '') {
        await storage.upsertSystemSetting({
          key: 'qb_prod_client_secret',
          value: data.qb_prod_client_secret,
          isEncrypted: true,
          description: 'QuickBooks Production Client Secret (encrypted)',
        });
      }
      
      if (data.qb_prod_redirect_uri !== undefined) {
        await storage.upsertSystemSetting({
          key: 'qb_prod_redirect_uri',
          value: data.qb_prod_redirect_uri,
          isEncrypted: false,
          description: 'QuickBooks Production Redirect URI',
        });
      }
      
      // Audit log
      await storage.createAuditLog({
        userId: req.user?.id,
        action: 'UPDATE',
        entityType: 'system_settings',
        entityId: 'qb_settings',
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      res.json({ message: 'QuickBooks settings updated successfully' });
    } catch (error) {
      console.error('Error updating QB settings:', error);
      res.status(500).json({ error: 'Failed to update QuickBooks settings' });
    }
  });

  // Get detected redirect URI
  app.get("/api/admin/qb-detected-redirect", requireAdmin, async (req: Request, res: Response) => {
    try {
      let detectedRedirectUri = '';
      let isReplit = false;
      
      // Auto-detect based on environment (same logic as service)
      if (process.env.REPLIT_DEV_DOMAIN) {
        detectedRedirectUri = `https://${process.env.REPLIT_DEV_DOMAIN}/api/quickbooks/callback`;
        isReplit = true;
      } else if (process.env.REPLIT_DOMAINS) {
        const domain = process.env.REPLIT_DOMAINS.split(',')[0];
        detectedRedirectUri = `https://${domain}/api/quickbooks/callback`;
        isReplit = true;
      } else {
        // For Docker/localhost, use the request host if available
        const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
        const host = req.headers.host || 'localhost:5000';
        detectedRedirectUri = `${protocol}://${host}/api/quickbooks/callback`;
      }
      
      res.json({ 
        detectedRedirectUri,
        isReplit,
        replitDevDomain: process.env.REPLIT_DEV_DOMAIN || null,
        replitDomains: process.env.REPLIT_DOMAINS || null,
      });
    } catch (error) {
      console.error('Error detecting redirect URI:', error);
      res.status(500).json({ error: 'Failed to detect redirect URI' });
    }
  });

  // QuickBooks Health Check
  app.get("/api/admin/qb-health", requireAdmin, async (req: Request, res: Response) => {
    try {
      let healthCheck;
      let credentialsConfigured = false;
      
      try {
        // Attempt to create QB OAuth service
        const qbOAuth = await createQuickBooksOAuthService(storage);
        healthCheck = await qbOAuth.healthCheck();
        credentialsConfigured = healthCheck.credentialsConfigured;
      } catch (error) {
        // Credentials not configured - this is expected, not an error
        if (error instanceof Error && error.message.includes('credentials not configured')) {
          healthCheck = {
            credentialsConfigured: false,
            clientId: 'Not configured',
            environment: 'sandbox',
            redirectUri: 'Not configured',
          };
        } else {
          throw error; // Re-throw unexpected errors
        }
      }
      
      // Get active connections count
      const connections = await storage.getAllQuickbooksConnections();
      const activeConnections = connections.length;
      
      // Count connections by status
      const now = new Date();
      const validConnections = connections.filter(conn => {
        const expiresAt = new Date(conn.accessTokenExpiresAt);
        return expiresAt > now;
      }).length;
      
      res.json({
        ...healthCheck,
        activeConnections,
        validConnections,
        expiredConnections: activeConnections - validConnections,
        status: credentialsConfigured ? 'healthy' : 'unconfigured',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error checking QB health:', error);
      res.status(500).json({ 
        status: 'error',
        credentialsConfigured: false,
        clientId: 'Error',
        environment: 'sandbox',
        redirectUri: 'Error',
        activeConnections: 0,
        validConnections: 0,
        expiredConnections: 0,
        error: error instanceof Error ? error.message : 'Failed to check QuickBooks health',
        timestamp: new Date().toISOString(),
      });
    }
  });

  // QuickBooks OAuth routes
  
  // Get all QuickBooks connections (for UI status display)
  app.get("/api/quickbooks/connections", async (req: Request, res: Response) => {
    try {
      const connections = await storage.getAllQuickbooksConnections();
      
      // Create a map of organizationId -> connection
      const connectionsMap = connections.reduce((acc, conn) => {
        acc[conn.organizationId] = conn;
        return acc;
      }, {} as Record<string, typeof connections[0]>);
      
      res.json(connectionsMap);
    } catch (error) {
      console.error('Error fetching QB connections:', error);
      res.status(500).json({ error: 'Failed to fetch QuickBooks connections' });
    }
  });
  
  app.get("/api/quickbooks/auth-url", async (req, res) => {
    try {
      const organizationId = req.query.organizationId as string;
      
      if (!organizationId) {
        return res.status(400).json({ error: "Organization ID is required" });
      }

      const qbOAuth = await createQuickBooksOAuthService(storage);
      const { authUrl, state } = qbOAuth.generateAuthUrl();
      
      // Store state in session for CSRF validation
      if (req.session) {
        req.session.qbState = state;
        req.session.qbOrganizationId = organizationId;
      }
      
      res.json({ authUrl, state });
    } catch (error) {
      console.error('Error generating QB auth URL:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to generate auth URL" });
    }
  });

  app.get("/api/quickbooks/callback", async (req, res) => {
    try {
      const { code, state, realmId, error: qbError } = req.query;
      
      // Check for QB errors
      if (qbError) {
        console.error('QuickBooks OAuth error:', qbError);
        return res.redirect(`/?qb_error=${encodeURIComponent(qbError as string)}`);
      }
      
      // Validate state for CSRF protection
      if (!req.session?.qbState || state !== req.session.qbState) {
        return res.redirect('/?qb_error=invalid_state');
      }
      
      const organizationId = req.session.qbOrganizationId;
      if (!organizationId) {
        return res.redirect('/?qb_error=missing_organization');
      }
      
      // Exchange code for tokens
      const qbOAuth = await createQuickBooksOAuthService(storage);
      const tokenResponse = await qbOAuth.exchangeCodeForTokens(code as string);
      
      // Check if connection already exists (reconnect scenario)
      const existingConnection = await storage.getQuickbooksConnection(organizationId);
      
      if (existingConnection) {
        // Update existing connection
        await storage.updateQuickbooksConnection(organizationId, {
          realmId: realmId as string,
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token,
          accessTokenExpiresAt: qbOAuth.calculateExpiryDate(tokenResponse.expires_in),
          refreshTokenExpiresAt: qbOAuth.calculateExpiryDate(tokenResponse.x_refresh_token_expires_in),
          status: 'connected',
          errorMessage: null,
        });
      } else {
        // Create new connection
        await storage.createQuickbooksConnection({
          organizationId,
          realmId: realmId as string,
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token,
          accessTokenExpiresAt: qbOAuth.calculateExpiryDate(tokenResponse.expires_in),
          refreshTokenExpiresAt: qbOAuth.calculateExpiryDate(tokenResponse.x_refresh_token_expires_in),
          status: 'connected',
        });
      }
      
      // Audit log
      await storage.createAuditLog({
        userId: req.user?.id,
        action: "CONNECT",
        entityType: "quickbooks_connection",
        entityId: organizationId,
        newValues: JSON.stringify({ realmId }),
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      // Clear session data
      delete req.session.qbState;
      delete req.session.qbOrganizationId;
      
      // Redirect to organization page with success message
      res.redirect(`/organizations?qb_connected=true&org_id=${organizationId}`);
    } catch (error) {
      console.error('QuickBooks callback error:', error);
      const errorMsg = error instanceof Error ? error.message : 'connection_failed';
      res.redirect(`/?qb_error=${encodeURIComponent(errorMsg)}`);
    }
  });

  app.delete("/api/quickbooks/:organizationId/disconnect", async (req, res) => {
    try {
      const { organizationId } = req.params;
      
      const connection = await storage.getQuickbooksConnection(organizationId);
      if (!connection) {
        return res.status(404).json({ error: "QuickBooks connection not found" });
      }
      
      // Revoke tokens
      try {
        const qbOAuth = await createQuickBooksOAuthService(storage);
        await qbOAuth.revokeTokens(connection.refreshToken);
      } catch (error) {
        console.error('Error revoking QB tokens:', error);
        // Continue with deletion even if revoke fails
      }
      
      // Delete connection and invoices
      await storage.deleteOrganizationInvoices(organizationId);
      await storage.deleteQuickbooksConnection(organizationId);
      
      // Audit log
      await storage.createAuditLog({
        userId: req.user?.id,
        action: "DISCONNECT",
        entityType: "quickbooks_connection",
        entityId: organizationId,
        oldValues: JSON.stringify({ realmId: connection.realmId }),
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      res.json({ message: "QuickBooks disconnected successfully" });
    } catch (error) {
      console.error('Error disconnecting QuickBooks:', error);
      res.status(500).json({ error: "Failed to disconnect QuickBooks" });
    }
  });

  // QuickBooks customer and invoice routes
  app.get("/api/organizations/:id/qb-connection", async (req, res) => {
    try {
      const { id } = req.params;
      const connection = await storage.getQuickbooksConnection(id);
      
      if (!connection) {
        return res.json({ connected: false });
      }
      
      // Return connection status without sensitive data
      res.json({
        connected: true,
        status: connection.status,
        qbCustomerId: connection.qbCustomerId,
        qbCustomerName: connection.qbCustomerName,
        lastSyncAt: connection.lastSyncAt,
        errorMessage: connection.errorMessage,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch QuickBooks connection" });
    }
  });

  app.get("/api/organizations/:id/qb-customers", async (req, res) => {
    try {
      const { id } = req.params;
      const searchTerm = (req.query.search as string) || '';
      
      const qbOAuth = await createQuickBooksOAuthService(storage);
      const qbSync = createQuickBooksSyncService(qbOAuth);
      
      const customers = await qbSync.searchCustomers(id, searchTerm);
      res.json(customers);
    } catch (error) {
      console.error('Error searching QB customers:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to search customers" });
    }
  });

  app.post("/api/organizations/:id/qb-map-customer", async (req, res) => {
    try {
      const { id } = req.params;
      const { qbCustomerId } = req.body;
      
      if (!qbCustomerId) {
        return res.status(400).json({ error: "QuickBooks customer ID is required" });
      }
      
      const qbOAuth = await createQuickBooksOAuthService(storage);
      const qbSync = createQuickBooksSyncService(qbOAuth);
      
      await qbSync.mapCustomer(id, qbCustomerId);
      
      // Audit log
      await storage.createAuditLog({
        userId: req.user?.id,
        action: "MAP_CUSTOMER",
        entityType: "quickbooks_connection",
        entityId: id,
        newValues: JSON.stringify({ qbCustomerId }),
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      res.json({ message: "Customer mapped successfully" });
    } catch (error) {
      console.error('Error mapping QB customer:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to map customer" });
    }
  });

  app.get("/api/organizations/:id/qb-invoices", async (req, res) => {
    try {
      const { id } = req.params;
      const invoices = await storage.getQuickbooksInvoices(id);
      res.json(invoices);
    } catch (error) {
      console.error('Error fetching QB invoices:', error);
      res.status(500).json({ error: "Failed to fetch invoices" });
    }
  });

  app.post("/api/organizations/:id/qb-sync", async (req, res) => {
    try {
      const { id } = req.params;
      
      const qbOAuth = await createQuickBooksOAuthService(storage);
      const qbSync = createQuickBooksSyncService(qbOAuth);
      
      const result = await qbSync.syncInvoices(id);
      
      // Audit log
      await storage.createAuditLog({
        userId: req.user?.id,
        action: "SYNC_INVOICES",
        entityType: "quickbooks_connection",
        entityId: id,
        newValues: JSON.stringify({ synced: result.synced, errors: result.errors.length }),
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      
      res.json(result);
    } catch (error) {
      console.error('Error syncing QB invoices:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to sync invoices" });
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
