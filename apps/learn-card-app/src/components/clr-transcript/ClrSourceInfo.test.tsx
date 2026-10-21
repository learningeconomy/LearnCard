import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import ClrSourceInfo from './ClrSourceInfo';

describe('ClrSourceInfo', () => {
    it('opens provenance details in an Ionic popover', async () => {
        render(
            <ClrSourceInfo
                field={{
                    value: 'Advanced',
                    sourcePath: 'credentialSubject.result[0].resultDescription',
                    specField: 'result.resultDescription',
                    directlyMapped: true,
                }}
                label="result scale"
            />
        );

        const trigger = screen.getByRole('button', { name: 'Show result scale source' });
        fireEvent.click(trigger);

        expect(trigger).toHaveAttribute('aria-expanded', 'true');
        expect(await screen.findByText('result.resultDescription')).toBeVisible();
        expect(screen.getByText('credentialSubject.result[0].resultDescription')).toBeVisible();
        expect(document.querySelector('ion-popover')).toBeInTheDocument();
    });
});
