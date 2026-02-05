# TickFlo - Ticket Management System Backend

A comprehensive NestJS backend API for ticket management with MongoDB.

## Features

- ✅ JWT Authentication & Authorization
- ✅ Role-based Access Control (Admin, QA, Developer)
- ✅ User Management
- ✅ Project Management
- ✅ Ticket Management with Status Tracking
- ✅ Comments System
- ✅ Ticket History Tracking
- ✅ MongoDB with Mongoose ODM
- ✅ Swagger API Documentation
- ✅ Input Validation with class-validator
- ✅ CORS Enabled

## Tech Stack

- **Framework:** NestJS v11
- **Runtime:** Node.js v18+
- **Language:** TypeScript
- **Database:** MongoDB (Local)
- **ODM:** Mongoose
- **Authentication:** JWT (Passport)
- **Validation:** class-validator, class-transformer
- **Documentation:** Swagger/OpenAPI

## Prerequisites

- Node.js v18 or higher
- MongoDB installed and running locally
- npm or yarn

## Installation

```bash
# Install dependencies
npm install
```

## Configuration

The `.env` file is already configured with:

```env
PORT=5050
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/your-db-name
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
FRONTEND_URL=http://localhost:3000

# Email Configuration (SMTP)
# For Gmail: smtp.gmail.com, port 587
# For Outlook: smtp-mail.outlook.com, port 587
# For SendGrid: smtp.sendgrid.net, port 587
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email36@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_NAME=TickFlo
SMTP_FROM_EMAIL=your-email36@gmail.com
```

## Running the Application

### 1. Start MongoDB

Make sure MongoDB is running on your local machine:

```bash
# Windows (if MongoDB is installed as a service)
net start MongoDB

# Or run mongod directly
mongod
```

### 2. Seed the Database (First Time Only)

```bash
npm run seed
```

This will create test users and a sample project:

**Test Credentials:**
- Admin: `admin@tickflo.com` / `Admin123!`
- QA: `qa@tickflo.com` / `QA123!`
- Developer: `john@tickflo.com` / `Dev123!`

### 3. Start the Development Server

```bash
npm run start:dev
```

The API will be available at: `http://localhost:5050`

### 4. Access Swagger Documentation

Open your browser and navigate to:
```
http://localhost:5050/api/docs
```

Or from another device on your network:
```
http://192.168.1.14:5050/api/docs
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/me` - Get current user (requires auth)

### Users
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user (Admin only)
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (Admin only)
- `PATCH /api/users/:id/toggle-status` - Toggle user status (Admin only)

### Projects
- `GET /api/projects` - Get all projects (Admin, QA)
- `GET /api/projects/:id` - Get project by ID
- `POST /api/projects` - Create project (Admin, QA)
- `PUT /api/projects/:id` - Update project (Admin, QA)
- `DELETE /api/projects/:id` - Delete project (Admin only)

### Tickets
- `GET /api/tickets` - Get all tickets
- `GET /api/tickets/:id` - Get ticket by ID
- `POST /api/tickets` - Create ticket (Admin, QA)
- `PUT /api/tickets/:id` - Update ticket
- `DELETE /api/tickets/:id` - Delete ticket
- `PATCH /api/tickets/:id/assign` - Assign ticket
- `PATCH /api/tickets/:id/status` - Update ticket status

### Comments
- `GET /api/tickets/:ticketId/comments` - Get comments for ticket
- `POST /api/tickets/:ticketId/comments` - Create comment
- `PUT /api/comments/:id` - Update comment
- `DELETE /api/comments/:id` - Delete comment

### Ticket History
- `GET /api/tickets/:ticketId/history` - Get ticket history

## Project Structure

```
src/
├── auth/                    # Authentication module
│   ├── decorators/         # Custom decorators
│   ├── dto/                # Data transfer objects
│   ├── guards/             # Auth guards
│   └── strategies/         # Passport strategies
├── users/                  # User management
├── projects/               # Project management
├── tickets/                # Ticket management
├── comments/               # Comments system
├── ticket-history/         # Ticket history tracking
├── database/               # Database utilities
│   └── seed.ts            # Database seeding script
├── app.module.ts          # Root module
└── main.ts                # Application entry point
```

## Available Scripts

```bash
# Development
npm run start:dev          # Start with hot-reload
npm run start:debug        # Start in debug mode

# Production
npm run build              # Build the application
npm run start:prod         # Start production server

# Database
npm run seed               # Seed database with test data

# Code Quality
npm run lint               # Lint code
npm run format             # Format code with Prettier

# Testing
npm run test               # Run unit tests
npm run test:watch         # Run tests in watch mode
npm run test:cov           # Run tests with coverage
npm run test:e2e           # Run e2e tests
```

## MongoDB Collections

The application creates the following collections:

- `users` - User accounts
- `projects` - Projects
- `tickets` - Tickets
- `comments` - Ticket comments
- `tickethistories` - Ticket history logs

## Role-Based Access Control

### Admin
- Full access to all resources
- Can manage users, projects, and tickets
- Can delete any resource

### QA (Quality Assurance)
- Can create and manage projects
- Can create and manage tickets
- Cannot manage users

### Developer
- Can view projects and tickets
- Can update assigned tickets
- Can self-assign tickets
- Can add comments

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

Get the token by logging in via `/auth/login` endpoint.

## MongoDB Compass

To view your database using MongoDB Compass:

1. Open MongoDB Compass
2. Connection String: `mongodb://localhost:27017`
3. Database Name: `tickflo`

## Troubleshooting

### MongoDB Connection Error

If you see "MongoDB connection error":
- Ensure MongoDB is running: `mongod`
- Check if port 27017 is available
- Verify MONGODB_URI in .env file

### Port Already in Use

If port 5050 is already in use:
- Change PORT in .env file
- Update IMPLEMENTATION.md references

### Build Errors

If you encounter build errors:
```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

This project is licensed under the UNLICENSED license.

## Support

For issues and questions, please refer to the IMPLEMENTATION.md file for detailed specifications.
