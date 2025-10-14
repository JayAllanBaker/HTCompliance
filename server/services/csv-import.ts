import * as fs from 'fs';
import Papa from 'papaparse';
import { InsertComplianceItem } from '../../shared/schema';
import { storage } from '../storage';

interface CSVRow {
  Category: string;
  Type: string;
  Commitment: string;
  Description: string;
  'Responsible Party': string;
  Status: string;
  'Due Date': string;
  Customer?: string;
}

export type DuplicateHandling = 'skip' | 'update';

export interface ImportResult {
  imported: number;
  updated: number;
  skipped: number;
  skippedItems: Array<{
    row: number;
    commitment: string;
    reason: string;
  }>;
  items: any[];
}

export async function parseCSV(filePath: string): Promise<CSVRow[]> {
  return new Promise((resolve, reject) => {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error(`CSV parsing errors: ${results.errors.map(e => e.message).join(', ')}`));
        } else {
          resolve(results.data as CSVRow[]);
        }
      },
      error: (error: Error) => {
        reject(new Error(`CSV parsing failed: ${error.message}`));
      }
    });
  });
}

function compareDates(date1: Date | null | undefined, date2: Date | null | undefined): boolean {
  const d1 = date1 ?? null;
  const d2 = date2 ?? null;
  
  if (d1 === null && d2 === null) return true;
  if (d1 === null || d2 === null) return false;
  
  // Compare only date parts (ignore time)
  return d1.toISOString().split('T')[0] === d2.toISOString().split('T')[0];
}

async function findDuplicate(item: InsertComplianceItem): Promise<any | null> {
  // Get all compliance items for this customer
  const result = await storage.getComplianceItems();
  
  // Find duplicate based on: category + commitment + customer + due date
  const duplicate = result.items.find((existing: any) => 
    existing.customerId === item.customerId &&
    existing.category === item.category &&
    existing.commitment.toLowerCase().trim() === item.commitment.toLowerCase().trim() &&
    compareDates(existing.dueDate, item.dueDate)
  );
  
  return duplicate || null;
}

export async function validateComplianceCSV(
  csvData: CSVRow[], 
  duplicateHandling: DuplicateHandling = 'skip'
): Promise<ImportResult> {
  const errors: string[] = [];
  const result: ImportResult = {
    imported: 0,
    updated: 0,
    skipped: 0,
    skippedItems: [],
    items: []
  };
  
  // Get all organizations to validate customer references
  const organizations = await storage.getOrganizations();
  const organizationMap = new Map(organizations.map(org => [org.name.toLowerCase(), org.id]));
  const organizationCodes = new Map(organizations.map(org => [org.code.toLowerCase(), org.id]));
  
  for (let i = 0; i < csvData.length; i++) {
    const row = csvData[i];
    const rowNumber = i + 2; // +2 because array is 0-indexed and CSV has header
    
    try {
      // Validate required fields
      if (!row.Category) {
        errors.push(`Row ${rowNumber}: Category is required`);
        continue;
      }
      
      if (!row.Commitment) {
        errors.push(`Row ${rowNumber}: Commitment is required`);
        continue;
      }
      
      if (!row['Responsible Party']) {
        errors.push(`Row ${rowNumber}: Responsible Party is required`);
        continue;
      }
      
      // Validate category enum
      const validCategories = ['Marketing Agreement', 'Billing', 'Deliverable', 'Compliance', 'End-of-Term'];
      if (!validCategories.includes(row.Category)) {
        errors.push(`Row ${rowNumber}: Invalid category "${row.Category}". Must be one of: ${validCategories.join(', ')}`);
        continue;
      }
      
      // Validate status enum
      const validStatuses = ['pending', 'complete', 'overdue', 'na'];
      const status = row.Status.toLowerCase();
      if (!validStatuses.includes(status)) {
        errors.push(`Row ${rowNumber}: Invalid status "${row.Status}". Must be one of: ${validStatuses.join(', ')}`);
        continue;
      }
      
      // Parse due date
      let dueDate: Date | null = null;
      if (row['Due Date'] && row['Due Date'].trim() !== '') {
        const dueDateStr = row['Due Date'].trim();
        
        // Handle various date formats
        let parsedDate: Date;
        
        if (dueDateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
          // MM/DD/YYYY format
          parsedDate = new Date(dueDateStr);
        } else if (dueDateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          // YYYY-MM-DD format
          parsedDate = new Date(dueDateStr);
        } else {
          // Try to parse as-is
          parsedDate = new Date(dueDateStr);
        }
        
        if (isNaN(parsedDate.getTime())) {
          errors.push(`Row ${rowNumber}: Invalid due date format "${row['Due Date']}". Use MM/DD/YYYY or YYYY-MM-DD`);
          continue;
        }
        
        dueDate = parsedDate;
      }
      
      // Find organization ID (customer field in CSV)
      let customerId: string;
      const customerName = row.Customer || 'CCAH'; // Default to CCAH if not specified
      
      // Try to find organization by name first, then by code
      const orgIdByName = organizationMap.get(customerName.toLowerCase());
      const orgIdByCode = organizationCodes.get(customerName.toLowerCase());
      
      if (orgIdByName) {
        customerId = orgIdByName;
      } else if (orgIdByCode) {
        customerId = orgIdByCode;
      } else {
        // Create new organization if it doesn't exist
        try {
          const newOrg = await storage.createOrganization({
            name: customerName,
            code: customerName.replace(/\s+/g, '_').toUpperCase(),
            isActive: true,
          });
          customerId = newOrg.id;
          organizationMap.set(customerName.toLowerCase(), customerId);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Row ${rowNumber}: Failed to create organization "${customerName}": ${message}`);
          continue;
        }
      }
      
      const validatedItem: InsertComplianceItem = {
        customerId,
        category: row.Category as any,
        type: row.Type || '',
        commitment: row.Commitment,
        description: row.Description || null,
        responsibleParty: row['Responsible Party'],
        status: status as any,
        dueDate,
      };
      
      // Check for duplicates
      const duplicate = await findDuplicate(validatedItem);
      
      if (duplicate) {
        if (duplicateHandling === 'skip') {
          // Skip this item
          result.skipped++;
          result.skippedItems.push({
            row: rowNumber,
            commitment: row.Commitment,
            reason: `Duplicate found (ID: ${duplicate.id})`
          });
        } else if (duplicateHandling === 'update') {
          // Update existing item
          const updatedItem = await storage.updateComplianceItem(duplicate.id, validatedItem);
          result.updated++;
          result.items.push(updatedItem);
        }
      } else {
        // Create new item
        const createdItem = await storage.createComplianceItem(validatedItem);
        result.imported++;
        result.items.push(createdItem);
      }
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Row ${rowNumber}: Validation error - ${message}`);
    }
  }
  
  if (errors.length > 0) {
    throw new Error(`CSV validation failed with ${errors.length} errors:\n${errors.join('\n')}`);
  }
  
  return result;
}

// Utility function to transform the provided CSV data format
export function transformCCAHCSV(csvData: any[]): CSVRow[] {
  return csvData.map(row => ({
    Category: row.Category || '',
    Type: row.Type || '',
    Commitment: row.Commitment || '',
    Description: row.Description || '',
    'Responsible Party': row['Responsible Party'] || '',
    Status: row.Status || 'pending',
    'Due Date': row['Due Date'] || '',
    Customer: 'CCAH' // Default customer for the provided data
  }));
}
