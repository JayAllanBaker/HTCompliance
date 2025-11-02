# BizGov Docker Setup Guide

## Default Admin Account

When the Docker container starts for the first time, it automatically creates a default admin account:

**Username:** `admin`  
**Password:** `admin123`

⚠️ **IMPORTANT SECURITY:** Change this password immediately after first login!

---

## Quick Start

### 1. Start the Application

```bash
docker-compose up -d
```

### 2. View Logs

**Windows:**
```bash
docker-logs-verbose.bat
```

**Linux/Mac:**
```bash
./docker-logs-verbose.sh
```

**Or manually:**
```bash
docker-compose logs -f --timestamps
```

### 3. Access the Application

Open your browser to: **http://localhost:5001**

Login with:
- Username: `admin`
- Password: `admin123`

---

## Initial Setup Process

The Docker container automatically:

1. ✅ Waits for PostgreSQL to be ready
2. ✅ Initializes database schema (tables, enums, constraints)
3. ✅ Creates default admin user (if not exists)
4. ✅ Starts the application server

You'll see logs like:
```
PostgreSQL is ready!
Initializing database schema...
[✓] Changes applied
Initializing default admin user...
✓ Default admin user created successfully
  Username: admin
  Password: admin123
  ⚠️  IMPORTANT: Please change this password after first login!
Starting application server...
```

---

## Verbose Debugging

### Enable Debug Mode

```bash
docker-compose -f docker-compose.yml -f docker-compose.debug.yml up
```

This enables:
- Express debug logs
- Drizzle ORM debug logs
- Enhanced error messages

### View Specific Logs

**App only:**
```bash
docker-compose logs -f app --timestamps
```

**Database only:**
```bash
docker-compose logs -f postgres --timestamps
```

---

## Database Connection (DBeaver)

Connect to the PostgreSQL database with:

- **Host:** `localhost`
- **Port:** `5434` (mapped from container's 5432 to avoid conflicts)
- **Database:** `bizgov`
- **Username:** `postgres`
- **Password:** `postgres`

**Note:** The database runs on port 5434 on your host machine to avoid conflicts with any existing PostgreSQL installations.

---

## Rebuilding After Changes

```bash
docker-compose build --no-cache
docker-compose down
docker-compose up -d
```

---

## Stopping the Application

```bash
docker-compose down
```

To also remove volumes (⚠️ **deletes all data**):
```bash
docker-compose down -v
```

---

## Security Recommendations

### Production Deployment

1. **Change default credentials** - Create a `.env` file:
   ```env
   POSTGRES_USER=your_secure_username
   POSTGRES_PASSWORD=your_secure_password
   POSTGRES_DB=bizgov
   SESSION_SECRET=your-very-long-random-secret-key
   ```

2. **Remove default admin** - After creating your own admin account, delete the default one

3. **Use HTTPS** - Deploy behind a reverse proxy (nginx/Traefik) with SSL

4. **Set Azure credentials** - For email alerts:
   ```env
   AZURE_CLIENT_ID=your_client_id
   AZURE_CLIENT_SECRET=your_client_secret
   AZURE_TENANT_ID=your_tenant_id
   ```

---

## Troubleshooting

### Container won't start
```bash
docker-compose logs app
```

### Database connection failed
```bash
docker-compose logs postgres
```

### Reset everything
```bash
docker-compose down -v
docker-compose up -d
```

### Admin user already exists
The script automatically skips creation if the admin user exists. No action needed.
