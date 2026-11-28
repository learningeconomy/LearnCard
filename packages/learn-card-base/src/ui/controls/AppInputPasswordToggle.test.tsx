import React, { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { AppInput } from './AppInput';
import { AppInputPasswordToggle } from './AppInputPasswordToggle';

afterEach(cleanup);

const PasswordField: React.FC = () => {
    const [visible, setVisible] = useState(false);
    return (
        <AppInput
            aria-label="Password"
            type={visible ? 'text' : 'password'}
            end={
                <AppInputPasswordToggle visible={visible} onVisibleChange={setVisible} mode="ios" />
            }
        />
    );
};

describe('AppInputPasswordToggle', () => {
    it('switches the input between password and text, naming the next action', () => {
        render(<PasswordField />);
        const input = screen.getByLabelText('Password');
        const toggle = screen.getByRole('switch', { name: 'Show password' });
        expect(input).toHaveAttribute('type', 'password');
        expect(toggle).toHaveAttribute('aria-checked', 'false');

        fireEvent.click(toggle);
        expect(input).toHaveAttribute('type', 'text');
        expect(screen.getByRole('switch', { name: 'Hide password' })).toHaveAttribute(
            'aria-checked',
            'true'
        );

        fireEvent.click(screen.getByRole('switch', { name: 'Hide password' }));
        expect(input).toHaveAttribute('type', 'password');
    });

    it('keeps focus in the input when pressed', () => {
        render(<PasswordField />);
        const toggle = screen.getByRole('switch', { name: 'Show password' });
        const pointerDown = new MouseEvent('pointerdown', { bubbles: true, cancelable: true });
        toggle.dispatchEvent(pointerDown);
        expect(pointerDown.defaultPrevented).toBe(true);
    });

    it('applies the mode and caller classes', () => {
        render(
            <AppInputPasswordToggle
                visible={false}
                onVisibleChange={() => {}}
                mode="md"
                className="p-0"
            />
        );
        const host = screen.getByRole('switch').parentElement!;
        expect(host).toHaveClass('app-input-password-toggle', 'md', 'p-0');
    });
});
