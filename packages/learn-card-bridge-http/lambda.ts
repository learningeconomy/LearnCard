import serverlessHttp from 'serverless-http';
import app from './src/app';

export const handler = serverlessHttp(app);
