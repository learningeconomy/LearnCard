import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import serverlessHttp from 'serverless-http';

import app from './src/app';
import { getWallet } from './src/wallet';

const _handler = serverlessHttp(app);

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
    if ((event as any).source === 'serverless-plugin-warmup') {
        console.log('[Warmup] Initializing wallet...');
        await getWallet(); // Intentionally don't wait for the wallet to init!
        console.log('[Warmup] Done!');
        return 'All done! 😄';
    }

    return _handler(event, context);
};
