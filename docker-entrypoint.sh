#!/bin/sh
set -e

echo "Starting BizGov application..."

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
until pg_isready -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" 2>/dev/null; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "PostgreSQL is ready!"

# Initialize database schema using Drizzle Push
echo "Initializing database schema..."
if ! npx drizzle-kit push --force 2>&1; then
  echo "Warning: Schema push failed. Database might already be initialized or there's a connection issue."
  echo "Attempting to start application anyway..."
fi

echo "Starting application server..."
exec node dist/index.js
