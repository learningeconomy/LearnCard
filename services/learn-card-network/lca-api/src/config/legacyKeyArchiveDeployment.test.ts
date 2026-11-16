import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const serverlessRequire = createRequire(require.resolve('serverless/package.json'));
const yaml: { load: (source: string) => unknown } = serverlessRequire('js-yaml');

type Statement = {
    Action: string | string[];
    Resource: string;
    Condition?: Record<string, Record<string, string>>;
};

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

const decrypts = (): Statement[] =>
    statements().filter(statement => statement.Action === 'kms:Decrypt');

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

    it('lets S3 decrypt SSE-KMS archive objects, scoped to S3 and the archive bucket', () => {
        expect(decrypts()).toContainEqual(
            expect.objectContaining({
                Condition: {
                    StringLike: { 'kms:ViaService': 's3.*.amazonaws.com' },
                    StringEquals: {
                        'kms:EncryptionContext:aws:s3:arn':
                            'arn:aws:s3:::${env:LEGACY_KEY_ARCHIVE_BUCKET, ""}',
                    },
                },
            })
        );
    });

    it('never grants an unconditioned decrypt', () => {
        for (const statement of decrypts()) expect(statement.Condition).toBeDefined();
    });
});
