/**
 * Optional local Firebase Auth emulator check. See FIREBASE-OTP-EMULATOR.md.
 * The Auth emulator accepts deliberately unsigned custom tokens; production does not.
 */
import { strict as assert } from 'node:assert';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';

// The Firebase web SDK is a LearnCard App dependency. Resolve it from that
// workspace rather than adding it as a production dependency of lca-api.
const requireFromApp = createRequire(
    new URL('../../../../apps/learn-card-app/package.json', import.meta.url)
);
const { initializeApp, deleteApp } = requireFromApp('firebase/app');
const { hasFirebaseOtpEmailProof } = requireFromApp('@learncard/helpers');
const {
    getAuth,
    connectAuthEmulator,
    createUserWithEmailAndPassword,
    signOut,
    signInWithCustomToken,
    getIdTokenResult,
} = requireFromApp('firebase/auth');

const projectId = 'demo-lc-otp-proof';
const emulatorHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
if (!emulatorHost || !/^(?:127\.0\.0\.1|localhost):\d+$/.test(emulatorHost)) {
    throw new Error('FIREBASE_AUTH_EMULATOR_HOST must refer to a local Auth emulator');
}

const email = `otp-${randomUUID()}@example.invalid`;
const verifiedAt = Math.floor(Date.now() / 1000);
const base64 = value => Buffer.from(JSON.stringify(value)).toString('base64url');

try {
    const app = initializeApp({ apiKey: 'demo-only', projectId });
    const auth = getAuth(app);
    connectAuthEmulator(auth, `http://${emulatorHost}`, { disableWarnings: true });

    const credential = await createUserWithEmailAndPassword(auth, email, randomUUID());
    const uid = credential.user.uid;
    await signOut(auth);

    // The temporary token and all claims are synthetic; never use alg:none
    // with any real Firebase project or outside this emulator-only check.
    const token = [
        base64({ alg: 'none', typ: 'JWT' }),
        base64({
            iss: 'emulator@example.invalid',
            sub: 'emulator@example.invalid',
            aud: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit',
            iat: verifiedAt,
            exp: verifiedAt + 3600,
            uid,
            claims: { lc_otp_verified_email: email, lc_otp_verified_at: verifiedAt },
        }),
        '',
    ].join('.');

    const signedIn = await signInWithCustomToken(auth, token);
    const initial = await getIdTokenResult(signedIn.user);
    const refreshed = await getIdTokenResult(signedIn.user, true);
    for (const { claims } of [initial, refreshed]) {
        assert.equal(claims.email, email);
        assert.equal(claims.email_verified, false);
        assert.equal(claims.lc_otp_verified_email, email);
        assert.equal(claims.lc_otp_verified_at, verifiedAt);
        assert.equal(claims.firebase.sign_in_provider, 'custom');
        assert.equal(claims.iss, `https://securetoken.google.com/${projectId}`);
        assert.equal(claims.aud, projectId);
        assert.equal(hasFirebaseOtpEmailProof(claims), true);
    }

    await signOut(auth);
    await deleteApp(app);
    console.log('Initial and forced-refresh ID tokens retained the OTP proof claims.');
} catch {
    // Avoid printing ID/custom/refresh tokens from any SDK error object.
    console.error('Firebase Auth emulator OTP proof check failed.');
    process.exitCode = 1;
}
