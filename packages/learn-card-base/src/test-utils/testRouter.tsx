import React, { createContext, useContext } from 'react';
import { createBrowserRouter, createMemoryRouter, RouterProvider } from 'react-router';
import type { Location, NavigationType, To } from 'react-router';

/**
 * Test router for components that navigate. A memory data router whose single splat route renders
 * the children of `<TestRouter>`, so descendant `<Routes>` keep absolute paths, plus a small
 * history-shaped handle for driving and asserting navigation from tests.
 */
export type TestHistory = {
    readonly router: ReturnType<typeof createMemoryRouter | typeof createBrowserRouter>;
    readonly location: Location;
    readonly action: NavigationType;
    /** `ACTION /path?search#hash` for every navigation committed since creation. */
    readonly entries: readonly string[];
    push: (to: To, state?: unknown) => Promise<void>;
    replace: (to: To, state?: unknown) => Promise<void>;
    goBack: () => Promise<void>;
};

const SlotContext = createContext<React.ReactNode>(null);
const Slot: React.FC = () => <>{useContext(SlotContext)}</>;

export const createTestHistory = ({
    initialEntries = ['/'],
    initialIndex,
    browser = false,
}: {
    initialEntries?: string[];
    initialIndex?: number;
    /** Use the jsdom window's history (and its current URL) instead of memory. */
    browser?: boolean;
} = {}): TestHistory => {
    const routes = [{ path: '*', element: <Slot /> }];
    const router = browser
        ? createBrowserRouter(routes)
        : createMemoryRouter(routes, { initialEntries, initialIndex });
    const entries: string[] = [];
    router.subscribe(state => {
        if (state.navigation.state !== 'idle') return;
        const { pathname, search, hash } = state.location;
        entries.push(`${state.historyAction} ${pathname}${search}${hash}`);
    });
    return {
        router,
        get location() {
            return router.state.location;
        },
        get action() {
            return router.state.historyAction;
        },
        get entries() {
            return entries;
        },
        push: (to, state) => router.navigate(to, { state }),
        replace: (to, state) => router.navigate(to, { replace: true, state }),
        goBack: () => router.navigate(-1),
    };
};

export const TestRouter: React.FC<{ history: TestHistory; children?: React.ReactNode }> = ({
    history,
    children,
}) => (
    <SlotContext.Provider value={children}>
        <RouterProvider router={history.router} />
    </SlotContext.Provider>
);
