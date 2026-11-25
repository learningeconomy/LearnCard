// The LearnCard monorepo hoists React 18 to the root for learn-card-app, while this service's
// admin UI uses React 19 from its own node_modules. react-test-renderer has no conflicting
// version, so Bun hoists it to the root, where its `require("react")` would find React 18.
// Resolve every React request in tests to this package's copy so the renderer and the
// components share one React.
import Module from 'node:module';

const localRequire = Module.createRequire(new URL('../package.json', import.meta.url));
const reactRequest = /^react(-dom)?(\/.*)?$/;
const moduleWithResolver = Module as unknown as {
    _resolveFilename: (request: string, ...rest: unknown[]) => string;
};
const resolveFilename = moduleWithResolver._resolveFilename;

let resolvingLocally = false;

moduleWithResolver._resolveFilename = (request, ...rest) => {
    if (resolvingLocally || !reactRequest.test(request)) return resolveFilename(request, ...rest);
    resolvingLocally = true;
    try {
        return localRequire.resolve(request);
    } finally {
        resolvingLocally = false;
    }
};
