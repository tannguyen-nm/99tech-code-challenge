# Architecture Design - CRUD Server (Problem 5)

## 1. System Overview

### 1.1 Purpose
A simple yet production-quality CRUD API server demonstrating backend development best practices with TypeScript, Express.js, and Prisma ORM.

### 1.2 Architecture Style
**Layered Architecture** (3-tier)

```
┌──────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                          │
│  (HTTP Clients: curl, Postman, Frontend Applications)    │
└───────────────────────┬──────────────────────────────────┘
                        │ HTTP/REST
┌───────────────────────▼──────────────────────────────────┐
│                 PRESENTATION LAYER                       │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Express.js Application (index.ts)                 │  │
│  ├────────────────────────────────────────────────────┤  │
│  │  Routes (task.routes.ts)                           │  │
│  │  • POST /api/tasks                                 │  │
│  │  • GET  /api/tasks                                 │  │
│  │  • GET  /api/tasks/:id                             │  │
│  │  • PUT  /api/tasks/:id                             │  │
│  │  • DELETE /api/tasks/:id                           │  │
│  ├────────────────────────────────────────────────────┤  │
│  │  Middleware                                        │  │
│  │  • express.json()                                  │  │
│  │  • express.urlencoded()                            │  │
│  │  • errorHandler (global)                           │  │
│  └────────────────────────────────────────────────────┘  │
└───────────────────────┬──────────────────────────────────┘
                        │
┌───────────────────────▼──────────────────────────────────┐
│                 APPLICATION LAYER                        │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Controllers (task.controller.ts)                  │  │
│  │  • Handle HTTP requests/responses                  │  │
│  │  • Delegate to services                            │  │
│  │  • Format responses                                │  │
│  ├────────────────────────────────────────────────────┤  │
│  │  Validators (task.validator.ts)                    │  │
│  │  • Zod schemas for input validation                │  │
│  │  • Runtime type checking                           │  │
│  │  • Type inference for TypeScript                   │  │
│  ├────────────────────────────────────────────────────┤  │
│  │  Services (task.service.ts)                        │  │
│  │  • Business logic                                  │  │
│  │  • Database operations via Prisma                  │  │
│  │  • Query building                                  │  │
│  └────────────────────────────────────────────────────┘  │
└───────────────────────┬──────────────────────────────────┘
                        │
┌───────────────────────▼──────────────────────────────────┐
│                   DATA ACCESS LAYER                      │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Prisma Client (database.ts)                       │  │
│  │  • Type-safe database queries                      │  │
│  │  • Auto-generated based on schema                  │  │
│  │  • Connection pooling                              │  │
│  └────────────────────────────────────────────────────┘  │
└───────────────────────┬──────────────────────────────────┘
                        │
┌───────────────────────▼──────────────────────────────────┐
│                   DATABASE LAYER                         │
│  ┌────────────────────────────────────────────────────┐  │
│  │  SQLite Database (prisma/dev.db)                   │  │
│  │  • File-based database                             │  │
│  │  • Single table: tasks                             │  │
│  │  • Auto-generated timestamps                       │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

---

## 2. Component Design

### 2.1 Entry Point (index.ts)

**Responsibility**: Application bootstrapping and server initialization

**Key Functions**:
- Initialize Express application
- Configure middleware
- Register routes
- Start HTTP server
- Handle graceful shutdown (missing - should be added)

**Dependencies**:
- express
- task.routes
- errorHandler middleware

**Configuration**:
- PORT: Environment variable or default 3000
- No other environment configuration (issue)

---

### 2.2 Routes Layer (task.routes.ts)

**Responsibility**: Define API endpoints and map to controllers

**Route Mappings**:
```typescript
router.post('/', controller.create)       // Create task
router.get('/', controller.list)          // List tasks
router.get('/:id', controller.getById)    // Get task by ID
router.put('/:id', controller.update)     // Update task
router.delete('/:id', controller.delete)  // Delete task
```

**Design Decisions**:
- ✅ RESTful URL structure
- ✅ Standard HTTP methods
- ✅ Clean URL paths (no redundant /task in path)
- ❌ No versioning (/api/v1/) - recommendation for future

---

### 2.3 Controller Layer (task.controller.ts)

**Responsibility**: Handle HTTP requests and responses

**Class**: `TaskController`

**Methods**:

#### create(req, res, next)
```typescript
// Flow:
1. Extract request body
2. Validate with createTaskSchema (Zod)
3. Call taskService.createTask()
4. Return 201 Created with task data
5. Error handling via next(error)
```

**Issues**:
- None (well-implemented)

#### list(req, res, next)
```typescript
// Flow:
1. Extract query parameters
2. Validate with listTasksQuerySchema (Zod)
3. Call taskService.listTasks()
4. Return 200 OK with tasks array + pagination
5. Error handling via next(error)
```

**Issues**:
- None (well-implemented)

#### getById(req, res, next)
```typescript
// Flow:
1. Parse ID from URL params
2. Validate ID is a number
3. Call taskService.getTaskById()
4. Return 200 OK if found, 404 if not found
5. Error handling via next(error)
```

**Issues**:
- Manual ID validation could be middleware

#### update(req, res, next)
```typescript
// Flow:
1. Parse ID from URL params
2. Validate ID is a number
3. Validate request body with updateTaskSchema
4. Call taskService.updateTask()
5. Return 200 OK with updated task
6. Error handling via next(error)
```

**Issues**:
- Duplicate ID validation logic (DRY violation)
- Should require at least one field in body

#### delete(req, res, next)
```typescript
// Flow:
1. Parse ID from URL params
2. Validate ID is a number
3. Call taskService.deleteTask()
4. Return 200 OK with success message
5. Error handling via next(error)
```

**Issues**:
- Duplicate ID validation logic

**Design Patterns Used**:
- ✅ Controller pattern
- ✅ Dependency injection (taskService instance)
- ✅ Error forwarding to middleware

**Recommendations**:
1. Extract ID validation to middleware
2. Add request logging
3. Add response timing headers

---

### 2.4 Service Layer (task.service.ts)

**Responsibility**: Business logic and database operations

**Class**: `TaskService`

**Methods**:

#### createTask(data: CreateTaskInput)
```typescript
return await prisma.task.create({ data });
```

**Issues**:
- None (simple pass-through to Prisma)

#### listTasks(query: ListTasksQuery)
```typescript
// Flow:
1. Build where clause from query
2. Execute parallel queries:
   - findMany with where/limit/offset/orderBy
   - count with where
3. Return { data, pagination }
```

**Issues**:
- ❌ Uses `any` type for where clause (line 20)
- Should use `Prisma.TaskWhereInput`

**Where Clause Building**:
```typescript
const where: any = {}; // ❌ Type safety lost

if (status) {
  where.status = status;
}

if (search) {
  where.OR = [
    { title: { contains: search } },
    { description: { contains: search } },
  ];
}
```

**Recommendation**:
```typescript
const where: Prisma.TaskWhereInput = {};

if (status) {
  where.status = status;
}

if (search) {
  where.OR = [
    { title: { contains: search, mode: 'insensitive' } },
    { description: { contains: search, mode: 'insensitive' } },
  ];
}
```

#### getTaskById(id: number)
```typescript
return await prisma.task.findUnique({ where: { id } });
```

**Issues**:
- None (simple Prisma query)

#### updateTask(id: number, data: UpdateTaskInput)
```typescript
return await prisma.task.update({ where: { id }, data });
```

**Issues**:
- Prisma will throw if task not found (handled by error middleware)

#### deleteTask(id: number)
```typescript
return await prisma.task.delete({ where: { id } });
```

**Issues**:
- Permanent deletion (no soft delete)
- Recommendation: Add soft delete option

**Design Patterns Used**:
- ✅ Service pattern
- ✅ Repository pattern (Prisma as repository)

---

### 2.5 Validator Layer (task.validator.ts)

**Responsibility**: Input validation with runtime type checking

**Technology**: Zod schemas

**Schemas**:

#### createTaskSchema
```typescript
z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed'])
          .optional()
          .default('pending'),
})
```

**Type Inference**:
```typescript
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
```

**Benefits**:
- ✅ Compile-time types
- ✅ Runtime validation
- ✅ Automatic error messages

#### updateTaskSchema
```typescript
z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed']).optional(),
})
```

**Issues**:
- ⚠️ Allows empty body (all fields optional)
- Should require at least one field

**Recommendation**:
```typescript
export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed']).optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided' }
);
```

#### listTasksQuerySchema
```typescript
z.object({
  status: z.enum(['pending', 'in_progress', 'completed']).optional(),
  search: z.string().optional(),
  limit: z.string().optional().transform(val => parseInt(val, 10)),
  offset: z.string().optional().transform(val => parseInt(val, 10)),
})
```

**Issues**:
- Transform returns `undefined` if no value (should default to 10 for limit, 0 for offset)

**Recommendation**:
```typescript
limit: z.string()
  .optional()
  .transform(val => val ? parseInt(val, 10) : 10)
  .refine(val => val > 0 && val <= 100, {
    message: 'Limit must be between 1 and 100'
  }),
offset: z.string()
  .optional()
  .transform(val => val ? parseInt(val, 10) : 0)
  .refine(val => val >= 0, {
    message: 'Offset must be non-negative'
  }),
```

---

### 2.6 Middleware Layer (errorHandler.ts)

**Responsibility**: Centralized error handling

**Function**: `errorHandler(error, req, res, next)`

**Error Types Handled**:

#### 1. Zod Validation Errors
```typescript
if (error instanceof ZodError) {
  return res.status(400).json({
    success: false,
    error: 'Validation error',
    details: error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
    })),
  });
}
```

**Response Example**:
```json
{
  "success": false,
  "error": "Validation error",
  "details": [
    { "field": "title", "message": "Title is required" }
  ]
}
```

#### 2. Prisma Errors

**P2025 - Record Not Found**:
```typescript
if (error.code === 'P2025') {
  return res.status(404).json({
    success: false,
    error: 'Resource not found',
  });
}
```

**P2002 - Unique Constraint Violation**:
```typescript
if (error.code === 'P2002') {
  return res.status(409).json({
    success: false,
    error: 'Resource already exists',
  });
}
```

#### 3. Generic Errors
```typescript
res.status(500).json({
  success: false,
  error: 'Internal server error',
  message: process.env.NODE_ENV === 'development' ? error.message : undefined,
});
```

**Issues**:
- Only console.error logging (no structured logs)
- No request ID for tracing
- No error code enums

**Recommendations**:
1. Add structured logging (Winston/Pino)
2. Add request ID tracking
3. Add error code enums
4. Add Sentry/error monitoring

---

### 2.7 Database Layer (Prisma)

**Configuration**: `prisma/schema.prisma`

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

model Task {
  id          Int      @id @default(autoincrement())
  title       String
  description String?
  status      String   @default("pending")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("tasks")
}
```

**Issues**:

1. **Status is String, not Enum**
   ```prisma
   // Current (wrong)
   status String @default("pending")

   // Should be
   enum TaskStatus {
     PENDING
     IN_PROGRESS
     COMPLETED
   }

   model Task {
     status TaskStatus @default(PENDING)
   }
   ```

2. **No Database Constraints**
   - Title length not enforced at DB level
   - Status values not constrained

**Recommendations**:
1. Add enum type for status
2. Add CHECK constraint for title length
3. Add indexes for frequently queried fields:
   ```prisma
   @@index([status])
   @@index([createdAt])
   ```

---

## 3. Data Flow

### 3.1 Create Task Flow

```
1. Client → POST /api/tasks with JSON body
2. Express → Parse JSON body
3. Routes → Route to TaskController.create()
4. Controller → Validate with createTaskSchema (Zod)
5. Controller → Call taskService.createTask(data)
6. Service → prisma.task.create({ data })
7. Prisma → INSERT INTO tasks VALUES (...)
8. Database → Return inserted row with ID
9. Prisma → Return Task object
10. Service → Return Task object
11. Controller → Format response { success: true, data: task }
12. Express → Send 201 Created with JSON response
```

**Error Path**:
```
If validation fails at step 4:
  → Throw ZodError
  → Caught by next(error)
  → errorHandler middleware
  → Return 400 Bad Request

If database error at step 7:
  → Throw PrismaClientKnownRequestError
  → Caught by next(error)
  → errorHandler middleware
  → Return appropriate status code
```

---

### 3.2 List Tasks Flow

```
1. Client → GET /api/tasks?status=pending&limit=10
2. Express → Parse query parameters
3. Routes → Route to TaskController.list()
4. Controller → Validate with listTasksQuerySchema (Zod)
5. Controller → Call taskService.listTasks(query)
6. Service → Build where clause from query
7. Service → Execute Promise.all([
     prisma.task.findMany({ where, take, skip, orderBy }),
     prisma.task.count({ where })
   ])
8. Prisma → SELECT * FROM tasks WHERE ... LIMIT ... OFFSET ...
9. Prisma → SELECT COUNT(*) FROM tasks WHERE ...
10. Database → Return rows and count
11. Service → Format { data: tasks, pagination: {...} }
12. Controller → Return formatted response
13. Express → Send 200 OK with JSON response
```

---

### 3.3 Update Task Flow

```
1. Client → PUT /api/tasks/1 with JSON body
2. Express → Parse URL params and JSON body
3. Routes → Route to TaskController.update()
4. Controller → Parse and validate ID
5. Controller → Validate body with updateTaskSchema (Zod)
6. Controller → Call taskService.updateTask(id, data)
7. Service → prisma.task.update({ where: { id }, data })
8. Prisma → UPDATE tasks SET ... WHERE id = ?
9. Database → Return updated row (or error if not found)
10. Prisma → Return Task object
11. Service → Return Task object
12. Controller → Format response
13. Express → Send 200 OK with JSON response
```

**Special Case - Task Not Found**:
```
At step 8:
  → Database returns 0 rows updated
  → Prisma throws P2025 error
  → errorHandler middleware
  → Return 404 Not Found
```

---

## 4. Security Analysis

### 4.1 Current Security Posture

**Authentication**: ❌ None
- All endpoints are public
- No user accounts
- No API keys

**Authorization**: ❌ None
- Anyone can modify/delete any task
- No ownership model

**Input Validation**: ✅ Good
- Zod schemas validate all inputs
- Type safety with TypeScript
- Parameterized queries (Prisma prevents SQL injection)

**Data Sanitization**: ⚠️ Partial
- No HTML sanitization
- No XSS protection for stored content
- Description field accepts any string

**Rate Limiting**: ❌ None
- No protection against abuse
- Can be DoS'd easily

**CORS**: ❌ Not configured
- Defaults to Express default (same-origin)
- Should configure explicitly

**Security Headers**: ❌ None
- No helmet.js middleware
- Missing CSP, HSTS, etc.

### 4.2 Threat Model

| Threat | Likelihood | Impact | Mitigation |
|--------|-----------|--------|------------|
| SQL Injection | Low | Critical | ✅ Prisma uses parameterized queries |
| XSS (Stored) | Medium | Medium | ❌ No input sanitization |
| CSRF | Low | Low | ❌ No CSRF tokens (API only) |
| DoS | High | High | ❌ No rate limiting |
| Unauthorized Access | High | High | ❌ No authentication |
| Data Breach | High | High | ❌ No access control |

### 4.3 Recommendations

1. **Add Authentication** (if required)
   - JWT tokens
   - API keys
   - User model with passwords (bcrypt)

2. **Add Rate Limiting**
   ```typescript
   import rateLimit from 'express-rate-limit';

   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100, // Limit each IP to 100 requests per windowMs
   });

   app.use('/api/', limiter);
   ```

3. **Add Security Headers**
   ```typescript
   import helmet from 'helmet';
   app.use(helmet());
   ```

4. **Add Input Sanitization**
   ```typescript
   import sanitizeHtml from 'sanitize-html';

   // In validator or service
   description: z.string().transform(val =>
     sanitizeHtml(val, { allowedTags: [] })
   ),
   ```

5. **Add CORS Configuration**
   ```typescript
   import cors from 'cors';
   app.use(cors({
     origin: process.env.ALLOWED_ORIGINS?.split(','),
     credentials: true,
   }));
   ```

---

## 5. Performance Considerations

### 5.1 Current Performance

**Database**:
- ✅ SQLite is fast for small datasets (< 100k rows)
- ❌ No indexes on status/createdAt fields
- ❌ No connection pooling (not needed for SQLite)

**Query Optimization**:
- ✅ Pagination implemented (limit/offset)
- ✅ Parallel queries in listTasks (findMany + count)
- ❌ No caching

**Memory Usage**:
- ✅ Streaming not needed (small result sets)
- ✅ No memory leaks (Prisma handles cleanup)

### 5.2 Bottlenecks

1. **Full Table Scan**
   - List tasks without filters scans entire table
   - Recommendation: Add indexes

2. **String Search**
   - `contains` search is slow on large datasets
   - Recommendation: Use full-text search or add search index

3. **Offset Pagination**
   - Inefficient for large offsets
   - Recommendation: Use cursor-based pagination

### 5.3 Optimization Recommendations

1. **Add Database Indexes**
   ```prisma
   model Task {
     // ...
     @@index([status])
     @@index([createdAt])
     @@index([title, description]) // For search
   }
   ```

2. **Add Caching** (if needed)
   ```typescript
   import NodeCache from 'node-cache';
   const cache = new NodeCache({ stdTTL: 60 });

   // In service
   const cacheKey = `tasks:${JSON.stringify(query)}`;
   const cached = cache.get(cacheKey);
   if (cached) return cached;

   const result = await prisma.task.findMany(...);
   cache.set(cacheKey, result);
   return result;
   ```

3. **Switch to Cursor Pagination**
   ```typescript
   // Instead of offset
   cursor: query.cursor ? { id: query.cursor } : undefined,
   take: query.limit,
   ```

---

## 6. Scalability Analysis

### 6.1 Current Scalability

**Vertical Scaling**: ✅ Good
- Stateless application
- Can increase server resources

**Horizontal Scaling**: ⚠️ Limited
- SQLite is file-based (single server only)
- No shared session state (not applicable yet)

**Database Scaling**: ❌ Limited
- SQLite not suitable for high concurrency
- Recommendation: Switch to PostgreSQL for production

### 6.2 Migration to PostgreSQL

**schema.prisma Changes**:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum TaskStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
}

model Task {
  id          Int        @id @default(autoincrement())
  title       String     @db.VarChar(200)
  description String?    @db.Text
  status      TaskStatus @default(PENDING)
  createdAt   DateTime   @default(now()) @db.Timestamp(6)
  updatedAt   DateTime   @updatedAt @db.Timestamp(6)

  @@map("tasks")
  @@index([status])
  @@index([createdAt])
}
```

**Benefits**:
- Multi-user concurrency
- Better performance at scale
- Full-text search support
- Better backup/replication

---

## 7. Testing Strategy

### 7.1 Unit Tests (Missing)

**Should Test**:
- Service methods (mock Prisma)
- Validator schemas
- Error handler middleware

**Example**:
```typescript
// task.service.test.ts
describe('TaskService', () => {
  describe('createTask', () => {
    it('should create a task with valid data', async () => {
      const mockData = { title: 'Test', status: 'pending' };
      const mockResult = { id: 1, ...mockData, createdAt: new Date(), updatedAt: new Date() };

      prismaMock.task.create.mockResolvedValue(mockResult);

      const result = await taskService.createTask(mockData);
      expect(result).toEqual(mockResult);
    });
  });
});
```

### 7.2 Integration Tests (Missing)

**Should Test**:
- Full API endpoints (end-to-end)
- Database operations
- Error responses

**Example**:
```typescript
// task.integration.test.ts
describe('POST /api/tasks', () => {
  it('should create a task and return 201', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .send({ title: 'Test Task', status: 'pending' });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id');
  });
});
```

---

## 8. Deployment Architecture

### 8.1 Development Environment

```
Local Machine
├── Node.js v20+
├── npm
├── SQLite database (file-based)
└── tsx (hot reload)
```

### 8.2 Production Environment (Recommended)

```
┌─────────────────────────────────────────┐
│         Load Balancer (NGINX)           │
└────────────────────┬────────────────────┘
                     │
       ┌─────────────┴─────────────┐
       │                           │
┌──────▼────────┐         ┌────────▼──────┐
│  App Server 1 │         │  App Server 2 │
│  (Node.js)    │         │  (Node.js)    │
└──────┬────────┘         └───────┬───────┘
       │                          │
       └─────────────┬────────────┘
                     │
           ┌─────────▼─────────┐
           │  PostgreSQL DB    │
           │  (Primary)        │
           └───────────────────┘
```

---
