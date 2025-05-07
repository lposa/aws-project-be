import { mockS3Client } from '../../../../../setupTestMocks';
import { importFileParser } from '../index';

jest.mock('@aws-sdk/client-s3', () => {
  return {
    S3: jest.fn().mockImplementation(() => mockS3Client),
  };
});

describe('importFileParser', () => {
  const mockBucketName = 'mock-bucket-name';
  const createMockEvent = (key: string): { Records: { s3: { object: { key: string } } }[] } => ({
    Records: [{ s3: { object: { key: key } } }],
  });

  beforeEach(() => {
    process.env.BUCKET_NAME = mockBucketName;
    process.env.SQS_QUEUE_URL = 'http://mock-sqs-url';
  });

  it('should return 404 if no bucket is found or provided', async () => {
    const event = createMockEvent('uploaded/test.csv');
    const response = await importFileParser(event as any);

    expect(JSON.parse(response.body).message).toBe('File processed successfully');

    expect(mockS3Client.getObject).toHaveBeenCalledWith({
      Bucket: mockBucketName,
      Key: 'uploaded/test.csv',
    });

    expect(mockS3Client.copyObject).toHaveBeenCalledWith({
      Bucket: mockBucketName,
      CopySource: `${mockBucketName}/uploaded/test.csv`,
      Key: 'parsed/test.csv',
    });

    expect(mockS3Client.deleteObject).toHaveBeenCalledWith({
      Bucket: mockBucketName,
      Key: 'uploaded/test.csv',
    });
  });
});
