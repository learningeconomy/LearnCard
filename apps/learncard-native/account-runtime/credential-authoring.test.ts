import { expect, test } from 'bun:test';
import { readFile } from 'node:fs/promises';
import { initLearnCard } from '@learncard/init';
import catalog from '../ios/NativeCore/Sources/LearnCardNativeCore/Resources/credential-authoring.json';
import { resolveNativeAuthoring } from './credential-authoring';
import { buildNativeTemplate } from './credential-draft';
import { credentialCategoryForDisplay } from './credential-category';

const draft = {
    requestID: 'authoring-test',
    title: 'Public test',
    summary: 'A synthetic authoring test.',
    criteria: '',
    kind: 'Achievements',
    achievementType: 'Certificate',
};

test('web categories and four visual formats are distinct from category-scoped credential types', () => {
    expect(catalog.formats).toEqual(['badge', 'award', 'certificate', 'media']);
    expect(catalog.categories.map(value => value.category).sort()).toEqual(
        [
            'Social Badge',
            'Achievement',
            'Qualifications',
            'Learning History',
            'Accomplishment',
            'Accommodation',
            'Work History',
            'ID',
        ].sort()
    );
    const result = resolveNativeAuthoring({
        ...draft,
        category: 'Qualifications',
        achievementType: 'License',
        displayType: 'badge',
    });
    expect(result).toMatchObject({
        category: 'Qualifications',
        achievementType: 'License',
        displayType: 'badge',
    });
    expect(
        resolveNativeAuthoring({
            ...draft,
            category: 'Accomplishment',
            achievementType: 'ext:Project',
        }).displayType
    ).toBe('media');
});

test('invalid categories, types and visual formats fail before issuance', () => {
    for (const change of [
        { category: 'Family', achievementType: 'ext:Family' },
        { category: 'AI Topic', achievementType: 'Badge' },
        { category: 'Memberships' },
        { category: 'Qualifications', achievementType: 'Certificate' },
        { category: 'Accomplishment', achievementType: 'License' },
        { category: 'Achievement', displayType: 'Course' },
        { category: 'Achievement', displayType: 'Competency' },
        { category: 'ID', achievementType: 'ext:SchoolID', displayType: 'media' },
        { category: 'Achievement', displayType: 'id' },
    ])
        expect(() =>
            buildNativeTemplate({ ...draft, ...change }, 'did:key:public', 'Test')
        ).toThrow();
});

test('older three-kind callers keep their category while semantic drafts take precedence', () => {
    expect(
        resolveNativeAuthoring({ ...draft, kind: 'Learning', achievementType: 'Course' }).category
    ).toBe('Learning History');
    expect(
        resolveNativeAuthoring({ ...draft, kind: 'Memberships', achievementType: 'Membership' })
    ).toMatchObject({ category: 'ID', displayType: 'id' });
    expect(
        resolveNativeAuthoring({
            ...draft,
            category: 'Accomplishment',
            achievementType: 'ext:Project',
        }).category
    ).toBe('Accomplishment');
});

test('every audited web type survives real signing with independent category and display metadata', async () => {
    const wasm = await readFile(
        new URL(
            '../../../packages/plugins/didkit/src/didkit/pkg/didkit_wasm_bg.wasm',
            import.meta.url
        )
    );
    const wallet = await initLearnCard({ seed: 'a'.repeat(64), didkit: wasm });
    let count = 0;
    for (const category of catalog.categories)
        for (const option of category.types) {
            const authoring = resolveNativeAuthoring({
                ...draft,
                category: category.category,
                achievementType: option.type,
            });
            const template = buildNativeTemplate(
                { ...draft, category: category.category, achievementType: option.type },
                wallet.id.did(),
                'Public test'
            );
            const credential = await wallet.invoke.issueCredential({
                ...template,
                id: `urn:uuid:${crypto.randomUUID()}`,
                validFrom: '2026-10-16T00:00:00Z',
                credentialSubject: { ...template.credentialSubject, id: wallet.id.did() },
            } as never);
            const proof = await wallet.invoke.verifyCredential(credential, { checks: ['proof'] });
            expect(proof.errors, category.category + '/' + option.type).toHaveLength(0);
            expect(credentialCategoryForDisplay(undefined, credential)).toBe(category.category);
            expect(credential.credentialSubject.achievement).toMatchObject({
                achievementType: option.type,
                tag: [`lc:category:${category.category}`],
            });
            expect(credential.display).toMatchObject({
                displayType: authoring.displayType,
                backgroundColor: authoring.backgroundColor,
            });
            if (category.category === 'ID') expect(credential.type).toContain('BoostID');
            count++;
        }
    expect(count).toBe(115);
}, 60_000);

test('changing visual format changes signed data while retaining the chosen category and type', async () => {
    const wasm = await readFile(
        new URL(
            '../../../packages/plugins/didkit/src/didkit/pkg/didkit_wasm_bg.wasm',
            import.meta.url
        )
    );
    const wallet = await initLearnCard({ seed: 'b'.repeat(64), didkit: wasm });
    for (const displayType of catalog.formats) {
        const template = buildNativeTemplate(
            { ...draft, category: 'Qualifications', achievementType: 'Certification', displayType },
            wallet.id.did(),
            'Public test'
        );
        const credential = await wallet.invoke.issueCredential({
            ...template,
            id: `urn:uuid:${crypto.randomUUID()}`,
            validFrom: '2026-10-16T00:00:00Z',
            credentialSubject: { ...template.credentialSubject, id: wallet.id.did() },
        } as never);
        expect(
            (await wallet.invoke.verifyCredential(credential, { checks: ['proof'] })).errors
        ).toHaveLength(0);
        const tampered = structuredClone(credential);
        tampered.display.displayType = displayType === 'badge' ? 'certificate' : 'badge';
        expect(
            (await wallet.invoke.verifyCredential(tampered, { checks: ['proof'] })).errors.length
        ).toBeGreaterThan(0);
        const moved = structuredClone(credential);
        moved.credentialSubject.achievement.tag = ['lc:category:Accomplishment'];
        expect(
            (await wallet.invoke.verifyCredential(moved, { checks: ['proof'] })).errors.length
        ).toBeGreaterThan(0);
        const retyped = structuredClone(credential);
        retyped.credentialSubject.achievement.achievementType = 'License';
        expect(
            (await wallet.invoke.verifyCredential(retyped, { checks: ['proof'] })).errors.length
        ).toBeGreaterThan(0);
    }
}, 30_000);

test('Media cover artwork is also signed as web-readable photo evidence', async () => {
    const wasm = await readFile(
        new URL(
            '../../../packages/plugins/didkit/src/didkit/pkg/didkit_wasm_bg.wasm',
            import.meta.url
        )
    );
    const wallet = await initLearnCard({ seed: 'c'.repeat(64), didkit: wasm });
    const artworkURL = 'https://cdn.filestackcontent.com/public-authoring-test';
    const template = buildNativeTemplate(
        {
            ...draft,
            category: 'Accomplishment',
            achievementType: 'ext:Artwork',
            displayType: 'media',
            artworkURL,
            details: { evidence: [{ url: 'https://example.org/work', name: 'Supporting work' }] },
        },
        wallet.id.did(),
        'Public test'
    );
    expect(template.evidence).toHaveLength(2);
    expect(template.evidence?.[0]).toMatchObject({
        id: artworkURL,
        type: ['Evidence', 'EvidenceFile'],
        genre: 'photo',
        fileType: 'image/jpeg',
    });
    expect(template.evidence?.[1]).toMatchObject({ id: 'https://example.org/work' });
    const credential = await wallet.invoke.issueCredential({
        ...template,
        id: `urn:uuid:${crypto.randomUUID()}`,
        validFrom: '2026-10-16T00:00:00Z',
        credentialSubject: { ...template.credentialSubject, id: wallet.id.did() },
    } as never);
    expect(
        (await wallet.invoke.verifyCredential(credential, { checks: ['proof'] })).errors
    ).toHaveLength(0);
    const tampered = structuredClone(credential);
    tampered.evidence[0].genre = 'video';
    expect(
        (await wallet.invoke.verifyCredential(tampered, { checks: ['proof'] })).errors.length
    ).toBeGreaterThan(0);
}, 30_000);
