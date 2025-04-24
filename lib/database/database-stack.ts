import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cdk from 'aws-cdk-lib';
import { join } from 'path';

export const enum TABLE_NAMES {
  PRODUCTS = 'products',
  STOCK = 'stock',
}

export class DatabaseStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const productsTable = dynamodb.Table.fromTableName(this, 'products', TABLE_NAMES.PRODUCTS);

    const addProductsLambda = new lambda.Function(this, 'add-products-db', {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      handler: 'handlers/addProducts/addProductsHandler.addProductsHandler',
      code: lambda.Code.fromAsset(join(__dirname, './')),
      environment: {
        TABLE_NAME: TABLE_NAMES.PRODUCTS,
      },
    });

    productsTable.grantWriteData(addProductsLambda);

    const stockTable = dynamodb.Table.fromTableName(this, 'stock', TABLE_NAMES.STOCK);

    const addStockLambda = new lambda.Function(this, 'add-stock-db', {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      handler: 'handlers/addStock/addStockHandler.addStockHandler',
      code: lambda.Code.fromAsset(join(__dirname, './')),
      environment: {
        PRODUCTS_TABLE_NAME: productsTable.tableName,
        STOCK_TABLE_NAME: stockTable.tableName,
      },
    });

    stockTable.grantWriteData(addStockLambda);
    productsTable.grantReadData(addStockLambda);
  }
}
