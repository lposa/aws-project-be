import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cdk from 'aws-cdk-lib';
import * as path from 'path';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import { TABLE_NAMES } from '../database/database-stack';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

const LAMBDA_EXCLUDE_FILES = [
  'tests/**/*',
  '**/*.test.ts',
  '**/*.test.js',
  '**/*.spec.ts',
  '**/*.spec.js',
];

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const api = new apigateway.RestApi(this, 'ProductsServiceApi', {
      restApiName: 'Products Api Gateway',
      description: 'API for Products',
    });

    const productsTable = dynamodb.Table.fromTableName(
      this,
      'ProductsTableRef',
      TABLE_NAMES.PRODUCTS
    );
    const stockTable = dynamodb.Table.fromTableName(this, 'StockTableRef', TABLE_NAMES.STOCK);

    const getProductsListLambda = new lambda.Function(this, 'getProductsList', {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      handler: 'handlers/getProductsList/getProductsList.getProductsList',
      code: lambda.Code.fromAsset(path.join(__dirname, './'), {
        exclude: LAMBDA_EXCLUDE_FILES,
      }),
      environment: {
        PRODUCTS_TABLE_NAME: TABLE_NAMES.PRODUCTS,
        STOCK_TABLE_NAME: TABLE_NAMES.STOCK,
      },
    });

    productsTable.grantReadData(getProductsListLambda);
    stockTable.grantReadData(getProductsListLambda);

    const productsResource = api.root.addResource('products');

    const productsLambdaIntegration = new apigateway.LambdaIntegration(getProductsListLambda, {
      proxy: true,
    });

    productsResource.addMethod('GET', productsLambdaIntegration);

    productsResource.addCorsPreflight({
      allowOrigins: ['https://d3iskzqmo4n6f4.cloudfront.net', 'http://localhost:3000'],
      allowMethods: ['GET'],
    });

    const getProductByIdLambda = new lambda.Function(this, 'getProductById', {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      handler: 'handlers/getProductById/getProductById.getProductById',
      code: lambda.Code.fromAsset(path.join(__dirname, './'), {
        exclude: LAMBDA_EXCLUDE_FILES,
      }),
      environment: {
        PRODUCTS_TABLE_NAME: TABLE_NAMES.PRODUCTS,
        STOCK_TABLE_NAME: TABLE_NAMES.STOCK,
      },
    });

    productsTable.grantReadData(getProductByIdLambda);
    stockTable.grantReadData(getProductByIdLambda);

    const productByIdResource = productsResource.addResource('{product_id}');

    const productByIdIntegration = new apigateway.LambdaIntegration(getProductByIdLambda, {
      proxy: true,
    });

    productByIdResource.addMethod('GET', productByIdIntegration);

    const createProductLambda = new lambda.Function(this, 'createProductLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      handler: 'handlers/createProduct/createProduct.createProduct',
      code: lambda.Code.fromAsset(path.join(__dirname, './'), {
        exclude: LAMBDA_EXCLUDE_FILES,
      }),
      environment: {
        PRODUCTS_TABLE_NAME: TABLE_NAMES.PRODUCTS,
        STOCK_TABLE_NAME: TABLE_NAMES.STOCK,
      },
    });

    const createProductIntegration = new apigateway.LambdaIntegration(createProductLambda, {
      proxy: true,
    });

    productsResource.addMethod('POST', createProductIntegration);

    productsTable.grantWriteData(createProductLambda);
    stockTable.grantWriteData(createProductLambda);
  }
}
