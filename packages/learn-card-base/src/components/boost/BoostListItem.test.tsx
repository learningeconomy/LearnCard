// @vitest-environment jsdom

import React from 'react';
import moment from 'moment';
import 'moment/dist/locale/fr';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { VC } from '@learncard/types';

const mocks = vi.hoisted(() => ({
    locale: 'en',
    registry: undefined as unknown,
    issuerName: undefined as string | undefined,
}));

vi.mock('learn-card-base/hooks/useRegistry', () => ({
    useKnownDIDRegistry: () => ({ data: mocks.registry }),
}));
vi.mock('../earned-and-managed-tabs/EarnedAndManagedTabs', () => ({
    BoostPageViewMode: { Card: 'card', List: 'list' },
}));
vi.mock('@learncard/react', () => ({
    isDid: (value: string) => value.startsWith('did:'),
    BoostGenericCard: ({ title, issuerName }: { title?: string; issuerName?: string }) => (
        <div data-testid="tile">
            {title}
            <span>{issuerName}</span>
        </div>
    ),
    formatDidDisplayName: (did: string) => did,
    getLifecycleTreatment: () => ({
        isInactive: false,
        mediaStyle: undefined,
        pillBg: undefined,
    }),
}));
vi.mock('learn-card-base', () => ({
    CredentialCategoryEnum: {
        achievement: 'Achievement',
        learningHistory: 'Learning History',
        socialBadge: 'Social Badge',
        accomplishment: 'Accomplishment',
        workHistory: 'Work History',
        accommodation: 'Accommodation',
        id: 'ID',
        membership: 'Membership',
        meritBadge: 'Merit Badge',
    },
    categoryMetadata: Object.fromEntries(
        [
            'Achievement',
            'Learning History',
            'Social Badge',
            'Accomplishment',
            'Work History',
            'Accommodation',
            'ID',
            'Qualifications',
        ].map(category => [category, { subColor: 'emerald-100' }])
    ),
}));
vi.mock('learn-card-base/hooks/useGetIssuerName', () => ({ default: () => mocks.issuerName }));
vi.mock('learn-card-base/helpers/credentialHelpers', async importOriginal => ({
    ...(await importOriginal<typeof import('learn-card-base/helpers/credentialHelpers')>()),
    getAchievementType: () => 'Achievement',
    getAchievementTypeDisplayText: () => 'Achievement',
    getIssuanceDate: () => '2026-08-06T00:00:00.000Z',
}));
vi.mock('../CredentialBadge/CredentialVerificationDisplay', () => ({
    default: () => null,
}));
vi.mock('../CredentialBadge/BadgeThumbnailImg', () => ({ default: () => null }));
vi.mock('../CredentialBadge/CredentialMediaBadge', () => ({ default: () => null }));
vi.mock('learn-card-base/helpers/display.helpers', () => ({
    DisplayTypeEnum: { Media: 'media' },
    getAttachmentTypeIcon: () => ({ AttachmentIcon: () => null, title: 'Video' }),
    getDisplayIcon: () => () => null,
}));
vi.mock('./boost', () => ({ BoostMediaOptionsEnum: { photo: 'photo' } }));
vi.mock('learn-card-base/stores/newCredsStore', () => ({
    newCredsStore: { use: { newCreds: () => ({}) } },
}));
vi.mock('../../svgs/DotIcon', () => ({ default: () => null }));
vi.mock('learn-card-base/i18n', () => ({
    useI18nLocale: () => mocks.locale,
    useT: () => (key: string) => key,
}));

import BoostListItem, { formatRelativeDate } from './BoostListItem';
import { BoostGenericCardWrapper } from '../wrappers/BoostGenericCardWrapper';
import type { CredentialCategory } from '../../types/credentials';

const credential = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    id: 'urn:credential:achievement',
    type: ['VerifiableCredential'],
    issuer: 'did:example:issuer',
    issuanceDate: '2026-08-06T00:00:00.000Z',
    credentialSubject: { id: 'did:example:learner' },
} as unknown as VC;

describe('BoostListItem', () => {
    it('formats relative dates in the active locale without changing global date state', () => {
        const now = Date.parse('2026-09-15T12:00:05.000Z');

        expect(formatRelativeDate('2026-09-15T12:00:00.000Z', 'ar', now)).toContain('ثوان');
        expect(formatRelativeDate('not-a-date', 'ar', now)).toBe('');
    });

    it('exposes clickable rows to pointer and keyboard users', () => {
        const onClick = vi.fn();
        const { rerender } = render(
            <BoostListItem
                credential={credential}
                categoryType="Achievement"
                title="Example Achievement"
                onClick={onClick}
            />
        );

        const clickableRow = screen.getByRole('button');
        expect(clickableRow.classList.contains('cursor-pointer')).toBe(true);
        expect(clickableRow.getAttribute('tabindex')).toBe('0');

        fireEvent.keyDown(clickableRow, { key: 'Enter' });
        fireEvent.keyDown(clickableRow, { key: ' ' });
        expect(onClick).toHaveBeenCalledTimes(2);

        rerender(
            <BoostListItem
                credential={credential}
                categoryType="Achievement"
                title="Example Achievement"
            />
        );

        const passiveRow = screen.getByTestId('boost-list-item');
        expect(passiveRow.classList.contains('cursor-pointer')).toBe(false);
        expect(passiveRow.getAttribute('role')).toBeNull();
        expect(passiveRow.getAttribute('tabindex')).toBeNull();
    });

    it('does not activate the row from nested controls', () => {
        const onClick = vi.fn();
        const onOptionsClick = vi.fn();
        render(
            <BoostListItem
                credential={credential}
                categoryType="Achievement"
                title="Example Achievement"
                onClick={onClick}
                onOptionsClick={onOptionsClick}
            />
        );

        const optionsButton = screen.getByRole('button', { name: 'More options' });

        fireEvent.keyDown(optionsButton, { key: 'Enter' });
        fireEvent.keyDown(optionsButton, { key: ' ' });
        expect(onClick).not.toHaveBeenCalled();

        fireEvent.click(optionsButton);
        expect(onOptionsClick).toHaveBeenCalledOnce();
        expect(onClick).not.toHaveBeenCalled();
    });
});

describe('expired credential visibility', () => {
    it.each(['expirationDate', 'validUntil'])(
        'keeps the row readable and marks %s expiry in regular and compact lists',
        expirationField => {
            const expired = { ...credential, [expirationField]: '2000-01-01T00:00:00Z' };
            const { rerender } = render(
                <BoostListItem credential={expired} title="Professional license" />
            );
            expect(screen.getByText('Professional license')).toBeTruthy();
            expect(screen.getByText(/credential.lifecycle.expired/)).toBeTruthy();
            rerender(<BoostListItem credential={expired} title="Professional license" compact />);
            expect(screen.getByText('Professional license')).toBeTruthy();
            expect(screen.getByText(/credential.lifecycle.expired/)).toBeTruthy();
        }
    );
});

const categories = [
    'Social Badge',
    'Work History',
    'Learning History',
    'Accommodation',
    'Accomplishment',
    'Achievement',
    'Qualifications',
    'ID',
] as CredentialCategory[];

const registry = (source: string, name?: string) => ({
    source,
    results: { matchingIssuers: [{ issuer: { federation_entity: { organization_name: name } } }] },
});

beforeEach(() => {
    mocks.locale = 'en';
    mocks.registry = undefined;
    mocks.issuerName = 'Example University';
});

describe('list display names across categories', () => {
    it.each(categories)('matches the tile title and resolved issuer for %s', category => {
        const props = {
            credential,
            categoryType: category,
            title: 'Animated Short',
            issuerName: 'Resolved Issuer',
        };
        const { rerender } = render(<BoostGenericCardWrapper {...props} />);
        expect(screen.getByTestId('tile').textContent).toContain('Animated Short');
        rerender(<BoostGenericCardWrapper {...props} boostPageViewMode="list" />);
        expect(screen.getByRole('heading').textContent).toBe('Animated Short');
        expect(screen.getByText('Resolved Issuer')).toBeTruthy();
        expect(screen.queryByText('Example University')).toBeNull();
    });

    it.each(categories)('uses existing credential-name fallbacks for %s', category => {
        const { rerender } = render(
            <BoostListItem
                categoryType={category}
                credential={{
                    ...credential,
                    name: 'Credential Name',
                    credentialSubject: { achievement: { name: 'Achievement Name' } },
                }}
            />
        );
        expect(screen.getByRole('heading').textContent).toBe('Credential Name');
        rerender(
            <BoostListItem
                categoryType={category}
                credential={{
                    ...credential,
                    credentialSubject: [{ achievement: { name: 'Achievement Name' } }],
                }}
            />
        );
        expect(screen.getByRole('heading').textContent).toBe('Achievement Name');
        rerender(
            <BoostListItem
                categoryType={category}
                credential={{ ...credential, type: ['VerifiableCredential', 'UniversityDegree'] }}
            />
        );
        expect(screen.getByRole('heading').textContent).toBe('University Degree');
    });

    it.each([false, true])(
        'shows media title with secondary attachment information (managed=%s)',
        managedBoost => {
            render(
                <BoostListItem
                    credential={{
                        ...credential,
                        attachments: [{ type: 'video', fileName: 'short.mp4' }],
                    }}
                    title="Animated Short"
                    displayType="media"
                    managedBoost={managedBoost}
                />
            );
            expect(screen.getByRole('heading').textContent).toBe('Animated Short');
            expect(screen.getByText('Video')).toBeTruthy();
        }
    );

    it('keeps a media attachment URL secondary', () => {
        render(
            <BoostListItem
                credential={{
                    ...credential,
                    attachments: [{ type: 'link', url: 'https://example.com/short' }],
                }}
                title="Animated Short"
                displayType="media"
            />
        );
        expect(screen.getByRole('heading').textContent).toBe('Animated Short');
        expect(screen.getByRole('link').getAttribute('href')).toBe('https://example.com/short');
    });

    it.each(categories)(
        'preserves the resolved issuer name over conflicting trusted metadata in %s',
        category => {
            mocks.registry = registry('trusted', 'Trusted University');
            render(
                <BoostListItem
                    credential={credential}
                    categoryType={category}
                    title="Animated Short"
                    issuerName="Resolved School"
                />
            );
            expect(screen.getByRole('heading').textContent).toBe('Animated Short');
            expect(screen.getByText('Resolved School')).toBeTruthy();
            expect(screen.queryByText('Trusted University')).toBeNull();
        }
    );

    it.each([
        'did:example:issuer',
        'did:web:other.example',
        'https://issuer.example/profile',
        'urn:uuid:issuer-id',
        'opaque-issuer-id',
    ])('prefers a trusted registry name over identifier-only resolution: %s', identifier => {
        mocks.registry = registry('trusted', 'Trusted University');
        render(
            <BoostListItem
                credential={{ ...credential, issuer: identifier }}
                title="Animated Short"
                issuerName={identifier}
            />
        );
        expect(screen.getByText('Trusted University')).toBeTruthy();
        expect(screen.queryByText(identifier)).toBeNull();
    });

    it.each([
        'did:web:other.example',
        'https://issuer.example/profile',
        'urn:uuid:other-issuer-id',
    ])(
        'recognizes a resolved identifier that differs from the credential issuer: %s',
        identifier => {
            mocks.registry = registry('trusted', 'Trusted University');
            render(<BoostListItem credential={credential} issuerName={identifier} />);
            expect(screen.getByText('Trusted University')).toBeTruthy();
            expect(screen.queryByText(identifier)).toBeNull();
        }
    );

    it('uses the trusted registry name when no resolved name is supplied', () => {
        mocks.registry = registry('trusted', 'Trusted University');
        render(<BoostListItem credential={credential} />);
        expect(screen.getByText('Trusted University')).toBeTruthy();
    });

    it.each(['trusted', 'unknown', 'untrusted'])(
        'preserves identifier fallback when no usable trusted name exists (%s)',
        source => {
            mocks.registry = registry(source, source === 'trusted' ? undefined : 'Registry Name');
            render(<BoostListItem credential={credential} issuerName="did:example:issuer" />);
            expect(screen.getByText('Digital ID:')).toBeTruthy();
            expect(screen.getByText('did:example:issuer')).toBeTruthy();
            expect(screen.queryByText('Registry Name')).toBeNull();
        }
    );

    it.each([
        ['trusted', undefined],
        ['trusted', ''],
        ['unknown', 'Registry Name'],
        ['untrusted', 'Registry Name'],
    ])('preserves resolved issuer fallback for %s / %s', (source, name) => {
        mocks.registry = registry(source!, name);
        render(
            <BoostListItem
                credential={credential}
                title="Animated Short"
                issuerName="Resolved School"
            />
        );
        expect(screen.getByText('Resolved School')).toBeTruthy();
        expect(screen.queryByText('Registry Name')).toBeNull();
    });

    it.each(
        categories.flatMap(category =>
            ['trusted', 'unknown', 'untrusted'].map(source => [category, source] as const)
        )
    )('keeps missing issuer metadata separate from the title in %s / %s', (category, source) => {
        mocks.registry = registry(source);
        mocks.issuerName = undefined;
        render(
            <BoostListItem credential={credential} categoryType={category} title="Animated Short" />
        );
        expect(screen.getByRole('heading').textContent).toBe('Animated Short');
        expect(screen.getByText('Digital ID:')).toBeTruthy();
    });

    it('uses the identifier fallback when no issuer name is available', () => {
        mocks.issuerName = undefined;
        render(<BoostListItem credential={credential} title="Animated Short" />);
        expect(screen.getByRole('heading').textContent).toBe('Animated Short');
        expect(screen.getByText('Digital ID:')).toBeTruthy();
    });

    it('keeps linked-credential counts and options on the list wrapper', () => {
        render(
            <BoostGenericCardWrapper
                credential={credential}
                title="Animated Short"
                boostPageViewMode="list"
                linkedCredentialsCount={2}
                optionsTriggerOnClick={vi.fn()}
            />
        );
        expect(screen.getByText('+2')).toBeTruthy();
        expect(screen.getByRole('button', { name: 'More options' })).toBeTruthy();
    });

    it('keeps the title when the issuer identifier and name are missing', () => {
        mocks.issuerName = undefined;
        render(<BoostListItem credential={{ ...credential, issuer: {} }} title="Animated Short" />);
        expect(screen.getByRole('heading').textContent).toBe('Animated Short');
        expect(screen.queryByText('Digital ID:')).toBeNull();
    });

    it.each(categories)('continues omitting issuer information in compact %s rows', category => {
        mocks.registry = registry('trusted', 'Trusted University');
        render(
            <BoostListItem
                credential={credential}
                categoryType={category}
                title="Animated Short"
                compact
                displayType="media"
                issuerName="Resolved School"
            />
        );
        expect(screen.getByRole('heading').textContent).toBe('Animated Short');
        expect(screen.queryByText('Trusted University')).toBeNull();
        expect(screen.queryByText('Resolved School')).toBeNull();
    });
});

describe('absolute issuance-date localization', () => {
    let previousLocale: string;
    const datedCredential = { ...credential, issuanceDate: '2025-07-18T12:00:00Z' };

    beforeEach(() => {
        previousLocale = moment.locale();
        moment.locale('fr');
    });

    afterEach(() => {
        moment.locale(previousLocale);
        vi.restoreAllMocks();
    });

    it('uses English when the global Moment locale is French without changing it', () => {
        render(<BoostListItem credential={datedCredential} title="Animated Short" />);
        expect(screen.getByText('July 18 2025')).toBeTruthy();
        expect(moment.locale()).toBe('fr');
    });

    it('uses French when selected even if the global Moment locale is English', () => {
        moment.locale('en');
        mocks.locale = 'fr';
        render(<BoostListItem credential={datedCredential} title="Animated Short" />);
        expect(screen.getByText('juillet 18 2025')).toBeTruthy();
        expect(moment.locale()).toBe('en');
    });

    it('updates the absolute date when the active locale changes', () => {
        const { rerender } = render(<BoostListItem credential={datedCredential} />);
        expect(screen.getByText('July 18 2025')).toBeTruthy();
        mocks.locale = 'fr';
        rerender(<BoostListItem credential={datedCredential} />);
        expect(screen.getByText('juillet 18 2025')).toBeTruthy();
        expect(moment.locale()).toBe('fr');
    });

    it.each([undefined, ''])('falls back to validFrom when issuanceDate is %s', issuanceDate => {
        render(
            <BoostListItem
                credential={{ ...datedCredential, issuanceDate, validFrom: '2025-07-19T12:00:00Z' }}
            />
        );
        expect(screen.getByText('July 19 2025')).toBeTruthy();
    });

    it('continues preferring issuanceDate over validFrom', () => {
        render(
            <BoostListItem credential={{ ...datedCredential, validFrom: '2025-07-19T12:00:00Z' }} />
        );
        expect(screen.getByText('July 18 2025')).toBeTruthy();
    });

    it('preserves Moment local-time interpretation of offset timestamps', () => {
        const dateValue = '2025-07-18T02:30:00+02:00';
        render(<BoostListItem credential={{ ...datedCredential, issuanceDate: dateValue }} />);
        const localDay = String(new Date(dateValue).getDate()).padStart(2, '0');
        const expected = `July ${localDay} 2025`;
        expect(screen.getByText(expected)).toBeTruthy();
        expect(moment.locale()).toBe('fr');
    });

    it('leaves relative-date formatting independent of the global Moment locale', () => {
        vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-08-07T00:00:00Z'));
        render(<BoostListItem credential={datedCredential} relativeDate />);
        expect(screen.getByText('yesterday')).toBeTruthy();
        expect(moment.locale()).toBe('fr');
    });
});
