import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Context } from 'aws-lambda';
import serverlessHttp from 'serverless-http';

import app from './src/app';
import { getLearnCard } from './src/learn-card';

const _handler = serverlessHttp(app);

export const handler = async (
    event: APIGatewayProxyEventV2 & { source?: string },
    context: Context
): Promise<APIGatewayProxyResultV2> => {
    if (event.source === 'serverless-plugin-warmup') {
        await getLearnCard();
        return 'Warmed up!';
    }

    return (await _handler(event, context)) as APIGatewayProxyResultV2;
};
