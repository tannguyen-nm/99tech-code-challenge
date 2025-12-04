import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';
import { validateTaskId } from './validateId';

describe('validateTaskId Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock<NextFunction>;

  beforeEach(() => {
    mockRequest = {
      params: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis() as any,
      json: jest.fn() as any,
    };
    mockNext = jest.fn() as jest.Mock<NextFunction>;
  });

  describe('Valid IDs', () => {
    it('should accept ID = "1"', () => {
      mockRequest.params = { id: '1' };

      validateTaskId(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect((mockRequest as any).parsedId).toBe(1);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should accept ID = "42"', () => {
      mockRequest.params = { id: '42' };

      validateTaskId(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect((mockRequest as any).parsedId).toBe(42);
    });

    it('should accept ID = "999"', () => {
      mockRequest.params = { id: '999' };

      validateTaskId(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect((mockRequest as any).parsedId).toBe(999);
    });

    it('should accept max integer', () => {
      mockRequest.params = { id: '2147483647' };

      validateTaskId(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect((mockRequest as any).parsedId).toBe(2147483647);
    });
  });

  describe('Invalid IDs', () => {
    it('should reject ID = "0"', () => {
      mockRequest.params = { id: '0' };

      validateTaskId(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid task ID',
        message: 'Task ID must be a positive integer',
      });
    });

    it('should reject negative ID', () => {
      mockRequest.params = { id: '-1' };

      validateTaskId(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid task ID',
        message: 'Task ID must be a positive integer',
      });
    });

    it('should reject non-numeric ID', () => {
      mockRequest.params = { id: 'abc' };

      validateTaskId(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should reject empty string', () => {
      mockRequest.params = { id: '' };

      validateTaskId(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should reject whitespace', () => {
      mockRequest.params = { id: '  ' };

      validateTaskId(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Edge Cases', () => {
    it('should accept float as integer (1.5 -> 1)', () => {
      mockRequest.params = { id: '1.5' };

      validateTaskId(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect((mockRequest as any).parsedId).toBe(1);
    });
  });

  describe('Response Format', () => {
    it('should return correct error structure', () => {
      mockRequest.params = { id: 'invalid' };

      validateTaskId(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.any(String),
          message: expect.any(String),
        })
      );
    });

    it('should have success: false', () => {
      mockRequest.params = { id: 'invalid' };

      validateTaskId(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      const call = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(call.success).toBe(false);
    });

    it('should have error field', () => {
      mockRequest.params = { id: 'invalid' };

      validateTaskId(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      const call = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(call.error).toBe('Invalid task ID');
    });

    it('should have message field', () => {
      mockRequest.params = { id: 'invalid' };

      validateTaskId(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );

      const call = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(call.message).toBe('Task ID must be a positive integer');
    });
  });
});
