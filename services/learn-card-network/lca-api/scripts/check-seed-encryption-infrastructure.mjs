#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

// Use Serverless's own YAML parser. An optional argument validates its packaged JSON template.
const require = createRequire(import.meta.url);
const serverlessRequire = createRequire(require.resolve('serverless/package.json'));
const config = serverlessRequire('js-yaml').load(
    readFileSync(fileURLToPath(new URL('../serverless.yml', import.meta.url)), 'utf8')
);
const packaged = process.argv[2] ? JSON.parse(readFileSync(process.argv[2], 'utf8')) : undefined;
const resources = packaged?.Resources ?? config.resources.Resources;
const key = resources.SigningAuthoritySeedKey;
assert.equal(key.Type, 'AWS::KMS::Key');
assert.equal(key.DeletionPolicy, 'Retain');
assert.equal(key.UpdateReplacePolicy, 'Retain');
assert.equal(key.Properties.KeySpec, 'SYMMETRIC_DEFAULT');
assert.equal(key.Properties.KeyUsage, 'ENCRYPT_DECRYPT');
assert.equal(key.Properties.EnableKeyRotation, true);

const roleArn = { 'Fn::GetAtt': ['IamRoleLambdaExecution', 'Arn'] };
const keyArn = { 'Fn::GetAtt': ['SigningAuthoritySeedKey', 'Arn'] };
const purpose = { StringEquals: { 'kms:EncryptionContext:purpose': 'lca-signing-authority-seed' } };
const statements = key.Properties.KeyPolicy.Statement;
const use = statements.find(statement => statement.Sid === 'LcaApiSeedEncryption');
assert.deepEqual(use.Principal, { AWS: roleArn });
assert.deepEqual(use.Action, ['kms:GenerateDataKey', 'kms:Decrypt']);
assert.deepEqual(use.Condition, purpose);
const deny = statements.find(statement => statement.Sid === 'DenyOtherCryptographicPrincipals');
assert.equal(deny.Effect, 'Deny');
assert.equal(deny.Principal, '*');
assert.deepEqual(deny.Condition, { ArnNotEquals: { 'aws:PrincipalArn': roleArn } });
assert(deny.Action.includes('kms:Decrypt'));
assert(deny.Action.includes('kms:ReEncrypt*'));
const admin = statements.find(statement => statement.Sid === 'AccountKeyAdministration');
assert(
    !admin.Action.some(action =>
        ['kms:*', 'kms:Decrypt', 'kms:CreateGrant', 'kms:ReEncrypt*'].includes(action)
    )
);
const iam = resources.SigningAuthoritySeedKeyPolicy.Properties;
assert.deepEqual(iam.Roles, [{ Ref: 'IamRoleLambdaExecution' }]);
assert.deepEqual(iam.PolicyDocument.Statement, [
    {
        Effect: 'Allow',
        Action: ['kms:GenerateDataKey', 'kms:Decrypt'],
        Resource: keyArn,
        Condition: purpose,
    },
]);

const worker = config.functions.seedMigration;
assert.equal(worker.timeout, 900);
assert.equal(worker.reservedConcurrency, 1);
assert.equal(worker.events, undefined);
assert.equal(worker.url, undefined);
assert.deepEqual(worker.vpc, config.functions.api.vpc);
for (const name of ['api', 'trpc', 'seedMigration']) {
    assert(config.functions[name].dependsOn.includes('SigningAuthoritySeedKeyPolicy'));
}
assert.deepEqual(config.provider.environment.SA_SEED_KMS_KEY_ARN, keyArn);
assert.equal(config.provider.environment.SA_SEED_LOCAL_KEK, undefined);
if (packaged) {
    const lambda = resources.SeedMigrationLambdaFunction;
    assert.equal(lambda.Properties.Timeout, 900);
    assert.equal(lambda.Properties.ReservedConcurrentExecutions, 1);
    assert.deepEqual(lambda.Properties.Role, roleArn);
    assert.deepEqual(lambda.Properties.Environment.Variables.SA_SEED_KMS_KEY_ARN, keyArn);
    for (const resource of Object.values(resources)) {
        if (resource.Type === 'AWS::Lambda::Permission' || resource.Type === 'AWS::Lambda::Url') {
            assert(!JSON.stringify(resource).includes('SeedMigrationLambdaFunction'));
        }
    }
}

// Validate the entire dependency graph, including generated role/function resources when packaged.
const references = value => {
    const found = new Set();
    const visit = node => {
        if (!node || typeof node !== 'object') return;
        if (typeof node.Ref === 'string') found.add(node.Ref);
        const attribute = node['Fn::GetAtt'];
        if (attribute) found.add(Array.isArray(attribute) ? attribute[0] : attribute.split('.')[0]);
        const sub = node['Fn::Sub'];
        const source = Array.isArray(sub) ? sub[0] : sub;
        if (typeof source === 'string') {
            for (const match of source.matchAll(/\$\{([^}.]+)(?:\.[^}]+)?\}/g)) found.add(match[1]);
        }
        for (const child of Object.values(node)) visit(child);
    };
    visit(value);
    for (const name of [].concat(value.DependsOn ?? [])) found.add(name);
    return [...found].filter(name => name in resources);
};
const finished = new Set();
const visit = (name, active = new Set()) => {
    assert(!active.has(name), `Circular CloudFormation dependency at ${name}`);
    if (finished.has(name)) return;
    const next = new Set(active).add(name);
    for (const dependency of references(resources[name])) visit(dependency, next);
    finished.add(name);
};
for (const name of Object.keys(resources)) visit(name);
console.log(
    `Seed encryption infrastructure checks passed (${packaged ? 'packaged template' : 'source config'}, ${finished.size} resources).`
);
