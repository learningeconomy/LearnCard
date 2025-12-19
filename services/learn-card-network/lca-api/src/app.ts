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

export const appRouter = t.router({
    notifications: notificationsRouter,
    utilities: utilitiesRouter,
    signingAuthority: signingAuthorityRouter,
    credentials: credentialsRouter,
    ai: aiRouter,
    pins: pinsRouter,
    firebase: firebaseRouter,
    analytics: analyticsRouter,
    preferences: preferencesRouter,
});
export type AppRouter = typeof appRouter;
