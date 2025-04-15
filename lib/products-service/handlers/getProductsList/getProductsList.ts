import { APIGatewayProxyResult } from 'aws-lambda';
import { mockProducts } from '../../mockProducts';
import { COMMON_HEADERS, STATUS_CODES } from '../../utils/constants';

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Retrieve the list of products
 *     description: Fetches all products stored in the Product Service.
 *     responses:
 *       200:
 *         description: List of products fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: Unique identifier for the product
 *                   name:
 *                     type: string
 *                     description: Name of the product
 *                   price:
 *                     type: number
 *                     description: Price of the product
 *                   description:
 *                     type: string
 *                     description: Short description of the product
 *       404:
 *         description: No products were found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No products found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal Server Error {error}"
 */

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
