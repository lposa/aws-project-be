import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { randomUUID } from 'crypto';
const tableName = process.env.TABLE_NAME as string;

export interface AddProductEvent {
  name?: string;
  description?: string;
  price?: number;
}

export const addProductsHandler = async (
  event: AddProductEvent,
  dynamoDBClient: DynamoDBClient = new DynamoDBClient({ region: process.env.AWS_REGION })
) => {
  try {
    if (!event.name || !event.description || !event.price) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'Invalid input. Ensure title, description, and price are provided.',
        }),
      };
    }

    const productId = randomUUID();

    const params = {
      TableName: tableName,
      Item: {
        id: { S: productId },
        name: { S: event.name },
        description: { S: event.description },
        price: { N: event.price.toString() },
      },
    };

    const command = new PutItemCommand(params);
    await dynamoDBClient.send(command);

    console.log(`Product added: ${event.name}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Product successfully added!',
        product: {
          id: productId,
          title: event.name,
          description: event.description,
          price: event.price,
        },
      }),
    };
  } catch (error) {
    console.error('Error adding products:', error);
    throw new Error('Error adding item to DynamoDB table');
  }
};
