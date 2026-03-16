/**
 * Strip the email from a Firebase user by UID.
 *
 * Usage:
 *   npx tsx scripts/strip-email.ts <uid>
 *
 * Requires GOOGLE_APPLICATION_CREDENTIAL env var (same as the API server).
 *
 * The Admin SDK's updateUser() cannot remove an email — it only accepts
 * a non-empty string. So we call the Identity Toolkit REST API directly
 * with deleteAttribute: ['EMAIL'].
 */
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import { GoogleAuth } from 'google-auth-library';

dotenv.config();

const uid = process.argv[2];

if (!uid) {
    console.error('Usage: npx tsx scripts/strip-email.ts <uid>');
    process.exit(1);
}

const credentialJson = process.env.GOOGLE_APPLICATION_CREDENTIAL;

if (!credentialJson) {
    console.error('GOOGLE_APPLICATION_CREDENTIAL env var is not set.');
    process.exit(1);
}

const serviceAccount = JSON.parse(credentialJson);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

async function main() {
    const before = await admin.auth().getUser(uid);
    console.log(`Before — uid: ${before.uid}, email: ${before.email ?? '(none)'}, phone: ${before.phoneNumber ?? '(none)'}`);

    // Use the Identity Toolkit REST API to delete the email attribute.
    // The Admin SDK doesn't expose this capability.
    const googleAuth = new GoogleAuth({
        credentials: serviceAccount,
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });

    const accessToken = await googleAuth.getAccessToken();

    const projectId = serviceAccount.project_id;
    const url = `https://identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts:update`;

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
            localId: uid,
            deleteAttribute: ['EMAIL'],
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Identity Toolkit error (${res.status}): ${err}`);
    }

    const after = await admin.auth().getUser(uid);
    console.log(`After  — uid: ${after.uid}, email: ${after.email ?? '(none)'}, phone: ${after.phoneNumber ?? '(none)'}`);

    console.log('Done.');
    process.exit(0);
}

main().catch(err => {
    console.error('Failed:', err);
    process.exit(1);
});
