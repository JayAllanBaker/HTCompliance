#!/usr/bin/env tsx
/**
 * Initialize default admin account for Docker deployments
 * Creates admin:admin123 if no admin user exists
 */

import { db } from "./db.js";
import { users } from "../shared/schema.js";
import { eq } from "drizzle-orm";
import { hashPassword } from "./auth.js";

async function initAdminUser() {
  try {
    console.log("Checking for default admin user...");
    
    // Check if admin user exists
    const existingAdmin = await db.select().from(users).where(eq(users.username, "admin")).limit(1);
    
    if (existingAdmin.length > 0) {
      console.log("✓ Admin user already exists, skipping creation");
      return;
    }
    
    console.log("Creating default admin user...");
    
    // Create admin user with hashed password
    const hashedPassword = await hashPassword("admin123");
    
    const [adminUser] = await db.insert(users).values({
      username: "admin",
      password: hashedPassword,
      role: "admin",
      fullName: "Default Administrator",
      email: "admin@bizgov.local"
    }).returning();
    
    console.log("✓ Default admin user created successfully");
    console.log("  Username: admin");
    console.log("  Password: admin123");
    console.log("  ⚠️  IMPORTANT: Please change this password after first login!");
    
    process.exit(0);
  } catch (error) {
    console.error("Error initializing admin user:", error);
    process.exit(1);
  }
}

initAdminUser();
