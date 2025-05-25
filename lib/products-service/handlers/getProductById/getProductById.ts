import { APIGatewayEvent } from 'aws-lambda';
import { COMMON_HEADERS, STATUS_CODES } from '../../utils/constants';
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';

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

const dynamoDBClient: DynamoDBClient = new DynamoDBClient({ region: process.env.AWS_REGION });

export const getProductById = async (event: APIGatewayEvent) => {
  try {
    const productId = event.pathParameters?.product_id;
    const productsTableName = process.env.PRODUCTS_TABLE_NAME!;
    const stockTableName = process.env.STOCK_TABLE_NAME!;

    if (!productId) {
      return {
        statusCode: STATUS_CODES.NOT_FOUND,
        headers: COMMON_HEADERS,
        body: JSON.stringify({ message: 'Product ID is missing' }),
      };
    }

    const productsCommand = new GetItemCommand({
      TableName: productsTableName,
      Key: { id: { S: productId } },
    });

    const productResult = await dynamoDBClient.send(productsCommand);

    if (!productResult.Item) {
      return {
        statusCode: STATUS_CODES.NOT_FOUND,
        headers: COMMON_HEADERS,
        body: JSON.stringify({ message: `Product with ID ${productId} not found` }),
      };
    }

    const product = {
      id: productResult.Item?.id?.S,
      name: productResult.Item?.name?.S,
      description: productResult.Item?.description?.S,
      price: parseFloat(productResult.Item?.price?.N || '0'),
    };

    const stockCommand = new GetItemCommand({
      TableName: stockTableName,
      Key: { product_id: { S: productId } },
    });
    const stockResult = await dynamoDBClient.send(stockCommand);

    const stockCount = stockResult.Item?.count?.N ? parseInt(stockResult.Item.count.N, 10) : 0;

    const productWithStock = {
      ...product,
      stock: stockCount,
    };

    return {
      statusCode: STATUS_CODES.OK,
      headers: COMMON_HEADERS,
      body: JSON.stringify(productWithStock),
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
