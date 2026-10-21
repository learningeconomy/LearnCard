import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Context } from 'aws-lambda';
import serverlessHttp from 'serverless-http';

import app from './src/app';

const _handler = serverlessHttp(app);

export const handler = async (
    event: APIGatewayProxyEventV2,
    context: Context
): Promise<APIGatewayProxyResultV2> => {
    return (await _handler(event, context)) as APIGatewayProxyResultV2;
};
