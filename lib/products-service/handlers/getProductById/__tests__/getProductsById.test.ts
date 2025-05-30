import { getProductById } from '../getProductById';
import { APIGatewayEvent } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

const validProductID = '1';
const invalidProductID = '1212';

const expectedResult = {
  id: '1',
  name: 'Product A',
  description: 'Description A',
  price: 19.99,
  stock: 5,
};

describe('getProductsById', () => {
  let dynamoDBClientMock: jest.Mocked<DynamoDBClient>;

  beforeEach(() => {
    jest.clearAllMocks();

    dynamoDBClientMock = new DynamoDBClient({}) as jest.Mocked<DynamoDBClient>;
  });

  const createMockEvent = (productId?: string): Partial<APIGatewayEvent> => ({
    pathParameters: productId ? { product_id: productId } : undefined,
  });

  it('Should return a product based on a provided id', async () => {
    dynamoDBClientMock.send = jest
      .fn()
      .mockResolvedValueOnce({
        Item: {
          id: { S: validProductID },
          name: { S: 'Product A' },
          description: { S: 'Description A' },
          price: { N: '19.99' },
        },
      })
      .mockResolvedValueOnce({
        Item: { product_id: { S: validProductID }, count: { N: '5' } },
      });

    const event = createMockEvent(validProductID) as APIGatewayEvent;
    const response = await getProductById(event);

    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body as string);
    expect(body).toEqual(expectedResult);
  });

  it('Should return a 404 Product not found if provided ID is non existent', async () => {
    dynamoDBClientMock.send = jest.fn().mockResolvedValueOnce({}).mockResolvedValueOnce({});

    const event = createMockEvent(invalidProductID) as APIGatewayEvent;
    const response = await getProductById(event);

    expect(response.statusCode).toBe(404);
    const body = JSON.parse(response.body as string);

    expect(body.message).toEqual(`Product with ID ${invalidProductID} not found`);
  });
});
