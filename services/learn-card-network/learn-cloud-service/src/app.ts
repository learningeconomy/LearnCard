import { t } from '@routes';
import { customStorageRouter, type CustomStorageRouter } from '@routes/customStorage';
import { indexRouter, type IndexRouter } from '@routes/indexPlane';
import { storageRouter, type StorageRouter } from '@routes/storage';
import { userRouter, type UserRouter } from '@routes/user';
import { utilitiesRouter, type UtilitiesRouter } from '@routes/utilities';

export { createContext } from '@routes';

export const appRouter = t.router<{
    customStorage: CustomStorageRouter;
    index: IndexRouter;
    storage: StorageRouter;
    user: UserRouter;
    utilities: UtilitiesRouter;
}>({
    customStorage: customStorageRouter,
    index: indexRouter,
    storage: storageRouter,
    user: userRouter,
    utilities: utilitiesRouter,
});
export type AppRouter = typeof appRouter;
