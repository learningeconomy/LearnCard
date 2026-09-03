import { t } from '@routes';
import { notificationsRouter } from '@routes/notifications';
import { utilitiesRouter } from '@routes/utilities';
import { signingAuthorityRouter } from '@routes/signing-authority';
import { credentialsRouter } from '@routes/credentials';
import { aiRouter } from '@routes/ai';
import { pinsRouter } from '@routes/pins';
import { firebaseRouter } from '@routes/firebase';
import { analyticsRouter } from '@routes/analytics';
export { createContext } from '@routes';
import { preferencesRouter } from '@routes/preferences';
import { keysRouter } from '@routes/keys';
import { qrLoginRouter } from '@routes/qr-login';
import { testRouter, type TestRouter } from '@routes/test';

const routes = {
    notifications: notificationsRouter,
    utilities: utilitiesRouter,
    signingAuthority: signingAuthorityRouter,
    credentials: credentialsRouter,
    ai: aiRouter,
    pins: pinsRouter,
    firebase: firebaseRouter,
    analytics: analyticsRouter,
    preferences: preferencesRouter,
    keys: keysRouter,
    qrLogin: qrLoginRouter,
};

export const appRouter = t.router<typeof routes & { test?: TestRouter }>({
    ...routes,
    // E2E-only observability routes (see routes/test.ts); undefined in production.
    test: process.env.IS_E2E_TEST ? testRouter : undefined,
});
export type AppRouter = typeof appRouter;
