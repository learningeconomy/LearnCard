// @vitest-environment jsdom

import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { IssuerContext } from '@learncard/types';

import VerifierStateBadgeAndText from './VerifierStateBadgeAndText';

const createContext = (overrides: Partial<IssuerContext> = {}): IssuerContext => ({
    state: 'connection',
    trustProfile: 'social',
    issuerDid: 'did:key:issuer',
    profile: {
        profileId: 'issuer',
        displayName: 'Charles Henway',
        image: 'https://example.com/charles.png',
    },
    connectionStatus: 'CONNECTED',
    mutualConnectionCount: 0,
    hasVerifiedContactMethod: true,
    ...overrides,
});

describe('VerifierStateBadgeAndText', () => {
    it('renders a connected issuer with an avatar and emerald relationship treatment', () => {
        const onClick = vi.fn();
        const { container, getByRole, getByText } = render(
            <VerifierStateBadgeAndText
                issuerContext={createContext()}
                label="From your connection Charles Henway"
                onClick={onClick}
            />
        );

        const issuerName = getByText('Charles Henway');
        expect(issuerName.parentElement?.parentElement?.className).toContain('text-emerald-600');
        expect(issuerName.tagName).toBe('STRONG');
        expect(issuerName.className).toContain('font-bold');
        expect(container.querySelector('img')?.getAttribute('src')).toBe(
            'https://example.com/charles.png'
        );

        fireEvent.click(getByRole('button'));
        expect(onClick).toHaveBeenCalledOnce();
    });

    it('keeps denylisted issuers red even when relationship data is present', () => {
        const { container, getByText } = render(
            <VerifierStateBadgeAndText
                issuerContext={createContext({ state: 'denied' })}
                label="Untrusted Issuer"
            />
        );

        expect(getByText('Untrusted Issuer').parentElement?.className).toContain('text-red-600');
        expect(container.querySelector('img')).toBeNull();
    });
});
