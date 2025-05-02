import { createProduct } from '../createProduct';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { STATUS_CODES } from '../../../utils/constants';
import { mockDynamoClient, mockSend } from '../../../../../setupTestMocks';

describe('createProduct', () => {
  const createMockEvent = (body?: object): Partial<APIGatewayProxyEvent> => ({
    body: body ? JSON.stringify(body) : null,
  });

  beforeEach(() => {
    mockSend.mockReset();
  });

  it('Should successfully create a product and stock', async () => {
    const newProduct = {
      name: 'The Last of Us Part II',
      description: 'Joel and Ellie continue their journey.',
      price: 59.99,
      count: 100,
    };

    const event = createMockEvent(newProduct) as APIGatewayProxyEvent;
    const response = await createProduct(event, mockDynamoClient as any);

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body as string);
    expect(body.message).toEqual('Product created successfully!');
    expect(body.product).toMatchObject({
      name: newProduct.name,
      description: newProduct.description,
      price: newProduct.price,
      stock: newProduct.count,
    });

    expect(mockSend).toHaveBeenCalled();
  });

  it('Should return a 404 error for missing required attributes', async () => {
    const invalidProduct = {
      description: 'Missing name, price, and count',
    };

    const event = createMockEvent(invalidProduct) as APIGatewayProxyEvent;
    const response = await createProduct(event, mockDynamoClient as any);

    expect(response.statusCode).toBe(STATUS_CODES.NOT_FOUND);
    const body = JSON.parse(response.body as string);
    expect(body.message).toEqual('Missing required product attributes');

    expect(mockSend).not.toHaveBeenCalled();
  });

  it('Should return a 500 error if DynamoDB fails', async () => {
    const newProduct = {
      name: 'Sample Product',
      description: 'This is a sample',
      price: 49.99,
      count: 10,
    };

    mockSend.mockRejectedValueOnce(new Error('DynamoDB Error'));

    const event = createMockEvent(newProduct) as APIGatewayProxyEvent;
    const response = await createProduct(event, mockDynamoClient as any);

    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body as string);
    expect(body.message).toContain('Failed to create product.');

    expect(mockSend).toHaveBeenCalledTimes(1);
  });
});
