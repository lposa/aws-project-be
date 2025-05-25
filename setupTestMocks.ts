import * as stream from 'stream';
import { S3 } from '@aws-sdk/client-s3';

export const mockSend = jest.fn();

export const mockDynamoClient = {
  send: mockSend,
};

// Mock the S3 client
export const mockS3Client = {
  getObject: jest.fn(() => ({
    promise: jest.fn(), // AWS SDK v2 compatibility if needed
    Body: stream.Readable.from(['name,value\nJohn,30\nJane,25']), // Mock Readable stream with CSV data
  })),
  copyObject: jest.fn(() => ({
    promise: jest.fn(),
  })),
  deleteObject: jest.fn(() => ({
    promise: jest.fn(),
  })),
} as unknown as S3;
