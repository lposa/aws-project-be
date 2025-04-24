import { Handler } from 'aws-lambda';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { randomUUID } from 'crypto';

const dynamoDB = new DynamoDBClient({ region: process.env.AWS_REGION });
const tableName = process.env.TABLE_NAME as string;

export const addProductsHandler: Handler = async (event) => {
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
    await dynamoDB.send(command);

    console.log(`Product added: ${event.title}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Product successfully added!',
        product: {
          id: productId,
          title: event.title,
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
