import React from 'react';

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import AlignmentsBox from '../CertificateDisplayCard/AlignmentsBox';

describe('credential alignment integration', () => {
    it('uses the canonical card only for skill and competency alignments', () => {
        render(
            <AlignmentsBox
                style="Certificate"
                alignment={[
                    {
                        targetUrl: 'https://example.org/frameworks/math/items/algebra',
                        targetName: 'Algebraic reasoning',
                        targetFramework: 'AP Mathematics',
                        targetCode: '2',
                        targetDescription: 'Builds and solves equations.',
                        targetType: 'CFItem',
                    },
                    {
                        targetUrl: 'https://example.org/occupations/software-developer',
                        targetName: 'Software Developers',
                        targetFramework: 'O*NET',
                        targetType: 'ceterms:Occupation',
                    },
                ]}
            />
        );

        expect(screen.getAllByTestId('skill-competency-card')).toHaveLength(1);
        expect(screen.getByText('Algebraic reasoning')).toBeTruthy();
        expect(screen.getByText('Software Developers')).toBeTruthy();
        expect(screen.getByText('Occupations & programs')).toBeTruthy();
    });
});
