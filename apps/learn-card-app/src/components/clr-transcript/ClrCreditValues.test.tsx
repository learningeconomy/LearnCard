import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { normalizeClrTranscriptDisplayModel } from 'learn-card-base/helpers/credentials/clr/renderer';
import { setLocale } from '../../paraglide/runtime.js';
import { ClrCreditValues } from './ClrCreditValues';

const course = (subject = {}, achievement = {}) =>
    normalizeClrTranscriptDisplayModel({
        type: ['ClrCredential'],
        credentialSubject: {
            verifiableCredential: [
                {
                    credentialSubject: {
                        ...subject,
                        achievement: { achievementType: 'Course', ...achievement },
                    },
                },
            ],
        },
    }).courses[0];

const courses = {
    missing: course(),
    zero: course({ creditsEarned: 0 }),
    earned: course({ creditsEarned: 3, creditUnit: 'ECTS' }),
    available: course({}, { creditsAvailable: 4, creditUnit: 'training hours' }),
    inferred: course({}, { description: 'A course, 2 credits.' }),
};
const CreditExamples = () => (
    <>
        {Object.entries(courses).map(([name, value]) => (
            <div key={name} data-testid={name}>
                <ClrCreditValues course={value} />
            </div>
        ))}
    </>
);

beforeEach(() => setLocale('en', { reload: false }));
afterEach(() => setLocale('en', { reload: false }));

describe('ClrCreditValues localization', () => {
    it.each([
        {
            locale: 'es',
            missing: 'Obtenidos —',
            aria: 'No se han proporcionado los créditos obtenidos',
            zero: '0 obtenidos',
            earned: '3 ECTS obtenidos',
            available: '4 training hours disponibles',
            inferred: '2 según la descripción',
        },
        {
            locale: 'fr',
            missing: 'Obtenus —',
            aria: 'Crédits obtenus non renseignés',
            zero: '0 obtenus',
            earned: '3 ECTS obtenus',
            available: '4 training hours disponibles',
            inferred: '2 d’après la description',
        },
        {
            locale: 'ar',
            missing: 'المكتسبة —',
            aria: 'لم تُقدَّم معلومات عن الأرصدة المكتسبة',
            zero: '0 مكتسبة',
            earned: '3 ECTS مكتسبة',
            available: '4 training hours متاحة',
            inferred: '2 حسب الوصف',
        },
    ] as const)(
        'updates all credit states and accessible labels when switching to $locale',
        expected => {
            const view = render(<CreditExamples />);
            expect(
                within(screen.getByTestId('missing')).getByLabelText('Earned credits not supplied')
            ).toHaveTextContent('Earned —');
            expect(within(screen.getByTestId('zero')).getByText('0 earned')).toBeInTheDocument();
            expect(
                within(screen.getByTestId('earned')).getByText('3 ECTS earned')
            ).toBeInTheDocument();
            expect(
                within(screen.getByTestId('available')).getByText('4 training hours available')
            ).toBeInTheDocument();
            expect(
                within(screen.getByTestId('inferred')).getByText('2 from description')
            ).toBeInTheDocument();

            setLocale(expected.locale, { reload: false });
            view.rerender(<CreditExamples />);
            for (const name of ['missing', 'zero', 'earned', 'available', 'inferred'] as const) {
                expect(
                    within(screen.getByTestId(name)).getByText(expected[name])
                ).toBeInTheDocument();
            }
            for (const name of ['missing', 'available', 'inferred']) {
                expect(
                    within(screen.getByTestId(name)).getByLabelText(expected.aria)
                ).toHaveTextContent(expected.missing);
            }
            for (const name of ['zero', 'earned']) {
                expect(
                    within(screen.getByTestId(name)).queryByLabelText(expected.aria)
                ).not.toBeInTheDocument();
            }
            expect(screen.queryByLabelText('Earned credits not supplied')).not.toBeInTheDocument();
        }
    );
});
