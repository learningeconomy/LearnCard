import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { classifyContractChange } from '@learncard/helpers';
import ContractUpdateChangesSummary from './ContractUpdateChangesSummary';
import { buildContractFormChanges } from './consentContractForm.helpers';
import type { ConsentContractFormValue } from './consentContractForm.types';
import { setLocale } from '../../../paraglide/runtime.js';

vi.mock('learn-card-base', () => ({
    contractCategoryNameToCategoryMetadata: (key: string) => ({ title: key }),
}));

const makeValue = (): ConsentContractFormValue => ({
    name: 'Original app',
    image: 'https://example.invalid/current.png',
    contract: {
        read: {
            credentials: { categories: { Achievement: { required: false, defaultEnabled: true } } },
            personal: {},
        },
        write: {
            credentials: { categories: { Certificate: { required: false } } },
            personal: {},
        },
    },
});

const showChanges = (baseline: ConsentContractFormValue, value: ConsentContractFormValue) => {
    render(
        <ContractUpdateChangesSummary
            baseline={baseline}
            value={value}
            changes={buildContractFormChanges(
                {
                    ...baseline,
                    uri: 'lc:contract:summary',
                    version: 1,
                    createdAt: '2026-10-01T00:00:00Z',
                    updatedAt: '2026-10-01T00:00:00Z',
                    owner: {
                        profileId: 'owner',
                        did: 'did:example:owner',
                        displayName: 'Owner',
                        shortBio: '',
                        bio: '',
                    },
                },
                value
            )}
            kind={classifyContractChange(baseline, value)}
        />
    );
};

beforeEach(() => setLocale('en', { reload: false }));

describe('pending contract change summary', () => {
    it('separates newly requested read access from removed write access and shows prior and next settings', () => {
        const baseline = makeValue();
        const value = structuredClone(baseline);
        value.contract.read.credentials.categories.Transcript = { required: true };
        value.contract.read.credentials.categories.Achievement.required = true;
        delete value.contract.write.credentials.categories.Certificate;
        showChanges(baseline, value);
        const read = within(screen.getByRole('region', { name: 'Read access' }));
        const write = within(screen.getByRole('region', { name: 'Write access' }));
        expect(read.getByText('Transcripts')).toBeInTheDocument();
        expect(read.getByText('New')).toBeInTheDocument();
        expect(read.getByText('Optional · on for new connections')).toBeInTheDocument();
        expect(read.getAllByText('Required')).toHaveLength(2);
        expect(write.getByText('Certificates')).toBeInTheDocument();
        expect(write.getByText('Removed')).toBeInTheDocument();
        expect(write.queryByText('Transcripts')).toBeNull();
        expect(read.queryByText('Certificates')).toBeNull();
    });
    it('shows the effective anonymization setting when the original request omitted it', () => {
        const baseline = makeValue();
        const value = structuredClone(baseline);
        value.contract.read.anonymize = false;
        showChanges(baseline, value);
        const read = within(screen.getByRole('region', { name: 'Read access' }));
        expect(read.getByText('Enabled')).toBeInTheDocument();
        expect(read.getByText('Disabled')).toBeInTheDocument();
        expect(screen.queryByRole('region', { name: 'Write access' })).toBeNull();
    });
    it('shows an existing image when the draft clears it rather than claiming both images are merely updated', () => {
        const baseline = makeValue();
        const value = { ...baseline, image: '' };
        showChanges(baseline, value);
        const details = within(screen.getByRole('region', { name: 'Request details' }));
        expect(details.getByRole('img', { name: 'Current' })).toHaveAttribute(
            'src',
            baseline.image
        );
        expect(details.getByText('Cleared')).toBeInTheDocument();
        expect(details.queryByRole('img', { name: 'After update' })).toBeNull();
    });
});
