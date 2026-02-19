import dotenv from 'dotenv';
import admin from 'firebase-admin';

dotenv.config();

let serviceAccount: admin.ServiceAccount | string = '';

try {
    if (process.env.GOOGLE_APPLICATION_CREDENTIAL) {
        serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIAL);
        console.log('Google Application Credential parsed successfully');
    }
} catch (error) {
    console.error('Invalid Google Application Credential JSON! Ignoring...');
}

const app = serviceAccount
    ? admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
    : undefined;

export default app;
