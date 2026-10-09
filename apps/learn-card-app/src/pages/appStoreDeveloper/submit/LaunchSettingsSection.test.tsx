import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { LaunchSettingsSection } from './LaunchSettingsSection';

vi.mock('@ionic/react', () => ({ IonIcon: () => <span /> }));
vi.mock('../components/LaunchConfigStep', () => ({
    LaunchConfigStep: ({ data }: { data: { launch_type: string } }) => (
        <div>Fields for {data.launch_type}</div>
    ),
}));

const value = { type: 'DIRECT_LINK' as const, configJson: '{"url":"https://quiz.app"}' };

describe('LaunchSettingsSection', () => {
    it('summarizes how the app opens and changes type', () => {
        const onChange = vi.fn();
        const { rerender } = render(
            <LaunchSettingsSection
                value={value}
                onChange={onChange}
                managedByApp={false}
                open={false}
                onOpenChange={vi.fn()}
            />
        );
        expect(screen.getByText('Opens in a new tab · https://quiz.app')).toBeInTheDocument();

        rerender(
            <LaunchSettingsSection
                value={value}
                onChange={onChange}
                managedByApp={false}
                open
                onOpenChange={vi.fn()}
            />
        );
        expect(screen.getByText('Fields for DIRECT_LINK')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /AI tutor/ }));
        expect(onChange).toHaveBeenCalledWith({ type: 'AI_TUTOR', configJson: '{}' });
    });

    it('only lets apps published from their code change the address', () => {
        const onChange = vi.fn();
        render(
            <LaunchSettingsSection
                value={{
                    type: 'EMBEDDED_IFRAME',
                    configJson: '{"url":"https://a.app","permissions":["x"]}',
                }}
                onChange={onChange}
                managedByApp
                open
                onOpenChange={vi.fn()}
            />
        );

        expect(screen.queryByRole('button', { name: /AI tutor/ })).toBeNull();
        fireEvent.change(screen.getByLabelText('Where your app lives'), {
            target: { value: 'https://b.app' },
        });
        expect(JSON.parse(onChange.mock.calls[0][0].configJson)).toEqual({
            url: 'https://b.app',
            permissions: ['x'],
        });
    });
});
