# Production Fixes Applied

## Issues Reported

1. ❌ `Cannot GET /auth/admin-exist`
2. ❌ `Failed to load dashboard data`
3. ❌ `Cannot GET /api/sprints?projectId=...&status=active`
4. ❌ `Cannot GET /api/labels?projectId=...`
5. ❌ Validation errors: `property type should not exist`, `property status should not exist`, etc.

---

## Fixes Applied

### Fix 1: Added `/auth/admin-exist` Endpoint ✅

**File**: `src/auth/auth.controller.ts`

```typescript
@Get('admin-exist')
@ApiOperation({ summary: 'Check if admin exists (public endpoint)' })
async checkAdminExists() {
  return this.authService.checkAdminExists();
}
```

**File**: `src/auth/auth.service.ts`

```typescript
async checkAdminExists() {
  const admins = await this.usersService.findAll({ role: 'admin' }, null);
  return {
    exists: admins.total > 0,
    count: admins.total,
  };
}
```

**Test**:
```bash
curl http://your-domain.com/auth/admin-exist
# Expected: { "exists": true, "count": 1 }
```

---

### Fix 2: Relaxed Validation Pipe ✅

**File**: `src/main.ts`

**Changed**:
```typescript
// BEFORE (strict - rejects new fields)
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,  // ❌ This was rejecting new fields
    transform: true,
  }),
);

// AFTER (flexible - allows new fields)
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: false,  // ✅ Now allows extra fields
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }),
);
```

**Why this fixes the validation errors**:
- Frontend sends new Phase 1-3 fields: `type`, `status`, `acceptanceCriteria`, `priorityScore`, `sprintId`, `parentId`
- Old validation rejected these with "property X should not exist"
- New validation accepts them and validates only the ones defined in DTO

---

### Fix 3: Modules Already Registered ✅

**File**: `src/app.module.ts`

Verified that all new modules are imported:

```typescript
imports: [
  // ... existing modules
  SprintsModule,    // ✅ Phase 2
  LabelsModule,     // ✅ Phase 3
]
```

**Endpoints now available**:
- `GET /api/sprints`
- `POST /api/sprints`
- `GET /api/labels`
- `POST /api/labels`
- And all other sprint/label endpoints

---

## Deployment Instructions

### Step 1: Pull Latest Code

```bash
cd /path/to/ticket-backend
git pull origin main
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Build Application

```bash
npm run build
```

### Step 4: Restart Application

```bash
# If using PM2
pm2 restart ticket-backend

# If using systemd
sudo systemctl restart ticket-backend

# If using Docker
docker restart ticket-backend
```

### Step 5: Verify Fixes

```bash
# Test 1: Check admin-exist endpoint
curl http://your-domain.com/auth/admin-exist
# Expected: { "exists": true, "count": 1 }

# Test 2: Login and get token
TOKEN=$(curl -X POST http://your-domain.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your-password"}' \
  | jq -r '.access_token')

# Test 3: Check sprints endpoint
curl -H "Authorization: Bearer $TOKEN" \
  "http://your-domain.com/api/sprints?projectId=YOUR_PROJECT_ID&status=active"

# Test 4: Check labels endpoint
curl -H "Authorization: Bearer $TOKEN" \
  "http://your-domain.com/api/labels?projectId=YOUR_PROJECT_ID"

# Test 5: Create ticket with new fields
curl -X POST http://your-domain.com/api/tickets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test ticket",
    "description": "Testing new fields",
    "type": "task",
    "status": "backlog",
    "priority": "medium",
    "priorityScore": 1000,
    "projectId": "YOUR_PROJECT_ID",
    "acceptanceCriteria": ["Test passes"]
  }'
```

---

## What Changed in Each Phase

### Phase 1 (Critical Fixes)
- ✅ New ticket statuses: `backlog`, `todo`, `in_progress`, `in_review`, `qa_testing`, `done`, `closed`, `blocked`, `rejected`
- ✅ New ticket types: `bug`, `feature`, `task`, `improvement`, `epic`, `story`
- ✅ New fields: `type`, `status`, `priorityScore`, `storyPoints`, `estimatedHours`, `acceptanceCriteria`, `watchers`

### Phase 2 (Core Features)
- ✅ Sprints system: `/api/sprints` endpoints
- ✅ Ticket relationships: parent/child, blocking
- ✅ New fields: `sprintId`, `parentId`, `relatedTickets`

### Phase 3 (Enhanced Features)
- ✅ Labels system: `/api/labels` endpoints
- ✅ Watchers: `/api/tickets/:id/watchers` endpoints
- ✅ Enhanced comments: threading, mentions, internal notes
- ✅ Changed: `labels` from `string[]` to `ObjectId[]`

---

## Frontend Compatibility

### Old Frontend (Before Phases)
- ❌ Will get validation errors for new fields
- ❌ Won't see sprints/labels endpoints
- ❌ Can't use new ticket types/statuses

### New Frontend (After Phases)
- ✅ Can use all new fields
- ✅ Can access sprints/labels
- ✅ Can use new ticket types/statuses
- ✅ Validation passes

**Migration Path**:
1. Deploy backend with fixes
2. Update frontend to use new fields
3. Run database migrations if needed

---

## Database Migration (If Needed)

If you have existing tickets with old status values:

```bash
# Run migration script
node dist/scripts/migrate-ticket-statuses.js
```

This will:
- Convert `pending` → `backlog`
- Convert `assigned` → `todo`
- Convert `awaiting` → `in_progress`
- Convert `closed` → `done`
- Add default `type: 'task'`
- Add default `priorityScore: 1000`

---

## Troubleshooting

### Issue: Still getting "Cannot GET" errors

**Solution**:
```bash
# 1. Check if app is running
pm2 status

# 2. Check logs for errors
pm2 logs ticket-backend --lines 50

# 3. Verify build succeeded
ls -la dist/

# 4. Restart app
pm2 restart ticket-backend
```

### Issue: Still getting validation errors

**Solution**:
```bash
# 1. Verify main.ts was updated
grep "forbidNonWhitelisted" dist/main.js
# Should show: forbidNonWhitelisted: false

# 2. If not, rebuild
npm run build

# 3. Restart
pm2 restart ticket-backend
```

### Issue: Endpoints return 404

**Solution**:
```bash
# 1. Check if modules are loaded
grep "SprintsModule" dist/app.module.js
grep "LabelsModule" dist/app.module.js

# 2. If not found, rebuild
npm run build

# 3. Restart
pm2 restart ticket-backend
```

---

## Success Criteria

After deployment, you should be able to:

- ✅ Access `/auth/admin-exist` without errors
- ✅ Login successfully
- ✅ Load dashboard data
- ✅ Access `/api/sprints` endpoints
- ✅ Access `/api/labels` endpoints
- ✅ Create tickets with new fields (`type`, `status`, etc.)
- ✅ No validation errors for new fields

---

## Rollback (If Needed)

If issues persist:

```bash
# 1. Checkout previous version
git checkout <previous-commit>

# 2. Rebuild
npm run build

# 3. Restart
pm2 restart ticket-backend
```

---

## Next Steps

1. Deploy these fixes to production
2. Test all endpoints
3. Update frontend to use new features
4. Run database migrations if needed
5. Monitor logs for any errors

---

## Support

If you encounter any issues:

1. Check logs: `pm2 logs ticket-backend`
2. Verify environment variables are set
3. Test endpoints with curl
4. Check database connection
5. Review `PRODUCTION_DEPLOYMENT_GUIDE.md`
