#!/usr/bin/env bun
/**
 * Smoke test against a deployed escrow enclave host, run through SSM on the
 * instance (no inbound access needed). Seals test shares with the real client
 * code, then checks verify-blob, carry-pin-verifier and fail-closed create-hold.
 *
 * Writes one real ledger chain (a signed Carried record plus its Object Lock
 * audit copy) under a throwaway DID. Run with credentials for the escrow account:
 *
 *   bun services/escrow-enclave-app/scripts/staging-smoke.ts \
 *     --instance i-... --public-key <pinned SPKI base64> --key-id escrow-staging-v1
 */
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { parseArgs } from 'node:util';
import {
    derivePinProof,
    encryptEscrowBlob,
    generateEscrowKeyPair,
    generatePinSalt,
    type EscrowEnvelope,
} from '@learncard/sss-key-manager';

const { values: args } = parseArgs({
    options: {
        instance: { type: 'string' },
        'public-key': { type: 'string' },
        'key-id': { type: 'string' },
        region: { type: 'string', default: 'us-east-1' },
    },
});
if (!args.instance || !args['public-key'] || !args['key-id']) {
    console.error('usage: --instance <id> --public-key <SPKI base64> --key-id <keyId>');
    process.exit(2);
}
const instance = args.instance;
const pinnedKey = args['public-key'];
const keyId = args['key-id'];

type Response = { status: number; body: Record<string, unknown> };

const aws = (...command: string[]): string =>
    execFileSync('aws', [...command, '--region', args.region!, '--output', 'text'], {
        encoding: 'utf8',
    }).trim();

const call = async (path: string, body: unknown): Promise<Response> => {
    const payload = Buffer.from(JSON.stringify(body)).toString('base64');
    const script = [
        'set -e',
        'TOKEN_FILE=$(systemctl show -p Environment --value escrow-enclave-host | tr " " "\\n" | grep ^ESCROW_ENCLAVE_TOKEN_FILE= | cut -d= -f2)',
        `echo ${payload} | base64 -d > /tmp/smoke-body.json`,
        `curl -s -k -o /tmp/smoke-out.json -w '%{http_code}' --resolve escrow-enclave.staging.internal:8443:127.0.0.1 https://escrow-enclave.staging.internal:8443${path} -H "Authorization: Bearer $(cat $TOKEN_FILE)" -H 'Content-Type: application/json' --data-binary @/tmp/smoke-body.json`,
        'echo',
        'base64 -w0 /tmp/smoke-out.json',
        'rm -f /tmp/smoke-body.json /tmp/smoke-out.json',
    ];
    const id = aws(
        'ssm',
        'send-command',
        '--instance-ids',
        instance,
        '--document-name',
        'AWS-RunShellScript',
        '--parameters',
        JSON.stringify({ commands: script }),
        '--query',
        'Command.CommandId'
    );
    for (let i = 0; i < 30; i++) {
        await Bun.sleep(2000);
        const status = aws(
            'ssm',
            'get-command-invocation',
            '--command-id',
            id,
            '--instance-id',
            instance,
            '--query',
            'Status'
        );
        if (status === 'InProgress' || status === 'Pending') continue;
        const out = aws(
            'ssm',
            'get-command-invocation',
            '--command-id',
            id,
            '--instance-id',
            instance,
            '--query',
            'StandardOutputContent'
        );
        const [code, b64] = out.split('\n');
        const text = Buffer.from(b64 ?? '', 'base64').toString('utf8');
        return { status: Number(code), body: text ? JSON.parse(text) : {} };
    }
    throw new Error(`SSM command ${id} did not finish`);
};

let failures = 0;
const check = (name: string, ok: boolean, detail: unknown): void => {
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `  ${JSON.stringify(detail)}`}`);
    if (!ok) failures++;
};

const did = `did:example:escrow-smoke-${randomBytes(8).toString('hex')}`;
const share = (): string => randomBytes(32).toString('hex');
const seal = (
    shareVersion: number,
    pinVerifier?: string,
    to = pinnedKey
): Promise<EscrowEnvelope> =>
    encryptEscrowBlob(
        { recoveryShare: share(), did, shareVersion, ...(pinVerifier ? { pinVerifier } : {}) },
        to,
        keyId
    );

const attest = await call('/v1/attest', { nonce: [...randomBytes(32)] });
check(
    'attest: host relays the pinned enclave key',
    attest.status === 200 && attest.body.publicKey === pinnedKey && attest.body.keyId === keyId,
    { status: attest.status, keyId: attest.body.keyId }
);

const pinVerifier = await derivePinProof('482913', generatePinSalt());
const v1 = await seal(1, pinVerifier);

const verified = await call('/v1/verify-blob', {
    envelope: v1,
    expectedDid: did,
    expectedShareVersion: 1,
});
check(
    'verify-blob: enclave opens a PIN share sealed to it',
    verified.status === 200 && verified.body.ok === true && verified.body.hasPin === true,
    verified
);

const wrongDid = await call('/v1/verify-blob', {
    envelope: v1,
    expectedDid: `${did}-other`,
    expectedShareVersion: 1,
});
check(
    'verify-blob: wrong DID is not ok',
    wrongDid.status === 200 && wrongDid.body.ok === false,
    wrongDid
);

const stranger = await seal(1, pinVerifier, (await generateEscrowKeyPair()).publicKey);
const foreign = await call('/v1/verify-blob', {
    envelope: stranger,
    expectedDid: did,
    expectedShareVersion: 1,
});
check(
    'verify-blob: share sealed to another key is refused',
    foreign.status !== 200 && foreign.body.code === 'blob',
    foreign
);

const v2 = await seal(2);
const carried = await call('/v1/carry-pin-verifier', {
    sourceEnvelope: v1,
    targetEnvelope: v2,
    expectedDid: did,
    sourceShareVersion: 1,
    targetShareVersion: 2,
    sourceEnrollmentEpoch: 1,
    targetEnrollmentEpoch: 2,
});
check(
    'carry-pin-verifier: trusted time + ledger write succeed',
    carried.status === 200 && typeof carried.body.envelope === 'object',
    carried
);

if (carried.status === 200) {
    const after = await call('/v1/verify-blob', {
        envelope: carried.body.envelope,
        expectedDid: did,
        expectedShareVersion: 2,
    });
    check(
        'verify-blob: carried v2 share now carries the PIN',
        after.status === 200 && after.body.ok === true && after.body.hasPin === true,
        after
    );
}

const hold = await call('/v1/create-hold', {
    envelope: v1,
    holdId: randomBytes(16).toString('hex'),
    expectedDid: did,
    expectedShareVersion: 1,
    enrollmentEpoch: 1,
    releasePolicy: 'hold',
    clientEphemeralPublicKey: (await generateEscrowKeyPair()).publicKey,
});
check(
    'create-hold: fails closed without an enrollment authority',
    hold.status !== 200 && hold.body.code === 'unavailable',
    hold
);

console.log(`\nDID used: ${did}`);
console.log(failures ? `${failures} check(s) failed` : 'All checks passed');
process.exit(failures ? 1 : 0);
