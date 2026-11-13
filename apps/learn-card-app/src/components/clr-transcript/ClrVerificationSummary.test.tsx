import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
    ClrCredentialVerification,
    ClrVerificationSnapshot,
} from 'learn-card-base/helpers/credentials/clr/verification.types';
import { setLocale } from '../../paraglide/runtime.js';
import {
    ClrRecordVerification,
    ClrRecordVerificationDetails,
    ClrVerificationSummary,
} from './ClrVerificationSummary';

const registry = vi.hoisted(() => ({
    source: 'unknown' as 'trusted' | 'untrusted' | 'unknown',
    incomplete: false,
    isError: false,
    refetch: vi.fn(),
}));
vi.mock('learn-card-base/hooks/useRegistry', () => ({
    useKnownDIDRegistry: () => ({
        isPending: false,
        isError: registry.isError,
        isSuccess: !registry.isError,
        data: {
            source: registry.source,
            incomplete: registry.incomplete,
            results: { matchingIssuers: [] },
        },
        refetch: registry.refetch,
    }),
}));

const publisher = 'did:web:publisher.example';
const node = (overrides: Partial<ClrCredentialVerification> = {}): ClrCredentialVerification => ({
    occurrencePath: 'credentialSubject.verifiableCredential[0]',
    issuerDid: 'did:web:district.example',
    issuerName: 'District A',
    verificationMethods: ['did:web:district.example#key-1'],
    proof: 'verified',
    lifecycle: 'unchecked',
    binding: 'matched',
    checks: ['proof'],
    warnings: [],
    errors: [],
    status: [],
    descendants: [],
    ...overrides,
});
const snapshot = (
    records: Record<string, ClrCredentialVerification>,
    outer: Partial<ClrCredentialVerification> = {}
): ClrVerificationSnapshot => ({
    outer: node({
        occurrencePath: '',
        issuerDid: publisher,
        issuerName: 'State agency',
        binding: 'not-applicable',
        ...outer,
    }),
    records,
    complete: true,
});

beforeEach(() => {
    registry.source = 'unknown';
    registry.incomplete = false;
    registry.isError = false;
    registry.refetch.mockClear();
    setLocale('en', { reload: false });
});

describe('CLR verification presentation', () => {
    it('keeps successful same-publisher and unsigned rows quiet, showing only the publisher status', () => {
        const same = node({ issuerDid: publisher });
        render(
            <>
                <ClrVerificationSummary
                    publisherDid={publisher}
                    snapshot={snapshot({
                        canonicalA: same,
                        unsigned: node({ proof: 'unsigned' }),
                    })}
                />
                <ClrRecordVerification node={same} recordId="canonicalA" publisherDid={publisher} />
                <ClrRecordVerification node={node({ proof: 'unsigned' })} recordId="unsigned" />
            </>
        );
        expect(screen.getByTestId('clr-outer-verification')).toHaveTextContent(
            'Verified · Issued by State agency'
        );
        expect(screen.queryAllByTestId('clr-record-verification')).toHaveLength(0);
        expect(screen.queryByText(/certified by/)).not.toBeInTheDocument();
        expect(screen.queryByText('Not listed')).not.toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'Retry verification' })
        ).not.toBeInTheDocument();
    });

    it('marks only the affected duplicate occurrence and never calls the valid publisher forged', () => {
        const invalid = node({
            proof: 'invalid',
            occurrencePath: 'credentialSubject.verifiableCredential[1]',
        });
        render(
            <>
                <ClrVerificationSummary
                    publisherDid={publisher}
                    snapshot={snapshot({
                        duplicate: node(),
                        'duplicate#occurrence-1': invalid,
                    })}
                />
                <ClrRecordVerification node={node()} recordId="duplicate" recordName="Math" />
                <ClrRecordVerification
                    node={invalid}
                    recordId="duplicate#occurrence-1"
                    recordName="Science"
                />
            </>
        );
        const first = screen.getByLabelText('Math · District A · Verified');
        const second = screen.getByLabelText(
            'Science · District A · Signature could not be confirmed'
        );
        expect(first).toHaveAttribute('data-record-id', 'duplicate');
        expect(second).toHaveAttribute('data-record-id', 'duplicate#occurrence-1');
        expect(screen.getByTestId('clr-outer-verification')).toHaveTextContent(
            'Verified · Issued by State agency'
        );
        expect(screen.getByTestId('clr-outer-verification')).toHaveTextContent(/1/);
    });

    it.each([
        [{ lifecycle: 'revoked' }, 'Revoked'],
        [{ lifecycle: 'suspended' }, 'Suspended'],
        [{ binding: 'mismatch' }, 'Issued for a different learner'],
        [{ binding: 'unknown' }, 'Learner match could not be confirmed'],
        [{ proof: 'unavailable' }, 'Could not verify right now'],
        [{ lifecycle: 'unavailable' }, 'Could not verify right now'],
    ] satisfies Array<[Partial<ClrCredentialVerification>, string]>)(
        'keeps lifecycle, binding and incomplete evidence distinct: %s',
        (state, label) => {
            render(
                <ClrRecordVerification node={node(state)} recordId="recordA" recordName="Math" />
            );
            expect(screen.getByLabelText(`Math · District A · ${label}`)).toBeInTheDocument();
        }
    );

    it('does not upgrade an unsigned or invalid publisher with valid district records', () => {
        const view = render(
            <ClrVerificationSummary
                publisherDid={publisher}
                snapshot={snapshot({ record: node() }, { proof: 'unsigned' })}
            />
        );
        expect(screen.getByTestId('clr-outer-verification')).toHaveTextContent(
            'Unsigned credential'
        );
        view.rerender(
            <ClrVerificationSummary
                publisherDid={publisher}
                snapshot={snapshot({ record: node() }, { proof: 'invalid' })}
            />
        );
        expect(screen.getByTestId('clr-outer-verification')).toHaveTextContent(
            'Signature could not be confirmed'
        );
    });

    it('does not require an absent status list to verify a signed district record', () => {
        render(
            <ClrRecordVerification node={node({ lifecycle: 'unchecked' })} recordId="recordA" />
        );
        expect(screen.getByTestId('clr-record-verification')).toHaveTextContent('Verified');
        expect(screen.queryByText('Could not verify right now')).not.toBeInTheDocument();
    });

    it('qualifies signed records included below an unsigned record without borrowing its signer', () => {
        render(
            <ClrRecordVerification
                node={node({
                    proof: 'unsigned',
                    descendants: [node({ issuerDid: 'did:web:other.example', proof: 'invalid' })],
                })}
                recordId="container"
                recordName="Included course"
            />
        );
        expect(screen.getByTestId('clr-record-verification')).toHaveTextContent(
            'Included records need attention'
        );
        expect(screen.getByTestId('clr-record-verification')).not.toHaveTextContent(/^Verified/);
    });

    it.each([
        ['trusted', false, false, 'Trusted registry entry'],
        ['untrusted', false, false, 'Flagged registry entry'],
        ['unknown', false, false, 'Not listed'],
        ['unknown', true, false, 'Registry could not be checked'],
        ['unknown', false, true, 'Registry could not be checked'],
    ] as const)(
        'separates exact-issuer registry result %s from signature verification',
        (source, incomplete, isError, label) => {
            registry.source = source;
            registry.incomplete = incomplete;
            registry.isError = isError;
            render(
                <ClrVerificationSummary
                    publisherDid={publisher}
                    snapshot={snapshot({ recordA: node() })}
                />
            );
            expect(screen.getAllByText(label).length).toBeGreaterThan(0);
            expect(screen.getByTestId('clr-outer-verification')).toHaveTextContent('Verified');
            if (incomplete || isError)
                expect(screen.queryByText('Not listed')).not.toBeInTheDocument();
        }
    );

    it('keeps header checking until the complete pass and offers neutral retry without stealing focus', () => {
        const retry = vi.fn();
        const pending = { ...snapshot({ recordA: node({ proof: 'checking' }) }), complete: false };
        const view = render(
            <ClrVerificationSummary retry={retry} publisherDid={publisher} snapshot={pending} />
        );
        expect(screen.getByTestId('clr-outer-verification')).toHaveTextContent(
            'Checking verification'
        );
        expect(screen.getByTestId('clr-outer-verification')).not.toHaveTextContent('Verified ·');
        view.rerender(
            <ClrVerificationSummary
                retry={retry}
                publisherDid={publisher}
                snapshot={snapshot({ recordA: node({ proof: 'unavailable' }) })}
            />
        );
        const retryButton = screen.getAllByRole('button', { name: 'Retry verification' }).at(-1)!;
        retryButton.focus();
        fireEvent.click(retryButton);
        expect(retry).toHaveBeenCalledOnce();
        expect(retryButton).toHaveFocus();
        view.rerender(
            <ClrVerificationSummary retry={retry} publisherDid={publisher} snapshot={pending} />
        );
        expect(retryButton).toHaveFocus();
        expect(retryButton).toHaveAttribute('aria-disabled', 'true');
        fireEvent.click(retryButton);
        expect(retry).toHaveBeenCalledOnce();
        view.rerender(
            <ClrVerificationSummary
                retry={retry}
                publisherDid={publisher}
                snapshot={snapshot({ recordA: node() })}
            />
        );
        expect(retryButton).toHaveFocus();
        expect(retryButton).toHaveAttribute('aria-disabled', 'false');
    });

    it('exposes issuer DID, registry entry and unique verification methods on demand', () => {
        render(
            <ClrVerificationSummary
                snapshot={snapshot({ recordA: node() })}
                publisherDid={publisher}
            />
        );
        const details = screen.getByRole('group', { name: 'Verification details for District A' });
        fireEvent.click(within(details).getByText('District A', { exact: true }));
        expect(
            within(details).getByText('Issuer DID: did:web:district.example')
        ).toBeInTheDocument();
        expect(
            within(details).getByText('Verification method: did:web:district.example#key-1')
        ).toBeInTheDocument();
    });

    it('does not hide failing signed occurrences when subject ambiguity leaves no canonical rows', () => {
        render(
            <ClrVerificationSummary
                publisherDid={publisher}
                snapshot={snapshot(
                    {},
                    {
                        descendants: [node({ proof: 'invalid' })],
                    }
                )}
            />
        );
        expect(screen.getByTestId('clr-outer-verification')).toHaveTextContent(
            'Unconfirmed signatures: 1'
        );
        expect(screen.getByText('Signature could not be confirmed')).toBeInTheDocument();
    });

    it('explains a same-publisher failed record independently of the outer signature', () => {
        render(
            <ClrRecordVerificationDetails
                node={node({ proof: 'invalid', issuerDid: publisher })}
                recordId="recordA"
                recordName="Math"
                publisherDid={publisher}
            />
        );
        expect(
            screen.getByText(
                'This record did not pass the signature check. The publisher’s signature is checked separately.'
            )
        ).toBeInTheDocument();
        expect(
            screen.getByText('Verification method: did:web:district.example#key-1')
        ).toBeInTheDocument();
    });
});
