# Therabo OpenClause Deployment Guide

This guide covers deploying Therabo to OpenClause cloud platform. OpenClause simplifies containerized application deployment with managed infrastructure.

---

## Prerequisites

Before deploying, ensure you have:

1. **OpenClause Account**: Sign up at https://openclaw.cloud
2. **Domain Name**: Point your domain to OpenClause's load balancer
3. **Git Repository**: Code pushed to GitHub/GitLab

---

## Supported Deployment Methods

### Method 1: Docker Registry (Recommended)

Push your Docker image to a registry, then connect to OpenClause.

#### Step 1: Build the Image

```bash
# Clone the repository
git clone https://github.com/your-org/therabo.git
cd therabo

# Copy and configure environment
cp .env.example .env
# Edit .env with your values (see Configuration section below)
nano .env

# Build the image
docker build -t therabo:latest .

# Tag for your registry
docker tag therabo:latest your-registry.io/therabo:latest
docker push your-registry.io/therabo:latest
```

#### Step 2: Configure OpenClause

1. Log in to OpenClause dashboard
2. Create a new project or select existing
3. Add a new service:
   - **Type**: Container
   - **Image**: `your-registry.io/therabo:latest`
   - **Port**: 8080
   - **Environment Variables**: Add from your `.env` file
4. Configure persistent volumes:
   - `/app/data` — SQLite database
   - `/app/uploads` — Uploaded images

#### Step 3: Deploy

Click "Deploy" in the OpenClause dashboard. The platform will:
- Pull your image
- Start the container
- Mount configured volumes
- Apply environment variables

---

### Method 2: Source Deploy

OpenClause can build directly from your repository.

#### Step 1: Connect Repository

1. In OpenClause dashboard, connect your Git repository
2. Select the `therabo` project root
3. Configure the build:
   - **Build Command**: `docker compose build`
   - **Output Directory**: (leave empty; uses Docker volume)

#### Step 2: Environment Variables

Add these in OpenClause dashboard:

| Variable | Required | Example |
|----------|----------|---------|
| `APP_URL` | Yes | `https://your-domain.com` |
| `JWT_SECRET` | Yes | `(openssl rand -base64 48)` |
| `ADMIN_BOOTSTRAP_PASSWORD` | Yes | `YourSecurePassword123` |
| `NODE_ENV` | Yes | `production` |
| `PORT` | Yes | `8080` |
| `DB_DIR` | Yes | `/app/data` |
| `UPLOAD_DIR` | Yes | `/app/uploads` |
| `STATIC_DIR` | Yes | `/app/public` |

#### Step 3: Deploy

Trigger a deployment from the dashboard or push to your connected branch.

---

## Configuration

### Required Settings

Edit your `.env` file before building:

```bash
APP_URL=https://your-domain.com
JWT_SECRET=<generate with: openssl rand -base64 48>
ADMIN_BOOTSTRAP_PASSWORD=YourSecurePassword123
NODE_ENV=production
PORT=8080
DB_DIR=/app/data
UPLOAD_DIR=/app/uploads
STATIC_DIR=/app/public
```

### Optional Payment Settings

If using Stripe:
```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

If using Alipay:
```bash
ALIPAY_APP_ID=2021...
ALIPAY_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----\n...
ALIPAY_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----\n...
```

If using WeChat Pay:
```bash
WECHAT_MCHID=1234567890
WECHAT_SERIAL_NO=ABCDEF...
WECHAT_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...
```

### Optional Email Settings

Configure SMTP via admin dashboard after deployment (see Post-deployment section).

---

## Post-deployment Steps

### 1. Verify Deployment

```bash
# Check application health
curl https://your-domain.com/api/health

# Expected response:
{"ok":true,"timestamp":"...","db":"ok"}
```

### 2. Access Admin Dashboard

1. Visit: `https://your-domain.com/#admin`
2. Login with:
   - Username: `admin`
   - Password: (from `ADMIN_BOOTSTRAP_PASSWORD`)
3. **Immediately** change the admin password

### 3. Configure SMTP (for emails)

In admin dashboard:
- Go to **Mail Center → SMTP**
- Fill in your SMTP provider details
- Test with **Send Test Email**

### 4. Set Up Domain (SSL)

1. In OpenClause, add your custom domain
2. Enable automatic SSL (Let's Encrypt)
3. Update DNS A record to point to your OpenClause load balancer

---

## Data Persistence

### Volumes

Ensure these paths persist across deployments:

| Path | Purpose |
|------|---------|
| `/app/data` | SQLite database (products, orders, customers, content) |
| `/app/uploads` | Product images, uploads |

In OpenClause, configure these as persistent volumes. Data persists across redeployments.

### Backup

```bash
# Copy database from volume
oc exec therabo-app cat /app/data/therabo.db > backup-$(date +%F).db

# Copy uploads folder
oc exec therabo-app tar -cf - /app/uploads | tar -xf - -C backups/
```

---

## Troubleshooting

### Container Won’t Start

Check logs in OpenClause dashboard. Common issues:
- Missing environment variables
- Port 8080 already in use
- Volume mount permissions

### Database Error

If you see `SQLITE_CANTOPEN`:
- Ensure volume `/app/data` is properly mounted
- Check file permissions

### Images Not Loading

Verify:
- Volume `/app/uploads` is mounted and has files
- Nginx serves `/uploads` path

### SSL Certificate Issues

In OpenClause dashboard:
1. Delete existing certificate
2. Request new Let's Encrypt certificate
3. Ensure your domain DNS points to the load balancer

---

## Scaling

### Vertical Scaling

Increase container size in OpenClause dashboard:
- CPU: 1 → 2 cores
- Memory: 1 GB → 2 GB

### Horizontal Scaling

Therabo is stateless and supports horizontal scaling:
1. Enable sticky sessions (recommended for checkout)
2. Use shared database (SQLite works for moderate load)
3. For high traffic, consider external database (PostgreSQL)

---

## Maintenance

### Updating Deployment

```bash
# Rebuild image
docker build -t therabo:latest .
docker push your-registry.io/therabo:latest

# In OpenClause, trigger redeploy
# Or use CLI:
oc deployment create --image your-registro.io/therabo:latest
```

### Logs

View logs in OpenClause dashboard or via CLI:
```bash
oc logs therabo-app -f
```

---

## Security Checklist

Before going live:

- [ ] Change default admin password
- [ ] Use strong `JWT_SECRET` (32+ random bytes)
- [ ] Enable HTTPS (OpenClause auto-SSL)
- [ ] Configure payment webhook secrets
- [ ] Restrict admin access to known IPs (if supported)
- [ ] Enable database backups

---

## Quick Reference

| Item | Value |
|------|-------|
| App Port | 8080 |
| Health Endpoint | `/api/health` |
| Admin Route | `/#admin` |
| Database Path | `/app/data/therabo.db` |
| Uploads Path | `/app/uploads` |

---

## Support

For deployment issues:
1. Check OpenClause status page
2. Review container logs in dashboard
3. Contact OpenClause support

For application issues, refer to [DEPLOY.md](./DEPLOY.md)