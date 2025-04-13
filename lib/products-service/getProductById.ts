import {APIGatewayEvent} from "aws-lambda";
import { mockProducts } from "./mockProducts";


export const handler = async (event: APIGatewayEvent) => {
    const productId = event.pathParameters?.product_id;



    const product = mockProducts.find((product) => product.id.toString() === productId);

    if (!product) {
        return {
            statusCode: 404,
            body: JSON.stringify({
                message: "Product not found"
            })
        }
    }

    return {
        statusCode: 200,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Headers" : "Content-Type",
            "Access-Control-Allow-Origin": "http://localhost:3000",
            "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
        },
        body: JSON.stringify(product)
    }
}
