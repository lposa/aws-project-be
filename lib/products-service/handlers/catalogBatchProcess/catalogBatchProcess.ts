import { SQSEvent } from 'aws-lambda';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const dynamoDBClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const snsClient = new SNSClient({ region: process.env.AWS_REGION });

const sendEmailSNS = async (
  id: string,
  name: string,
  description: string,
  price: string,
  count: string
) => {
  try {
    const snsMessage = {
      id,
      name,
      description,
      price,
      count,
    };

    console.log('Publishing SNS Message:', snsMessage);

    const publishCommand = new PublishCommand({
      TopicArn: process.env.SNS_TOPIC_ARN,
      Message: JSON.stringify(snsMessage),
      Subject: 'AWS Project - New Product Created',
    });

    const snsResponse = await snsClient.send(publishCommand);
    console.log('SNS Publish Response:', snsResponse);
  } catch (error) {
    console.error(`Error sending SNS: ${error}`);
    throw error;
  }
};

export const catalogBatchProcess = async (event: SQSEvent) => {
  try {
    for (const record of event.Records) {
      const messageBody = JSON.parse(record.body);

      console.log('Processing message:', messageBody);

      if (!messageBody) {
        console.error('No message was found.', record);
      }

      const { id, name, description, price, count } = messageBody;

      const productItem = {
        id: { S: id || '' },
        name: { S: name || '' },
        description: { S: description || '' },
        price: { N: price || 0 },
      };

      const productCommand = new PutItemCommand({
        TableName: process.env.PRODUCTS_TABLE_NAME!,
        Item: productItem,
      });

      await dynamoDBClient.send(productCommand);
      console.log(`Inserted product: ${id}`);

      const stockItem = {
        product_id: { S: id || '' },
        count: { N: count || 0 },
      };

      const stockCommand = new PutItemCommand({
        TableName: process.env.STOCK_TABLE_NAME!,
        Item: stockItem,
      });

      await dynamoDBClient.send(stockCommand);
      console.log(`Inserted stock for product: ${id}`);

      await sendEmailSNS(id, name, description, price, count);
    }
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Batch processed successfully' }),
    };
  } catch (error) {
    console.error('Error processing batch', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Batch processing failed', error: (error as Error).message }),
    };
  }
};
