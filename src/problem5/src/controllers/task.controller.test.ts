import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

// Create mock service
const mockTaskService = {
  createTask: jest.fn(),
  listTasks: jest.fn(),
  getTaskById: jest.fn(),
  updateTask: jest.fn(),
  deleteTask: jest.fn(),
};

// Mock TaskService before importing controller
jest.mock('../services/task.service.js', () => ({
  TaskService: jest.fn(() => mockTaskService),
}));

// Import controller after mocking
import { TaskController } from './task.controller';

describe('TaskController', () => {
  let controller: TaskController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock<NextFunction>;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new TaskController();
    mockRequest = {
      body: {},
      query: {},
      params: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis() as any,
      json: jest.fn() as any,
    };
    mockNext = jest.fn() as jest.Mock<NextFunction>;
  });

  describe('create', () => {
    it('should create task with valid data', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test Description',
        status: 'pending' as const,
      };

      const createdTask = {
        id: 1,
        ...taskData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.body = taskData;
      mockTaskService.createTask = jest.fn().mockResolvedValue(createdTask);

      await controller.create(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: createdTask,
      });
    });

    it('should call next with validation error for invalid data', async () => {
      mockRequest.body = {}; // Missing required title

      await controller.create(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(ZodError);
    });

    it('should call next with service error', async () => {
      const error = new Error('Database error');
      mockRequest.body = { title: 'Test' };
      mockTaskService.createTask = jest.fn().mockRejectedValue(error);

      await controller.create(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('list', () => {
    it('should list all tasks with default pagination', async () => {
      const mockResult = {
        data: [
          {
            id: 1,
            title: 'Task 1',
            description: 'Description 1',
            status: 'pending' as const,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        pagination: {
          total: 1,
          limit: 10,
          offset: 0,
          hasMore: false,
        },
      };

      mockRequest.query = {};
      mockTaskService.listTasks = jest.fn().mockResolvedValue(mockResult);

      await controller.list(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        ...mockResult,
      });
    });

    it('should filter tasks by status', async () => {
      const mockResult = {
        data: [],
        pagination: {
          total: 0,
          limit: 10,
          offset: 0,
          hasMore: false,
        },
      };

      mockRequest.query = { status: 'pending' };
      mockTaskService.listTasks = jest.fn().mockResolvedValue(mockResult);

      await controller.list(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      expect(mockTaskService.listTasks).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'pending' })
      );
    });

    it('should handle search query', async () => {
      const mockResult = {
        data: [],
        pagination: {
          total: 0,
          limit: 10,
          offset: 0,
          hasMore: false,
        },
      };

      mockRequest.query = { search: 'test' };
      mockTaskService.listTasks = jest.fn().mockResolvedValue(mockResult);

      await controller.list(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      expect(mockTaskService.listTasks).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'test' })
      );
    });

    it('should call next with validation error for invalid query', async () => {
      mockRequest.query = { limit: '101' }; // Exceeds max limit

      await controller.list(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(ZodError);
    });
  });

  describe('getById', () => {
    it('should return task when found', async () => {
      const mockTask = {
        id: 1,
        title: 'Task 1',
        description: 'Description',
        status: 'pending' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.params = { id: '1' };
      mockTaskService.getTaskById = jest.fn().mockResolvedValue(mockTask);

      await controller.getById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockTask,
      });
    });

    it('should return 404 when task not found', async () => {
      mockRequest.params = { id: '999' };
      mockTaskService.getTaskById = jest.fn().mockResolvedValue(null);

      await controller.getById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Task not found',
      });
    });

    it('should return 400 for invalid ID', async () => {
      mockRequest.params = { id: 'invalid' };

      await controller.getById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid task ID',
      });
    });

    it('should call next with service error', async () => {
      const error = new Error('Database error');
      mockRequest.params = { id: '1' };
      mockTaskService.getTaskById = jest.fn().mockRejectedValue(error);

      await controller.getById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('update', () => {
    it('should update task with valid data', async () => {
      const updateData = { title: 'Updated Title' };
      const updatedTask = {
        id: 1,
        title: 'Updated Title',
        description: 'Description',
        status: 'pending' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = updateData;
      mockTaskService.updateTask = jest.fn().mockResolvedValue(updatedTask);

      await controller.update(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: updatedTask,
      });
    });

    it('should return 400 for invalid ID', async () => {
      mockRequest.params = { id: 'invalid' };
      mockRequest.body = { title: 'Updated Title' };

      await controller.update(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid task ID',
      });
    });

    it('should call next with validation error for empty body', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = {};

      await controller.update(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(ZodError);
    });

    it('should call next with service error (P2025)', async () => {
      const error = new Error('Record not found');
      (error as any).code = 'P2025';

      mockRequest.params = { id: '999' };
      mockRequest.body = { title: 'Updated Title' };
      mockTaskService.updateTask = jest.fn().mockRejectedValue(error);

      await controller.update(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('delete', () => {
    it('should delete task successfully', async () => {
      const deletedTask = {
        id: 1,
        title: 'Task 1',
        description: 'Description',
        status: 'pending' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.params = { id: '1' };
      mockTaskService.deleteTask = jest.fn().mockResolvedValue(deletedTask);

      await controller.delete(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Task deleted successfully',
      });
    });

    it('should return 400 for invalid ID', async () => {
      mockRequest.params = { id: 'invalid' };

      await controller.delete(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid task ID',
      });
    });

    it('should call next with service error (P2025)', async () => {
      const error = new Error('Record not found');
      (error as any).code = 'P2025';

      mockRequest.params = { id: '999' };
      mockTaskService.deleteTask = jest.fn().mockRejectedValue(error);

      await controller.delete(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
