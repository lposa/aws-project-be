import { APIGatewayProxyResult } from 'aws-lambda';
import { mockProducts } from '../../mockProducts';
import { COMMON_HEADERS, STATUS_CODES } from '../../utils/constants';

export const getProductsList = async (): Promise<APIGatewayProxyResult> => {
  try {
    if (!mockProducts || mockProducts.length === 0) {
      return {
        statusCode: STATUS_CODES.NOT_FOUND,
        headers: COMMON_HEADERS,
        body: JSON.stringify({
          message: 'No products found',
        }),
      };
    }
    return {
      statusCode: STATUS_CODES.OK,
      headers: COMMON_HEADERS,
      body: JSON.stringify(mockProducts),
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
