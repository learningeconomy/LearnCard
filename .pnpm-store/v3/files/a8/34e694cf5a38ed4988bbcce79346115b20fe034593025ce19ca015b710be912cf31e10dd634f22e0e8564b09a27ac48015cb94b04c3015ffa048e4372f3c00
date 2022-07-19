"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const normalizePath = require("normalize-path");
const path_1 = require("path");
const utils_1 = require("../utils");
function escapeSpecialChars(str) {
    return str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}
function getAliasPrefixRegExp(alias) {
    return new RegExp(`(?:^${escapeSpecialChars(alias.prefix)})|(?:\.(js|json)$)`, 'g');
}
function removeAliasPrefix(requiredModule, alias) {
    return requiredModule.replace(getAliasPrefixRegExp(alias), '');
}
function replaceImportStatement({ orig, file, config }) {
    var _a, _b;
    const requiredModule = (_b = (_a = orig.match((0, utils_1.newStringRegex)())) === null || _a === void 0 ? void 0 : _a.groups) === null || _b === void 0 ? void 0 : _b.path;
    config.output.assert(typeof requiredModule == 'string', `Unexpected import statement pattern ${orig}`);
    const alias = config.aliasTrie.search(requiredModule);
    if (!alias)
        return orig;
    const isAlias = alias.shouldPrefixMatchWildly
        ?
            requiredModule.startsWith(alias.prefix) && requiredModule !== alias.prefix
        :
            requiredModule === alias.prefix ||
                requiredModule.startsWith(alias.prefix + '/');
    if (isAlias) {
        for (let i = 0; i < alias.paths.length; i++) {
            const absoluteAliasPath = config.pathCache.getAbsoluteAliasPath(alias.paths[i].basePath, alias.paths[i].path);
            if (!config.pathCache.existsResolvedAlias(alias.prefix.length == requiredModule.length
                ? normalizePath(absoluteAliasPath)
                : normalizePath(`${absoluteAliasPath}/${removeAliasPrefix(requiredModule, alias)}`))) {
                continue;
            }
            let relativeAliasPath = normalizePath((0, path_1.relative)((0, path_1.dirname)(file), absoluteAliasPath));
            if (!relativeAliasPath.startsWith('.')) {
                relativeAliasPath = './' + relativeAliasPath;
            }
            const index = orig.indexOf(alias.prefix);
            const newImportScript = orig.substring(0, index) +
                relativeAliasPath +
                '/' +
                orig.substring(index + alias.prefix.length);
            const modulePath = newImportScript.match((0, utils_1.newStringRegex)()).groups.path;
            return newImportScript.replace(modulePath, normalizePath(modulePath));
        }
    }
    return orig;
}
exports.default = replaceImportStatement;
//# sourceMappingURL=default.replacer.js.map