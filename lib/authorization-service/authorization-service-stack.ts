import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cdk from 'aws-cdk-lib';
import * as path from 'path';
import { Construct } from 'constructs';

export class AuthorizationServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const basicAuthorizerLambda = new lambda.Function(this, 'BasicAuthorizerLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handlers/basicAuthorizer.basicAuthorizer',
      code: lambda.Code.fromAsset(path.join(__dirname, './')),
      environment: {
        LPOSA: 'test1234',
      },
    });

    const api = new apigateway.RestApi(this, 'AuthorizationApi', {
      restApiName: 'Authorization Service API',
      description: 'API Gateway for the Basic Authorizer Lambda function',
    });

    const authorizerResource = api.root.addResource('authorizer');

    authorizerResource.addMethod('GET', new apigateway.LambdaIntegration(basicAuthorizerLambda), {
      authorizationType: apigateway.AuthorizationType.NONE,
    });

    new cdk.CfnOutput(this, 'APIGatewayURL', {
      value: api.url || 'Something went wrong with the API Gateway!',
      description: 'The API Gateway URL for testing the authorizer function',
    });
  }
}
