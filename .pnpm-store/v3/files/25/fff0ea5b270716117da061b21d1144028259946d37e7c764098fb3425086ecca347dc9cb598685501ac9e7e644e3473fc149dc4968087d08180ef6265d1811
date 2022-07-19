"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PathCache = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
class PathCache {
    constructor(useCache) {
        this.useCache = useCache;
        if (useCache) {
            this.existsCache = new Map();
            this.absoluteCache = new Map();
        }
    }
    exists(path) {
        return ((0, fs_1.existsSync)(`${path}`) ||
            (0, fs_1.existsSync)(`${path}.js`) ||
            (0, fs_1.existsSync)(`${path}.json`) ||
            (0, fs_1.existsSync)(`${path}.jsx`) ||
            (0, fs_1.existsSync)(`${path}.cjs`) ||
            (0, fs_1.existsSync)(`${path}.mjs`) ||
            (0, fs_1.existsSync)(`${path}.d.ts`) ||
            (0, fs_1.existsSync)(`${path}.d.tsx`) ||
            (0, fs_1.existsSync)(`${path}.d.cts`) ||
            (0, fs_1.existsSync)(`${path}.d.mts`));
    }
    existsResolvedAlias(path) {
        if (!this.useCache)
            return this.exists(path);
        if (this.existsCache.has(path)) {
            return this.existsCache.get(path);
        }
        else {
            const result = this.exists(path);
            this.existsCache.set(path, result);
            return result;
        }
    }
    getAAP({ basePath, aliasPath }) {
        const aliasPathParts = aliasPath
            .split('/')
            .filter((part) => !part.match(/^\.$|^\s*$/));
        let aliasPathPart = aliasPathParts.shift() || '';
        let pathExists;
        while (!(pathExists = this.exists((0, path_1.join)(basePath, aliasPathPart))) &&
            aliasPathParts.length) {
            aliasPathPart = aliasPathParts.shift();
        }
        return (0, path_1.join)(basePath, pathExists ? aliasPathPart : '', aliasPathParts.join('/'));
    }
    getAbsoluteAliasPath(basePath, aliasPath) {
        const request = { basePath, aliasPath };
        if (!this.useCache)
            return this.getAAP(request);
        if (this.absoluteCache.has(request)) {
            return this.absoluteCache.get(request);
        }
        else {
            const result = this.getAAP(request);
            this.absoluteCache.set(request, result);
            return result;
        }
    }
}
exports.PathCache = PathCache;
//# sourceMappingURL=path-cache.js.map