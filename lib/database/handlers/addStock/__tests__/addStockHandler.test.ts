import { mockDynamoClient, mockSend } from '../../../../../setupTestMocks';
import { AddStockEventType, addStockHandler } from '../addStockHandler';

describe('addStockHandler', () => {
  const createMockEvent = (input?: AddStockEventType) => ({
    product_id: input?.product_id,
    count: input?.count,
  });

  beforeEach(() => {
    mockSend.mockReset();
  });

  it('Should successfully add a stock and return 200', async () => {
    mockSend.mockResolvedValueOnce({
      Item: {
        id: { S: '2' },
        name: { S: 'Product A' },
        description: { S: 'Description A' },
        price: { N: '19.99' },
      },
    });

    const stock = {
      product_id: '2',
      count: 20,
    };

    const event = createMockEvent(stock);
    const response = await addStockHandler(event as any, mockDynamoClient as any);

    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body as string);
    expect(body.message).toBe('Stock successfully added for product_id: 2');
    expect(body.stock).toMatchObject({
      product_id: '2',
      count: 20,
    });

    expect(mockSend).toHaveBeenCalledTimes(2);
  });

  it('Should return a 404 status if no product with matching id is found', async () => {
    mockSend.mockResolvedValueOnce({});

    const stock = {
      product_id: '4',
      count: 20,
    };

    const event = createMockEvent(stock);
    const response = await addStockHandler(event as any, mockDynamoClient as any);

    expect(response.statusCode).toBe(404);
  });

  it('Should return a 400 status if no product_id or stock are provided', async () => {
    mockSend.mockResolvedValueOnce({});

    const event = createMockEvent(undefined);
    const response = await addStockHandler(event as any, mockDynamoClient as any);

    expect(response.statusCode).toBe(400);
  });
});
