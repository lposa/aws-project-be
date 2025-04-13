import { APIGatewayEvent } from 'aws-lambda';
import { mockProducts } from '../../mockProducts';
import { COMMON_HEADERS, STATUS_CODES } from '../../utils/constants';

export const getProductById = async (event: APIGatewayEvent) => {
  try {
    const productId = event.pathParameters?.product_id;

    const product = mockProducts.find((product) => product.id.toString() === productId);

    if (!product) {
      return {
        statusCode: STATUS_CODES.NOT_FOUND,
        headers: COMMON_HEADERS,
        body: JSON.stringify({
          message: 'Product not found',
        }),
      };
    }

    return {
      statusCode: STATUS_CODES.OK,
      headers: COMMON_HEADERS,
      body: JSON.stringify(product),
    };
  } catch (error) {
    return {
      statusCode: STATUS_CODES.SERVER_ERROR,
      headers: COMMON_HEADERS,
      body: JSON.stringify({
        message: `Internal Server Error ${error}`,
      }),
    };
  }
};
