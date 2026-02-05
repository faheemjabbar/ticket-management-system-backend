# TickFlo Backend

NestJS backend API for ticket management system.

## Features

- JWT Authentication & Authorization
- Role-based Access Control (Superadmin, Admin, QA, Developer)
- User Management
- Project Management
- Ticket Management
- Comments & History Tracking
- Password Reset via Email
- Real-time Notifications (WebSocket)
- File Upload Support

## Tech Stack

- NestJS
- TypeScript
- MongoDB
- JWT
- Socket.io
- Nodemailer

## Prerequisites

- Node.js v18+
- MongoDB

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file:

```env
PORT=5050
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/tickflow
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:3000

# Superadmin
SUPERADMIN_EMAIL=admin@example.com
SUPERADMIN_PASSWORD=admin123
SUPERADMIN_NAME=Admin User

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_NAME=TickFlo
SMTP_FROM_EMAIL=your-email@gmail.com
```

## Running

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

API: `http://localhost:5050`  
Docs: `http://localhost:5050/api/docs`

## API Endpoints

### Authentication
- `POST /auth/register` - Register user
- `POST /auth/login` - Login user
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password

### Users
- `GET /api/users` - Get users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Projects
- `GET /api/projects` - Get projects
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Tickets
- `GET /api/tickets` - Get tickets
- `POST /api/tickets` - Create ticket
- `PUT /api/tickets/:id` - Update ticket
- `PATCH /api/tickets/:id/assign` - Assign ticket
- `PATCH /api/tickets/:id/status` - Update status

### Comments
- `GET /api/tickets/:ticketId/comments` - Get comments
- `POST /api/tickets/:ticketId/comments` - Create comment

### Upload
- `POST /api/upload` - Upload file

## Roles

**Superadmin** - Full system access  
**Admin** - Manage assigned projects and tickets  
**QA** - Manage tickets in assigned projects  
**Developer** - View and update assigned tickets

## Authentication

Protected endpoints require JWT token:

```
Authorization: Bearer <token>
```
