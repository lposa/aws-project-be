import { Handler } from 'aws-lambda';
import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';

const dynamoDB = new DynamoDBClient({ region: process.env.AWS_REGION });
const productsTableName = process.env.PRODUCTS_TABLE_NAME as string;
const stockTableName = process.env.STOCK_TABLE_NAME as string;

export const addStockHandler: Handler = async (event) => {
  try {
    const { product_id, count } = event;

    if (!product_id || !count) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'Invalid input. Ensure product_id and count are provided.',
        }),
      };
    }

    const checkProductCommand = new GetItemCommand({
      TableName: productsTableName,
      Key: {
        id: { S: product_id },
      },
    });

    const productResult = await dynamoDB.send(checkProductCommand);

    if (!productResult.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: `Product with ID ${product_id} does not exist.`,
        }),
      };
    }

    console.log(`Validated that product_id ${product_id} exists`);

    const stockItemCommand = new PutItemCommand({
      TableName: stockTableName,
      Item: {
        product_id: { S: product_id },
        count: { N: count.toString() },
      },
    });

    await dynamoDB.send(stockItemCommand);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Stock successfully added for product_id: ${product_id}`,
        stock: {
          product_id,
          count,
        },
      }),
    };
  } catch (error) {
    console.error('Error adding stock:', error);
    throw new Error('Error adding item to DynamoDB table');
  }
};
