# BizGov Compliance Hub - Docker Deployment Guide

## Prerequisites
- Docker 20.10+ and Docker Compose 2.0+
- At least 2GB RAM and 10GB disk space

## Quick Start Commands

### Initial Setup
```bash
# 1. Copy environment template
cp .env.docker.example .env

# 2. Edit .env with your configuration (required for production)
nano .env  # or use your preferred editor

# 3. Build containers
docker-compose build

# 4. Start services (database + app)
docker-compose up -d

# 5. Check status
docker-compose ps

# 6. View logs
docker-compose logs -f app
```

### Daily Operations
```bash
# Start containers
docker-compose up -d

# Stop containers
docker-compose down

# Restart containers
docker-compose restart

# View logs (all services)
docker-compose logs -f

# View logs (app only)
docker-compose logs -f app

# View logs (database only)
docker-compose logs -f postgres

# Check container status
docker-compose ps

# Check container resource usage
docker stats bizgov-app bizgov-postgres
```

### Maintenance Commands
```bash
# Rebuild after code changes
docker-compose build --no-cache
docker-compose up -d

# Stop and remove containers (keeps data)
docker-compose down

# Stop and remove containers + volumes (DELETES DATA!)
docker-compose down -v

# Access app container shell
docker-compose exec app sh

# Access database container shell
docker-compose exec postgres psql -U postgres -d bizgov

# Run database schema sync manually
docker-compose exec app npx drizzle-kit push --force
```

## Configuration

### Step 1: Environment Variables

Copy the example file and edit it:
```bash
cp .env.docker.example .env
```

**Required Configuration (Production):**

```bash
# Database Security
POSTGRES_PASSWORD=your_secure_password_here

# Session Security (generate with: openssl rand -base64 32)
SESSION_SECRET=your_very_long_random_secret_key

# Microsoft Graph API (for email alerts)
AZURE_CLIENT_ID=your_azure_client_id
AZURE_CLIENT_SECRET=your_azure_client_secret
AZURE_TENANT_ID=your_azure_tenant_id

# Email Settings
SENDER_EMAIL=noreply@healthtrixss.com
DEFAULT_ALERT_EMAIL=admin@healthtrixss.com
```

**Optional Configuration:**

```bash
# Change ports if needed
APP_PORT=5000
POSTGRES_PORT=5432

# Database name and user
POSTGRES_DB=bizgov
POSTGRES_USER=postgres

# Application URL
APP_URL=http://localhost:5000
```

### Step 2: Build and Deploy

```bash
# Build the Docker images
docker-compose build

# Start all services in background
docker-compose up -d
```

**The deployment automatically:**
1. Starts PostgreSQL database
2. Waits for database to be ready
3. Initializes database schema using Drizzle
4. Starts the web application on port 5000

### Step 3: Access Application

- **Web Application**: http://localhost:5000
- **Database**: localhost:5432 (from host machine)

**First Login:**
1. Navigate to http://localhost:5000
2. Click "Register" to create first admin user
3. Fill in username, email, and password
4. Start using the application

## Architecture

### Services

The deployment includes two containers:

**bizgov-postgres** (Database)
- PostgreSQL 16 Alpine
- Persistent storage in `postgres_data` volume
- Health checks every 10 seconds
- Auto-restart enabled

**bizgov-app** (Application)
- Node.js 22 Alpine
- React frontend + Express backend
- Persistent uploads in `app_uploads` volume
- Health checks every 30 seconds
- Auto-restart enabled
- Automatic database schema initialization

### Volumes

**postgres_data** - Database files
- Location: Docker volume (managed by Docker)
- Contains all PostgreSQL data
- Persists when containers are stopped

**app_uploads** - Evidence files and attachments
- Location: Docker volume (managed by Docker)
- Contains uploaded documents
- Persists when containers are stopped

### Network

**bizgov-network** - Bridge network
- Internal communication between app and database
- App connects to postgres via hostname `postgres:5432`

## Backup and Restore

### Database Backup
```bash
# Create SQL dump
docker-compose exec postgres pg_dump -U postgres bizgov > backup_$(date +%Y%m%d).sql

# Or use the built-in export feature
# Login to app → Admin Panel → Export/Import → Export Database
```

### Database Restore
```bash
# From SQL dump
docker-compose exec -T postgres psql -U postgres bizgov < backup_20241007.sql

# Or use the built-in import feature
# Login to app → Admin Panel → Export/Import → Import Database
```

### Uploads Backup
```bash
# Backup uploads directory
docker run --rm -v bizgov_app_uploads:/data -v $(pwd):/backup \
  alpine tar czf /backup/uploads-backup-$(date +%Y%m%d).tar.gz -C /data .
```

### Uploads Restore
```bash
# Restore uploads directory
docker run --rm -v bizgov_app_uploads:/data -v $(pwd):/backup \
  alpine tar xzf /backup/uploads-backup-20241007.tar.gz -C /data
```

### Complete Backup (Database + Uploads)
```bash
# Create backup directory
mkdir -p backups/$(date +%Y%m%d)

# Backup database
docker-compose exec postgres pg_dump -U postgres bizgov > backups/$(date +%Y%m%d)/database.sql

# Backup uploads
docker run --rm -v bizgov_app_uploads:/data -v $(pwd)/backups/$(date +%Y%m%d):/backup \
  alpine tar czf /backup/uploads.tar.gz -C /data .

echo "Backup complete in: backups/$(date +%Y%m%d)"
```

## Troubleshooting

### Check Service Status
```bash
# View all containers
docker-compose ps

# Check specific service health
docker inspect bizgov-app --format='{{.State.Health.Status}}'
docker inspect bizgov-postgres --format='{{.State.Health.Status}}'
```

### View Logs
```bash
# All logs
docker-compose logs

# Follow logs in real-time
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100

# Specific service
docker-compose logs -f app
docker-compose logs -f postgres
```

### Database Connection Test
```bash
# From app container
docker-compose exec app node -e "console.log(process.env.DATABASE_URL)"

# Test PostgreSQL connection
docker-compose exec postgres psql -U postgres -d bizgov -c "SELECT version();"
```

### Common Issues

**Port Already in Use**
```bash
# Change port in .env file
echo "APP_PORT=5001" >> .env
docker-compose down
docker-compose up -d
```

**Database Connection Failed**
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Restart database
docker-compose restart postgres

# Check database logs
docker-compose logs postgres
```

**Schema Initialization Failed**
```bash
# Run schema push manually
docker-compose exec app npx drizzle-kit push --force

# Or restart the app container
docker-compose restart app
```

**Container Won't Start**
```bash
# Check container logs for errors
docker-compose logs app

# Validate docker-compose configuration
docker-compose config

# Rebuild from scratch
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Security Checklist

- [ ] Changed `POSTGRES_PASSWORD` from default
- [ ] Generated strong `SESSION_SECRET` (min 32 chars)
- [ ] Configured Azure credentials for email alerts
- [ ] Using HTTPS in production (reverse proxy)
- [ ] Regular backups scheduled
- [ ] Database port not exposed externally (remove ports in docker-compose.yml for production)
- [ ] Updated Docker images monthly
- [ ] Firewall configured to allow only necessary ports

## Production Deployment

### Reverse Proxy (HTTPS)

**Using Nginx:**
```nginx
server {
    listen 80;
    server_name bizgov.yourcompany.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name bizgov.yourcompany.com;

    ssl_certificate /etc/ssl/certs/bizgov.crt;
    ssl_certificate_key /etc/ssl/private/bizgov.key;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Production Best Practices

1. **Remove External Database Port**
   - Edit `docker-compose.yml`
   - Comment out `ports:` section under `postgres` service
   - Database only accessible from app container

2. **Use Docker Secrets** (Docker Swarm)
   ```yaml
   secrets:
     postgres_password:
       external: true
     session_secret:
       external: true
   ```

3. **Resource Limits**
   ```yaml
   services:
     app:
       deploy:
         resources:
           limits:
             cpus: '2'
             memory: 2G
           reservations:
             cpus: '1'
             memory: 1G
   ```

4. **Auto-restart Policy**
   ```yaml
   restart: always  # Already configured
   ```

5. **Monitoring**
   - Add Prometheus + Grafana
   - Use container health endpoints
   - Set up log aggregation (ELK, Loki)

## Update Procedure

```bash
# 1. Backup current data
docker-compose exec postgres pg_dump -U postgres bizgov > backup_before_update.sql

# 2. Pull latest code
git pull origin main

# 3. Rebuild containers
docker-compose build --no-cache

# 4. Stop current containers
docker-compose down

# 5. Start updated containers
docker-compose up -d

# 6. Verify deployment
docker-compose ps
docker-compose logs -f app

# 7. Test application
curl http://localhost:5000/api/user
```

## Environment Variables Reference

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `POSTGRES_DB` | Database name | No | bizgov | bizgov |
| `POSTGRES_USER` | Database user | No | postgres | postgres |
| `POSTGRES_PASSWORD` | Database password | **Yes** | postgres | MySecureP@ss123 |
| `POSTGRES_PORT` | External DB port | No | 5432 | 5432 |
| `APP_PORT` | External app port | No | 5000 | 5000 |
| `APP_URL` | Public URL | No | http://localhost:5000 | https://bizgov.company.com |
| `SESSION_SECRET` | Session encryption | **Yes** | changeme | 32+ random chars |
| `AZURE_CLIENT_ID` | Graph API client | **Yes** | - | xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx |
| `AZURE_CLIENT_SECRET` | Graph API secret | **Yes** | - | your-secret-value |
| `AZURE_TENANT_ID` | Azure tenant | **Yes** | - | xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx |
| `SENDER_EMAIL` | Email from address | No | noreply@healthtrixss.com | noreply@company.com |
| `DEFAULT_ALERT_EMAIL` | Alert recipient | No | admin@healthtrixss.com | admin@company.com |
| `NODE_ENV` | Runtime environment | No | production | production |

## Support

- **Application Logs**: `docker-compose logs -f app`
- **Database Logs**: `docker-compose logs -f postgres`
- **Health Status**: `docker-compose ps`
- **Shell Access**: `docker-compose exec app sh`
- **Database Access**: `docker-compose exec postgres psql -U postgres -d bizgov`

For additional help, refer to the main application documentation or contact your system administrator.
