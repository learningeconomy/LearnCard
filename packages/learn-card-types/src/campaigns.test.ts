import { describe, expect, it } from 'vitest';

import {
    CampaignValidator,
    CreateCampaignInputValidator,
    UpdateCampaignInputValidator,
    CampaignAudienceSourceValidator,
} from './campaigns';

const draft = {
    id: 'pilot-clr',
    name: 'Pilot',
    channels: ['inApp'],
    message: { title: 'Welcome' },
};

describe('campaign schemas', () => {
    it('accepts legacy modal content and defaults to a draft with minor exclusion', () => {
        expect(CreateCampaignInputValidator.parse(draft)).toMatchObject({
            status: 'draft',
            excludeMinors: true,
            selfEnroll: false,
            message: { presentation: 'modal', frequency: 'once' },
        });
    });
    it('requires notification content only for notify and rejects empty/duplicate channels', () => {
        for (const channels of [[], ['inApp', 'inApp'], ['notify']]) {
            expect(CreateCampaignInputValidator.safeParse({ ...draft, channels }).success).toBe(
                false
            );
        }
        expect(
            CreateCampaignInputValidator.safeParse({
                ...draft,
                channels: ['notify'],
                notification: { title: 'Hello', body: 'Open the app' },
            }).success
        ).toBe(true);
    });
    it('validates time windows after normalizing timezone offsets', () => {
        const parsed = CreateCampaignInputValidator.parse({
            ...draft,
            startsAt: '2026-10-22T10:00:00-07:00',
            endsAt: '2026-10-22T18:00:00Z',
        });
        expect(parsed.startsAt).toBe('2026-10-22T17:00:00.000Z');
        expect(
            CreateCampaignInputValidator.safeParse({
                ...draft,
                startsAt: '2026-10-22T18:00:00Z',
                endsAt: '2026-10-22T10:00:00-07:00',
            }).success
        ).toBe(false);
    });
    it('rejects immutable IDs in updates and mismatched persisted message IDs', () => {
        expect(
            UpdateCampaignInputValidator.safeParse({
                campaignId: 'pilot-clr',
                updates: { id: 'other-id' },
            }).success
        ).toBe(false);
        expect(
            CampaignValidator.safeParse({
                ...draft,
                createdAt: '2026-10-22T00:00:00Z',
                updatedAt: '2026-10-22T00:00:00Z',
                message: { title: 'Welcome', id: 'other-id' },
            }).success
        ).toBe(false);
    });
    it('leaves omitted update fields untouched instead of applying creation defaults', () => {
        expect(
            UpdateCampaignInputValidator.parse({
                campaignId: 'pilot-clr',
                updates: { name: 'Renamed' },
            })
        ).toEqual({ campaignId: 'pilot-clr', updates: { name: 'Renamed' } });
    });
    it('requires exactly one credential sender and rejects unsafe metadata keys', () => {
        const source = { type: 'credentialsSentBy', senderProfileId: 'issuer' };
        for (const input of [
            { type: 'credentialsSentBy' },
            { ...source, listingId: 'listing' },
            { ...source, metadata: { 'kind` MATCH (n) DETACH DELETE n //': 'x' } },
            { ...source, metadata: { constructor: 'x' } },
        ])
            expect(CampaignAudienceSourceValidator.safeParse(input).success).toBe(false);
        expect(
            CampaignAudienceSourceValidator.parse({ ...source, metadata: { kind: 'transcript' } })
        ).toMatchObject({ includePending: false });
    });
    it('limits lists to 1000 and normalizes verified email lookup inputs', () => {
        expect(
            CampaignAudienceSourceValidator.safeParse({
                type: 'dids',
                dids: Array(1001).fill('did:key:alice'),
            }).success
        ).toBe(false);
        expect(
            CampaignAudienceSourceValidator.parse({ type: 'emails', emails: ['Alice@Example.com'] })
        ).toEqual({ type: 'emails', emails: ['alice@example.com'] });
    });
});
