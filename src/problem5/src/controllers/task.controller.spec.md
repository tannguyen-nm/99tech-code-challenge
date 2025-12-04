# Task Controller Specification

**Module**: `src/controllers/task.controller.ts`
**Type**: Controller Layer
**Responsibility**: Handle HTTP requests and responses for task operations

---

## Overview

The `TaskController` class manages all HTTP endpoints related to task CRUD operations. It acts as the presentation layer, receiving HTTP requests, delegating to the service layer, and formatting responses.

---

## Class: TaskController

### Methods

#### 1. create(req, res, next)

**Purpose**: Handle POST /api/tasks - Create a new task

**Input**:
- `req.body`: JSON object with task data
  - `title` (string, required): Task title (1-200 chars)
  - `description` (string, optional): Task description
  - `status` (enum, optional): pending | in_progress | completed (default: pending)

**Process**:
1. Extract request body
2. Validate with `createTaskSchema` (Zod)
3. Call `taskService.createTask(validatedData)`
4. Return 201 Created with task object
5. Pass errors to error handler middleware

**Output**:
- **Success (201 Created)**:
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "title": "Task title",
      "description": "Task description",
      "status": "pending",
      "createdAt": "2025-12-01T10:00:00.000Z",
      "updatedAt": "2025-12-01T10:00:00.000Z"
    }
  }
  ```

- **Validation Error (400)**:
  ```json
  {
    "success": false,
    "error": "Validation error",
    "details": [
      { "field": "title", "message": "Title is required" }
    ]
  }
  ```

**Error Handling**:
- Zod validation errors → 400 Bad Request (via errorHandler)
- Database errors → 500 Internal Server Error (via errorHandler)

---

#### 2. list(req, res, next)

**Purpose**: Handle GET /api/tasks - List tasks with optional filters

**Input**:
- `req.query`: Query parameters
  - `status` (enum, optional): Filter by status
  - `search` (string, optional): Search in title/description
  - `limit` (number, optional): Results per page (default: 10, max: 100)
  - `offset` (number, optional): Skip N results (default: 0)

**Process**:
1. Extract query parameters
2. Validate with `listTasksQuerySchema` (Zod)
3. Call `taskService.listTasks(validatedQuery)`
4. Return 200 OK with tasks array and pagination metadata

**Output**:
- **Success (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "title": "Task 1",
        "description": "Description",
        "status": "pending",
        "createdAt": "2025-12-01T10:00:00.000Z",
        "updatedAt": "2025-12-01T10:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 50,
      "limit": 10,
      "offset": 0,
      "hasMore": true
    }
  }
  ```

**Filtering Logic**:
- `status`: Exact match
- `search`: Substring match in title OR description (case-sensitive)
- Sorting: `createdAt DESC` (newest first)

---

#### 3. getById(req, res, next)

**Purpose**: Handle GET /api/tasks/:id - Get a single task by ID

**Input**:
- `req.params.id`: Task ID (string, must parse to positive integer)

**Process**:
1. Parse ID from params
2. Validate ID is a number and positive
3. Call `taskService.getTaskById(id)`
4. Return 200 OK if found, 404 if not found

**Output**:
- **Success (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "title": "Task title",
      "description": "Task description",
      "status": "pending",
      "createdAt": "2025-12-01T10:00:00.000Z",
      "updatedAt": "2025-12-01T10:00:00.000Z"
    }
  }
  ```

- **Not Found (404)**:
  ```json
  {
    "success": false,
    "error": "Task not found"
  }
  ```

- **Invalid ID (400)**:
  ```json
  {
    "success": false,
    "error": "Invalid task ID"
  }
  ```

**Implementation Status**: ✅ Implemented

**Issues**:
- ⚠️ Duplicate ID validation logic (should use middleware)

---

#### 4. update(req, res, next)

**Purpose**: Handle PUT /api/tasks/:id - Update a task

**Input**:
- `req.params.id`: Task ID
- `req.body`: JSON object with fields to update (all optional, but at least one required)
  - `title` (string, optional): New title (1-200 chars)
  - `description` (string, optional): New description
  - `status` (enum, optional): New status

**Process**:
1. Parse ID from params
2. Validate ID is a number and positive
3. Validate request body with `updateTaskSchema` (Zod)
4. Call `taskService.updateTask(id, validatedData)`
5. Return 200 OK with updated task

**Output**:
- **Success (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "title": "Updated title",
      "description": "Updated description",
      "status": "in_progress",
      "createdAt": "2025-12-01T10:00:00.000Z",
      "updatedAt": "2025-12-01T10:30:00.000Z"
    }
  }
  ```

- **Empty Body (400)**:
  ```json
  {
    "success": false,
    "error": "Validation error",
    "details": [
      {
        "field": "_root",
        "message": "At least one field must be provided for update"
      }
    ]
  }
  ```

- **Not Found (404)**:
  ```json
  {
    "success": false,
    "error": "Resource not found"
  }
  ```

**Implementation Status**: ✅ Implemented

**Issues**:
- ⚠️ Duplicate ID validation logic (should use middleware)

---

#### 5. delete(req, res, next)

**Purpose**: Handle DELETE /api/tasks/:id - Delete a task

**Input**:
- `req.params.id`: Task ID

**Process**:
1. Parse ID from params
2. Validate ID is a number and positive
3. Call `taskService.deleteTask(id)`
4. Return 200 OK with success message

**Output**:
- **Success (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Task deleted successfully"
  }
  ```

- **Not Found (404)**:
  ```json
  {
    "success": false,
    "error": "Resource not found"
  }
  ```

**Implementation Status**: ✅ Implemented

**Issues**:
- ⚠️ Duplicate ID validation logic (should use middleware)
- ⚠️ Permanent deletion (no soft delete)

---

## Dependencies

**Internal**:
- `TaskService` - Business logic and database operations
- `createTaskSchema` - Validation schema for task creation
- `updateTaskSchema` - Validation schema for task updates
- `listTasksQuerySchema` - Validation schema for query parameters

**External**:
- `express` - HTTP framework (Request, Response, NextFunction types)

---

## Error Handling Strategy

All methods use try-catch with `next(error)` to forward errors to the global error handler middleware. This ensures:
- Consistent error response format
- Centralized logging
- Proper HTTP status codes

**Error Flow**:
```
Controller → try/catch → next(error) → errorHandler middleware → Client
```

---

## Design Patterns

1. **Controller Pattern**: Separates HTTP handling from business logic
2. **Dependency Injection**: TaskService instance injected (currently as singleton)
3. **Middleware Chain**: Leverages Express middleware for error handling

---

## Improvements Needed

### High Priority

1. **Extract ID Validation to Middleware**
   - Current: Duplicate validation in 3 methods (getById, update, delete)
   - Solution: Create `validateTaskId` middleware
   - Benefit: DRY principle, consistent validation

2. **Add Request Logging**
   - Log incoming requests with method, path, params
   - Include request ID for tracing

### Medium Priority

3. **Add Response Timing**
   - Add X-Response-Time header
   - Help identify performance bottlenecks

4. **Type Safety for Parsed ID**
   - Currently uses `req.params.id` (string)
   - After middleware: use typed property for parsed integer

### Low Priority

5. **Add API Versioning**
   - Prepare for future API changes
   - Example: `/api/v1/tasks`

---

## Testing Requirements

### Unit Tests Required

1. **create() method**
   - ✅ Valid data → 201 Created
   - ✅ Missing title → 400 Validation Error
   - ✅ Invalid status → 400 Validation Error
   - ✅ Title too long → 400 Validation Error

2. **list() method**
   - ✅ No filters → Returns all tasks
   - ✅ Status filter → Returns filtered tasks
   - ✅ Search filter → Returns matching tasks
   - ✅ Pagination → Returns correct subset
   - ✅ Invalid limit → 400 Validation Error

3. **getById() method**
   - ✅ Valid ID, task exists → 200 OK
   - ✅ Valid ID, task not found → 404 Not Found
   - ✅ Invalid ID (not a number) → 400 Bad Request
   - ✅ Invalid ID (negative) → 400 Bad Request

4. **update() method**
   - ✅ Valid update → 200 OK
   - ✅ Empty body → 400 Validation Error
   - ✅ Task not found → 404 Not Found
   - ✅ Invalid ID → 400 Bad Request

5. **delete() method**
   - ✅ Valid ID, task exists → 200 OK
   - ✅ Task not found → 404 Not Found
   - ✅ Invalid ID → 400 Bad Request

**Target Coverage**: 100% (all branches)

---

## API Contract

All methods follow this response structure:

**Success Response**:
```typescript
{
  success: true,
  data?: T,              // Optional data payload
  pagination?: {         // Optional pagination (list only)
    total: number,
    limit: number,
    offset: number,
    hasMore: boolean
  }
}
```

**Error Response**:
```typescript
{
  success: false,
  error: string,         // Error message
  details?: Array<{      // Optional validation details
    field: string,
    message: string
  }>
}
```

---

## Security Considerations

1. **Input Validation**: ✅ All inputs validated with Zod schemas
2. **SQL Injection**: ✅ Protected by Prisma (parameterized queries)
3. **XSS**: ⚠️ No sanitization (descriptions could contain HTML)
4. **Authentication**: ❌ No authentication (all endpoints public)
5. **Authorization**: ❌ No authorization (anyone can modify/delete)

**Recommendation**: Add authentication middleware before production deployment

---

## Performance Considerations

1. **Validation**: Zod validation is synchronous and fast (<1ms)
2. **Database Queries**: Delegated to service layer (properly indexed)
3. **Response Size**: List endpoint supports pagination to limit payload

**Bottlenecks**: None identified at controller layer

---

**Document Version**: 1.0
**Last Updated**: 2025-12-01
**Status**: Complete - Ready for Implementation Review
