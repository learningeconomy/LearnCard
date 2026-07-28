import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import ActiveAiSessionPrompt from './ActiveAiSessionPrompt';

describe('ActiveAiSessionPrompt', () => {
    it('offers resume and confirmed replacement actions for the active session', () => {
        const onResume = vi.fn();
        const onStartNew = vi.fn();

        render(
            <ActiveAiSessionPrompt
                activeThreadTitle="Interview practice"
                isResuming={false}
                isStartingNew={false}
                onResume={onResume}
                onStartNew={onStartNew}
            />
        );

        expect(screen.getByText(/Interview practice/)).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Resume Session' }));
        fireEvent.click(screen.getByRole('button', { name: 'Start New Session' }));

        expect(onResume).toHaveBeenCalledTimes(1);
        expect(onStartNew).toHaveBeenCalledTimes(1);
    });

    it('locks both actions while an active-session action is running', () => {
        render(
            <ActiveAiSessionPrompt
                isResuming
                isStartingNew={false}
                onResume={vi.fn()}
                onStartNew={vi.fn()}
            />
        );

        expect(screen.getByRole('button', { name: 'Resuming...' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Start New Session' })).toBeDisabled();
    });
});
