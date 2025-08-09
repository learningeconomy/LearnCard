import { describe, test, expect } from 'vitest';
import { getLearnCardForUser } from './helpers/learncard.helpers';
import type { LearnCard } from './helpers/learncard.helpers';

let a: LearnCard;
let b: LearnCard;

describe('Presentations', () => {
    beforeEach(async () => {
        a = await getLearnCardForUser('a');
        b = await getLearnCardForUser('b');
    });

    test('Users can send/receive presentations via LCN', async () => {
        // Create a test credential first
        const unsignedVc = a.invoke.getTestVc(b.id.did());
        const vc = await a.invoke.issueCredential(unsignedVc);

        // Create a presentation with the credential
        const unsignedVp = await a.invoke.newPresentation(vc);
        const vp = await a.invoke.issuePresentation(unsignedVp);

        const uri = await a.invoke.sendPresentation('testb', vp);

        const incomingPresentations = await b.invoke.getIncomingPresentations();

        expect(incomingPresentations).toHaveLength(1);
        expect(incomingPresentations[0]!.uri).toEqual(uri);

        const resolvedVp = await b.read.get(incomingPresentations[0]!.uri);

        expect(resolvedVp).toEqual(vp);

        await b.invoke.acceptPresentation(uri);

        expect(await a.invoke.getSentPresentations()).toHaveLength(1);
        expect(await b.invoke.getReceivedPresentations()).toHaveLength(1);
        expect(await b.invoke.getIncomingPresentations()).toHaveLength(0);
    });

    test('Users cannot accept the same presentation twice', async () => {
        // Create a test credential first
        const unsignedVc = a.invoke.getTestVc(b.id.did());
        const vc = await a.invoke.issueCredential(unsignedVc);

        // Create a presentation with the credential
        const unsignedVp = await a.invoke.newPresentation(vc);
        const vp = await a.invoke.issuePresentation(unsignedVp);

        const uri = await a.invoke.sendPresentation('testb', vp);

        // First acceptance should succeed
        await expect(b.invoke.acceptPresentation(uri)).resolves.not.toThrow();

        // Verify the presentation is now in received presentations
        const receivedPresentations = await b.invoke.getReceivedPresentations();
        expect(receivedPresentations).toHaveLength(1);

        // Second acceptance should fail
        await expect(b.invoke.acceptPresentation(uri)).rejects.toThrow(/already been received/);

        // Verify that received presentations count hasn't changed
        const receivedPresentationsAfter = await b.invoke.getReceivedPresentations();
        expect(receivedPresentationsAfter).toHaveLength(1);
    });

    test('proof context is placed at top-level vp["@context"] for interoperability', async () => {
        // Create a test credential first
        const unsignedVc = a.invoke.getTestVc(b.id.did());
        const vc = await a.invoke.issueCredential(unsignedVc);

        // Create and issue a presentation with a DataIntegrity proof
        const unsignedVp = await a.invoke.newPresentation(vc);
        const vp = await a.invoke.issuePresentation(unsignedVp);

        // Verify structure
        expect(vp).toBeDefined();
        expect(vp.proof).toBeDefined();

        // Proof-level @context should NOT exist
        if (Array.isArray(vp.proof)) {
            (vp.proof as any[]).forEach(p => expect((p as any)['@context']).toBeUndefined());
        } else {
            expect((vp.proof as any)['@context']).toBeUndefined();
        }

        // Top-level @context should exist and be an array
        expect(vp['@context']).toBeDefined();
        expect(Array.isArray(vp['@context'])).toBe(true);

        const contexts = vp['@context'] as string[];
        expect(contexts).toContain('https://www.w3.org/ns/credentials/v2');
        expect(contexts).toContain('https://w3id.org/security/suites/ed25519-2020/v1');

        // Verify the presentation is valid
        const verification = await a.invoke.verifyPresentation(vp);
        expect(verification.warnings).toHaveLength(0);
        expect(verification.errors).toHaveLength(0);
        expect(verification.checks).toContain('proof');
    });
});
