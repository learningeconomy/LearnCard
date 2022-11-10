import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import serverlessHttp from 'serverless-http';

import app from './src/app';
import { getLearnCard } from './src/learn-card';

const _handler = serverlessHttp(app);

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
    if ((event as any).source === 'serverless-plugin-warmup') {
        console.log('[Warmup] Initializing wallet...');
        await getLearnCard(); // Intentionally don't wait for the wallet to init!
        console.log('[Warmup] Done!');
        return 'All done! 😄';
    }

    return _handler(event, context);
};
