import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3_deployment from 'aws-cdk-lib/aws-s3-deployment';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-lambda-event-sources';
import path from 'path';

const LAMBDA_EXCLUDE_FILES = [
  'tests/**/*',
  '**/*.test.ts',
  '**/*.test.js',
  '**/*.spec.ts',
  '**/*.spec.js',
];

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const api = new apigateway.RestApi(this, 'ImportServiceApi', {
      restApiName: 'Import Service Api Gateway',
      description: 'API for Import Service',
    });

    const bucket = new s3.Bucket(this, 'ImportBucket', {
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    new s3_deployment.BucketDeployment(this, 'UploadedFolderDeployment', {
      sources: [s3_deployment.Source.data('dummy.txt', '')],
      destinationBucket: bucket,
      destinationKeyPrefix: 'uploaded/',
    });

    new cdk.CfnOutput(this, 'ImportedBucketNameOutput', {
      value: bucket.bucketName,
      description: 'S3 Bucket for Import Service',
    });

    const importProductsFileLambda = new lambda.Function(this, 'importProductsFile', {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      handler: 'handlers/importProductsFile/importProductsFile.importProductsFile',
      code: lambda.Code.fromAsset(path.join(__dirname, './'), {
        exclude: LAMBDA_EXCLUDE_FILES,
      }),
      environment: {
        BUCKET_NAME: bucket.bucketName,
      },
    });

    bucket.grantReadWrite(importProductsFileLambda);

    const importProductsFileResource = api.root.addResource('import');

    const importProductsFileIntegration = new apigateway.LambdaIntegration(
      importProductsFileLambda,
      {
        proxy: true,
      }
    );

    importProductsFileResource.addMethod('GET', importProductsFileIntegration);

    importProductsFileResource.addCorsPreflight({
      allowOrigins: ['https://d3iskzqmo4n6f4.cloudfront.net', 'http://localhost:3000'],
      allowMethods: ['GET', 'PUT'],
    });

    const importFileParserLambda = new lambda.Function(this, 'importFileParser', {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      handler: 'handlers/importFileParser/importFileParser.importFileParser',
      code: lambda.Code.fromAsset(path.join(__dirname, './'), {
        exclude: LAMBDA_EXCLUDE_FILES,
      }),
      environment: {
        BUCKET_NAME: bucket.bucketName,
      },
    });

    bucket.grantReadWrite(importFileParserLambda);
    bucket.grantDelete(importFileParserLambda);

    importFileParserLambda.addEventSource(
      new events.S3EventSource(bucket, {
        events: [s3.EventType.OBJECT_CREATED],
        filters: [{ prefix: 'uploaded/' }],
      })
    );
  }
}
