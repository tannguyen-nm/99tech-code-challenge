import type { Request, Response, NextFunction } from 'express';
import { TaskService } from '../services/task.service.js';
import {
  createTaskSchema,
  updateTaskSchema,
  listTasksQuerySchema,
} from '../validators/task.validator.js';

const taskService = new TaskService();

export class TaskController {
  /**
   * POST /api/tasks - Create a new task
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = createTaskSchema.parse(req.body);
      const task = await taskService.createTask(validatedData);

      res.status(201).json({
        success: true,
        data: task,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/tasks - List all tasks with optional filters
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedQuery = listTasksQuerySchema.parse(req.query);
      const result = await taskService.listTasks(validatedQuery);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/tasks/:id - Get a single task by ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid task ID',
        });
      }

      const task = await taskService.getTaskById(id);

      if (!task) {
        return res.status(404).json({
          success: false,
          error: 'Task not found',
        });
      }

      res.status(200).json({
        success: true,
        data: task,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/tasks/:id - Update a task
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid task ID',
        });
      }

      const validatedData = updateTaskSchema.parse(req.body);
      const task = await taskService.updateTask(id, validatedData);

      res.status(200).json({
        success: true,
        data: task,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/tasks/:id - Delete a task
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid task ID',
        });
      }

      await taskService.deleteTask(id);

      res.status(200).json({
        success: true,
        message: 'Task deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
