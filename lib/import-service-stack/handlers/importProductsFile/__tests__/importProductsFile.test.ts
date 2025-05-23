import { mockS3Client } from '../../../../../setupTestMocks';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { importProductsFile } from '../index';
import { COMMON_HEADERS, STATUS_CODES } from '../../../utils/constants/index';
import { APIGatewayEvent } from 'aws-lambda';

jest.mock('@aws-sdk/client-s3', () => {
  const originalModule = jest.requireActual('@aws-sdk/client-s3');
  return {
    ...originalModule,
    S3: jest.fn().mockImplementation(() => mockS3Client),
    PutObjectCommand: jest.fn().mockImplementation((input) => ({
      input,
    })),
  };
});

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(() => {
    return Promise.resolve('https://mock-signed-url.com'); // Mock response
  }),
}));

describe('ImportProductsFile', () => {
  const createMockEvent = (fileName?: string): Partial<APIGatewayEvent> => ({
    queryStringParameters: fileName ? { fileName: fileName } : undefined,
  });
  const mockBucketName = 'mock-bucket-name';

  beforeEach(() => {
    jest.resetAllMocks();
    process.env.BUCKET_NAME = mockBucketName;
    process.env.SQS_QUEUE_URL = 'http://mock-sqs-url';
  });

  it('Should return status code 200 and call getSignedUrl without any errors', async () => {
    const mockSignedUrl = 'https://mock-signed-url.com';
    (getSignedUrl as jest.Mock).mockResolvedValueOnce(mockSignedUrl);

    const event = createMockEvent('test.csv');
    const response = await importProductsFile(event as any);

    console.log(response);

    expect(response.statusCode).toBe(STATUS_CODES.OK);
    expect(response.headers).toEqual(COMMON_HEADERS);

    const body = JSON.parse(response.body);
    expect(body.signedUrl).toBe(mockSignedUrl);

    expect(getSignedUrl).toHaveBeenCalledTimes(1);
  });

  it('Should return a 404 status code if file name is not provided', async () => {
    const mockSignedUrl = 'https://mock-signed-url.com';
    (getSignedUrl as jest.Mock).mockResolvedValueOnce(mockSignedUrl);

    const event = createMockEvent('');
    const response = await importProductsFile(event as any);

    expect(response.statusCode).toBe(STATUS_CODES.NOT_FOUND);
  });

  it('Should return a 500 status code if getSignedUrl throws an error', async () => {
    const errorMessage = 'Mocked getSignedUrl error';
    (getSignedUrl as jest.Mock).mockRejectedValue(new Error(errorMessage));

    const event = createMockEvent('test.csv');
    const response = await importProductsFile(event as any);

    expect(response.statusCode).toBe(STATUS_CODES.SERVER_ERROR);
  });
});
