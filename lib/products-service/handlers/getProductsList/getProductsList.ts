import { APIGatewayProxyResult } from 'aws-lambda';
import { COMMON_HEADERS, STATUS_CODES } from '../../utils/constants';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';

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

const dynamoDBClient: DynamoDBClient = new DynamoDBClient({ region: process.env.AWS_REGION });

export const getProductsList = async (): Promise<APIGatewayProxyResult> => {
  try {
    const productsTableName = process.env.PRODUCTS_TABLE_NAME!;
    const stockTableName = process.env.STOCK_TABLE_NAME!;

    const productsCommand = new ScanCommand({ TableName: productsTableName });
    const productsData = await dynamoDBClient.send(productsCommand);

    if (!productsData.Items || productsData.Items.length === 0) {
      return {
        statusCode: STATUS_CODES.NOT_FOUND,
        headers: COMMON_HEADERS,
        body: JSON.stringify({ message: 'No products found' }),
      };
    }

    const products = productsData.Items.map((item) => ({
      id: item.id.S,
      name: item.name.S,
      description: item.description.S,
      price: parseFloat(item.price.N || '0'),
    }));

    const stockCommand = new ScanCommand({ TableName: stockTableName });
    const stockData = await dynamoDBClient.send(stockCommand);

    const stock = stockData?.Items?.map((item) => ({
      product_id: item.product_id.S,
      count: parseInt(item.count.N || '0', 10),
    }));

    const productsWithStock = products.map((product) => ({
      ...product,
      stock: stock?.find((s) => s.product_id === product.id)?.count || 0,
    }));

    return {
      statusCode: STATUS_CODES.OK,
      headers: COMMON_HEADERS,
      body: JSON.stringify(productsWithStock),
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
