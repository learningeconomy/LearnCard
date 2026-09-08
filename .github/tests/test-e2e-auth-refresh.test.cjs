const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { observable } = require('@trpc/server/observable');

async function main() {
    for (const client of [
        'lca-api-client',
        'learn-card-network/brain-client',
        'learn-card-network/cloud-client',
    ]) {
        const file = path.resolve(__dirname, '../../packages', client, 'src/callbackLink.ts');
        const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
            compilerOptions: { module: ts.ModuleKind.CommonJS },
        }).outputText;
        const exports = {};
        vm.runInNewContext(code, { exports, require });
        const original = { data: { httpStatus: 401 } };
        let requests = 0;
        let refreshes = 0;
        const link = exports.callbackLink(async () => {
            refreshes++;
            throw new Error('refresh unauthorized');
        })();
        const result = await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('request hung')), 1000);
            link({
                op: {},
                next: () => {
                    requests++;
                    return observable(observer => observer.error(original));
                },
            }).subscribe({
                error: error => {
                    clearTimeout(timeout);
                    resolve(error);
                },
            });
        });
        assert.equal(result, original);
        assert.equal(requests, 1);
        assert.equal(refreshes, 1);
    }
    console.log('All three clients propagate failed auth refresh without hanging');
}
main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
