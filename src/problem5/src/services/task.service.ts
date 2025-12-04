import { prisma } from '../config/database.js';
import { Prisma } from '@prisma/client';
import type { CreateTaskInput, UpdateTaskInput, ListTasksQuery } from '../validators/task.validator.js';

export class TaskService {
  /**
   * Create a new task
   */
  async createTask(data: CreateTaskInput) {
    return await prisma.task.create({
      data,
    });
  }

  /**
   * List tasks with optional filters
   */
  async listTasks(query: ListTasksQuery) {
    const { status, search, limit = 10, offset = 0 } = query;

    const where: Prisma.TaskWhereInput = {};

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Search in title and description
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.task.count({ where }),
    ]);

    return {
      data: tasks,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }

  /**
   * Get a single task by ID
   */
  async getTaskById(id: number) {
    return await prisma.task.findUnique({
      where: { id },
    });
  }

  /**
   * Update a task
   */
  async updateTask(id: number, data: UpdateTaskInput) {
    return await prisma.task.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a task
   */
  async deleteTask(id: number) {
    return await prisma.task.delete({
      where: { id },
    });
  }
}
