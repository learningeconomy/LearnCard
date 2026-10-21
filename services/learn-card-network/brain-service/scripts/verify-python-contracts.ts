import assert from 'node:assert/strict';
import type { ZodType } from 'zod';

import { configureOfflineSchemaEnvironment } from './offline-schema-environment';

type CapturedRequest = {
    method: string;
    path: string;
    body: unknown;
    serverValid: boolean;
};

const capture = process.argv[2];
if (!capture)
    throw new Error(
        'Usage: bun --conditions=development scripts/verify-python-contracts.ts CAPTURE'
    );
configureOfflineSchemaEnvironment();

// Static imports would initialize router dependencies before credentials are removed.
const { AllocateCredentialRefreshInputValidator, PublishCredentialRefreshInputValidator } =
    await import('@learncard/types');
const { activityRouter } = await import('../src/routes/activity');

const activityInputs: Record<string, ZodType> = {
    '/activity/credentials': activityRouter._def.procedures.getMyActivities._def.inputs.at(
        -1
    ) as ZodType,
    '/activity/credentials/stats': activityRouter._def.procedures.getActivityStats._def.inputs.at(
        -1
    ) as ZodType,
};
const records: CapturedRequest[] = await Bun.file(capture).json();
for (const record of records) {
    const url = new URL(record.path, 'http://offline.invalid');
    let valid: boolean;
    if (url.pathname === '/credential-refresh/publish') {
        valid = PublishCredentialRefreshInputValidator.safeParse(record.body).success;
    } else if (url.pathname === '/credential-refresh/allocate') {
        valid = AllocateCredentialRefreshInputValidator.safeParse(record.body).success;
    } else {
        const validator = activityInputs[url.pathname];
        assert(validator, `No source validator for captured path ${url.pathname}`);
        valid = validator.safeParse(Object.fromEntries(url.searchParams)).success;
    }
    assert.equal(
        valid,
        record.serverValid,
        `Source contract rejected/accepted unexpected input: ${record.method} ${record.path}`
    );
}

// The historical client format and offset suffixes must remain invalid server input.
for (const validator of Object.values(activityInputs)) {
    for (const date of [
        '2026-01-02T03:04:05.000000+0000',
        '2026-01-02T03:04:05+00:00',
        '2026-01-02T03:04:05',
    ]) {
        for (const field of ['startDate', 'endDate']) {
            assert.equal(
                validator.safeParse({ [field]: date }).success,
                false,
                `Server unexpectedly accepts ${field}=${date}`
            );
        }
    }
}
console.log(
    `Verified ${records.length} captured publication/allocation/activity cases and Z-only boundaries against actual source validators`
);
process.exit(0);
