# Problem 5: A Crude Server - CRUD API

A complete RESTful CRUD API built with Express.js, TypeScript, Prisma, and SQLite for managing tasks.

## 📁 Structure

```
problem5/
├── README.md                # This file
├── challenge/
│   └── CHALLENGE.md         # Original problem statement
├── docs/                    # Technical documentation
├── src/
│   ├── index.ts             # Server entry point
│   ├── config/
│   │   └── database.ts      # Prisma client setup
│   ├── controllers/
│   │   └── task.controller.ts    # Request handlers
│   ├── services/
│   │   └── task.service.ts       # Business logic
│   ├── validators/
│   │   └── task.validator.ts     # Zod schemas
│   ├── middleware/
│   │   └── errorHandler.ts       # Error handling
│   └── routes/
│       └── task.routes.ts        # API routes
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── dev.db              # SQLite database (generated)
├── package.json
└── tsconfig.json
```

## ✨ Features

- ✅ **Full CRUD Operations** - Create, Read, List, Update, Delete
- ✅ **TypeScript** - Full type safety throughout
- ✅ **Database Persistence** - SQLite with Prisma ORM
- ✅ **Request Validation** - Zod schemas for input validation
- ✅ **Error Handling** - Centralized error handling middleware
- ✅ **Filtering** - List tasks by status and search
- ✅ **Pagination** - Limit and offset support
- ✅ **RESTful Design** - Standard HTTP methods and status codes

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

```bash
# Navigate to problem5 directory
cd src/problem5

# Install dependencies
npm install

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

Server runs at `http://localhost:3000`

## 📡 API Endpoints

### Base URL
```
http://localhost:3000
```

### Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API information |
| GET | `/health` | Health check |
| POST | `/api/tasks` | Create a task |
| GET | `/api/tasks` | List tasks (with filters) |
| GET | `/api/tasks/:id` | Get a specific task |
| PUT | `/api/tasks/:id` | Update a task |
| DELETE | `/api/tasks/:id` | Delete a task |

---

## 📝 Detailed API Documentation

### 1. Create a Task

**POST** `/api/tasks`

Create a new task.

**Request Body:**
```json
{
  "title": "Complete project documentation",
  "description": "Write comprehensive README and API docs",
  "status": "pending"
}
```

**Fields:**
- `title` (string, required): Task title (1-200 characters)
- `description` (string, optional): Task description
- `status` (string, optional): One of `pending`, `in_progress`, `completed` (default: `pending`)

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Complete project documentation",
    "description": "Write comprehensive README and API docs",
    "status": "pending",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Example (curl):**
```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Complete project documentation",
    "description": "Write comprehensive README and API docs",
    "status": "pending"
  }'
```

---

### 2. List Tasks

**GET** `/api/tasks`

Retrieve a list of tasks with optional filtering and pagination.

**Query Parameters:**
- `status` (string, optional): Filter by status (`pending`, `in_progress`, `completed`)
- `search` (string, optional): Search in title and description
- `limit` (number, optional): Number of results to return (default: 10)
- `offset` (number, optional): Number of results to skip (default: 0)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Complete project documentation",
      "description": "Write comprehensive README and API docs",
      "status": "pending",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 10,
    "offset": 0,
    "hasMore": false
  }
}
```

**Examples:**

```bash
# Get all tasks
curl http://localhost:3000/api/tasks

# Filter by status
curl http://localhost:3000/api/tasks?status=pending

# Search tasks
curl http://localhost:3000/api/tasks?search=documentation

# Pagination
curl http://localhost:3000/api/tasks?limit=5&offset=10

# Combined filters
curl http://localhost:3000/api/tasks?status=in_progress&search=project&limit=5
```

---

### 3. Get a Task

**GET** `/api/tasks/:id`

Retrieve a specific task by ID.

**URL Parameters:**
- `id` (number, required): Task ID

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Complete project documentation",
    "description": "Write comprehensive README and API docs",
    "status": "pending",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "error": "Task not found"
}
```

**Example:**
```bash
curl http://localhost:3000/api/tasks/1
```

---

### 4. Update a Task

**PUT** `/api/tasks/:id`

Update an existing task.

**URL Parameters:**
- `id` (number, required): Task ID

**Request Body** (all fields optional):
```json
{
  "title": "Updated task title",
  "description": "Updated description",
  "status": "in_progress"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Updated task title",
    "description": "Updated description",
    "status": "in_progress",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

**Example:**
```bash
curl -X PUT http://localhost:3000/api/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed"
  }'
```

---

### 5. Delete a Task

**DELETE** `/api/tasks/:id`

Delete a task permanently.

**URL Parameters:**
- `id` (number, required): Task ID

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Task deleted successfully"
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "error": "Resource not found"
}
```

**Example:**
```bash
curl -X DELETE http://localhost:3000/api/tasks/1
```

---

## 🗄️ Database Schema

### Task Model

| Field       | Type     | Description                                   |
|-------------|----------|-----------------------------------------------|
| id          | Integer  | Auto-incrementing primary key                 |
| title       | String   | Task title (required)                         |
| description | String?  | Task description (optional)                   |
| status      | String   | Status: `pending`, `in_progress`, `completed` |
| createdAt   | DateTime | Auto-generated creation timestamp             |
| updatedAt   | DateTime | Auto-updated modification timestamp           |

## ⚠️ Error Handling

The API returns consistent error responses:

### Validation Error (400)
```json
{
  "success": false,
  "error": "Validation error",
  "details": [
    {
      "field": "title",
      "message": "Title is required"
    }
  ]
}
```

### Not Found (404)
```json
{
  "success": false,
  "error": "Task not found"
}
```

### Server Error (500)
```json
{
  "success": false,
  "error": "Internal server error"
}
```

## 🔧 Development

### Available Scripts

```bash
# Start development server (with hot reload)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run database migrations
npm run db:migrate

# Open Prisma Studio (database GUI)
npm run db:studio

# Seed database with sample data
npm run db:seed
```

### Database Commands

```bash
# Create a new migration
npx prisma migrate dev --name migration_name

# Reset database (⚠️  deletes all data)
npx prisma migrate reset

# View database in browser
npx prisma studio
```

## 🧪 Testing the API

### Using curl

```bash
# Create a task
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Test task", "status": "pending"}'

# List all tasks
curl http://localhost:3000/api/tasks

# Get task by ID
curl http://localhost:3000/api/tasks/1

# Update task
curl -X PUT http://localhost:3000/api/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"status": "completed"}'

# Delete task
curl -X DELETE http://localhost:3000/api/tasks/1
```

### Using REST Client (VSCode Extension)

Create a file `requests.http`:

```http
### Create Task
POST http://localhost:3000/api/tasks
Content-Type: application/json

{
  "title": "Sample Task",
  "description": "This is a test task",
  "status": "pending"
}

### List Tasks
GET http://localhost:3000/api/tasks?status=pending

### Get Task
GET http://localhost:3000/api/tasks/1

### Update Task
PUT http://localhost:3000/api/tasks/1
Content-Type: application/json

{
  "status": "completed"
}

### Delete Task
DELETE http://localhost:3000/api/tasks/1
```

## 🎯 Architecture Highlights

### Layered Architecture

1. **Routes** (`src/routes/`) - Define API endpoints
2. **Controllers** (`src/controllers/`) - Handle HTTP requests/responses
3. **Services** (`src/services/`) - Business logic and database operations
4. **Validators** (`src/validators/`) - Request validation with Zod
5. **Middleware** (`src/middleware/`) - Error handling and other cross-cutting concerns

### Type Safety

- **TypeScript** throughout the codebase
- **Prisma** for type-safe database queries
- **Zod** for runtime validation with inferred types

### Best Practices

- ✅ Separation of concerns
- ✅ Centralized error handling
- ✅ Input validation
- ✅ Consistent API responses
- ✅ RESTful conventions
- ✅ Clear code organization

## 📝 Notes

- Database file: `prisma/dev.db` (SQLite)
- Migrations: `prisma/migrations/`
- Environment: Development mode by default
- Port: 3000 (configurable via `PORT` environment variable)

## 🔄 Switching to PostgreSQL

To use PostgreSQL instead of SQLite:

1. Update `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

2. Create `.env` file:
```
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
```

3. Run migrations:
```bash
npm run db:migrate
```

## 🚀 Production Deployment

1. Build the project:
```bash
npm run build
```

2. Set environment variables:
```bash
export NODE_ENV=production
export PORT=3000
export DATABASE_URL="your_database_url"
```

3. Start the server:
```bash
npm start
```

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Zod Documentation](https://zod.dev/)

---

**Status**: ✅ Complete - Full CRUD API with TypeScript, Prisma, and comprehensive documentation
