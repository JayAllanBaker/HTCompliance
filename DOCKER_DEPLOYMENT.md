# BizGov Compliance Hub - Docker Deployment Guide

## Quick Start

### Prerequisites
- Docker 20.10+ and Docker Compose 2.0+
- At least 2GB RAM and 10GB disk space

### Development Deployment

1. **Clone the repository** (if not already done)

2. **Configure environment variables**
   ```bash
   cp .env.docker.example .env
   # Edit .env with your production values
   ```

3. **Build and start services**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Application: http://localhost:5000
   - Database: localhost:5432

5. **View logs**
   ```bash
   docker-compose logs -f app
   ```

### Production Deployment

#### 1. Environment Configuration

Create a `.env` file with secure production values:

```bash
# Database
POSTGRES_PASSWORD=<strong-random-password>

# Session Security
SESSION_SECRET=<generate-with-openssl-rand-base64-32>

# Microsoft Graph API
AZURE_CLIENT_ID=<your-azure-app-id>
AZURE_CLIENT_SECRET=<your-azure-app-secret>
AZURE_TENANT_ID=<your-azure-tenant-id>

# Email
SENDER_EMAIL=noreply@yourcompany.com
DEFAULT_ALERT_EMAIL=admin@yourcompany.com
```

#### 2. Build Production Image

```bash
docker-compose build --no-cache
```

#### 3. Start Services

```bash
docker-compose up -d
```

#### 4. Run Database Migrations

```bash
# Migrations are included in the image and run automatically
# Or run manually if needed:
docker-compose exec app npm run db:push
```

#### 5. Create Admin User

Access the application at http://your-domain.com and register your first admin user through the UI.

## Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `POSTGRES_DB` | Database name | No | bizgov |
| `POSTGRES_USER` | Database user | No | postgres |
| `POSTGRES_PASSWORD` | Database password | Yes (prod) | postgres |
| `SESSION_SECRET` | Session encryption key | Yes | changeme |
| `AZURE_CLIENT_ID` | Microsoft Graph client ID | Yes | - |
| `AZURE_CLIENT_SECRET` | Microsoft Graph secret | Yes | - |
| `AZURE_TENANT_ID` | Azure AD tenant ID | Yes | - |
| `APP_PORT` | External port mapping | No | 5000 |
| `APP_URL` | Public application URL | No | http://localhost:5000 |

### Volume Management

The application uses two persistent volumes:

- **postgres_data**: Database storage
- **app_uploads**: Uploaded evidence files and attachments

#### Backup Volumes

```bash
# Backup database
docker-compose exec postgres pg_dump -U postgres bizgov > backup.sql

# Backup uploads
docker run --rm -v bizgov_app_uploads:/data -v $(pwd):/backup \
  alpine tar czf /backup/uploads-backup.tar.gz -C /data .
```

#### Restore Volumes

```bash
# Restore database
docker-compose exec -T postgres psql -U postgres bizgov < backup.sql

# Restore uploads
docker run --rm -v bizgov_app_uploads:/data -v $(pwd):/backup \
  alpine tar xzf /backup/uploads-backup.tar.gz -C /data
```

## Health Checks

The application includes built-in health checks:

- **App Health**: Checked every 30s on `/api/user`
- **DB Health**: Checked every 10s with `pg_isready`

View health status:
```bash
docker-compose ps
```

## Troubleshooting

### Container Fails to Start

1. Check logs:
   ```bash
   docker-compose logs app
   docker-compose logs postgres
   ```

2. Verify environment variables:
   ```bash
   docker-compose config
   ```

3. Check database connection:
   ```bash
   docker-compose exec postgres psql -U postgres -d bizgov -c "SELECT 1;"
   ```

### Database Connection Issues

1. Ensure PostgreSQL is healthy:
   ```bash
   docker-compose ps postgres
   ```

2. Test connectivity:
   ```bash
   docker-compose exec app node -e "require('pg').Client({host:'postgres',port:5432,user:'postgres',password:'postgres',database:'bizgov'}).connect().then(()=>console.log('OK')).catch(console.error)"
   ```

### Port Already in Use

Change the external port mapping in `.env`:
```bash
APP_PORT=5001  # Change from default 5000
POSTGRES_PORT=5433  # Change if 5432 is in use
```

## Maintenance

### Update Application

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose build --no-cache
docker-compose up -d
```

### Scale Services

Docker Compose doesn't natively support scaling with defined container names. For scaling, use Docker Swarm or Kubernetes.

### Monitor Resources

```bash
docker stats bizgov-app bizgov-postgres
```

## Security Best Practices

1. **Always use strong passwords** in production
2. **Generate random SESSION_SECRET**: `openssl rand -base64 32`
3. **Use HTTPS** with a reverse proxy (nginx, Traefik, Caddy)
4. **Regular backups** of database and uploads
5. **Keep Docker images updated**
6. **Restrict database access** to application container only
7. **Use secrets management** for Azure credentials (e.g., Docker Secrets, Vault)

## Production Architecture

For production deployment, consider:

1. **Reverse Proxy**: Use nginx or Traefik for SSL/TLS termination
2. **Load Balancer**: Distribute traffic across multiple app containers
3. **Managed Database**: Use AWS RDS, Azure Database, or similar
4. **Object Storage**: Move uploads to S3/Azure Blob Storage
5. **Monitoring**: Add Prometheus + Grafana for metrics
6. **Logging**: Centralize logs with ELK or Loki stack

## Support

For issues or questions, refer to the main application documentation or contact your system administrator.
