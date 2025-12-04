import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';
import { ZodError, z } from 'zod';
import { Prisma } from '@prisma/client';
import { errorHandler } from './errorHandler';

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock<NextFunction>;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis() as any,
      json: jest.fn() as any,
    };
    mockNext = jest.fn() as jest.Mock<NextFunction>;
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('Zod Error Handling', () => {
    it('should handle single validation error', () => {
      const schema = z.object({ title: z.string() });
      let error: ZodError;

      try {
        schema.parse({});
      } catch (e) {
        error = e as ZodError;
      }

      errorHandler(
        error!,
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation error',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: expect.any(String),
            message: expect.any(String),
          }),
        ]),
      });
    });

    it('should handle multiple validation errors', () => {
      const schema = z.object({
        title: z.string(),
        status: z.enum(['pending', 'in_progress', 'completed']),
      });
      let error: ZodError;

      try {
        schema.parse({});
      } catch (e) {
        error = e as ZodError;
      }

      errorHandler(
        error!,
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      const call = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(call.details).toHaveLength(2);
    });

    it('should map nested field paths correctly', () => {
      const schema = z.object({
        user: z.object({
          name: z.string(),
        }),
      });
      let error: ZodError;

      try {
        schema.parse({ user: {} });
      } catch (e) {
        error = e as ZodError;
      }

      errorHandler(
        error!,
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      const call = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(call.details[0].field).toBe('user.name');
    });
  });

  describe('Prisma Error Handling', () => {
    it('should handle P2025 (not found) error', () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        {
          code: 'P2025',
          clientVersion: '5.0.0',
        }
      );

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Resource not found',
      });
    });

    it('should handle P2002 (unique violation) error', () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint violation',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
        }
      );

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Resource already exists',
      });
    });

    it('should handle other Prisma errors as 500', () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Some other error',
        {
          code: 'P2003',
          clientVersion: '5.0.0',
        }
      );

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });
  });

  describe('Generic Error Handling', () => {
    it('should handle generic error in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Something went wrong');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error',
        message: 'Something went wrong',
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('should hide error details in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new Error('Something went wrong');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error',
      });

      const call = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(call.message).toBeUndefined();

      process.env.NODE_ENV = originalEnv;
    });

    it('should log error to console', () => {
      const error = new Error('Test error');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error:', error);
    });
  });

  describe('Response Format', () => {
    it('should always have success: false', () => {
      const error = new Error('Test');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      const call = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(call.success).toBe(false);
    });

    it('should always have error field', () => {
      const error = new Error('Test');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      const call = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(call.error).toBeDefined();
      expect(typeof call.error).toBe('string');
    });

    it('should have details array for validation errors', () => {
      const schema = z.object({ title: z.string() });
      let error: ZodError;

      try {
        schema.parse({});
      } catch (e) {
        error = e as ZodError;
      }

      errorHandler(
        error!,
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      const call = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(Array.isArray(call.details)).toBe(true);
      expect(call.details.length).toBeGreaterThan(0);
    });
  });
});
