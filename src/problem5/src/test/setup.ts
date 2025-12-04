// Jest setup file
// This file runs before all tests

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'file:./test.db';

// Increase test timeout if needed
jest.setTimeout(10000);
