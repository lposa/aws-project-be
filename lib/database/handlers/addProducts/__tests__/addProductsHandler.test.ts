import { AddProductEvent, addProductsHandler } from '../addProductsHandler';
import { mockDynamoClient, mockSend } from '../../../../../setupTestMocks';

jest.mock('crypto', () => ({
  randomUUID: jest.fn(() => 'mocked-random-uuid'),
}));

describe('addProductsHandler', () => {
  const createMockEvent = (input?: AddProductEvent) => ({
    name: input?.['name'],
    description: input?.['description'],
    price: input?.['price'],
  });

  beforeEach(() => {
    mockSend.mockReset();
  });

  it('Should successfully add a product and return 200', async () => {
    mockSend.mockResolvedValueOnce({});

    const product = {
      name: 'Product A',
      description: 'This is Product A.',
      price: 199.99,
    };

    const event = createMockEvent(product);
    const response = await addProductsHandler(event as any, mockDynamoClient as any);

    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body as string);
    expect(body.message).toBe('Product successfully added!');
    expect(body.product).toMatchObject({
      id: 'mocked-random-uuid',
      title: product.name,
      description: product.description,
      price: product.price,
    });

    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it('Should return a 400 error for missing required attributes', async () => {
    const invalidEvent = createMockEvent({
      description: 'This is missing the title and price',
    });

    const response = await addProductsHandler(invalidEvent as any);

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body as string);
    expect(body.message).toBe('Invalid input. Ensure title, description, and price are provided.');

    expect(mockSend).not.toHaveBeenCalled();
  });

  it('Should return a 500 error if DynamoDB throws an error', async () => {
    mockSend.mockRejectedValueOnce(new Error('DynamoDB Error'));

    const product = {
      name: 'Faulty Product',
      description: 'This is a faulty product.',
      price: 99.99,
    };

    const event = createMockEvent(product);
    await expect(addProductsHandler(event as any, mockDynamoClient as any)).rejects.toThrow(
      'Error adding item to DynamoDB table'
    );

    expect(mockSend).toHaveBeenCalledTimes(1);
  });
});
