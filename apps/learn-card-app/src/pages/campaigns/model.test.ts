import { describe, expect, it } from 'vitest';
import {
    audienceChunks,
    campaignToForm,
    initialForm,
    parseAudienceCsv,
    previewMessage,
    validateForm,
} from './model';
import { CampaignValidator } from '@learncard/types';

const valid = () => ({ ...initialForm(), id: 'test-campaign', name: 'A campaign' });
describe('campaign authoring contracts', () => {
    it('applies safe defaults and validates against the actual create contract', () => {
        const result = validateForm(valid());
        expect(result.errors).toEqual([]);
        expect(result.data).toMatchObject({
            status: 'draft',
            excludeMinors: true,
            selfEnroll: false,
        });
    });
    it('reports field paths, malformed JSON and missing notification copy', () => {
        expect(validateForm({ ...valid(), messageJson: '{' }).errors[0]).toMatch(/^message:/);
        expect(
            validateForm({ ...valid(), messageJson: '{"title": 4}' }).errors.some(e =>
                e.startsWith('message.title:')
            )
        ).toBe(true);
        expect(
            validateForm({ ...valid(), notify: true }).errors.some(e =>
                e.startsWith('notification.title:')
            )
        ).toBe(true);
    });
    it('rejects empty channels and inverted dates', () => {
        expect(validateForm({ ...valid(), inApp: false }).data).toBeUndefined();
        expect(
            validateForm({ ...valid(), startsAt: '2026-10-30T10:00', endsAt: '2026-10-29T10:00' })
                .errors
        ).toContain('endsAt: End must be after start');
    });
    it('round trips saved configuration, including selfEnroll and false excludeMinors', () => {
        const input = validateForm({
            ...valid(),
            selfEnroll: true,
            excludeMinors: false,
            startsAt: '2026-10-30T10:00',
        }).data!;
        const campaign = CampaignValidator.parse({
            ...input,
            message: { ...input.message, id: input.id },
            createdAt: '2026-10-29T00:00:00Z',
            updatedAt: '2026-10-29T00:00:00Z',
        });
        expect(validateForm(campaignToForm(campaign)).data).toEqual({
            ...input,
            message: campaign.message,
        });
    });
    it('previews an unsaved message using renderer defaults and a local id', () => {
        expect(previewMessage(initialForm())).toMatchObject({
            success: true,
            data: { id: 'composer-preview', title: 'Your campaign message' },
        });
    });
});
describe('DID CSV', () => {
    it('supports BOM, named columns, quoting, CRLF and deduplication', () => {
        expect(
            parseAudienceCsv(
                '\uFEFFname,did\r\n"Doe, Jane",did:key:one\r\nOther,did:key:one\r\nNew, did:key:two '
            )
        ).toEqual({ dids: ['did:key:one', 'did:key:two'], duplicates: 1, errors: [] });
    });
    it('accepts a headerless one-column CSV and rejects malformed rows atomically', () => {
        expect(parseAudienceCsv('did:key:one\ndid:web:two').errors).toEqual([]);
        expect(parseAudienceCsv('did\nnot-a-did\ndid:key:one').errors[0]).toContain('row 2');
        expect(parseAudienceCsv('first,last\na,b').errors).toContain(
            'Use a named did column or a single column.'
        );
        expect(parseAudienceCsv('did,did\ndid:key:a,did:key:b').errors).toContain(
            'Use only one did column.'
        );
        expect(parseAudienceCsv('did\n"unterminated').errors.length).toBeGreaterThan(0);
    });
    it('splits ten thousand unique rows into ten API-sized batches', () => {
        const result = parseAudienceCsv(
            'did\n' + Array.from({ length: 10_000 }, (_, i) => `did:key:${i}`).join('\n')
        );
        expect(result.errors).toEqual([]);
        const chunks = audienceChunks(result.dids);
        expect(chunks).toHaveLength(10);
        expect(chunks.every(chunk => chunk.length === 1000)).toBe(true);
        expect(chunks.flat()).toEqual(result.dids);
    });
    it('rejects empty data and invalid prefix/whitespace/oversize values', () => {
        for (const text of ['', 'did', 'did:', 'did:key:a b', 'did:' + 'a'.repeat(2048)])
            expect(parseAudienceCsv(text).errors.length).toBeGreaterThan(0);
    });
});

describe('advanced audience sources', () => {
    it('validates existing email, sender, listing and inbox contracts', async () => {
        const { parseAudienceSource } = await import('./model');
        expect(
            parseAudienceSource('{"type":"emails","emails":["Learner@Example.com"]}').data
        ).toEqual({ type: 'emails', emails: ['learner@example.com'] });
        expect(
            parseAudienceSource('{"type":"credentialsSentBy","senderProfileId":"issuer"}').data
        ).toMatchObject({ includePending: false });
        expect(
            parseAudienceSource('{"type":"credentialsSentBy","listingId":"listing"}').errors
        ).toEqual([]);
        expect(
            parseAudienceSource('{"type":"inboxClaims","issuerDid":"did:key:issuer"}').errors
        ).toEqual([]);
        expect(
            parseAudienceSource(
                '{"type":"credentialsSentBy","listingId":"one","senderProfileId":"two"}'
            ).data
        ).toBeUndefined();
    });
});
