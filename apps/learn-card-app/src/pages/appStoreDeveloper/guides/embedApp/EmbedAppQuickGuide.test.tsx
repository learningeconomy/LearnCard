import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import EmbedAppQuickGuide from './EmbedAppQuickGuide';

const state = vi.hoisted(() => ({
    currentStep: 0,
    completedSteps: [] as string[],
    config: {} as Record<string, unknown>,
    resetGuide: vi.fn(),
}));

vi.mock('@ionic/react', () => ({ IonIcon: () => <span /> }));
vi.mock('../../../../helpers/externalLinkHelpers', () => ({ openExternalLink: vi.fn() }));
vi.mock('../../apps/NewAppSheet', () => ({ DEVELOPER_DOCS_URL: 'https://docs.example.com' }));
vi.mock('../shared/useGuideState', async () => {
    const ReactModule = await import('react');
    return {
        useGuideState: () => {
            const [, force] = ReactModule.useReducer((n: number) => n + 1, 0);
            return {
                state: { completedSteps: state.completedSteps },
                resetGuide: state.resetGuide,
                currentStep: state.currentStep,
                getConfig: (key: string, fallback?: unknown) => state.config[key] ?? fallback,
                updateConfig: (key: string, value: unknown) => {
                    state.config[key] = value;
                    force();
                },
                goToStep: (step: number) => {
                    state.currentStep = step;
                    force();
                },
                markStepComplete: vi.fn(),
            };
        },
    };
});

const renderGuide = () =>
    render(
        <MemoryRouter initialEntries={['/guide']}>
            <Route path="/guide">
                <EmbedAppQuickGuide selectedIntegration={null} setSelectedIntegration={vi.fn()} />
            </Route>
            <Route path="/app-store/developer" render={() => <div>Your Apps page</div>} />
        </MemoryRouter>
    );

describe('EmbedAppQuickGuide', () => {
    it('builds a starter prompt from the app idea and features', () => {
        state.currentStep = 0;
        state.config = {};
        renderGuide();

        fireEvent.change(screen.getByLabelText("What's your app about?"), {
            target: { value: 'a spelling bee' },
        });
        fireEvent.click(screen.getByRole('button', { name: /Send notifications/ }));

        expect(screen.getByText(/Build a spelling bee\./)).toBeInTheDocument();
        expect(screen.getByText(/sendNotification/)).toBeInTheDocument();
    });

    it('walks through try and publish, ending in Your Apps', () => {
        state.currentStep = 0;
        state.config = {};
        renderGuide();

        fireEvent.click(screen.getByRole('button', { name: /I've Started My App/ }));
        expect(screen.getByText('Try it in the preview')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /It's Working/ }));
        fireEvent.click(screen.getByRole('button', { name: /Go to Your Apps/ }));
        expect(screen.getByText('Your Apps page')).toBeInTheDocument();
    });

    it('starts projects from the old 6-step guide over', () => {
        state.currentStep = 4;
        state.completedSteps = ['getting-started', 'signing-authority'];
        state.config = {};
        renderGuide();

        expect(screen.getByText('Make your app')).toBeInTheDocument();
        expect(state.resetGuide).toHaveBeenCalled();
        state.completedSteps = [];
    });
});
