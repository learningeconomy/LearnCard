"use strict";
/**
 * Factory for supported packagers.
 *
 * All packagers must implement the following interface:
 *
 * interface Packager {
 *
 * static get lockfileName(): string;
 * static get copyPackageSectionNames(): Array<string>;
 * static get mustCopyModules(): boolean;
 * static getProdDependencies(cwd: string, depth: number = 1): BbPromise<Object>;
 * static rebaseLockfile(pathToPackageRoot: string, lockfile: Object): void;
 * static install(cwd: string): BbPromise<void>;
 * static prune(cwd: string): BbPromise<void>;
 * static runScripts(cwd: string, scriptNames): BbPromise<void>;
 *
 * }
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.get = void 0;
const npm_1 = require("./npm");
const pnpm_1 = require("./pnpm");
const yarn_1 = require("./yarn");
const registeredPackagers = {
    npm: new npm_1.NPM(),
    pnpm: new pnpm_1.Pnpm(),
    yarn: new yarn_1.Yarn(),
};
/**
 * Factory method.
 * @this ServerlessWebpack - Active plugin instance
 * @param {string} packagerId - Well known packager id.
 * @returns {Promise<Packager>} - Promised packager to allow packagers be created asynchronously.
 */
function get(packagerId) {
    if (!(packagerId in registeredPackagers)) {
        const message = `Could not find packager '${packagerId}'`;
        this.log.error(`ERROR: ${message}`);
        throw new this.serverless.classes.Error(message);
    }
    return registeredPackagers[packagerId];
}
exports.get = get;
