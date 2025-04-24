#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ProductServiceStack } from '../lib/products-service/product-service-stack';
import { DatabaseStack } from '../lib/database/database-stack';

const app = new cdk.App();
new ProductServiceStack(app, 'ProductsService', {});
new DatabaseStack(app, 'DatabaseStack', {});
