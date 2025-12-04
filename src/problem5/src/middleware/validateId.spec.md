# Validate ID Middleware Specification

**Module**: `src/middleware/validateId.ts`
**Type**: Express Middleware
**Responsibility**: Validate and parse task ID from URL parameters

---

## Overview

The `validateTaskId` middleware validates that the `:id` parameter in the URL is a valid positive integer. This eliminates duplicate validation logic across multiple controller methods and ensures consistent error responses.

---

## Function: validateTaskId

**Signature**:
```typescript
function validateTaskId(
  req: Request,
  res: Response,
  next: NextFunction
): void
```

**Purpose**: Express middleware to validate task ID parameter

**Registration**: Used on routes with `:id` parameter
```typescript
router.get('/:id', validateTaskId, controller.getById);
router.put('/:id', validateTaskId, controller.update);
router.delete('/:id', validateTaskId, controller.delete);
```

---

## Validation Logic

### Input
- `req.params.id`: String from URL parameter

### Process
1. Parse `req.params.id` to integer
2. Check if result is NaN (not a number)
3. Check if result is <= 0 (not positive)
4. If invalid: Return 400 Bad Request
5. If valid: Store parsed ID and call next()

### Output (on success)
- `(req as any).parsedId`: Parsed integer ID
- Calls `next()` to continue to controller

### Output (on error)
- **Status Code**: 400 Bad Request
- **Body**:
  ```json
  {
    "success": false,
    "error": "Invalid task ID",
    "message": "Task ID must be a positive integer"
  }
  ```

---

## Implementation

```typescript
export function validateTaskId(req: Request, res: Response, next: NextFunction) {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id) || id <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Invalid task ID',
      message: 'Task ID must be a positive integer',
    });
  }

  // Store parsed ID for use in controller
  (req as any).parsedId = id;

  next();
}
```

---

## Valid vs Invalid IDs

### Valid IDs
| Input        | Parsed     | Status             |
|--------------|------------|--------------------|
| "1"          | 1          | ✅ Valid           |  
| "42"         | 42         | ✅ Valid           |
| "999"        | 999        | ✅ Valid           |
| "2147483647" | 2147483647 | ✅ Valid (max int) |

### Invalid IDs
| Input | Parsed | Reason                                   | Status       |
|-------|--------|------------------------------------------|--------------|
| "0"   | 0      | Not positive                             | ❌ Invalid   |
| "-1"  | -1     | Negative                                 | ❌ Invalid   |
| "abc" | NaN    | Not a number                             | ❌ Invalid   |
| "1.5" | 1      | Float (parsed to 1, but should be exact) | ⚠️ Edge case |
| ""    | NaN    | Empty string                             | ❌ Invalid   |
| "  "  | NaN    | Whitespace                               | ❌ Invalid   |

**Note on Floats**: `parseInt("1.5", 10)` returns `1`, which passes validation. This is acceptable since database IDs are always integers.

---

## Error Response Format

**Consistent Structure**:
```json
{
  "success": false,
  "error": "Invalid task ID",
  "message": "Task ID must be a positive integer"
}
```

**Benefits**:
- Matches error format from errorHandler middleware
- Clear, user-friendly message
- Machine-readable structure

---

## Usage in Routes

### Before (Duplicate Logic)

```typescript
// In controller (repeated 3 times)
async getById(req, res, next) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid task ID',
    });
  }
  // ... rest of logic
}
```

### After (DRY with Middleware)

```typescript
// In routes
router.get('/:id', validateTaskId, controller.getById);
router.put('/:id', validateTaskId, controller.update);
router.delete('/:id', validateTaskId, controller.delete);

// In controller (cleaner)
async getById(req, res, next) {
  const id = (req as any).parsedId;  // Already validated and parsed
  // ... rest of logic
}
```

**Benefits**:
- Eliminates code duplication
- Consistent validation logic
- Easier to maintain and test

---

## Integration with Controller

### Option 1: Access via req.parsedId (Current)

```typescript
const id = (req as any).parsedId;
```

**Issues**:
- Uses `any` type (loses type safety)
- TypeScript doesn't know about custom property

### Option 2: Extend Request Interface (Better)

```typescript
// types/express.d.ts
declare global {
  namespace Express {
    interface Request {
      parsedId?: number;
    }
  }
}

// In controller (type-safe)
const id = req.parsedId!;  // Non-null assertion
```

**Benefits**:
- Full type safety
- IntelliSense support
- No `any` casts needed

---

## Testing Requirements

### Unit Tests Required

1. **Valid IDs**
   - ✅ ID = "1" → Calls next(), sets parsedId = 1
   - ✅ ID = "42" → Calls next(), sets parsedId = 42
   - ✅ ID = "999" → Calls next(), sets parsedId = 999

2. **Invalid IDs**
   - ✅ ID = "0" → 400 Bad Request, doesn't call next()
   - ✅ ID = "-1" → 400 Bad Request
   - ✅ ID = "abc" → 400 Bad Request
   - ✅ ID = "" → 400 Bad Request
   - ✅ ID = "  " → 400 Bad Request

3. **Edge Cases**
   - ✅ ID = "1.5" → Calls next() with parsedId = 1
   - ✅ ID = "2147483647" (max int) → Valid
   - ✅ ID = "2147483648" (overflow) → Valid (but might fail in database)

4. **Response Format**
   - ✅ Error response has `success: false`
   - ✅ Error response has `error` field
   - ✅ Error response has `message` field

**Mocking Strategy**:
```typescript
const mockRequest = {
  params: { id: '1' }
} as unknown as Request;

const mockResponse = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
} as unknown as Response;

const mockNext = jest.fn() as NextFunction;
```

**Target Coverage**: 100%

---

## Performance Considerations

**Overhead**: Negligible (~0.01ms)

**Operations**:
- `parseInt()`: Fast (native function)
- `isNaN()`: Fast (simple check)
- Comparison: Fast

**Bottleneck**: None (validation is not a performance concern)

---

## Security Considerations

### SQL Injection
- ✅ **Protected**: ID is validated as integer before database query
- Prisma uses parameterized queries anyway

### Integer Overflow
- ⚠️ **Potential Issue**: JavaScript can handle integers up to `Number.MAX_SAFE_INTEGER` (2^53 - 1)
- Database (SQLite/PostgreSQL) uses 32-bit or 64-bit integers
- **Mitigation**: Database will reject overflowed values

### DoS via Invalid IDs
- ✅ **Protected**: Fails fast (before database query)
- Invalid IDs are rejected immediately

---

## Alternative Implementations

### 1. Zod Schema (More Robust)

```typescript
import { z } from 'zod';

const idSchema = z.coerce.number().int().positive();

export function validateTaskId(req, res, next) {
  try {
    const id = idSchema.parse(req.params.id);
    req.parsedId = id;
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Invalid task ID',
      message: 'Task ID must be a positive integer',
    });
  }
}
```

**Benefits**:
- Consistent with other validation (Zod)
- Better error messages
- More validation options (min, max, etc.)

### 2. Express Param Handler

```typescript
router.param('id', (req, res, next, id) => {
  const parsedId = parseInt(id, 10);
  if (isNaN(parsedId) || parsedId <= 0) {
    return res.status(400).json({ error: 'Invalid ID' });
  }
  req.parsedId = parsedId;
  next();
});

// Automatically applies to all routes with :id
router.get('/:id', controller.getById);
```

**Benefits**:
- Automatic application to all routes
- Express built-in feature

---

## Comparison: Manual vs Middleware Validation

| Aspect           | Manual (Before)       | Middleware (After)   |
|------------------|-----------------------|----------------------|
| Code Duplication | 3 copies              | 1 copy               |
| Lines of Code    | 18 lines              | 6 lines              |
| Consistency      | ⚠️ Risk of divergence | ✅ Always consistent |
| Testability      | 3 test suites         | 1 test suite         |
| Maintainability  | ⚠️ Update 3 places    | ✅ Update 1 place    |

**Verdict**: Middleware is significantly better

---

## Error Scenarios

### Scenario 1: Non-Numeric ID
```
GET /api/tasks/abc

Response: 400 Bad Request
{
  "success": false,
  "error": "Invalid task ID",
  "message": "Task ID must be a positive integer"
}
```

### Scenario 2: Negative ID
```
GET /api/tasks/-1

Response: 400 Bad Request
{
  "success": false,
  "error": "Invalid task ID",
  "message": "Task ID must be a positive integer"
}
```

### Scenario 3: Zero ID
```
GET /api/tasks/0

Response: 400 Bad Request
{
  "success": false,
  "error": "Invalid task ID",
  "message": "Task ID must be a positive integer"
}
```

### Scenario 4: Valid ID (Not Found)
```
GET /api/tasks/999

Middleware: ✅ Passes validation
Controller: Queries database
Database: No record found
Error Handler: Returns 404

Response: 404 Not Found
{
  "success": false,
  "error": "Resource not found"
}
```

---

## Future Enhancements

### 1. Add Max ID Validation
```typescript
const MAX_ID = 2147483647;  // 32-bit integer max

if (id > MAX_ID) {
  return res.status(400).json({
    error: 'Invalid task ID',
    message: `Task ID must be less than ${MAX_ID}`,
  });
}
```

### 2. UUID Support (if schema changes)
```typescript
import { validate as isUUID } from 'uuid';

if (!isUUID(req.params.id)) {
  return res.status(400).json({
    error: 'Invalid task ID',
    message: 'Task ID must be a valid UUID',
  });
}
```

### 3. Add to Error Handler
```typescript
// Custom error class
class InvalidIdError extends Error {
  constructor() {
    super('Invalid task ID');
    this.name = 'InvalidIdError';
  }
}

// Throw instead of returning response
if (isNaN(id) || id <= 0) {
  throw new InvalidIdError();
}

// Handle in error handler middleware
if (error instanceof InvalidIdError) {
  return res.status(400).json({ error: error.message });
}
```

---

## Integration Status

**Current**:
- ✅ Middleware created
- ❌ Not yet integrated into routes
- ❌ Controller still has duplicate validation

**Next Steps**:
1. Update routes to use middleware
2. Remove duplicate validation from controller
3. Update controller to use `req.parsedId`
4. Write unit tests

---
