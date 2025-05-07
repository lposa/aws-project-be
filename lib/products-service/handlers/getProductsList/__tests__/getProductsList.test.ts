import { STATUS_CODES } from '../../../utils/constants';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

const expectedResults = [
  {
    description: 'Description A',
    id: '1',
    name: 'Product A',
    price: 19.99,
    stock: 5,
  },
  {
    description: 'Description B',
    id: '2',
    name: 'Product B',
    price: 29.99,
    stock: 0,
  },
];

describe('getProductsById', () => {
  let dynamoDBClientMock: jest.Mocked<DynamoDBClient>;

  beforeEach(() => {
    process.env.SNS_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456789012:createProductTopic';
    process.env.PRODUCTS_TABLE_NAME = 'MockProductsTable';
    process.env.STOCK_TABLE_NAME = 'MockStockTable';

    jest.clearAllMocks();

    dynamoDBClientMock = new DynamoDBClient({}) as jest.Mocked<DynamoDBClient>;
  });

  it('Should return all products', async () => {
    dynamoDBClientMock.send = jest
      .fn()
      .mockResolvedValueOnce({
        Items: [
          {
            id: { S: '1' },
            name: { S: 'Product A' },
            description: { S: 'Description A' },
            price: { N: '19.99' },
          },
          {
            id: { S: '2' },
            name: { S: 'Product B' },
            description: { S: 'Description B' },
            price: { N: '29.99' },
          },
        ],
      })
      .mockResolvedValueOnce({
        Items: [
          { product_id: { S: '1' }, count: { N: '5' } },
          { product_id: { S: '2' }, count: { N: '0' } },
        ],
      });

    const { getProductsList } = await import('../getProductsList');
    const response = await getProductsList();

    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body as string);
    expect(body).toEqual(expectedResults);
  });

  it('Should return a 404 if no products exist', async () => {
    dynamoDBClientMock.send = jest.fn().mockResolvedValueOnce({});

    const { getProductsList } = await import('../getProductsList');
    const response = await getProductsList();

    expect(response.statusCode).toBe(STATUS_CODES.NOT_FOUND);

    const body = JSON.parse(response.body as string);
    expect(body).toEqual({
      message: 'No products found',
    });
    jest.restoreAllMocks();
  });
});
