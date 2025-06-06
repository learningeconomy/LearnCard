// UPSTREAM: tsc-alias does not replace paths which start with @.
// https://github.com/justkey007/tsc-alias/issues/212

const path = require('path');

const tsconfig = require('./tsconfig.json');

const {
    compilerOptions: { paths = {} },
} = tsconfig;

module.exports.default = ({ orig, file }) => {
    if (orig.startsWith(`from '@`)) {
        const key = orig.split("from '")[1].slice(0, -1);
        const tsPath = paths[key]?.[0];
        if (tsPath == null) return orig;
        const target = path
            .relative(file, tsPath)
            .replace('./src', '')
            .replace('.././', './')
            .replace('.ts', '');
        if (path != null) return `from '${target}'`;
    } else if (orig.startsWith('import("@')) {
        const key = orig.split('import("')[1].slice(0, -2);
        const tsPath = paths[key]?.[0];
        if (tsPath == null) return orig;
        const target = path
            .relative(file, tsPath)
            .replace('./src', '')
            .replace('.././', './')
            .replace('.ts', '');
        if (path != null) return `import("${target}")`;
    }
    return orig;
};
