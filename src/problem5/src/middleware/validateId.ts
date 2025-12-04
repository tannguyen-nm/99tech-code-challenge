import type { Request, Response, NextFunction } from 'express';

/**
 * Middleware to validate that the ID parameter is a valid positive integer
 */
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
