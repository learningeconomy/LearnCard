import './sentry';
import { t } from '@routes';
import { customStorageRouter } from '@routes/customStorage';
import { indexRouter } from '@routes/indexPlane';
import { storageRouter } from '@routes/storage';
import { userRouter } from '@routes/user';
import { utilitiesRouter } from '@routes/utilities';

export { createContext } from '@routes';

export const appRouter = t.router({
    customStorage: customStorageRouter,
    index: indexRouter,
    storage: storageRouter,
    user: userRouter,
    utilities: utilitiesRouter,
});
export type AppRouter = typeof appRouter;
