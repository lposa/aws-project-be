#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ProductServiceStack } from '../lib/products-service/product-service-stack';
import { DatabaseStack } from '../lib/database/database-stack';
import { ImportServiceStack } from '../lib/import-service-stack/import-service-stack';
import { AuthorizationServiceStack } from '../lib/authorization-service/authorization-service-stack';

const app = new cdk.App();
const productServiceStack = new ProductServiceStack(app, 'ProductsService');
new DatabaseStack(app, 'DatabaseStack', {});
new ImportServiceStack(app, 'ImportServiceStack', {
  catalogItemsQueue: productServiceStack.catalogItemsQueue,
});
new AuthorizationServiceStack(app, 'AuthorizationServiceStack', {});
