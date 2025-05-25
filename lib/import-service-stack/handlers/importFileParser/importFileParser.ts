import { S3Event } from 'aws-lambda';
import { STATUS_CODES } from '../../utils/constants';
import { S3 } from '@aws-sdk/client-s3';
import * as stream from 'stream';
import csvParser from 'csv-parser';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

const sqsClient = new SQSClient({ region: process.env.AWS_REGION });

const s3Client: S3 = new S3();

export const importFileParser = async (event: S3Event) => {
  console.log('S3 Event:', JSON.stringify(event, null, 2));

  try {
    const bucketName = process.env.BUCKET_NAME;
    const catalogItemsQueueUrl = process.env.SQS_QUEUE_URL;

    if (!bucketName || !catalogItemsQueueUrl) {
      return {
        statusCode: STATUS_CODES.NOT_FOUND,
        body: JSON.stringify({ message: `Cant find bucket with name ${bucketName}` }),
      };
    }

    for (const record of event.Records) {
      const objectKey = record.s3.object.key;

      console.log(`Processing file: ${objectKey} from bucket: ${bucketName}`);

      const response = await s3Client.getObject({
        Bucket: bucketName!,
        Key: objectKey!,
      });

      const inputStream = response.Body as stream.Readable;
      await new Promise<void>((resolve, reject) => {
        inputStream
          .pipe(csvParser())
          .on('data', async (data) => {
            console.log('Parsed Record:', data);

            const normalizedData = {
              id: data.id || data.productId || '',
              name: data.name || '',
              description: data.description || '',
              price: parseFloat(data.price || 0),
              count: parseInt(data.count || 0, 10),
            };

            try {
              const sendMessageCommand = new SendMessageCommand({
                QueueUrl: catalogItemsQueueUrl!,
                MessageBody: JSON.stringify(normalizedData),
              });

              await sqsClient.send(sendMessageCommand);
              console.log(`Record sent to SQS: ${JSON.stringify(data)}`);
            } catch (err) {
              console.error(`Error sending record to SQS: ${JSON.stringify(data)}`, err);
              reject(err);
            }
          })
          .on('end', async () => {
            console.log(`Finished processing file: ${objectKey}`);

            const parsedKey = objectKey.replace('uploaded/', 'parsed/');

            try {
              await s3Client.copyObject({
                Bucket: bucketName!,
                CopySource: `${bucketName}/${objectKey}`,
                Key: parsedKey,
              });
              console.log(`File copied to: ${parsedKey}`);

              await s3Client.deleteObject({
                Bucket: bucketName!,
                Key: objectKey!,
              });
              console.log(`File deleted from: ${objectKey}`);
              resolve();
            } catch (err) {
              reject(err);
            }
          })
          .on('error', (error) => {
            console.error(`Error parsing file: ${objectKey}`, error);
            reject(error);
          });
      });
    }

    return {
      statusCode: STATUS_CODES.OK,
      body: JSON.stringify({ message: 'File processed successfully' }),
    };
  } catch (error) {
    return {
      statusCode: STATUS_CODES.SERVER_ERROR,
      body: JSON.stringify({ message: 'Failed t process file', error }),
    };
  }
};
