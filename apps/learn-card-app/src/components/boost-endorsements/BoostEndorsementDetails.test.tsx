// @vitest-environment jsdom

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const endorsementA = {
    endorsement: { id: 'urn:uuid:endorsement-a' },
    metadata: { id: 'record-a' },
};

vi.mock('learn-card-base', () => ({
    useWallet: () => ({ initWallet: vi.fn() }),
    useGetVCInfo: (credential: { id?: string }) => ({
        endorsements: credential.id === 'urn:uuid:credential-a' ? [endorsementA] : [],
    }),
}));

vi.mock('./EndorsementCard', () => ({ default: () => null }));
vi.mock('./EndorsementsList/EndorsementFullView', () => ({
    default: ({ endorsement }: { endorsement: { id: string } }) => <div>{endorsement.id}</div>,
}));

import BoostEndorsementDetails from './BoostEndorsementDetails';

const credentialA = { id: 'urn:uuid:credential-a' };
const credentialB = { id: 'urn:uuid:credential-b' };

describe('BoostEndorsementDetails', () => {
    it('does not retain endorsements when the displayed credential changes', () => {
        const { rerender } = render(<BoostEndorsementDetails credential={credentialA as never} />);
        expect(screen.getByText('urn:uuid:endorsement-a')).toBeInTheDocument();

        rerender(<BoostEndorsementDetails credential={credentialB as never} />);
        expect(screen.queryByText('urn:uuid:endorsement-a')).not.toBeInTheDocument();
    });
});
