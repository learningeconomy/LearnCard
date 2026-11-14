export { default } from './shared/registryProxy.ts';

// Both this opt-in and the response cache headers are required for CDN caching.
export const config = { path: '/api/registry-proxy/*', cache: 'manual' };
