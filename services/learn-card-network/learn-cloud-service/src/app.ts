import { t } from '@routes';
import { indexRouter } from '@routes/indexPlane';
import { userRouter } from '@routes/user';
import { utilitiesRouter } from '@routes/utilities';

export { createContext } from '@routes';

export const appRouter = t.router({
    index: indexRouter,
    user: userRouter,
    utilities: utilitiesRouter,
});
export type AppRouter = typeof appRouter;
