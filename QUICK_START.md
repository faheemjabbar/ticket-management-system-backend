# TickFlo Backend - Quick Start Guide

## ✅ Current Status

Your backend is **fully implemented and running**! 

- ✅ Server running at: `http://192.168.1.19:5050`
- ✅ Swagger docs at: `http://192.168.1.19:5050/api/docs`
- ✅ MongoDB connected successfully
- ✅ All modules implemented (Auth, Users, Projects, Tickets, Comments, History)

## 🚀 Next Steps

### 1. Seed the Database

Open a **new terminal** and run:

```bash
npm run seed
```

This will create test users:
- **Admin:** admin@tickflo.com / Admin123!
- **QA:** qa@tickflo.com / QA123!
- **Developer:** john@tickflo.com / Dev123!

### 2. Test the API

#### Option A: Using Swagger UI (Recommended)

1. Open browser: `http://192.168.1.19:5050/api/docs`
2. Click on `/auth/login` endpoint
3. Click "Try it out"
4. Use test credentials:
   ```json
   {
     "email": "admin@tickflo.com",
     "password": "Admin123!"
   }
   ```
5. Copy the `access_token` from response
6. Click "Authorize" button at top
7. Paste token as: `Bearer <your-token>`
8. Now you can test all endpoints!

#### Option B: Using cURL

```bash
# Login
curl -X POST http://192.168.1.19:5050/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@tickflo.com\",\"password\":\"Admin123!\"}"

# Get current user (replace TOKEN with your access_token)
curl -X GET http://192.168.1.19:5050/auth/me \
  -H "Authorization: Bearer TOKEN"
```

#### Option C: Using Postman

1. Import the API endpoints from Swagger
2. Create a new request to `/auth/login`
3. Get the token and add it to Authorization header

## 📋 What's Implemented

### Authentication & Authorization
- ✅ JWT-based authentication
- ✅ Role-based access control (Admin, QA, Developer)
- ✅ Password hashing with bcrypt
- ✅ Protected routes with guards

### User Management
- ✅ CRUD operations for users
- ✅ User roles and permissions
- ✅ Toggle user status
- ✅ Last login tracking

### Project Management
- ✅ Create/Read/Update/Delete projects
- ✅ Team member management
- ✅ Project status tracking
- ✅ Search and filtering

### Ticket Management
- ✅ Create/Read/Update/Delete tickets
- ✅ Assign tickets to users
- ✅ Update ticket status
- ✅ Priority levels
- ✅ Labels and deadlines
- ✅ Filter by status, priority, project

### Comments System
- ✅ Add comments to tickets
- ✅ Update/Delete comments
- ✅ Attachment support (schema ready)

### Ticket History
- ✅ Track all ticket changes
- ✅ View history timeline

## 🗂️ Project Structure

```
src/
├── auth/                   # JWT authentication
│   ├── decorators/        # @CurrentUser, @Roles
│   ├── dto/               # Login, Register DTOs
│   ├── guards/            # JwtAuthGuard, RolesGuard
│   └── strategies/        # JWT Strategy
├── users/                 # User management
├── projects/              # Project management
├── tickets/               # Ticket management
├── comments/              # Comments system
├── ticket-history/        # History tracking
└── database/              # Seed scripts
```

## 🔧 Available Commands

```bash
# Development
npm run start:dev          # Start with hot-reload (CURRENTLY RUNNING)
npm run start:debug        # Start in debug mode

# Database
npm run seed               # Seed test data

# Production
npm run build              # Build for production
npm run start:prod         # Start production server

# Code Quality
npm run lint               # Lint code
npm run format             # Format code
```

## 📊 MongoDB Collections

Your database `tickflo` has these collections:

- `users` - User accounts with roles
- `projects` - Projects with team members
- `tickets` - Tickets with status tracking
- `comments` - Ticket comments
- `tickethistories` - Change history

## 🔐 API Authentication

All endpoints (except `/auth/register` and `/auth/login`) require authentication:

```
Authorization: Bearer <your-jwt-token>
```

## 🎯 Role Permissions

### Admin
- Full access to everything
- Can manage users
- Can delete any resource

### QA
- Create/manage projects
- Create/manage tickets
- Cannot manage users

### Developer
- View projects and tickets
- Update assigned tickets
- Self-assign tickets
- Add comments

## 📝 Example API Calls

### Register New User
```bash
POST /auth/register
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "Test123!",
  "role": "developer"
}
```

### Create Project
```bash
POST /api/projects
Authorization: Bearer <token>
{
  "name": "New Project",
  "description": "Project description",
  "status": "active",
  "startDate": "2026-01-29",
  "teamMembers": [
    {
      "userId": "user-id-here",
      "role": "developer"
    }
  ]
}
```

### Create Ticket
```bash
POST /api/tickets
Authorization: Bearer <token>
{
  "title": "Bug in login page",
  "description": "Users cannot login",
  "priority": "high",
  "projectId": "project-id-here",
  "labels": ["bug", "urgent"]
}
```

## 🐛 Troubleshooting

### MongoDB Not Connected?
```bash
# Start MongoDB service
net start MongoDB

# Or run mongod directly
mongod
```

### Port 5050 Already in Use?
Change PORT in `.env` file

### Can't Access Swagger?
Make sure server is running and visit:
`http://192.168.1.19:5050/api/docs`

## 📚 Documentation

- Full API spec: See `IMPLEMENTATION.md`
- Swagger UI: `http://192.168.1.19:5050/api/docs`
- MongoDB Compass: `mongodb://localhost:27017`

## ✨ What's Next?

1. **Seed the database** with test data
2. **Test the API** using Swagger UI
3. **Connect your frontend** to the backend
4. **Customize** as needed for your requirements

---

**Your backend is ready to use! 🎉**

The server is currently running in watch mode, so any changes you make to the code will automatically reload.
