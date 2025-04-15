import { APIGatewayEvent } from 'aws-lambda';
import { mockProducts } from '../../mockProducts';
import { COMMON_HEADERS, STATUS_CODES } from '../../utils/constants';

/**
 * @swagger
 * /products/{product_id}:
 *   get:
 *     summary: Retrieve a single product by ID
 *     description: Fetches the product that matches the provided ID.
 *     parameters:
 *       - in: path
 *         name: product_id
 *         required: true
 *         description: The unique identifier for the product
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: Unique identifier for the product
 *                 name:
 *                   type: string
 *                   description: Name of the product
 *                 price:
 *                   type: number
 *                   description: Price of the product
 *                 description:
 *                   type: string
 *                   description: Short description of the product
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Product not found"
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
