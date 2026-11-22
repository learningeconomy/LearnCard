// Loaded into every Vitest worker via `execArgv` (see vitest.config.ts).
//
// learn-card-app installs React 19 in its own node_modules while the hoisted root copy stays on
// React 18 for the rest of the monorepo. Vite builds and Vitest-transformed source pick the
// app's copy through `resolve.dedupe`, but dependencies Node loads directly (CommonJS such as
// react-router 5, or ESM such as @tanstack/react-query) would still find the root copy and
// render with two Reacts. Resolve every `react` / `react-dom` request to the app's copy.
import { createRequire, registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';

const requireFromApp = createRequire(new URL('./package.json', import.meta.url));
const REACT = /^react(-dom)?(\/.*)?$/;

registerHooks({
    resolve(specifier, context, nextResolve) {
        if (!REACT.test(specifier)) return nextResolve(specifier, context);
        // Both packages ship CommonJS only, so the require() resolution is the right file.
        return { url: pathToFileURL(requireFromApp.resolve(specifier)).href, shortCircuit: true };
    },
});
