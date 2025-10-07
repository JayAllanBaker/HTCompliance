# BizGov - Docker Quick Start

## 🚀 Quick Deploy (5 Minutes)

### Step 1: Configure Environment
```bash
# Copy environment template
cp .env.docker.example .env

# Edit with your values (use nano, vim, or any editor)
nano .env
```

**Required Changes in `.env`:**
- `POSTGRES_PASSWORD` - Set a strong password
- `SESSION_SECRET` - Generate with: `openssl rand -base64 32`
- `AZURE_CLIENT_ID` - Your Azure app client ID
- `AZURE_CLIENT_SECRET` - Your Azure app secret
- `AZURE_TENANT_ID` - Your Azure tenant ID

### Step 2: Deploy
```bash
# Build containers
docker-compose build

# Start services
docker-compose up -d

# Check status
docker-compose ps
```

### Step 3: Access Application
Open browser: **http://localhost:5000**

Register first admin user and start using BizGov!

---

## 📋 Essential Commands

### Start/Stop
```bash
docker-compose up -d          # Start
docker-compose down           # Stop
docker-compose restart        # Restart
```

### Logs
```bash
docker-compose logs -f        # View all logs
docker-compose logs -f app    # App logs only
```

### Status
```bash
docker-compose ps             # Container status
docker stats bizgov-app       # Resource usage
```

### Update
```bash
git pull
docker-compose build --no-cache
docker-compose down
docker-compose up -d
```

---

## 🔧 What Gets Deployed

**Two containers:**
1. **bizgov-postgres** - PostgreSQL 16 database
2. **bizgov-app** - React + Express application

**Automatic setup:**
- ✅ Database schema initialized on first start
- ✅ Persistent data volumes created
- ✅ Health checks configured
- ✅ Auto-restart enabled

**Persistent volumes:**
- `postgres_data` - Database files
- `app_uploads` - Uploaded documents

---

## 🐛 Troubleshooting

**Port already in use?**
```bash
# Change port in .env
echo "APP_PORT=5001" >> .env
docker-compose down
docker-compose up -d
```

**Database connection failed?**
```bash
# Restart database
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

**Need to reset everything?**
```bash
# WARNING: Deletes all data!
docker-compose down -v
docker-compose up -d
```

---

## 📦 Backup & Restore

### Backup
```bash
# Backup database
docker-compose exec postgres pg_dump -U postgres bizgov > backup.sql

# Backup uploads
docker run --rm -v bizgov_app_uploads:/data -v $(pwd):/backup \
  alpine tar czf /backup/uploads.tar.gz -C /data .
```

### Restore
```bash
# Restore database
docker-compose exec -T postgres psql -U postgres bizgov < backup.sql

# Restore uploads
docker run --rm -v bizgov_app_uploads:/data -v $(pwd):/backup \
  alpine tar xzf /backup/uploads.tar.gz -C /data
```

---

## 🔒 Security Checklist

- [ ] Changed `POSTGRES_PASSWORD` from default
- [ ] Generated random `SESSION_SECRET` (32+ chars)
- [ ] Set Azure credentials
- [ ] Using HTTPS in production (reverse proxy)
- [ ] Regular backups scheduled

---

## 📚 Full Documentation

See [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md) for complete documentation including:
- Production deployment guide
- Security best practices
- Reverse proxy setup (HTTPS)
- Advanced troubleshooting
- Resource limits and scaling

---

## 🆘 Quick Help

```bash
# View this guide
cat DOCKER_QUICKSTART.md

# Check deployment is ready
ls -la Dockerfile docker-compose.yml .env

# Validate docker-compose config
docker-compose config

# Access database directly
docker-compose exec postgres psql -U postgres -d bizgov
```
