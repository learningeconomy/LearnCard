import { t } from '@routes';
import { customStorageRouter, CustomStorageRouter } from '@routes/customStorage';
import { indexRouter, IndexRouter } from '@routes/indexPlane';
import { storageRouter, StorageRouter } from '@routes/storage';
import { userRouter, UserRouter } from '@routes/user';
import { utilitiesRouter, UtilitiesRouter } from '@routes/utilities';

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
