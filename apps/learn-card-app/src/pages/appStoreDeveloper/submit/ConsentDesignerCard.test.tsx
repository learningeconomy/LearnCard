import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ConsentDesignerCard } from './ConsentDesignerCard';

vi.mock('@ionic/react', () => ({ IonIcon: () => <span />, IonSpinner: () => <span /> }));

describe('ConsentDesignerCard', () => {
    it('starts from suggested choices so enabling is one tap', async () => {
        const onEnable = vi.fn().mockResolvedValue(undefined);
        render(
            <ConsentDesignerCard
                appName="AI Tutor"
                onEnable={onEnable}
                onDismiss={vi.fn()}
                suggestedScopes={{
                    read: { credentialCategories: ['Achievement'], personalFields: ['name'] },
                    reason: 'Personalize your experience',
                }}
            />
        );

        expect(screen.getByText(/We picked these based on what your app uses/)).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: 'Enable Consent' }));

        await waitFor(() =>
            expect(onEnable).toHaveBeenCalledWith({
                read: { credentialCategories: ['Achievement'], personalFields: ['name'] },
                reason: 'Personalize your experience',
            })
        );
        expect(await screen.findByText('Consent is ready')).toBeTruthy();
    });

    it('shows a friendly error when enabling fails', async () => {
        render(
            <ConsentDesignerCard
                appName="AI Tutor"
                onEnable={vi.fn().mockRejectedValue(new Error('TRPC 500 internal'))}
                onDismiss={vi.fn()}
                suggestedScopes={{ read: { credentialCategories: ['Achievement'] } }}
            />
        );
        fireEvent.click(screen.getByRole('button', { name: 'Enable Consent' }));
        expect(await screen.findByText('Something went wrong. Please try again.')).toBeTruthy();
    });
});
