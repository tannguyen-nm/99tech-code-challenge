import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { mockDeep, mockReset } from 'jest-mock-extended';
import type { PrismaClient } from '@prisma/client';

// Create mock before any imports that use it
const prismaMock = mockDeep<PrismaClient>();

// Mock the database module BEFORE importing TaskService
jest.mock('../config/database.js', () => ({
  prisma: prismaMock,
}));

// Import TaskService AFTER mocking
import { TaskService } from './task.service';

describe('TaskService', () => {
  let taskService: TaskService;

  beforeEach(() => {
    mockReset(prismaMock);
    taskService = new TaskService();
  });

  describe('createTask', () => {
    it('should create task with valid data', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test Description',
        status: 'pending' as const,
      };

      const expectedTask = {
        id: 1,
        ...taskData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.task.create.mockResolvedValue(expectedTask);

      const result = await taskService.createTask(taskData);

      expect(result).toEqual(expectedTask);
      expect(prismaMock.task.create).toHaveBeenCalledWith({
        data: taskData,
      });
    });

    it('should use default status (pending)', async () => {
      const taskData = {
        title: 'Test Task',
      };

      const expectedTask = {
        id: 1,
        title: 'Test Task',
        description: null,
        status: 'pending' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.task.create.mockResolvedValue(expectedTask);

      const result = await taskService.createTask(taskData);

      expect(result.status).toBe('pending');
    });

    it('should handle optional description (null)', async () => {
      const taskData = {
        title: 'Test Task',
      };

      const expectedTask = {
        id: 1,
        title: 'Test Task',
        description: null,
        status: 'pending' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.task.create.mockResolvedValue(expectedTask);

      const result = await taskService.createTask(taskData);

      expect(result.description).toBeNull();
    });
  });

  describe('listTasks', () => {
    it('should return all tasks with no filters', async () => {
      const mockTasks = [
        {
          id: 1,
          title: 'Task 1',
          description: 'Description 1',
          status: 'pending' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          title: 'Task 2',
          description: 'Description 2',
          status: 'in_progress' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      prismaMock.task.findMany.mockResolvedValue(mockTasks);
      prismaMock.task.count.mockResolvedValue(2);

      const result = await taskService.listTasks({ limit: 10, offset: 0 });

      expect(result.data).toEqual(mockTasks);
      expect(result.pagination).toEqual({
        total: 2,
        limit: 10,
        offset: 0,
        hasMore: false,
      });
    });

    it('should filter tasks by status', async () => {
      const mockTasks = [
        {
          id: 1,
          title: 'Task 1',
          description: 'Description 1',
          status: 'pending' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      prismaMock.task.findMany.mockResolvedValue(mockTasks);
      prismaMock.task.count.mockResolvedValue(1);

      await taskService.listTasks({
        status: 'pending',
        limit: 10,
        offset: 0,
      });

      expect(prismaMock.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'pending' },
        })
      );
    });

    it('should search in title', async () => {
      const mockTasks = [
        {
          id: 1,
          title: 'Project Task',
          description: 'Description',
          status: 'pending' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      prismaMock.task.findMany.mockResolvedValue(mockTasks);
      prismaMock.task.count.mockResolvedValue(1);

      await taskService.listTasks({
        search: 'project',
        limit: 10,
        offset: 0,
      });

      expect(prismaMock.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { title: { contains: 'project' } },
              { description: { contains: 'project' } },
            ],
          },
        })
      );
    });

    it('should search in description', async () => {
      const mockTasks = [
        {
          id: 1,
          title: 'Task',
          description: 'Project Description',
          status: 'pending' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      prismaMock.task.findMany.mockResolvedValue(mockTasks);
      prismaMock.task.count.mockResolvedValue(1);

      const result = await taskService.listTasks({
        search: 'project',
        limit: 10,
        offset: 0,
      });

      expect(result.data).toEqual(mockTasks);
    });

    it('should handle pagination correctly', async () => {
      const mockTasks = [
        {
          id: 3,
          title: 'Task 3',
          description: 'Description 3',
          status: 'pending' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      prismaMock.task.findMany.mockResolvedValue(mockTasks);
      prismaMock.task.count.mockResolvedValue(10);

      const result = await taskService.listTasks({ limit: 5, offset: 2 });

      expect(prismaMock.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
          skip: 2,
        })
      );
      expect(result.pagination.hasMore).toBe(true);
    });

    it('should set hasMore flag correctly', async () => {
      prismaMock.task.findMany.mockResolvedValue([]);
      prismaMock.task.count.mockResolvedValue(5);

      const result = await taskService.listTasks({ limit: 10, offset: 0 });

      expect(result.pagination.hasMore).toBe(false);
    });

    it('should return empty array when no tasks found', async () => {
      prismaMock.task.findMany.mockResolvedValue([]);
      prismaMock.task.count.mockResolvedValue(0);

      const result = await taskService.listTasks({ limit: 10, offset: 0 });

      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });
  });

  describe('getTaskById', () => {
    it('should return task when found', async () => {
      const mockTask = {
        id: 1,
        title: 'Task 1',
        description: 'Description 1',
        status: 'pending' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.task.findUnique.mockResolvedValue(mockTask);

      const result = await taskService.getTaskById(1);

      expect(result).toEqual(mockTask);
      expect(prismaMock.task.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should return null when task not found', async () => {
      prismaMock.task.findUnique.mockResolvedValue(null);

      const result = await taskService.getTaskById(999);

      expect(result).toBeNull();
    });
  });

  describe('updateTask', () => {
    it('should update task title', async () => {
      const mockTask = {
        id: 1,
        title: 'Updated Title',
        description: 'Description',
        status: 'pending' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.task.update.mockResolvedValue(mockTask);

      const result = await taskService.updateTask(1, { title: 'Updated Title' });

      expect(result.title).toBe('Updated Title');
      expect(prismaMock.task.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { title: 'Updated Title' },
      });
    });

    it('should update task status', async () => {
      const mockTask = {
        id: 1,
        title: 'Task',
        description: 'Description',
        status: 'completed' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.task.update.mockResolvedValue(mockTask);

      const result = await taskService.updateTask(1, { status: 'completed' });

      expect(result.status).toBe('completed');
    });

    it('should update multiple fields', async () => {
      const updateData = {
        title: 'New Title',
        status: 'in_progress' as const,
      };

      const mockTask = {
        id: 1,
        ...updateData,
        description: 'Description',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.task.update.mockResolvedValue(mockTask);

      const result = await taskService.updateTask(1, updateData);

      expect(result.title).toBe('New Title');
      expect(result.status).toBe('in_progress');
    });

    it('should throw error when task not found', async () => {
      const error = new Error('Record not found');
      (error as any).code = 'P2025';

      prismaMock.task.update.mockRejectedValue(error);

      await expect(
        taskService.updateTask(999, { title: 'New Title' })
      ).rejects.toThrow();
    });
  });

  describe('deleteTask', () => {
    it('should delete existing task', async () => {
      const mockTask = {
        id: 1,
        title: 'Task 1',
        description: 'Description',
        status: 'pending' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.task.delete.mockResolvedValue(mockTask);

      const result = await taskService.deleteTask(1);

      expect(result).toEqual(mockTask);
      expect(prismaMock.task.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw error when task not found', async () => {
      const error = new Error('Record not found');
      (error as any).code = 'P2025';

      prismaMock.task.delete.mockRejectedValue(error);

      await expect(taskService.deleteTask(999)).rejects.toThrow();
    });
  });
});
