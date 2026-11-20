import React, { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CampaignAudienceSourceEditor } from './CampaignAudienceSourceEditor';
import { parseAudienceSource } from './model';

afterEach(cleanup);
const mount = (initial = '') => {
    const changed = vi.fn();
    const Harness = () => {
        const [value, setValue] = useState(initial);
        return (
            <>
                <CampaignAudienceSourceEditor
                    value={value}
                    onChange={next => {
                        changed(next);
                        setValue(next);
                    }}
                />
                <output data-testid="source-value">{value}</output>
            </>
        );
    };
    render(<Harness />);
    return changed;
};
const current = () => JSON.parse(screen.getByTestId('source-value').textContent!);
const change = (label: string, value: string) =>
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
const json = () => fireEvent.click(screen.getByRole('tab', { name: 'JSON' }));
const fields = () => fireEvent.click(screen.getByRole('tab', { name: 'Fields' }));

describe('audience source fields', () => {
    it('normalizes and deduplicates pasted emails while retaining separators during typing', () => {
        mount();
        change('Email addresses', ' Alice@EXAMPLE.com\nalice@example.com, bob@example.com;\n');
        expect(screen.getByLabelText('Email addresses')).toHaveValue(
            ' Alice@EXAMPLE.com\nalice@example.com, bob@example.com;\n'
        );
        expect(current()).toEqual({
            type: 'emails',
            emails: ['alice@example.com', 'bob@example.com'],
        });
        json();
        expect(
            JSON.parse((screen.getByLabelText('Audience source JSON') as HTMLTextAreaElement).value)
        ).toEqual(current());
        fields();
        expect(screen.getByLabelText('Email addresses')).toHaveValue(
            'alice@example.com\nbob@example.com'
        );
    });
    it('offers identifiers without CSV and preserves drafts when changing source types', () => {
        mount();
        change('Email addresses', 'a@example.com');
        change('Audience source', 'dids');
        change('Account identifiers', 'did:key:one\ndid:key:two\ndid:key:one');
        expect(current()).toEqual({ type: 'dids', dids: ['did:key:one', 'did:key:two'] });
        change('Audience source', 'emails');
        expect(current()).toEqual({ type: 'emails', emails: ['a@example.com'] });
        change('Audience source', 'dids');
        expect(screen.getByLabelText('Account identifiers')).toHaveValue(
            'did:key:one\ndid:key:two'
        );
    });
    it('does not rewrite JSON on mode switches, including invalid or unknown fields', () => {
        const raw = '{ "type": "emails", "emails": ["UPPER@example.com"], "extra": 7 }';
        const changed = mount(raw);
        json();
        fields();
        json();
        expect(screen.getByLabelText('Audience source JSON')).toHaveValue(raw);
        expect(changed).not.toHaveBeenCalled();
        change('Audience source JSON', '{');
        fields();
        expect(screen.getByText(/Your original input is preserved/)).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Edit audience JSON' }));
        expect(screen.getByLabelText('Audience source JSON')).toHaveValue('{');
    });
    it('loads JSON edits into fields and rejects invalid entries and oversized lists', () => {
        mount();
        json();
        change(
            'Audience source JSON',
            JSON.stringify({ type: 'dids', dids: ['did:key:from-json'] })
        );
        fields();
        expect(screen.getByLabelText('Account identifiers')).toHaveValue('did:key:from-json');
        change('Account identifiers', 'not-an-identifier');
        expect(parseAudienceSource(JSON.stringify(current())).data).toBeUndefined();
        change(
            'Account identifiers',
            Array.from({ length: 1001 }, (_, i) => `did:key:${i}`).join('\n')
        );
        expect(parseAudienceSource(JSON.stringify(current())).data).toBeUndefined();
        change('Audience source', 'emails');
        change('Email addresses', 'not-an-email');
        expect(parseAudienceSource(JSON.stringify(current())).data).toBeUndefined();
    });
    it('constructs credential sources with exactly one sender, metadata, dates and pending', () => {
        mount();
        change('Audience source', 'credentialsSentBy');
        change('Sender username', 'issuer');
        change('Filter name', 'kind');
        change('Filter value', 'transcript');
        fireEvent.click(screen.getByRole('button', { name: 'Add filter' }));
        change('Since (local time, optional)', '2026-10-30T12:00');
        fireEvent.click(screen.getByLabelText('Include pending credentials'));
        expect(parseAudienceSource(JSON.stringify(current())).data).toEqual({
            type: 'credentialsSentBy',
            senderProfileId: 'issuer',
            metadata: { kind: 'transcript' },
            includePending: true,
            since: new Date('2026-10-30T12:00').toISOString(),
        });
        change('Sender type', 'listingId');
        change('App listing ID', 'sample-app');
        expect(current().senderProfileId).toBeUndefined();
        expect(current().listingId).toBe('sample-app');
        fireEvent.click(screen.getByRole('button', { name: 'Remove filter kind' }));
        fireEvent.click(screen.getByRole('button', { name: 'Clear date' }));
        expect(current().metadata).toBeUndefined();
        expect(current().since).toBeUndefined();
    });
    it('constructs claimed-credential and boost sources', () => {
        mount();
        change('Audience source', 'inboxClaims');
        change('Issuer account identifier', 'did:key:issuer');
        expect(parseAudienceSource(JSON.stringify(current())).data).toEqual({
            type: 'inboxClaims',
            issuerDid: 'did:key:issuer',
        });
        change('Audience source', 'boostRecipients');
        change('Source boost URI', 'lc:network:sample-boost');
        fireEvent.click(screen.getByLabelText('Include pending credentials'));
        expect(parseAudienceSource(JSON.stringify(current())).data).toEqual({
            type: 'boostRecipients',
            boostUri: 'lc:network:sample-boost',
            includePending: true,
        });
    });
});
