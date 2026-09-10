const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const file = path.resolve(
    __dirname,
    '../../services/learn-card-network/lca-api/src/routes/credentials.ts'
);
const source = ts.createSourceFile(
    file,
    fs.readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true
);
let handler;
function visit(node) {
    if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        node.expression.name.text === 'catch' &&
        node.arguments[0]?.getText(source).includes('resolveDid')
    ) {
        handler = node.arguments[0].getText(source);
    }
    ts.forEachChild(node, visit);
}
visit(source);
assert.ok(handler, 'issuance recovery handler exists');

async function main() {
    for (const message of [
        'Key mismatch',
        'Missing verification relationship.',
        'unrelated failure',
    ]) {
        const calls = [];
        const exports = {};
        const credential = { issuer: 'did:web:example.test' };
        vm.runInNewContext(
            ts.transpileModule(`exports.recover = ${handler}`, {
                compilerOptions: { module: ts.ModuleKind.CommonJS },
            }).outputText,
            {
                exports,
                console: { warn() {} },
                credential,
                options: {},
                verificationMethod: 'did:web:example.test#authority',
                saDid: 'did:web:example.test',
                learnCard: {
                    invoke: {
                        resolveDid: async (did, options) =>
                            calls.push(['refresh', did, options.noCache]),
                        issueCredential: async () => {
                            calls.push(['issue']);
                            return credential;
                        },
                    },
                },
            }
        );
        if (message === 'unrelated failure') {
            await assert.rejects(exports.recover(message));
            assert.equal(calls.length, 0);
        } else {
            assert.equal(await exports.recover(message), credential);
            assert.deepEqual(calls, [['refresh', 'did:web:example.test', true], ['issue']]);
        }
    }
    console.log('Signing refresh retries stale key errors once and propagates unrelated errors');
}
main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
