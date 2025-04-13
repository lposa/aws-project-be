import { mockProducts } from '../../../mockProducts';

describe('getProductsById', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.resetModules();
  });

  it('Should return all products', async () => {
    jest.doMock('../../../mockProducts', () => ({
      mockProducts,
    }));

    const { getProductsList } = await import('../getProductsList');
    const response = await getProductsList();

    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body as string);
    expect(body).toEqual(mockProducts);
  });

  it('Should return a 404 if no products exist', async () => {
    jest.doMock('../../../mockProducts', () => ({ mockProducts: [] }));

    const { getProductsList } = await import('../getProductsList');
    const response = await getProductsList();

    expect(response.statusCode).toBe(404);

    const body = JSON.parse(response.body as string);
    expect(body).toEqual({
      message: 'No products found',
    });
    jest.restoreAllMocks();
  });
});
