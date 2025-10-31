import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { drizzle as neonDrizzle } from 'drizzle-orm/neon-serverless';
import { drizzle as pgDrizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import ws from "ws";
import * as schema from "../shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Check if using Neon serverless (URL contains neon.tech) or standard PostgreSQL
const isNeon = process.env.DATABASE_URL.includes('neon.tech');

let pool: any;
let db: any;

if (isNeon) {
  // Use Neon serverless driver with WebSocket
  neonConfig.webSocketConstructor = ws;
  pool = new NeonPool({ connectionString: process.env.DATABASE_URL });
  
  // Add error handler to prevent crashes from connection terminations
  pool.on('error', (err: Error) => {
    console.error('[Database Pool Error]', err.message);
    // Don't crash the app - Neon will automatically reconnect on next query
  });
  
  db = neonDrizzle({ client: pool, schema });
} else {
  // Use standard PostgreSQL driver for Docker/local PostgreSQL
  const { Pool: PgPool } = pg;
  pool = new PgPool({ connectionString: process.env.DATABASE_URL });
  
  // Add error handler to prevent crashes from connection errors
  pool.on('error', (err: Error) => {
    console.error('[Database Pool Error]', err.message);
  });
  
  db = pgDrizzle({ client: pool, schema });
}

export { pool, db };
