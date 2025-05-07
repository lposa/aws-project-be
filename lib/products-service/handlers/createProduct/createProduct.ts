import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { STATUS_CODES } from '../../utils/constants';
import { randomUUID } from 'crypto';

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product
 *     description: Adds a new product to the DynamoDB database, along with its stock information.
 *     requestBody:
 *       required: true
 *       description: The product details.
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - price
 *               - count
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the product.
 *                 example: "The Last of Us Part II"
 *               description:
 *                 type: string
 *                 description: A short description of the product.
 *                 example: "Joel and Ellie continue their journey."
 *               price:
 *                 type: number
 *                 description: The price of the product.
 *                 example: 59.99
 *               count:
 *                 type: integer
 *                 description: Initial stock count for the product.
 *                 example: 100
 *     responses:
 *       201:
 *         description: Product created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Product created successfully!"
 *                 product:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: The unique identifier of the created product.
 *                       example: "123e4567-e89b-12d3-a456-426614174000"
 *                     name:
 *                       type: string
 *                       description: Name of the product.
 *                       example: "The Last of Us Part II"
 *                     description:
 *                       type: string
 *                       description: Description of the product.
 *                       example: "Joel and Ellie continue their journey."
 *                     price:
 *                       type: number
 *                       description: Price of the product.
 *                       example: 59.99
 *                     stock:
 *                       type: integer
 *                       description: Initial stock count of the product.
 *                       example: 100
 *       400:
 *         description: Missing required product attributes.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Missing required product attributes"
 *       500:
 *         description: Internal Server Error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Failed to create product. Error goes here."
 */

const dynamoDBClient: DynamoDBClient = new DynamoDBClient({ region: process.env.AWS_REGION });

export const createProduct = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const body = event.body ? JSON.parse(event.body) : null;

    if (!body.name || !body.description || !body.price || !body.count) {
      return {
        statusCode: STATUS_CODES.NOT_FOUND,
        body: JSON.stringify({
          message: 'Missing required product attributes',
        }),
      };
    }

    const productId = randomUUID();

    const productItem = {
      id: { S: productId },
      name: { S: body.name },
      description: { S: body.description || '' },
      price: { N: body.price.toString() },
    };

    const stockItem = {
      product_id: { S: productId },
      count: { N: body.count.toString() },
    };

    const command = new PutItemCommand({
      TableName: process.env.PRODUCTS_TABLE_NAME!,
      Item: productItem,
    });

    console.log(command);

    await dynamoDBClient.send(command);

    const stockCommand = new PutItemCommand({
      TableName: process.env.STOCK_TABLE_NAME!,
      Item: stockItem,
    });

    await dynamoDBClient.send(stockCommand);

    return {
      statusCode: STATUS_CODES.CREATED,
      body: JSON.stringify({
        message: 'Product created successfully!',
        product: {
          id: productId,
          name: body.name,
          description: body.description || '',
          price: parseFloat(body.price),
          stock: parseInt(body.count, 10),
        },
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: `Failed to create product. ${error}`,
      }),
    };
  }
};
