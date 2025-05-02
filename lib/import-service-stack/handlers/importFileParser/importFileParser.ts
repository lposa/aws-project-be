import { S3Event } from 'aws-lambda';
import { STATUS_CODES } from '../../utils/constants';
import { S3 } from '@aws-sdk/client-s3';
import * as stream from 'stream';
import csvParser from 'csv-parser';

export const importFileParser = async (event: S3Event, s3Client: S3 = new S3()) => {
  console.log('S3 Event:', JSON.stringify(event, null, 2));

  try {
    const bucketName = process.env.BUCKET_NAME;

    if (!bucketName) {
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
          .on('data', (data) => {
            console.log('Parsed Record:', data);
          })
          .on('end', async () => {
            console.log(`Finished processing file: ${objectKey}`);

            // Define the destination key (parsed/ folder)
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
