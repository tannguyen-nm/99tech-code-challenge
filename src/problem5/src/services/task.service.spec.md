# Task Service Specification

**Module**: `src/services/task.service.ts`
**Type**: Service Layer
**Responsibility**: Business logic and database operations for tasks

---

## Overview

The `TaskService` class encapsulates all business logic and database operations related to tasks. It acts as an intermediary between the controller layer and the data access layer (Prisma).

---

## Class: TaskService

### Methods

#### 1. createTask(data: CreateTaskInput)

**Purpose**: Create a new task in the database

**Input**:
- `data`: CreateTaskInput
  - `title` (string): Task title (validated: 1-200 chars)
  - `description` (string, optional): Task description
  - `status` (TaskStatus, optional): Task status (default: pending)

**Process**:
1. Receive validated data from controller
2. Call `prisma.task.create({ data })`
3. Return created task object with generated ID and timestamps

**Output**:
```typescript
Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
}
```

**Business Rules**:
- Title is required and cannot be empty
- Status defaults to 'pending' if not provided
- Timestamps (createdAt, updatedAt) are auto-generated

**Database Operations**:
- Single INSERT operation
- Auto-increment ID generation

**Error Handling**:
- Prisma errors bubble up to error handler middleware
- No custom error handling needed (creation always succeeds with valid data)

**Implementation Status**: ✅ Implemented

**Test Coverage**: ✅ Complete (see task.service.test.ts)

---

#### 2. listTasks(query: ListTasksQuery)

**Purpose**: Retrieve a list of tasks with optional filtering, searching, and pagination

**Input**:
- `query`: ListTasksQuery
  - `status` (TaskStatus, optional): Filter by status
  - `search` (string, optional): Search term for title/description
  - `limit` (number): Results per page (validated: 1-100, default: 10)
  - `offset` (number): Skip N results (validated: >= 0, default: 0)

**Process**:
1. Build Prisma where clause based on filters
   - Status filter: Exact match
   - Search: Substring match in title OR description
2. Execute parallel queries:
   - `findMany`: Fetch tasks with where, limit, offset, orderBy
   - `count`: Get total count with same where clause
3. Return tasks array and pagination metadata

**Output**:
```typescript
{
  data: Task[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}
```

**Business Rules**:
- Default sorting: `createdAt DESC` (newest first)
- Search is case-sensitive (SQLite limitation)
- Pagination uses offset-based strategy

**Database Operations**:
- Two queries executed in parallel (Promise.all)
- SELECT with WHERE, ORDER BY, LIMIT, OFFSET
- COUNT with same WHERE clause

**Where Clause Building**:
```typescript
const where: Prisma.TaskWhereInput = {};

// Status filter
if (status) {
  where.status = status;
}

// Search filter (OR condition)
if (search) {
  where.OR = [
    { title: { contains: search } },
    { description: { contains: search } },
  ];
}
```

**Performance Considerations**:
- Database indexes on `status` and `createdAt` improve query speed
- Parallel execution reduces total query time
- Offset pagination can be slow for large offsets (future: use cursor-based)

**Implementation Status**: ✅ Implemented

**Improvements**:
- ✅ Fixed: Now uses `Prisma.TaskWhereInput` instead of `any`
- ⚠️ Consider: Add cursor-based pagination for better performance

**Test Coverage**: ✅ Complete (see task.service.test.ts)

---

#### 3. getTaskById(id: number)

**Purpose**: Retrieve a single task by its ID

**Input**:
- `id` (number): Task ID (validated as positive integer in controller)

**Process**:
1. Call `prisma.task.findUnique({ where: { id } })`
2. Return task object or null if not found

**Output**:
```typescript
Task | null
```

**Business Rules**:
- Returns null if task doesn't exist (not an error)
- Controller layer handles 404 response

**Database Operations**:
- Single SELECT by primary key (fastest query)
- Uses unique index on `id`

**Error Handling**:
- No errors expected (query always succeeds)
- Null return value indicates "not found"

**Implementation Status**: ✅ Implemented

**Test Coverage**: ✅ Complete (see task.service.test.ts)

---

#### 4. updateTask(id: number, data: UpdateTaskInput)

**Purpose**: Update an existing task

**Input**:
- `id` (number): Task ID
- `data`: UpdateTaskInput (all fields optional, but at least one required)
  - `title` (string, optional): New title
  - `description` (string, optional): New description
  - `status` (TaskStatus, optional): New status

**Process**:
1. Receive validated data from controller
2. Call `prisma.task.update({ where: { id }, data })`
3. Return updated task object

**Output**:
```typescript
Task
```

**Business Rules**:
- At least one field must be provided (validated in controller)
- Only provided fields are updated
- `updatedAt` timestamp is auto-updated
- Throws error if task doesn't exist

**Database Operations**:
- Single UPDATE operation
- Uses primary key for WHERE clause

**Error Handling**:
- Prisma throws P2025 error if task not found
- Error handler middleware converts to 404 response

**Implementation Status**: ✅ Implemented

**Test Coverage**: ✅ Complete (see task.service.test.ts)

---

#### 5. deleteTask(id: number)

**Purpose**: Permanently delete a task

**Input**:
- `id` (number): Task ID

**Process**:
1. Call `prisma.task.delete({ where: { id } })`
2. Return deleted task object

**Output**:
```typescript
Task
```

**Business Rules**:
- Permanent deletion (no soft delete)
- Throws error if task doesn't exist
- Cannot be undone

**Database Operations**:
- Single DELETE operation
- Uses primary key for WHERE clause

**Error Handling**:
- Prisma throws P2025 error if task not found
- Error handler middleware converts to 404 response

**Implementation Status**: ✅ Implemented

**Improvements Needed**:
- ⚠️ Consider: Add soft delete option (add `deletedAt` field)
- ⚠️ Consider: Add confirmation requirement for delete operations

**Test Coverage**: ✅ Complete (see task.service.test.ts)

---

## Dependencies

**Internal**:
- `prisma` - Prisma Client instance from `config/database.ts`
- `CreateTaskInput` - Type from task.validator
- `UpdateTaskInput` - Type from task.validator
- `ListTasksQuery` - Type from task.validator

**External**:
- `@prisma/client` - Prisma types (Task, Prisma namespace)

---

## Database Schema

```prisma
enum TaskStatus {
  pending
  in_progress
  completed
}

model Task {
  id          Int        @id @default(autoincrement())
  title       String
  description String?
  status      TaskStatus @default(pending)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  @@map("tasks")
  @@index([status])
  @@index([createdAt])
}
```

**Indexes**:
- Primary key: `id` (auto-generated unique index)
- Secondary: `status` (for filtering)
- Secondary: `createdAt` (for sorting)

---

## Business Logic

### Validation Layer Separation

**Important**: This service layer does NOT perform validation. All validation is done in the validator layer (Zod schemas) before reaching the service.

**Rationale**:
- Clear separation of concerns
- Service methods assume valid input
- Validation logic is centralized and reusable

### Transaction Strategy

**Current**: No explicit transactions needed
- All operations are single-statement
- Prisma handles atomic operations

**Future**: If multi-table operations are added:
```typescript
async function complexOperation() {
  return await prisma.$transaction(async (tx) => {
    // Multiple operations here
  });
}
```

---

## Error Handling

### Prisma Error Codes

| Code  | Description                      | HTTP Status     |
|-------|----------------------------------|-----------------|
| P2025 | Record not found                 | 404 Not Found   |
| P2002 | Unique constraint violation      | 409 Conflict    |
| P2003 | Foreign key constraint violation | 400 Bad Request |

All Prisma errors are caught by the error handler middleware and converted to appropriate HTTP responses.

---

## Performance Optimization

### Current Optimizations

1. **Parallel Queries**: `listTasks` uses `Promise.all` for findMany + count
2. **Database Indexes**: Status and createdAt indexes improve query performance
3. **Selective Fields**: Currently returns all fields (future: add field selection)

### Future Optimizations

1. **Caching Layer**:
   ```typescript
   async listTasks(query: ListTasksQuery) {
     const cacheKey = `tasks:${JSON.stringify(query)}`;
     const cached = await cache.get(cacheKey);
     if (cached) return cached;

     const result = await /* database query */;
     await cache.set(cacheKey, result, 60); // 60 second TTL
     return result;
   }
   ```

2. **Cursor-Based Pagination**:
   ```typescript
   cursor: query.cursor ? { id: query.cursor } : undefined,
   take: query.limit + 1, // Fetch one extra to detect hasMore
   ```

3. **Field Selection**:
   ```typescript
   select: {
     id: true,
     title: true,
     status: true,
     // Exclude description if not needed
   }
   ```

---

## Testing Requirements

### Unit Tests Required

1. **createTask()**
   - ✅ Valid data → Returns task with ID
   - ✅ Default status → Uses 'pending'
   - ✅ Optional description → Handles null

2. **listTasks()**
   - ✅ No filters → Returns all tasks
   - ✅ Status filter → Returns only matching status
   - ✅ Search in title → Returns matching tasks
   - ✅ Search in description → Returns matching tasks
   - ✅ Pagination → Returns correct subset
   - ✅ hasMore flag → Correctly indicates more results
   - ✅ Empty result → Returns empty array

3. **getTaskById()**
   - ✅ Existing task → Returns task object
   - ✅ Non-existent task → Returns null

4. **updateTask()**
   - ✅ Update title → Returns updated task
   - ✅ Update status → Returns updated task
   - ✅ Update multiple fields → All fields updated
   - ✅ Non-existent task → Throws error

5. **deleteTask()**
   - ✅ Existing task → Returns deleted task
   - ✅ Non-existent task → Throws error

**Mocking Strategy**:
```typescript
import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset } from 'jest-mock-extended';

export const prismaMock = mockDeep<PrismaClient>();

beforeEach(() => {
  mockReset(prismaMock);
});
```

**Target Coverage**: 100% (all methods and branches)

---

## Design Patterns

1. **Service Pattern**: Encapsulates business logic
2. **Repository Pattern**: Prisma acts as repository (no custom repository needed)
3. **Data Mapper**: Prisma maps database rows to TypeScript objects

---

## Type Safety

### Before Fix
```typescript
const where: any = {};  // ❌ Lost type safety
```

### After Fix
```typescript
const where: Prisma.TaskWhereInput = {};  // ✅ Type-safe
```

**Benefits**:
- Compile-time type checking
- IntelliSense autocomplete
- Prevents invalid where clause properties

---

## Security Considerations

1. **SQL Injection**: ✅ Protected (Prisma uses parameterized queries)
2. **Data Sanitization**: ⚠️ No sanitization (accepts any string)
3. **Authorization**: ❌ No authorization checks (service trusts controller)

**Recommendation**: Add data sanitization if storing user-generated content

---

## Scalability Considerations

### Current Scale
- **Small datasets** (< 10,000 tasks): Excellent performance
- **Medium datasets** (10,000 - 100,000 tasks): Good performance with indexes
- **Large datasets** (> 100,000 tasks): Consider cursor-based pagination

### Migration to PostgreSQL

When scaling beyond SQLite limitations:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**Benefits**:
- Better concurrency handling
- Full-text search support
- Advanced indexing options
- Better performance at scale

---

## Code Quality Metrics

| Metric                | Value    | Status       |
|-----------------------|----------|--------------|
| Lines of Code         | 83       | ✅ Concise   |
| Cyclomatic Complexity | Low      | ✅ Simple    |
| Type Safety           | 100%     | ✅ Excellent |
| Test Coverage         | 100%     | ✅ Complete  |
| Documentation         | Complete | ✅ Good      |

**Test File**: `src/services/task.service.test.ts`
**Test Statistics**:
- Total Tests: 18 unit tests for this service
- Coverage: 100% statements, 100% branches, 100% functions, 100% lines
- Mocking: Uses `jest-mock-extended` for Prisma client mocking

---
