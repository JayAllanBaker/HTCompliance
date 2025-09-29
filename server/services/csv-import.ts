import * as fs from 'fs';
import * as Papa from 'papaparse';
import { InsertComplianceItem } from '@shared/schema';
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

export async function validateComplianceCSV(csvData: CSVRow[]): Promise<InsertComplianceItem[]> {
  const validatedItems: InsertComplianceItem[] = [];
  const errors: string[] = [];
  
  // Get all customers to validate customer references
  const customers = await storage.getCustomers();
  const customerMap = new Map(customers.map(c => [c.name.toLowerCase(), c.id]));
  const customerCodes = new Map(customers.map(c => [c.code.toLowerCase(), c.id]));
  
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
      
      // Find customer ID
      let customerId: string;
      const customerName = row.Customer || 'CCAH'; // Default to CCAH if not specified
      
      // Try to find customer by name first, then by code
      const customerIdByName = customerMap.get(customerName.toLowerCase());
      const customerIdByCode = customerCodes.get(customerName.toLowerCase());
      
      if (customerIdByName) {
        customerId = customerIdByName;
      } else if (customerIdByCode) {
        customerId = customerIdByCode;
      } else {
        // Create new customer if it doesn't exist
        try {
          const newCustomer = await storage.createCustomer({
            name: customerName,
            code: customerName.replace(/\s+/g, '_').toUpperCase(),
            isActive: true,
          });
          customerId = newCustomer.id;
          customerMap.set(customerName.toLowerCase(), customerId);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Row ${rowNumber}: Failed to create customer "${customerName}": ${message}`);
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
      
      validatedItems.push(validatedItem);
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Row ${rowNumber}: Validation error - ${message}`);
    }
  }
  
  if (errors.length > 0) {
    throw new Error(`CSV validation failed with ${errors.length} errors:\n${errors.join('\n')}`);
  }
  
  return validatedItems;
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
