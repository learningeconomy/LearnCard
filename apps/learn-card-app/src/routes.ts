import { index, layout, route, type RouteConfig } from '@react-router/dev/routes';

import { ROUTE_TABLE, routeModuleFile, type RouteEntry } from './routing/routeTable';

const toRoute = ({ path, page, id }: RouteEntry) => {
    const options = id ? { id } : undefined;
    return path === '/'
        ? index(routeModuleFile(page), options)
        : route(path, routeModuleFile(page), options);
};

// The root route (root.tsx) renders the app shell once; pages render in its <Outlet />.
export default [
    layout(
        'routes/_private.tsx',
        ROUTE_TABLE.filter(entry => entry.access === 'private').map(toRoute)
    ),
    ...ROUTE_TABLE.filter(entry => entry.access === 'public').map(toRoute),
    // Unknown paths render nothing inside the shell, as before, instead of React Router's 404.
    route('*', 'routes/catchAll.tsx'),
] satisfies RouteConfig;
