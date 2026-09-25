#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseArgs } from 'node:util';

const { values } = parseArgs({
    options: {
        'function-name': { type: 'string' },
        region: { type: 'string' },
        phase: { type: 'string', default: 'dry-run' },
        'batch-size': { type: 'string', default: '50' },
        'one-batch': { type: 'boolean', default: false },
        help: { type: 'boolean', default: false },
    },
});

if (values.help) {
    console.log(
        'Usage: node scripts/migrate-signing-authority-seeds.mjs --function-name NAME --region REGION --phase dry-run|prepare|verify|purge [--batch-size 1..100] [--one-batch]'
    );
    process.exit(0);
}
const batchSize = Number(values['batch-size']);
if (
    !values['function-name'] ||
    !values.region ||
    !['dry-run', 'prepare', 'verify', 'purge'].includes(values.phase) ||
    !Number.isInteger(batchSize) ||
    batchSize < 1 ||
    batchSize > 100
) {
    console.error('Provide --function-name, --region, a valid --phase, and --batch-size 1..100.');
    process.exit(1);
}

// No database credentials or key material on the operator host. AWS CLI uses its normal credential chain.
const directory = mkdtempSync(join(tmpdir(), 'lca-sa-migration-'));
const payloadFile = join(directory, 'request.json');
const outputFile = join(directory, 'response.json');
writeFileSync(payloadFile, JSON.stringify({ phase: values.phase, batchSize }), { mode: 0o600 });
try {
    let done = false;
    do {
        const invocation = JSON.parse(
            execFileSync(
                'aws',
                [
                    'lambda',
                    'invoke',
                    '--function-name',
                    values['function-name'],
                    '--region',
                    values.region,
                    '--invocation-type',
                    'RequestResponse',
                    '--payload',
                    `fileb://${payloadFile}`,
                    '--cli-read-timeout',
                    '910',
                    '--cli-connect-timeout',
                    '10',
                    '--output',
                    'json',
                    outputFile,
                ],
                {
                    encoding: 'utf8',
                    stdio: ['ignore', 'pipe', 'pipe'],
                    env: { ...process.env, AWS_PAGER: '' },
                }
            )
        );
        const result = JSON.parse(readFileSync(outputFile, 'utf8'));
        if (invocation.FunctionError || invocation.StatusCode !== 200) {
            // The Lambda boundary emits only sanitized migration errors.
            console.error(
                result.errorMessage ?? 'Migration invocation failed. Inspect the function logs.'
            );
            process.exitCode = 1;
            break;
        }
        console.log(JSON.stringify(result));
        done = result.done === true;
        if (!done && result.processed === 0) {
            console.error('No progress in this batch. Inspect the function logs before retrying.');
            process.exitCode = 1;
            break;
        }
    } while (!done && !values['one-batch']);
} catch {
    console.error(
        'AWS invocation failed. Check your credentials, region, and function name; rerun to resume.'
    );
    process.exitCode = 1;
} finally {
    rmSync(directory, { recursive: true, force: true });
}
