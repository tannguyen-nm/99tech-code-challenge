# Error Handler Middleware Specification

**Module**: `src/middleware/errorHandler.ts`
**Type**: Express Middleware
**Responsibility**: Centralized error handling and HTTP response formatting

---

## Overview

The `errorHandler` middleware catches all errors thrown in the application and converts them into consistent, client-friendly HTTP responses. It handles different error types (Zod validation errors, Prisma errors, generic errors) and formats them appropriately.

---

## Function: errorHandler

**Signature**:
```typescript
function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void
```

**Purpose**: Express error handling middleware (4 parameters)

**Registration**: Must be registered LAST in the middleware chain
```typescript
app.use(errorHandler);  // After all routes
```

---

## Error Types Handled

### 1. Zod Validation Errors

**Detection**: `error instanceof ZodError`

**Response**:
- **Status Code**: 400 Bad Request
- **Body**:
  ```json
  {
    "success": false,
    "error": "Validation error",
    "details": [
      {
        "field": "title",
        "message": "Title is required"
      },
      {
        "field": "limit",
        "message": "Limit must be between 1 and 100"
      }
    ]
  }
  ```

**Details Mapping**:
```typescript
error.errors.map((err) => ({
  field: err.path.join('.'),  // Array path joined with dots
  message: err.message,
}))
```

**Example Scenarios**:
- Missing required field
- Invalid data type
- Failed validation constraints
- Failed custom refinements

**Implementation**:
```typescript
if (error instanceof ZodError) {
  return res.status(400).json({
    success: false,
    error: 'Validation error',
    details: error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    })),
  });
}
```

**Implementation Status**: ✅ Implemented

---

### 2. Prisma Known Request Errors

**Detection**: `error instanceof Prisma.PrismaClientKnownRequestError`

**Error Codes Handled**:

#### P2025 - Record Not Found

**Scenario**: Attempted to update/delete a non-existent record

**Response**:
- **Status Code**: 404 Not Found
- **Body**:
  ```json
  {
    "success": false,
    "error": "Resource not found"
  }
  ```

**Example Operations**:
- `prisma.task.update({ where: { id: 999 } })` - Task doesn't exist
- `prisma.task.delete({ where: { id: 999 } })` - Task doesn't exist

**Implementation**:
```typescript
if (error.code === 'P2025') {
  return res.status(404).json({
    success: false,
    error: 'Resource not found',
  });
}
```

#### P2002 - Unique Constraint Violation

**Scenario**: Attempted to create a record with duplicate unique field

**Response**:
- **Status Code**: 409 Conflict
- **Body**:
  ```json
  {
    "success": false,
    "error": "Resource already exists"
  }
  ```

**Example Operations**:
- Duplicate username
- Duplicate email
- Any unique constraint violation

**Note**: Current schema has no unique constraints besides `id`, so this is for future extensibility.

**Implementation**:
```typescript
if (error.code === 'P2002') {
  return res.status(409).json({
    success: false,
    error: 'Resource already exists',
  });
}
```

**Implementation Status**: ✅ Implemented

---

### 3. Generic Errors

**Detection**: All other error types (fallback)

**Response**:
- **Status Code**: 500 Internal Server Error
- **Body**:
  ```json
  {
    "success": false,
    "error": "Internal server error",
    "message": "Detailed error message (development only)"
  }
  ```

**Environment-Based Behavior**:
- **Development**: Includes detailed error message
- **Production**: Hides error details (security)

**Implementation**:
```typescript
res.status(500).json({
  success: false,
  error: 'Internal server error',
  message: process.env.NODE_ENV === 'development' ? error.message : undefined,
});
```

**Security Rationale**:
- Production: Don't expose internal error details to clients
- Development: Show full error for debugging

**Implementation Status**: ✅ Implemented

---

## Error Flow Diagram

```
Request → Route → Controller
                     ↓ (error thrown)
                  try/catch
                     ↓
                 next(error)
                     ↓
              errorHandler Middleware
                     ↓
           ┌─────────┴─────────┐
           │                   │
    ZodError?             PrismaError?
       ↓                       ↓
   400 Bad Request           P2025? → 404 Not Found
                             P2002? → 409 Conflict
                               │
                               ↓
                           Generic Error
                               ↓
                        500 Internal Server Error
```

---

## Logging Behavior

**Current**:
```typescript
console.error('Error:', error);
```

**Issues**:
- Only logs to console
- No structured logging
- No error tracking service integration

**Recommendations**:
1. **Add Winston for Structured Logging**:
   ```typescript
   logger.error('Request error', {
     error: error.message,
     stack: error.stack,
     requestId: req.id,
     path: req.path,
     method: req.method,
   });
   ```

2. **Add Error Tracking Service**:
   ```typescript
   Sentry.captureException(error);
   ```

3. **Add Request Context**:
   ```typescript
   logger.error('Error processing request', {
     error,
     request: {
       method: req.method,
       path: req.path,
       query: req.query,
       body: req.body,
       ip: req.ip,
       userAgent: req.get('user-agent'),
     },
   });
   ```

---

## Response Format Consistency

All error responses follow this structure:

```typescript
{
  success: false,              // Always false for errors
  error: string,               // Error type/category
  message?: string,            // Optional detailed message
  details?: Array<{            // Optional validation details
    field: string,
    message: string
  }>
}
```

**Benefits**:
- Predictable client-side error handling
- Easy to parse and display
- Consistent across all error types

---

## HTTP Status Codes

| Status | Error Type            | Use Case                          |
|--------|-----------------------|-----------------------------------|
| 400    | Bad Request           | Validation errors, malformed data |
| 404    | Not Found             | Resource doesn't exist            |
| 409    | Conflict              | Unique constraint violation       |
| 500    | Internal Server Error | Unexpected errors                 |

**Future Codes to Consider**:
- 401 Unauthorized - Invalid/missing authentication
- 403 Forbidden - Valid auth but insufficient permissions
- 429 Too Many Requests - Rate limiting
- 503 Service Unavailable - Database connection issues

---

## Error Handling Best Practices

### ✅ Current Implementation

1. **Centralized**: Single error handler for all routes
2. **Consistent**: All errors formatted the same way
3. **Type-Specific**: Different handling for different error types
4. **Secure**: Hides internal details in production

### ⚠️ Missing Features

1. **Structured Logging**: Only console.error
2. **Error Tracking**: No Sentry/similar integration
3. **Request ID**: No correlation ID for tracing
4. **Error Codes**: No machine-readable error codes
5. **Retry Information**: No retry-after headers

---

## Testing Requirements

### Unit Tests Required

1. **Zod Error Handling**
   - ✅ Single validation error → 400 with details
   - ✅ Multiple validation errors → 400 with array of details
   - ✅ Nested field error → field path joined with dots

2. **Prisma Error Handling**
   - ✅ P2025 (not found) → 404 response
   - ✅ P2002 (unique violation) → 409 response
   - ✅ Other Prisma errors → 500 fallback

3. **Generic Error Handling**
   - ✅ Unknown error in development → 500 with message
   - ✅ Unknown error in production → 500 without message
   - ✅ Error logged to console

4. **Response Format**
   - ✅ All responses have `success: false`
   - ✅ All responses have `error` field
   - ✅ Validation errors have `details` array

**Mocking Strategy**:
```typescript
const mockRequest = {} as Request;
const mockResponse = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
} as unknown as Response;
const mockNext = jest.fn() as NextFunction;
```

**Target Coverage**: 100%

---

## Integration Points

### 1. Express Application
```typescript
// Must be registered AFTER all routes
app.use('/api/tasks', taskRoutes);
app.use(errorHandler);  // ← Last middleware
```

### 2. Controller Layer
```typescript
try {
  // Operation
} catch (error) {
  next(error);  // Forward to errorHandler
}
```

### 3. Async Error Handling
```typescript
// Errors in async functions automatically caught
router.get('/', async (req, res, next) => {
  try {
    await someAsyncOperation();
  } catch (error) {
    next(error);
  }
});
```

---

## Security Considerations

### Information Disclosure

**Risk**: Exposing internal error details to clients

**Mitigation**:
```typescript
message: process.env.NODE_ENV === 'development' ? error.message : undefined
```

**Production Example**:
```json
{
  "success": false,
  "error": "Internal server error"
  // No "message" field in production
}
```

### Stack Traces

**Current**: Not included in responses (good)

**Logging**: Stack traces logged server-side for debugging

---

## Performance Considerations

**Overhead**: Negligible (~0.1ms per error)

**Error Frequency**:
- Validation errors: Common (user input)
- Not found errors: Occasional (invalid IDs)
- Internal errors: Rare (bugs)

**Optimization**: Not needed (error handling is already fast)

---

## Error Response Examples

### Example 1: Missing Required Field
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

### Example 2: Task Not Found
```json
{
  "success": false,
  "error": "Resource not found"
}
```

### Example 3: Internal Server Error (Development)
```json
{
  "success": false,
  "error": "Internal server error",
  "message": "Cannot read property 'title' of undefined"
}
```

### Example 4: Internal Server Error (Production)
```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## Future Enhancements

### 1. Error Codes
```typescript
enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

{
  "success": false,
  "error": "Validation error",
  "code": "VALIDATION_ERROR",  // ← Machine-readable
  "details": [...]
}
```

### 2. Request ID Tracking
```typescript
import { v4 as uuidv4 } from 'uuid';

// Middleware to add request ID
app.use((req, res, next) => {
  req.id = uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Include in error response
{
  "success": false,
  "error": "Internal server error",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### 3. Structured Logging
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  format: winston.format.json(),
  transports: [new winston.transports.File({ filename: 'error.log' })],
});

logger.error('Request failed', {
  error: error.message,
  stack: error.stack,
  requestId: req.id,
  path: req.path,
  method: req.method,
});
```

### 4. Error Monitoring
```typescript
import * as Sentry from '@sentry/node';

// Only capture 500 errors
if (statusCode >= 500) {
  Sentry.captureException(error);
}
```

---

## Comparison: Before vs After Error Handler

### Without Error Handler
```typescript
// Each route handles errors differently
router.get('/', async (req, res) => {
  try {
    // ...
  } catch (error) {
    res.status(500).json({ error: error.message });  // Inconsistent
  }
});
```

### With Error Handler
```typescript
// Consistent error handling everywhere
router.get('/', async (req, res, next) => {
  try {
    // ...
  } catch (error) {
    next(error);  // Handled centrally
  }
});
```

**Benefits**:
- Consistent error format
- DRY principle
- Easier to add features (logging, monitoring)

---
