import { createProduct } from '../createProduct';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { STATUS_CODES } from '../../../utils/constants';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

jest.mock('@aws-sdk/client-dynamodb', () => {
  const originalModule = jest.requireActual('@aws-sdk/client-dynamodb');

  return {
    ...originalModule,
    DynamoDBClient: jest.fn().mockImplementation(() => ({
      send: jest.fn(),
    })),
    PutItemCommand: jest.fn().mockImplementation((input) => ({
      input,
    })),
  };
});

describe('createProduct', () => {
  let dynamoDBClientMock: jest.Mocked<DynamoDBClient>;

  const createMockEvent = (body?: object): Partial<APIGatewayProxyEvent> => ({
    body: body ? JSON.stringify(body) : null,
  });

  beforeEach(() => {
    process.env.SNS_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456789012:createProductTopic';
    process.env.PRODUCTS_TABLE_NAME = 'MockProductsTable';
    process.env.STOCK_TABLE_NAME = 'MockStockTable';

    jest.clearAllMocks();

    dynamoDBClientMock = new DynamoDBClient({}) as jest.Mocked<DynamoDBClient>;
    (DynamoDBClient as jest.Mock).mockImplementation(() => dynamoDBClientMock);
  });

  it('Should successfully create a product and stock', async () => {
    const newProduct = {
      name: 'The Last of Us Part II',
      description: 'Joel and Ellie continue their journey.',
      price: 59.99,
      count: 100,
    };

    const event = createMockEvent(newProduct) as APIGatewayProxyEvent;
    const response = await createProduct(event);

    console.log(response);

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body as string);
    expect(body.message).toEqual('Product created successfully!');
    expect(body.product).toMatchObject({
      name: newProduct.name,
      description: newProduct.description,
      price: newProduct.price,
      stock: newProduct.count,
    });
  });

  it('Should return a 404 error for missing required attributes', async () => {
    const invalidProduct = {
      description: 'Missing name, price, and count',
    };

    const event = createMockEvent(invalidProduct) as APIGatewayProxyEvent;
    const response = await createProduct(event);

    expect(response.statusCode).toBe(STATUS_CODES.NOT_FOUND);
    const body = JSON.parse(response.body as string);
    expect(body.message).toEqual('Missing required product attributes');

    expect(dynamoDBClientMock.send).not.toHaveBeenCalled();
  });
});
