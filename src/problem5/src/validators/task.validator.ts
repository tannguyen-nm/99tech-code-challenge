import { z } from 'zod';

// Schema for creating a task
export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed']).optional().default('pending'),
});

// Schema for updating a task
export const updateTaskSchema = z
  .object({
    title: z.string().min(1, 'Title cannot be empty').max(200, 'Title too long').optional(),
    description: z.string().optional(),
    status: z.enum(['pending', 'in_progress', 'completed']).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

// Schema for query filters
export const listTasksQuerySchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed']).optional(),
  search: z.string().optional(),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .refine((val) => val > 0 && val <= 100, {
      message: 'Limit must be between 1 and 100',
    }),
  offset: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 0))
    .refine((val) => val >= 0, {
      message: 'Offset must be non-negative',
    }),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
