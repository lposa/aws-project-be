import { SQSEvent } from 'aws-lambda';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { catalogBatchProcess } from '../catalogBatchProcess';

describe('catalogBatchProcess', () => {
  let dynamoDBClientMock: jest.Mocked<DynamoDBClient>;
  let snsClientMock: jest.Mocked<SNSClient>;

  const mockEvent: SQSEvent = {
    Records: [
      {
        body: JSON.stringify({
          id: '123',
          name: 'Test Product',
          description: 'A description for the test product',
          price: '10.99',
          count: '5',
        }),
        messageId: '1',
        receiptHandle: '',
        attributes: {
          ApproximateReceiveCount: '1',
          SentTimestamp: '1683022912000',
          SenderId: 'AIDAEXAMPLE',
          ApproximateFirstReceiveTimestamp: '1683022912001',
        },
        messageAttributes: {},
        md5OfBody: '',
        eventSource: 'aws:sqs',
        eventSourceARN: '',
        awsRegion: '',
      },
    ],
  };

  beforeEach(() => {
    process.env.SNS_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456789012:createProductTopic';
    process.env.PRODUCTS_TABLE_NAME = 'MockProductsTable';
    process.env.STOCK_TABLE_NAME = 'MockStockTable';

    jest.clearAllMocks();

    dynamoDBClientMock = new DynamoDBClient({}) as jest.Mocked<DynamoDBClient>;
    snsClientMock = new SNSClient({}) as jest.Mocked<SNSClient>;

    dynamoDBClientMock.send = jest.fn().mockResolvedValue({});
    snsClientMock.send = jest.fn().mockResolvedValue({
      MessageId: 'mockMessageId',
    });
  });

  it('should process all records successfully', async () => {
    const response = await catalogBatchProcess(mockEvent);

    expect(PutItemCommand).toHaveBeenCalledTimes(2); // 1 for product + 1 for stock
    expect(dynamoDBClientMock.send).toHaveBeenCalledTimes(2);

    expect(PublishCommand).toHaveBeenCalledTimes(1);
    expect(snsClientMock.send).toHaveBeenCalledTimes(1);

    expect(response).toEqual({
      statusCode: 200,
      body: JSON.stringify({ message: 'Batch processed successfully' }),
    });
  });

  it('should handle errors from DynamoDB gracefully', async () => {
    (dynamoDBClientMock.send as jest.Mock).mockRejectedValueOnce(new Error('DynamoDB error'));

    const response = await catalogBatchProcess(mockEvent);

    expect(response).toEqual({
      statusCode: 500,
      body: JSON.stringify({
        message: 'Batch processing failed',
        error: 'DynamoDB error',
      }),
    });

    expect(snsClientMock.send).toHaveBeenCalledTimes(0);
  });

  it('should handle errors from SNS gracefully', async () => {
    (snsClientMock.send as jest.Mock).mockRejectedValueOnce(new Error('SNS error'));
    const response = await catalogBatchProcess(mockEvent);

    expect(response).toEqual({
      statusCode: 500,
      body: JSON.stringify({
        message: 'Batch processing failed',
        error: 'SNS error',
      }),
    });

    expect(dynamoDBClientMock.send).toHaveBeenCalledTimes(2);

    expect(snsClientMock.send).toHaveBeenCalledTimes(1);
  });

  it('should skip processing if message body is malformed', async () => {
    const malformedEvent = {
      Records: [
        {
          body: 'this-is-invalid-json',
        },
      ],
    } as any;

    await expect(catalogBatchProcess(malformedEvent)).resolves.not.toThrow();

    expect(PutItemCommand).toHaveBeenCalledTimes(0);
    expect(snsClientMock.send).toHaveBeenCalledTimes(0);
  });
});
