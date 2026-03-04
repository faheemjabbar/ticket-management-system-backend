# Production Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Variables

Ensure all required environment variables are set in production:

```bash
# Database
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/tickflow

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Email (for password reset)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM=noreply@tickflow.com

# Admin Credentials (for initial setup)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-this-password
ADMIN_NAME=System Admin

# Application
NODE_ENV=production
PORT=5050
```

### 2. Build the Application

```bash
# Install dependencies
npm install

# Build TypeScript to JavaScript
npm run build

# Verify build succeeded
ls -la dist/
```

### 3. Run Database Migrations

If you have existing data, run migrations:

```bash
# Migrate ticket statuses (Phase 1)
node dist/scripts/migrate-ticket-statuses.js

# Create initial admin (if needed)
node dist/scripts/create-admin.js
```

---

## Common Production Issues & Fixes

### Issue 1: "Cannot GET /auth/admin-exist"

**Problem**: Frontend trying to check if admin exists before showing registration

**Solution**: ✅ FIXED - Added endpoint

```typescript
// src/auth/auth.controller.ts
@Get('admin-exist')
async checkAdminExists() {
  return this.authService.checkAdminExists();
}
```

**Test**:
```bash
curl http://your-domain.com/auth/admin-exist
# Should return: { "exists": true, "count": 1 }
```

---

### Issue 2: "Cannot GET /api/sprints" or "Cannot GET /api/labels"

**Problem**: New modules not loaded or routes not registered

**Solution**: Verify modules are imported in `app.module.ts`

```typescript
// src/app.module.ts
imports: [
  // ... other modules
  SprintsModule,    // ✅ Added in Phase 2
  LabelsModule,     // ✅ Added in Phase 3
]
```

**Test**:
```bash
# Test sprints endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://your-domain.com/api/sprints

# Test labels endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://your-domain.com/api/labels
```

---

### Issue 3: "property type should not exist" (Validation Errors)

**Problem**: Strict validation rejecting new fields

**Solution**: ✅ FIXED - Changed validation pipe settings

```typescript
// src/main.ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: false,  // Changed from true to false
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }),
);
```

**Why this happens**:
- Frontend sends new fields: `type`, `status`, `acceptanceCriteria`, `priorityScore`
- Old backend rejects them with `forbidNonWhitelisted: true`
- New backend accepts them with `forbidNonWhitelisted: false`

---

### Issue 4: "Failed to load dashboard data"

**Problem**: API endpoints returning errors or not found

**Possible Causes**:
1. Database connection failed
2. JWT token expired or invalid
3. Organization filtering issues
4. Missing data in database

**Debug Steps**:

```bash
# 1. Check if backend is running
curl http://your-domain.com/health

# 2. Check database connection
# Look for MongoDB connection logs in console

# 3. Test authentication
curl -X POST http://your-domain.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your-password"}'

# 4. Test dashboard endpoints with token
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://your-domain.com/api/users

curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://your-domain.com/api/projects

curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://your-domain.com/api/tickets
```

---

## Deployment Steps

### Option 1: Manual Deployment

```bash
# 1. SSH into server
ssh user@your-server.com

# 2. Navigate to application directory
cd /path/to/ticket-backend

# 3. Pull latest code
git pull origin main

# 4. Install dependencies
npm install

# 5. Build application
npm run build

# 6. Restart application
pm2 restart ticket-backend
# OR
systemctl restart ticket-backend
```

### Option 2: Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 5050

CMD ["node", "dist/main"]
```

```bash
# Build and run
docker build -t ticket-backend .
docker run -d -p 5050:5050 \
  -e MONGODB_URI="your-connection-string" \
  -e JWT_SECRET="your-secret" \
  --name ticket-backend \
  ticket-backend
```

### Option 3: PM2 Deployment

```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start dist/main.js --name ticket-backend

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

---

## Post-Deployment Verification

### 1. Health Check

```bash
# Check if server is responding
curl http://your-domain.com/auth/admin-exist

# Expected: { "exists": true, "count": 1 }
```

### 2. API Endpoints Check

```bash
# Get auth token first
TOKEN=$(curl -X POST http://your-domain.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your-password"}' \
  | jq -r '.access_token')

# Test all major endpoints
curl -H "Authorization: Bearer $TOKEN" http://your-domain.com/api/users
curl -H "Authorization: Bearer $TOKEN" http://your-domain.com/api/organizations
curl -H "Authorization: Bearer $TOKEN" http://your-domain.com/api/projects
curl -H "Authorization: Bearer $TOKEN" http://your-domain.com/api/tickets
curl -H "Authorization: Bearer $TOKEN" http://your-domain.com/api/sprints
curl -H "Authorization: Bearer $TOKEN" http://your-domain.com/api/labels
```

### 3. Database Check

```bash
# Connect to MongoDB
mongosh "your-connection-string"

# Check collections
use tickflow
show collections

# Check data
db.users.countDocuments()
db.organizations.countDocuments()
db.projects.countDocuments()
db.tickets.countDocuments()
db.sprints.countDocuments()
db.labels.countDocuments()
```

---

## Troubleshooting

### Problem: Server won't start

**Check logs**:
```bash
# PM2 logs
pm2 logs ticket-backend

# Docker logs
docker logs ticket-backend

# System logs
journalctl -u ticket-backend -f
```

**Common issues**:
- Port 5050 already in use
- MongoDB connection failed
- Missing environment variables
- Build errors

### Problem: 404 on all endpoints

**Possible causes**:
1. Application not running
2. Wrong port
3. Reverse proxy misconfigured
4. CORS issues

**Check**:
```bash
# Is app running?
ps aux | grep node

# Is port open?
netstat -tulpn | grep 5050

# Test directly (bypass proxy)
curl http://localhost:5050/auth/admin-exist
```

### Problem: Database connection errors

**Check**:
```bash
# Test MongoDB connection
mongosh "your-connection-string"

# Check if IP is whitelisted (MongoDB Atlas)
# Go to Network Access in MongoDB Atlas
# Add your server's IP address
```

### Problem: JWT token issues

**Symptoms**:
- "Unauthorized" errors
- Token expired messages
- Invalid token errors

**Solutions**:
```bash
# 1. Check JWT_SECRET is set
echo $JWT_SECRET

# 2. Check token expiration
# Default is 7 days (JWT_EXPIRES_IN=7d)

# 3. Clear frontend localStorage and login again
```

---

## Performance Optimization

### 1. Enable Compression

```typescript
// src/main.ts
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.use(compression());
  
  // ... rest of configuration
}
```

### 2. Add Rate Limiting

```bash
npm install @nestjs/throttler
```

```typescript
// src/app.module.ts
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 100,
    }),
    // ... other modules
  ],
})
```

### 3. Enable Caching

```bash
npm install cache-manager
```

```typescript
// src/app.module.ts
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      ttl: 300, // 5 minutes
    }),
    // ... other modules
  ],
})
```

---

## Security Checklist

- [ ] Change default admin password
- [ ] Use strong JWT_SECRET (min 32 characters)
- [ ] Enable HTTPS in production
- [ ] Set secure CORS origins (not `origin: true`)
- [ ] Enable rate limiting
- [ ] Use environment variables for secrets
- [ ] Enable MongoDB authentication
- [ ] Whitelist server IP in MongoDB Atlas
- [ ] Use helmet for security headers
- [ ] Enable request logging
- [ ] Set up monitoring and alerts

---

## Monitoring

### 1. Application Logs

```bash
# PM2 logs
pm2 logs ticket-backend --lines 100

# Save logs to file
pm2 logs ticket-backend > logs.txt
```

### 2. Performance Monitoring

```bash
# PM2 monitoring
pm2 monit

# Memory usage
pm2 show ticket-backend
```

### 3. Database Monitoring

```bash
# MongoDB Atlas
# Go to Metrics tab in Atlas dashboard

# Check slow queries
db.setProfilingLevel(1, { slowms: 100 })
db.system.profile.find().sort({ ts: -1 }).limit(10)
```

---

## Rollback Plan

If deployment fails:

```bash
# 1. Stop current version
pm2 stop ticket-backend

# 2. Checkout previous version
git checkout <previous-commit-hash>

# 3. Rebuild
npm install
npm run build

# 4. Restart
pm2 restart ticket-backend

# 5. Verify
curl http://your-domain.com/auth/admin-exist
```

---

## Support

If issues persist:

1. Check application logs
2. Check database connection
3. Verify environment variables
4. Test endpoints with curl
5. Check frontend console for errors
6. Review this guide for common issues

---

## Quick Fix Commands

```bash
# Restart application
pm2 restart ticket-backend

# View logs
pm2 logs ticket-backend --lines 50

# Check status
pm2 status

# Rebuild application
npm run build

# Run migrations
node dist/scripts/migrate-ticket-statuses.js

# Test endpoint
curl http://localhost:5050/auth/admin-exist
```

---

## Version History

- **Phase 1**: Critical fixes (statuses, types, roles)
- **Phase 2**: Core features (sprints, relationships)
- **Phase 3**: Enhanced features (watchers, labels, comments)

Current Version: **Phase 3 Complete (B+ Grade)**
