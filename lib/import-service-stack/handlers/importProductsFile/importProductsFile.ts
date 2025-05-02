import { APIGatewayEvent } from 'aws-lambda';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PutObjectCommand, S3 } from '@aws-sdk/client-s3';
import { COMMON_HEADERS, STATUS_CODES } from '../../utils/constants';

export const importProductsFile = async (event: APIGatewayEvent, s3Client: S3 = new S3()) => {
  try {
    const fileName = event.queryStringParameters?.fileName;

    if (!fileName) {
      return {
        statusCode: STATUS_CODES.NOT_FOUND,
        headers: COMMON_HEADERS,
        body: JSON.stringify({ message: 'File Name is missing!' }),
      };
    }

    const bucketName = process.env.BUCKET_NAME;
    const objectKey = `uploaded/${fileName}`;

    const signedUrl = await getSignedUrl(
      s3Client,
      new PutObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
        ContentType: 'text/csv',
      }),
      {
        expiresIn: 300,
      }
    );

    return {
      statusCode: STATUS_CODES.OK,
      headers: COMMON_HEADERS,
      body: JSON.stringify({ signedUrl }),
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
