import { APIGatewayEvent } from 'aws-lambda';

const decodeBasicToken = (authHeader: string) => {
  const token = authHeader.split(' ')[1];
  const decodedToken = Buffer.from(token, 'base64').toString('utf-8');
  const [username, password] = decodedToken.split(':');
  return { username, password };
};

export const validateCredentials = (credentials: {
  username: string;
  password: string;
}): boolean => {
  const { username, password } = credentials;

  const expectedPassword = process.env[username.toUpperCase()];
  return expectedPassword === password;
};

export const basicAuthorizer = async (event: APIGatewayEvent) => {
  console.log('Event received', event);

  const authHeader = event.headers.Authorization || event.headers.authorization;

  if (!authHeader) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: 'Authorization header is missing' }),
    };
  }

  try {
    const credentials = decodeBasicToken(authHeader);

    const isAuthorized = validateCredentials(credentials);

    if (!isAuthorized) {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: 'Access denied: Invalid credentials' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Access granted!' }),
    };
  } catch (error) {
    console.error('Error during authorization:', error);

    return {
      statusCode: 403,
      body: JSON.stringify({ message: 'Access denied: Error during processing' }),
    };
  }
};
