const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const file = path.resolve(__dirname, '../../packages/plugins/learn-card-network/src/plugin.ts');
const source = ts.createSourceFile(
    file,
    fs.readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true
);
let method;
function visit(node) {
    if (ts.isPropertyAssignment(node) && node.name.getText(source) === 'deleteProfile') {
        method = node.initializer.getText(source);
    }
    ts.forEachChild(node, visit);
}
visit(source);
assert.ok(method);
async function main() {
    for (const allowed of [true, false]) {
        let finishInit;
        let mutations = 0;
        const denied = new Error('This operation requires profiles:delete scope');
        const context = {
            apiToken: 'test-token',
            userData: undefined,
            initialQuery: new Promise(resolve => {
                finishInit = resolve;
            }),
            ensureUser: async () => {
                throw new Error('must not require profile read');
            },
            client: {
                profile: {
                    deleteProfile: {
                        mutate: async () => {
                            mutations++;
                            if (!allowed) throw denied;
                            return true;
                        },
                    },
                },
            },
        };
        vm.createContext(context);
        vm.runInContext(`deleteProfile = ${method}`, context);
        const pending = context.deleteProfile();
        assert.equal(mutations, 0);
        finishInit();
        if (allowed) assert.equal(await pending, true);
        else await assert.rejects(pending, error => error === denied);
        assert.equal(mutations, 1);
        assert.equal(context.userData, undefined);
    }
    console.log(
        'Profile deletion waits for initialization and delegates token authorization to server'
    );
}
main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
