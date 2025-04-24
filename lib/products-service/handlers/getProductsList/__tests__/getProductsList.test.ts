import { mockDynamoClient, mockSend } from '../../../../../setupTestMocks';
import { STATUS_CODES } from '../../../utils/constants';

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
  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.resetModules();
  });

  it('Should return all products', async () => {
    mockSend
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
    const response = await getProductsList(mockDynamoClient as any);

    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body as string);
    expect(body).toEqual(expectedResults);
  });

  it('Should return a 404 if no products exist', async () => {
    mockSend.mockResolvedValueOnce({ Items: [] });

    const { getProductsList } = await import('../getProductsList');
    const response = await getProductsList(mockDynamoClient as any);

    expect(response.statusCode).toBe(STATUS_CODES.NOT_FOUND);

    const body = JSON.parse(response.body as string);
    expect(body).toEqual({
      message: 'No products found',
    });
    jest.restoreAllMocks();
  });
});
