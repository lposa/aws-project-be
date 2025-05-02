import { mockS3Client } from '../../../../../setupTestMocks';
import { importFileParser } from '../index';

describe('importFileParser', () => {
  const createMockEvent = (key: string): { Records: { s3: { object: { key: string } } }[] } => ({
    Records: [{ s3: { object: { key: key } } }],
  });

  const mockBucketName = 'mock-bucket-name';
  process.env.BUCKET_NAME = mockBucketName;

  it('should return 404 if no bucket is found or provided', async () => {
    const event = createMockEvent('uploaded/test.csv');
    const response = await importFileParser(event as any, mockS3Client);

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
