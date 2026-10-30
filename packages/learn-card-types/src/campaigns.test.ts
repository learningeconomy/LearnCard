import { describe, expect, it } from 'vitest';
import { LCNNotificationValidator } from './lcn';

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
    it('requires only selected channel content and permits clearing inactive content', () => {
        const notification = { title: 'Hello', body: 'Open the app' };
        const notifyOnly = { ...draft, channels: ['notify'], message: undefined, notification };
        expect(CreateCampaignInputValidator.safeParse(notifyOnly).success).toBe(true);
        expect(
            CampaignValidator.safeParse({
                ...notifyOnly,
                createdAt: '2026-10-29T00:00:00Z',
                updatedAt: '2026-10-29T00:00:00Z',
            }).success
        ).toBe(true);
        expect(
            CreateCampaignInputValidator.safeParse({ ...draft, message: undefined }).success
        ).toBe(false);
        expect(
            CreateCampaignInputValidator.safeParse({ ...notifyOnly, channels: ['inApp', 'notify'] })
                .success
        ).toBe(false);
        expect(
            CreateCampaignInputValidator.safeParse({
                ...draft,
                channels: ['inApp', 'notify'],
                notification,
            }).success
        ).toBe(true);
        expect(
            UpdateCampaignInputValidator.parse({
                campaignId: draft.id,
                updates: { channels: ['notify'], message: null, notification },
            }).updates.message
        ).toBeNull();
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

    it('allows at most twenty metadata filters for profile and listing senders', () => {
        const metadata = Object.fromEntries(
            Array.from({ length: 20 }, (_, index) => [`filter_${index}`, 'transcript'])
        );
        for (const sender of [{ senderProfileId: 'issuer' }, { listingId: 'listing' }]) {
            const source = { type: 'credentialsSentBy', ...sender };
            expect(
                CampaignAudienceSourceValidator.safeParse({ ...source, metadata: {} }).success
            ).toBe(true);
            expect(CampaignAudienceSourceValidator.parse({ ...source, metadata })).toMatchObject({
                metadata,
            });
            const oversized = CampaignAudienceSourceValidator.safeParse({
                ...source,
                metadata: { ...metadata, overflow: 'transcript' },
            });
            expect(oversized.success).toBe(false);
            if (!oversized.success) {
                expect(oversized.error.issues).toEqual([
                    expect.objectContaining({
                        path: ['metadata'],
                        message: expect.stringContaining('maximum 20'),
                    }),
                ]);
            }
        }
    });
});

describe('campaign notification wire shape', () => {
    it('accepts ANNOUNCEMENT and retains its campaign identity', () => {
        const notification = {
            type: 'ANNOUNCEMENT',
            from: 'did:web:brain.example',
            to: { did: 'did:key:learner' },
            data: {
                metadata: { campaignId: 'pilot-clr', campaignCreatedAt: '2026-01-01T00:00:00Z' },
            },
        };
        expect(LCNNotificationValidator.parse(notification)).toMatchObject(notification);
        expect(
            LCNNotificationValidator.safeParse({
                ...notification,
                data: { metadata: { campaignId: '../invalid' } },
            }).success
        ).toBe(false);
    });
});
