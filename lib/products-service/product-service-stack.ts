import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cdk from 'aws-cdk-lib';
import * as path from 'path';
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import { Construct } from 'constructs';

export class ProductServiceStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const api = new apigateway.RestApi(this, "ProductsServiceApi", {
            restApiName: "Products Api Gateway",
            description: "API for Products"
        })

        const getProductsListLambda = new lambda.Function(this, 'getProductsList', {
            runtime: lambda.Runtime.NODEJS_20_X,
            memorySize: 1024,
            timeout: cdk.Duration.seconds(5),
            handler: 'getProductsList.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, './')),
        })

        const productsResource = api.root.addResource("products")

        const productsLambdaIntegration = new apigateway.LambdaIntegration(getProductsListLambda,{
            proxy: true
        })

        productsResource.addMethod("GET", productsLambdaIntegration)

        productsResource.addCorsPreflight({
            allowOrigins: ["https://d3iskzqmo4n6f4.cloudfront.net", "http://localhost:3000"],
            allowMethods: ["GET"],
        });

        const getProductByIdLambda = new lambda.Function(this, 'getProductById', {
            runtime: lambda.Runtime.NODEJS_20_X,
            memorySize: 1024,
            timeout: cdk.Duration.seconds(5),
            handler: 'getProductById.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, './')),
        })

        const productByIdResource = productsResource.addResource("{product_id}")

        const productByIdIntegration = new apigateway.LambdaIntegration(getProductByIdLambda, {
            proxy: true
        })

        productByIdResource.addMethod("GET", productByIdIntegration)

    }
}
