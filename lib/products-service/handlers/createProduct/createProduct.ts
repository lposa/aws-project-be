import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { STATUS_CODES } from '../../utils/constants';
import { randomUUID } from 'crypto';

export const createProduct = async (
  event: APIGatewayProxyEvent,
  dynamoDBClient: DynamoDBClient = new DynamoDBClient({ region: process.env.AWS_REGION })
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
