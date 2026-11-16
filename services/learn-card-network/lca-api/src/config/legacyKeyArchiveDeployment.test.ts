import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const serverlessRequire = createRequire(require.resolve('serverless/package.json'));
const yaml: { load: (source: string) => unknown } = serverlessRequire('js-yaml');

type Statement = {
    Action: string | string[];
    Resource: string;
    Condition?: Record<string, Record<string, string | string[]>>;
};

const BUCKET = 'arn:aws:s3:::${env:LEGACY_KEY_ARCHIVE_BUCKET, ""}';
const DECRYPT_ACTIONS = new Set(['kms:Decrypt', 'kms:*', '*']);

const grantsDecrypt = (statement: Pick<Statement, 'Action'>): boolean =>
    [statement.Action].flat().some(action => DECRYPT_ACTIONS.has(action));

const statements = (): Statement[] => {
    const serverless = yaml.load(
        readFileSync(new URL('../../serverless.yml', import.meta.url), 'utf8')
    ) as {
        resources: {
            Resources: Record<
                string,
                { Properties: { PolicyDocument: { Statement: Statement[] } } }
            >;
        };
    };
    return serverless.resources.Resources.LegacyKeyArchivePolicy!.Properties.PolicyDocument
        .Statement;
};

const decrypts = (): Statement[] => statements().filter(grantsDecrypt);

describe('legacy key archive IAM policy', () => {
    it('decrypts payloads only with the archive purpose context', () => {
        expect(decrypts()).toContainEqual(
            expect.objectContaining({
                Condition: {
                    StringEquals: { 'kms:EncryptionContext:purpose': 'lc-w3a-key-backup' },
                },
            })
        );
    });

    it('lets S3 decrypt archive objects with or without Bucket Keys, scoped to the bucket', () => {
        expect(decrypts()).toContainEqual(
            expect.objectContaining({
                Condition: {
                    StringLike: {
                        'kms:ViaService': 's3.*.amazonaws.com',
                        'kms:EncryptionContext:aws:s3:arn': [BUCKET, `${BUCKET}/uid/*`],
                    },
                },
            })
        );
    });

    it('detects decrypt grants in string, array and wildcard form', () => {
        expect(grantsDecrypt({ Action: 'kms:Decrypt' })).toBe(true);
        expect(grantsDecrypt({ Action: ['s3:GetObject', 'kms:Decrypt'] })).toBe(true);
        expect(grantsDecrypt({ Action: 'kms:*' })).toBe(true);
        expect(grantsDecrypt({ Action: ['*'] })).toBe(true);
        expect(grantsDecrypt({ Action: ['s3:GetObject', 's3:ListBucket'] })).toBe(false);
    });

    it('never grants an unconditioned decrypt', () => {
        expect(decrypts()).toHaveLength(2);
        for (const statement of decrypts()) expect(statement.Condition).toBeDefined();
    });
});
