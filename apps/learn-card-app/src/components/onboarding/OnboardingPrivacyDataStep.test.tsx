import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import OnboardingPrivacyDataStep from './OnboardingPrivacyDataStep';
import type { OnboardingPrivacyPreferences } from './privacyPreferences';

vi.mock('@ionic/react', () => ({
    IonToggle: ({
        checked,
        disabled,
        onIonChange,
        'aria-label': ariaLabel,
    }: {
        checked?: boolean;
        disabled?: boolean;
        onIonChange?: (event: { detail: { checked: boolean } }) => void;
        'aria-label'?: string;
    }) => (
        <input
            type="checkbox"
            aria-label={ariaLabel}
            checked={checked}
            disabled={disabled}
            onChange={e => onIonChange?.({ detail: { checked: e.target.checked } })}
        />
    ),
}));

vi.mock('learn-card-base/config/TenantConfigProvider', () => ({
    useBrandingConfig: () => ({ name: 'LearnCard' }),
}));

vi.mock('./onboardingHeader/OnboardingHeader', () => ({
    __esModule: true,
    default: ({ text, secondaryText }: { text: string; secondaryText?: string }) => (
        <div>
            <h1>{text}</h1>
            {secondaryText && <p>{secondaryText}</p>}
        </div>
    ),
}));

vi.mock('./onboardingFooter/OnboardingFooter', () => ({
    __esModule: true,
    default: ({ text, onClick, onBack, showBackButton, disabled }: any) => (
        <div data-testid="onboarding-footer">
            {showBackButton && (
                <button type="button" onClick={onBack} disabled={disabled}>
                    Back
                </button>
            )}
            <button type="button" onClick={onClick} disabled={disabled}>
                {text}
            </button>
        </div>
    ),
}));

const renderStep = (preferences: OnboardingPrivacyPreferences) => {
    const onChange = vi.fn();
    const onContinue = vi.fn();
    const onBack = vi.fn();

    render(
        <OnboardingPrivacyDataStep
            preferences={preferences}
            onChange={onChange}
            onContinue={onContinue}
            onBack={onBack}
        />
    );

    return { onChange, onContinue, onBack };
};

describe('OnboardingPrivacyDataStep', () => {
    it('shows minor defaults with AI locked off and other toggles editable', () => {
        const { onChange } = renderStep({
            aiEnabled: false,
            aiAutoDisabled: true,
            analyticsEnabled: false,
            analyticsAutoDisabled: false,
            bugReportsEnabled: false,
            isMinor: true,
        });

        expect(screen.getByText("Choose what you'd like to enable.")).toBeInTheDocument();
        expect(
            screen.getByText(
                "You're in control. Turn on only what feels right for you, and change it anytime in Settings."
            )
        ).toBeInTheDocument();
        expect(
            screen.getByText('Some features are restricted for users under 18.')
        ).toBeInTheDocument();
        expect(screen.getByText('A guardian can turn this on later.')).toBeInTheDocument();

        const aiToggle = screen.getByLabelText('AI Features') as HTMLInputElement;
        const analyticsToggle = screen.getByLabelText('Usage Analytics') as HTMLInputElement;
        const crashReportsToggle = screen.getByLabelText('Crash Reports') as HTMLInputElement;

        expect(aiToggle).not.toBeChecked();
        expect(aiToggle).toBeDisabled();
        expect(analyticsToggle).not.toBeChecked();
        expect(analyticsToggle).toBeEnabled();
        expect(crashReportsToggle).not.toBeChecked();
        expect(crashReportsToggle).toBeEnabled();

        fireEvent.click(analyticsToggle);
        fireEvent.click(crashReportsToggle);

        expect(onChange).toHaveBeenNthCalledWith(1, { analyticsEnabled: true });
        expect(onChange).toHaveBeenNthCalledWith(2, { bugReportsEnabled: true });
    });

    it('shows adult defaults with all toggles on and editable', () => {
        const { onChange } = renderStep({
            aiEnabled: true,
            aiAutoDisabled: false,
            analyticsEnabled: true,
            analyticsAutoDisabled: false,
            bugReportsEnabled: true,
            isMinor: false,
        });

        const aiToggle = screen.getByLabelText('AI Features') as HTMLInputElement;
        const analyticsToggle = screen.getByLabelText('Usage Analytics') as HTMLInputElement;
        const crashReportsToggle = screen.getByLabelText('Crash Reports') as HTMLInputElement;

        expect(screen.queryByText('Some features are restricted for users under 18.')).toBeNull();
        expect(aiToggle).toBeChecked();
        expect(aiToggle).toBeEnabled();
        expect(analyticsToggle).toBeChecked();
        expect(analyticsToggle).toBeEnabled();
        expect(crashReportsToggle).toBeChecked();
        expect(crashReportsToggle).toBeEnabled();

        fireEvent.click(aiToggle);

        expect(onChange).toHaveBeenCalledWith({ aiEnabled: false });
    });

    it('uses the shared footer for back and continue actions', () => {
        const { onBack, onContinue } = renderStep({
            aiEnabled: true,
            aiAutoDisabled: false,
            analyticsEnabled: true,
            analyticsAutoDisabled: false,
            bugReportsEnabled: true,
            isMinor: false,
        });

        fireEvent.click(screen.getByRole('button', { name: 'Back' }));
        fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

        expect(onBack).toHaveBeenCalledTimes(1);
        expect(onContinue).toHaveBeenCalledTimes(1);
        expect(screen.getByTestId('onboarding-footer')).toBeInTheDocument();
    });
});
