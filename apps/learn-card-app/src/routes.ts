import { route, type RouteConfig } from '@react-router/dev/routes';

// App.tsx keeps its own <Routes> table and renders from the root route; this splat only makes
// every path a match (the root route alone matches just "/").
export default [route('*', 'routes/catchAll.tsx')] satisfies RouteConfig;
