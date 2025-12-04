import { describe, it, expect } from '@jest/globals';
import {
  createTaskSchema,
  updateTaskSchema,
  listTasksQuerySchema,
} from './task.validator';
import { ZodError } from 'zod';

describe('Task Validator', () => {
  describe('createTaskSchema', () => {
    describe('Valid Cases', () => {
      it('should accept minimal valid data', () => {
        const data = { title: 'Task' };
        const result = createTaskSchema.parse(data);

        expect(result.title).toBe('Task');
        expect(result.status).toBe('pending'); // Default status
      });

      it('should accept full valid data', () => {
        const data = {
          title: 'Task',
          description: 'Details',
          status: 'in_progress' as const,
        };
        const result = createTaskSchema.parse(data);

        expect(result.title).toBe('Task');
        expect(result.description).toBe('Details');
        expect(result.status).toBe('in_progress');
      });

      it('should apply default status when not provided', () => {
        const data = { title: 'Task', description: 'Details' };
        const result = createTaskSchema.parse(data);

        expect(result.status).toBe('pending');
      });

      it('should accept optional description omitted', () => {
        const data = { title: 'Task' };
        const result = createTaskSchema.parse(data);

        expect(result.description).toBeUndefined();
      });
    });

    describe('Invalid Cases', () => {
      it('should reject missing title', () => {
        const data = {};

        expect(() => createTaskSchema.parse(data)).toThrow(ZodError);
      });

      it('should reject empty title', () => {
        const data = { title: '' };

        expect(() => createTaskSchema.parse(data)).toThrow(ZodError);
        try {
          createTaskSchema.parse(data);
        } catch (error) {
          expect(error).toBeInstanceOf(ZodError);
          expect((error as ZodError).errors[0].message).toBe('Title is required');
        }
      });

      it('should reject title too long (201 chars)', () => {
        const data = { title: 'x'.repeat(201) };

        expect(() => createTaskSchema.parse(data)).toThrow(ZodError);
        try {
          createTaskSchema.parse(data);
        } catch (error) {
          expect(error).toBeInstanceOf(ZodError);
          expect((error as ZodError).errors[0].message).toBe('Title too long');
        }
      });

      it('should reject invalid status', () => {
        const data = { title: 'Task', status: 'done' };

        expect(() => createTaskSchema.parse(data)).toThrow(ZodError);
      });
    });
  });

  describe('updateTaskSchema', () => {
    describe('Valid Cases', () => {
      it('should accept single field update', () => {
        const data = { title: 'New Title' };
        const result = updateTaskSchema.parse(data);

        expect(result.title).toBe('New Title');
      });

      it('should accept status only', () => {
        const data = { status: 'completed' as const };
        const result = updateTaskSchema.parse(data);

        expect(result.status).toBe('completed');
      });

      it('should accept multiple fields', () => {
        const data = {
          title: 'New Title',
          status: 'in_progress' as const,
        };
        const result = updateTaskSchema.parse(data);

        expect(result.title).toBe('New Title');
        expect(result.status).toBe('in_progress');
      });

      it('should accept clearing description', () => {
        const data = { description: '' };
        const result = updateTaskSchema.parse(data);

        expect(result.description).toBe('');
      });
    });

    describe('Invalid Cases', () => {
      it('should reject empty body', () => {
        const data = {};

        expect(() => updateTaskSchema.parse(data)).toThrow(ZodError);
        try {
          updateTaskSchema.parse(data);
        } catch (error) {
          expect(error).toBeInstanceOf(ZodError);
          expect((error as ZodError).errors[0].message).toBe(
            'At least one field must be provided for update'
          );
        }
      });

      it('should reject empty title', () => {
        const data = { title: '' };

        expect(() => updateTaskSchema.parse(data)).toThrow(ZodError);
        try {
          updateTaskSchema.parse(data);
        } catch (error) {
          expect(error).toBeInstanceOf(ZodError);
          expect((error as ZodError).errors[0].message).toBe('Title cannot be empty');
        }
      });

      it('should reject title too long', () => {
        const data = { title: 'x'.repeat(201) };

        expect(() => updateTaskSchema.parse(data)).toThrow(ZodError);
        try {
          updateTaskSchema.parse(data);
        } catch (error) {
          expect(error).toBeInstanceOf(ZodError);
          expect((error as ZodError).errors[0].message).toBe('Title too long');
        }
      });

      it('should reject invalid status', () => {
        const data = { status: 'done' };

        expect(() => updateTaskSchema.parse(data)).toThrow(ZodError);
      });
    });
  });

  describe('listTasksQuerySchema', () => {
    describe('Valid Cases', () => {
      it('should return defaults for empty query', () => {
        const data = {};
        const result = listTasksQuerySchema.parse(data);

        expect(result.limit).toBe(10);
        expect(result.offset).toBe(0);
      });

      it('should accept valid status filter', () => {
        const data = { status: 'pending' as const };
        const result = listTasksQuerySchema.parse(data);

        expect(result.status).toBe('pending');
        expect(result.limit).toBe(10);
        expect(result.offset).toBe(0);
      });

      it('should accept valid search', () => {
        const data = { search: 'project' };
        const result = listTasksQuerySchema.parse(data);

        expect(result.search).toBe('project');
      });

      it('should transform string limit to number', () => {
        const data = { limit: '25', offset: '50' };
        const result = listTasksQuerySchema.parse(data);

        expect(result.limit).toBe(25);
        expect(result.offset).toBe(50);
      });

      it('should accept combined filters', () => {
        const data = {
          status: 'in_progress' as const,
          search: 'urgent',
          limit: '5',
          offset: '10',
        };
        const result = listTasksQuerySchema.parse(data);

        expect(result.status).toBe('in_progress');
        expect(result.search).toBe('urgent');
        expect(result.limit).toBe(5);
        expect(result.offset).toBe(10);
      });
    });

    describe('Invalid Cases', () => {
      it('should reject invalid status', () => {
        const data = { status: 'done' };

        expect(() => listTasksQuerySchema.parse(data)).toThrow(ZodError);
      });

      it('should reject limit too high', () => {
        const data = { limit: '101' };

        expect(() => listTasksQuerySchema.parse(data)).toThrow(ZodError);
        try {
          listTasksQuerySchema.parse(data);
        } catch (error) {
          expect(error).toBeInstanceOf(ZodError);
          expect((error as ZodError).errors[0].message).toBe(
            'Limit must be between 1 and 100'
          );
        }
      });

      it('should reject limit zero', () => {
        const data = { limit: '0' };

        expect(() => listTasksQuerySchema.parse(data)).toThrow(ZodError);
        try {
          listTasksQuerySchema.parse(data);
        } catch (error) {
          expect(error).toBeInstanceOf(ZodError);
          expect((error as ZodError).errors[0].message).toBe(
            'Limit must be between 1 and 100'
          );
        }
      });

      it('should reject negative offset', () => {
        const data = { offset: '-1' };

        expect(() => listTasksQuerySchema.parse(data)).toThrow(ZodError);
        try {
          listTasksQuerySchema.parse(data);
        } catch (error) {
          expect(error).toBeInstanceOf(ZodError);
          expect((error as ZodError).errors[0].message).toBe(
            'Offset must be non-negative'
          );
        }
      });

      it('should reject non-numeric limit', () => {
        const data = { limit: 'abc' };

        expect(() => listTasksQuerySchema.parse(data)).toThrow(ZodError);
      });
    });
  });
});
