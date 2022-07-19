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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const esbuild_1 = require("esbuild");
const test_support_1 = require("test-support");
const _1 = __importDefault(require("."));
const slash_1 = __importDefault(require("slash"));
const path_1 = __importDefault(require("path"));
require('debug').enable(require('../package.json').name);
test('works', () => __awaiter(void 0, void 0, void 0, function* () {
    const { unlink, base, paths: [ENTRY], } = yield test_support_1.writeFiles({
        'entry.ts': `import {x} from './utils'; console.log(x);`,
        'utils.ts': `import mod from 'mod'; export const x = mod('x');`,
        'node_modules/mod/index.js': 'export default () => {}',
    });
    let called = 0;
    let resolved = [];
    const res = yield esbuild_1.build({
        entryPoints: [ENTRY],
        write: false,
        format: 'esm',
        target: 'es2017',
        bundle: true,
        plugins: [
            _1.default({
                extensions: ['.js', '.ts'],
                onNonResolved: (p) => {
                    throw new Error(`cannot resolve ${p}`);
                },
                onResolved: (x) => {
                    resolved.push(x);
                    called++;
                    return x;
                },
            }),
        ],
    });
    expect(called).toBe(3);
    const expected = ['entry.ts', 'utils.ts', 'node_modules/mod/index.js'];
    expect(resolved.map(normalize(base))).toEqual(expected);
    unlink();
    // console.log(formatEsbuildOutput(res))
}));
test('all resolved paths are absolute', () => __awaiter(void 0, void 0, void 0, function* () {
    const { unlink, base, paths: [ENTRY], } = yield test_support_1.writeFiles({
        'entry.ts': `import {x} from './utils'; console.log(x);`,
        'utils.ts': `import mod from 'mod'; export const x = mod('x');`,
        'node_modules/mod/index.js': 'export default () => {}',
    });
    let resolved = [];
    const res = yield esbuild_1.build({
        entryPoints: [ENTRY],
        write: false,
        format: 'esm',
        bundle: true,
        plugins: [
            _1.default({
                extensions: ['.js', '.ts'],
                onResolved: (x) => {
                    resolved.push(x);
                    return x;
                },
            }),
        ],
    });
    expect(resolved.filter((x) => path_1.default.isAbsolute(x)).length).toEqual(3);
    unlink();
    // console.log(formatEsbuildOutput(res))
}));
test('does not throw when onUnresolved', () => __awaiter(void 0, void 0, void 0, function* () {
    const { unlink, paths: [ENTRY], } = yield test_support_1.writeFiles({
        'entry.ts': `import {x} from 'xxx'; console.log(x);`,
    });
    let called = false;
    yield esbuild_1.build({
        entryPoints: [ENTRY],
        write: false,
        bundle: true,
        plugins: [
            _1.default({
                extensions: ['.js', '.ts'],
                onNonResolved: () => {
                    called = true;
                    return {
                        external: true,
                    };
                },
            }),
        ],
    });
    expect(called).toBeTruthy();
    unlink();
}));
test('uses mainFields option', () => __awaiter(void 0, void 0, void 0, function* () {
    const { unlink, base, paths: [ENTRY], } = yield test_support_1.writeFiles({
        'main.ts': `import mod from 'mod'; export const x = mod('x');`,
        'node_modules/mod/module.js': 'export default () => {}',
        'node_modules/mod/package.json': JSON.stringify({
            name: 'mod',
            version: '0.0.0',
            module: 'module.js',
            main: 'module.js',
        }),
    });
    let resolved = [];
    yield esbuild_1.build({
        entryPoints: [ENTRY],
        write: false,
        bundle: true,
        plugins: [
            _1.default({
                extensions: ['.js', '.ts', '.json'],
                mainFields: ['module', 'main'],
                onNonResolved: (p) => {
                    throw new Error(`cannot resolve ${p}`);
                },
                onResolved(p) {
                    resolved.push(p);
                },
            }),
        ],
    });
    expect(resolved.map(normalize(base))).toEqual([
        'main.ts',
        'node_modules/mod/module.js',
    ]);
    unlink();
}));
test('isExtensionRequiredInImportPath', () => __awaiter(void 0, void 0, void 0, function* () {
    const { unlink, base, paths: [ENTRY], } = yield test_support_1.writeFiles({
        'entry.ts': `import {x} from './utils.ts'; console.log(x);`,
        'utils.ts': `export * from './another.ts?query'`,
        'another.ts': `import mod from 'mod'; export const x = mod('x');`,
        'node_modules/mod/index.js': 'export default () => {}',
    });
    let called = 0;
    let resolved = [];
    const res = yield esbuild_1.build({
        entryPoints: [ENTRY],
        write: false,
        format: 'esm',
        target: 'es2017',
        bundle: true,
        plugins: [
            _1.default({
                extensions: ['.js', '.ts'],
                isExtensionRequiredInImportPath: true,
                onNonResolved: (p) => {
                    throw new Error(`cannot resolve ${p}`);
                },
                onResolved: (x) => {
                    resolved.push(x);
                    called++;
                    return x;
                },
            }),
        ],
    });
    expect(called).toBe(3);
    const expected = ['entry.ts', 'utils.ts', 'another.ts'];
    expect(resolved.map(normalize(base))).toEqual(expected);
    unlink();
    // console.log(formatEsbuildOutput(res))
}));
const normalize = (base) => (x) => slash_1.default(path_1.default.relative(base, x));
//# sourceMappingURL=index.test.js.map