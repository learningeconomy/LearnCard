import dotenv from 'dotenv';
import admin from 'firebase-admin';

dotenv.config();

let serviceAccount: admin.ServiceAccount | string = '';

try {
    if (process.env.GOOGLE_APPLICATION_CREDENTIAL) {
        const parsed = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIAL);
        if (typeof parsed.private_key === 'string') {
            parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
        }
        serviceAccount = parsed;
        console.log('Google Application Credential parsed successfully');
    }
} catch (error) {
    console.error('Invalid Google Application Credential JSON! Ignoring...', error);
}

const app = serviceAccount
    ? admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
    : undefined;

export default app;
