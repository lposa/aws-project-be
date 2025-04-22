import { getProductById } from '../getProductById';
import { APIGatewayEvent } from 'aws-lambda';
import { mockProducts } from '../../../mockProducts';

describe('getProductsById', () => {
  const createMockEvent = (productId?: string): Partial<APIGatewayEvent> => ({
    pathParameters: productId ? { product_id: productId } : undefined,
  });

  it('Should return a product based on a provided id', async () => {
    const event = createMockEvent('1') as APIGatewayEvent;
    const response = await getProductById(event);

    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body as string);
    expect(body).toEqual(mockProducts[0]);
  });

  it('Should return a 404 Product not found if provided ID is non existent', async () => {
    const event = createMockEvent('1212') as APIGatewayEvent;
    const response = await getProductById(event);

    expect(response.statusCode).toBe(404);
    const body = JSON.parse(response.body as string);

    expect(body.message).toEqual('Product not found');
  });
});
