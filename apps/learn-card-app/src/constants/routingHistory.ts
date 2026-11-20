import { createBrowserHistory } from 'history';

/** The router and Sentry must observe the same history, rather than window.history. */
export const routingHistory = createBrowserHistory();
