"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanUrl = exports.queryRE = exports.NodeResolvePlugin = exports.resolveAsync = void 0;
const escape_string_regexp_1 = __importDefault(require("escape-string-regexp"));
const fs_1 = __importDefault(require("fs"));
const module_1 = require("module");
const path_1 = __importDefault(require("path"));
const resolve_1 = __importDefault(require("resolve"));
const util_1 = require("util");
const NAME = 'node-resolve';
const debug = require('debug')(NAME);
let pnpapi;
try {
    pnpapi = require('pnpapi');
}
catch (_a) { }
const promisifiedResolve = util_1.promisify(resolve_1.default);
const resolveAsync = (id, _b) => __awaiter(void 0, void 0, void 0, function* () {
    var { mainFields } = _b, _opts = __rest(_b, ["mainFields"]);
    function packageFilter(packageJSON) {
        if (!(mainFields === null || mainFields === void 0 ? void 0 : mainFields.length)) {
            return packageJSON;
        }
        // changes the main field to be another field
        for (let mainField of mainFields) {
            if (mainField === 'main') {
                break;
            }
            const newMain = packageJSON[mainField];
            if (newMain && typeof newMain === 'string') {
                debug(`set main to '${mainField}`);
                packageJSON['main'] = newMain;
                break;
            }
        }
        return packageJSON;
    }
    const opts = Object.assign({ preserveSymlinks: false, packageFilter }, _opts);
    const res = yield promisifiedResolve(id, opts);
    // resolve virtual workspaces to real path
    if (pnpapi && res && !res.includes('node_modules')) {
        try {
            const realPath = pnpapi.resolveVirtual(res);
            if (realPath) {
                return realPath;
            }
        }
        catch (_c) { }
    }
    return res;
});
exports.resolveAsync = resolveAsync;
function NodeResolvePlugin({ onNonResolved, namespace, extensions, onResolved, resolveOptions, mainFields, name = NAME, isExtensionRequiredInImportPath, resolveSynchronously, }) {
    const builtinsSet = new Set(module_1.builtinModules);
    debug('setup');
    const filter = new RegExp('(' + extensions.map(escape_string_regexp_1.default).join('|') + ')(\\?.*)?$');
    return {
        name,
        setup: function setup({ onLoad, onResolve }) {
            onLoad({ filter, namespace }, (args) => __awaiter(this, void 0, void 0, function* () {
                try {
                    if (builtinsSet.has(args.path)) {
                        return;
                    }
                    const contents = yield fs_1.default.promises.readFile(args.path); // do not convert to string to support images and other assets
                    let resolveDir = path_1.default.dirname(args.path);
                    debug('onLoad');
                    return {
                        loader: 'default',
                        contents,
                        resolveDir,
                    };
                }
                catch (e) {
                    return null;
                }
            }));
            onResolve({ filter: isExtensionRequiredInImportPath ? filter : /.*/ }, function resolver(args) {
                return __awaiter(this, void 0, void 0, function* () {
                    args.path = exports.cleanUrl(args.path);
                    if (builtinsSet.has(args.path)) {
                        return null;
                    }
                    if (args.path.startsWith('data:')) {
                        return null;
                    }
                    let resolved;
                    try {
                        const options = Object.assign({ basedir: args.resolveDir, preserveSymlinks: false, extensions,
                            mainFields }, resolveOptions);
                        resolved = resolveSynchronously
                            ? resolve_1.default.sync(args.path, options)
                            : yield exports.resolveAsync(args.path, options);
                    }
                    catch (e) {
                        debug(`not resolved ${args.path}`);
                        if (onNonResolved) {
                            let res = yield onNonResolved(args.path, args.importer, e);
                            return res || null;
                        }
                        else {
                            return null;
                        }
                    }
                    // resolved = path.relative(resolved, process.cwd())
                    debug(`resolved '${resolved}'`);
                    if (resolved && onResolved) {
                        const res = yield onResolved(resolved, args.importer);
                        if (typeof res === 'string') {
                            return {
                                path: res,
                                namespace,
                            };
                        }
                        if ((res === null || res === void 0 ? void 0 : res.path) != null ||
                            (res === null || res === void 0 ? void 0 : res.external) != null ||
                            (res === null || res === void 0 ? void 0 : res.namespace) != null ||
                            (res === null || res === void 0 ? void 0 : res.errors) != null) {
                            return res;
                        }
                    }
                    if (pnpapi &&
                        resolveSynchronously &&
                        resolved &&
                        !resolved.includes('node_modules')) {
                        try {
                            const realPath = pnpapi.resolveVirtual(resolved);
                            if (realPath) {
                                return { path: realPath, namespace };
                            }
                        }
                        catch (_a) { }
                    }
                    if (resolved) {
                        return {
                            path: resolved,
                            namespace,
                        };
                    }
                });
            });
        },
    };
}
exports.NodeResolvePlugin = NodeResolvePlugin;
exports.default = NodeResolvePlugin;
exports.queryRE = /\?.*$/;
const cleanUrl = (url) => url.replace(exports.queryRE, '');
exports.cleanUrl = cleanUrl;
//# sourceMappingURL=index.js.map