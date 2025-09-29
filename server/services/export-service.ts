import { storage } from '../storage';
import * as crypto from 'crypto';

export class ExportService {
  async exportDatabase(): Promise<any> {
    try {
      const exportData = await storage.exportDatabase();
      
      // Generate hash manifest for integrity checking
      const dataString = JSON.stringify(exportData.data);
      const hash = crypto.createHash('sha256').update(dataString).digest('hex');
      
      return {
        ...exportData,
        manifest: {
          hash,
          exportedAt: new Date().toISOString(),
          version: '1.0',
          schema: 'bizgov-compliance',
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Export failed: ${message}`);
    }
  }
  
  async validateImport(importData: any): Promise<boolean> {
    try {
      // Validate structure
      if (!importData.data || !importData.manifest) {
        throw new Error('Invalid export file format');
      }
      
      // Validate hash if present
      if (importData.manifest.hash) {
        const dataString = JSON.stringify(importData.data);
        const calculatedHash = crypto.createHash('sha256').update(dataString).digest('hex');
        
        if (calculatedHash !== importData.manifest.hash) {
          throw new Error('Data integrity check failed - file may be corrupted');
        }
      }
      
      // Validate version compatibility
      if (importData.manifest.version && importData.manifest.version !== '1.0') {
        console.warn(`Import version ${importData.manifest.version} may not be fully compatible with current version 1.0`);
      }
      
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Import validation failed: ${message}`);
    }
  }
  
  async generateScheduledExport(): Promise<string> {
    try {
      const exportData = await this.exportDatabase();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `bizgov-export-${timestamp}.json`;
      
      // In a real implementation, you would save this to object storage
      // For now, we'll just return the JSON string
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Scheduled export failed: ${message}`);
    }
  }
}

export const exportService = new ExportService();
