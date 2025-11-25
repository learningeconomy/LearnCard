import dotenv from 'dotenv';
import { ServerClient } from 'postmark';

dotenv.config();

let postmarkClient: ServerClient | null = null;

if (process.env.POSTMARK_SERVER_TOKEN) {
    postmarkClient = new ServerClient(process.env.POSTMARK_SERVER_TOKEN);
} else {
    console.warn('No POSTMARK_SERVER_TOKEN found; email sending disabled.');
}

export const getPostmarkClient = (): ServerClient => {
    if (!postmarkClient) {
        throw new Error('Postmark client is not initialized');
    }
    return postmarkClient;
};
