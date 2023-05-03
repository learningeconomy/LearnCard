import { t } from '@routes';
import { indexRouter } from '@routes/indexPlane';
import { utilitiesRouter } from '@routes/utilities';

export { createContext } from '@routes';

export const appRouter = t.router({
    index: indexRouter,
    utilities: utilitiesRouter,
});
export type AppRouter = typeof appRouter;
