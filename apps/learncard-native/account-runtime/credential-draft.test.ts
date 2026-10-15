import { expect, test } from 'bun:test';
import { readFile } from 'node:fs/promises';
import { initLearnCard } from '@learncard/init';
import {
    buildNativeTemplate,
    fingerprintNativeDraft,
    type NativeCredentialDraft,
} from './credential-draft';

const draft: NativeCredentialDraft = {
    requestID: 'public-spike-draft',
    title: 'Kindness',
    summary: 'A thoughtful teammate.',
    kind: 'Achievements',
    achievementType: 'Badge',
    criteria: 'Supported their peers.',
    artworkURL: 'https://cdn.filestackcontent.com/public-test-artwork',
    recipient: 'test-recipient',
};

test('builder template interoperates with real VC v2 signing and preserves artwork and recipient', async () => {
    const wasm = await readFile(
        new URL(
            '../../../packages/plugins/didkit/src/didkit/pkg/didkit_wasm_bg.wasm',
            import.meta.url
        )
    );
    const issuer = await initLearnCard({ seed: 'a'.repeat(64), didkit: wasm });
    const holder = await initLearnCard({ seed: 'b'.repeat(64), didkit: wasm });
    const template = buildNativeTemplate(draft, issuer.id.did(), 'Public Test Issuer');
    expect('id' in template.credentialSubject).toBe(false);
    expect('validFrom' in template).toBe(false);
    // The SDK's send path supplies these per-recipient fields before signing.
    const credential = await issuer.invoke.issueCredential({
        ...template,
        id: 'urn:uuid:0ac8f673-2605-4692-bac5-31a8bfb2480c',
        validFrom: new Date().toISOString(),
        credentialSubject: { ...template.credentialSubject, id: holder.id.did() },
    });
    const verification = await holder.invoke.verifyCredential(credential, { checks: ['proof'] });
    expect(verification.errors).toHaveLength(0);
    expect(credential.credentialSubject).toMatchObject({
        id: holder.id.did(),
        achievement: {
            image: { id: draft.artworkURL },
            criteria: { narrative: draft.criteria },
            achievementType: 'Badge',
        },
    });
}, 30_000);

test('invalid drafts and non-provider artwork cannot reach issuance', () => {
    for (const changes of [
        { title: ' ' },
        { summary: 'x'.repeat(1001) },
        { achievementType: 'MadeUp' },
        { artworkURL: 'file:///private/photo.jpg' },
        { artworkURL: 'https://cdn.filestackcontent.com.evil.test/photo' },
    ]) {
        expect(() =>
            buildNativeTemplate({ ...draft, ...changes }, 'did:key:public-test', 'Test')
        ).toThrow();
    }
});

test('optional consumer details survive real OBv3 signing at their web-compatible locations', async () => {
    const wasm = await readFile(
        new URL(
            '../../../packages/plugins/didkit/src/didkit/pkg/didkit_wasm_bg.wasm',
            import.meta.url
        )
    );
    const issuer = await initLearnCard({ seed: 'a'.repeat(64), didkit: wasm });
    const details = {
        criteriaURL: 'https://example.org/criteria',
        fieldOfStudy: 'Design',
        role: 'Team mentor',
        term: 'Autumn 2026',
        activityStartDate: '2026-09-01T04:00:00Z',
        activityEndDate: '2026-10-01T04:00:00Z',
        validUntil: '2028-01-01T04:59:59Z',
        evidence: [
            {
                url: 'https://example.org/project',
                name: 'Team project',
                summary: 'A public project showing the work.',
            },
        ],
    };
    const template = buildNativeTemplate(
        { ...draft, details },
        issuer.id.did(),
        'Public Test Issuer'
    );
    const credential = await issuer.invoke.issueCredential({
        ...template,
        validFrom: new Date().toISOString(),
        credentialSubject: { ...template.credentialSubject, id: issuer.id.did() },
    });
    expect(
        (await issuer.invoke.verifyCredential(credential, { checks: ['proof'] })).errors
    ).toHaveLength(0);
    expect(credential).toMatchObject({
        validUntil: details.validUntil,
        evidence: [
            {
                id: details.evidence[0].url,
                type: ['Evidence'],
                name: 'Team project',
                description: details.evidence[0].summary,
            },
        ],
    });
    expect(credential.credentialSubject).toMatchObject({
        role: details.role,
        term: details.term,
        activityStartDate: details.activityStartDate,
        activityEndDate: details.activityEndDate,
        achievement: {
            fieldOfStudy: 'Design',
            criteria: { id: details.criteriaURL, narrative: draft.criteria },
        },
    });
    expect('evidence' in template.credentialSubject).toBe(false);
    expect(details.evidence[0]).toEqual({
        url: 'https://example.org/project',
        name: 'Team project',
        summary: 'A public project showing the work.',
    });
}, 30_000);

test('untouched and blank optional details do not invent evidence, expiry, or activity', () => {
    const template = buildNativeTemplate(
        { ...draft, details: { evidence: [{ url: '', name: ' ', summary: '' }] } },
        'did:key:test',
        'Test'
    );
    expect('evidence' in template).toBe(false);
    expect('validUntil' in template).toBe(false);
    expect('activityStartDate' in template.credentialSubject).toBe(false);
    expect(template.credentialSubject.achievement.criteria).toEqual({ narrative: draft.criteria });
});

test('malformed optional data is rejected before issuance instead of silently dropped', () => {
    for (const details of [
        { criteriaURL: 'file:///private/criteria' },
        { evidence: [{ url: 'javascript:alert(1)' }] },
        { evidence: [{ url: '', name: 'A missing artifact' }] },
        { evidence: Array.from({ length: 6 }, () => ({ url: 'https://example.org/evidence' })) },
        { evidence: [{ url: 'https://name:password@example.org/private' }] },
        { fieldOfStudy: 'x'.repeat(201) },
        { validUntil: '2026-02-30T00:00:00Z' },
        { activityStartDate: '2026-10-02T00:00:00Z', activityEndDate: '2026-10-01T00:00:00Z' },
    ])
        expect(() => buildNativeTemplate({ ...draft, details }, 'did:key:test', 'Test')).toThrow();
});

test('draft retry identity ignores nested object key order but preserves actual evidence and recipient edits', () => {
    const one: NativeCredentialDraft = {
        ...draft,
        details: {
            role: 'Mentor',
            evidence: [
                { url: 'https://example.org/one', name: 'Work' },
                { url: 'https://example.org/two' },
            ],
        },
    };
    const reordered: NativeCredentialDraft = {
        details: {
            evidence: [
                { name: 'Work', url: 'https://example.org/one' },
                { url: 'https://example.org/two' },
            ],
            role: 'Mentor',
        },
        ...draft,
    };
    expect(fingerprintNativeDraft(one)).toBe(fingerprintNativeDraft(reordered));
    expect(fingerprintNativeDraft(one)).not.toBe(
        fingerprintNativeDraft({ ...one, recipient: 'someone-else' })
    );
    expect(fingerprintNativeDraft(one)).not.toBe(
        fingerprintNativeDraft({
            ...one,
            details: { ...one.details, evidence: [...(one.details?.evidence ?? [])].reverse() },
        })
    );
});
