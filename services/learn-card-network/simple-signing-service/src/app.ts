import { t } from '@routes';
import { utilitiesRouter } from '@routes/utilities';
import { signingAuthorityRouter } from '@routes/signing-authority';
import { credentialsRouter } from '@routes/credentials';

export { createContext } from '@routes';

export const appRouter = t.router({
    utilities: utilitiesRouter,
    signingAuthority: signingAuthorityRouter,
    credentials: credentialsRouter,
});
export type AppRouter = typeof appRouter;
