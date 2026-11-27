import React, { useRef, useState } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppInput, type AppInputHandle } from './AppInput';

afterEach(() => {
    cleanup();
    vi.useRealTimers();
    document.documentElement.removeAttribute('mode');
});

const input = (): HTMLInputElement => screen.getByRole('textbox') as HTMLInputElement;

describe('AppInput', () => {
    it("renders ion-input's structure: host > label[for] > native-wrapper > input", () => {
        render(<AppInput data-testid="host" />);
        const host = screen.getByTestId('host');
        const native = input();
        const label = host.querySelector('label.app-input-wrapper');

        expect(host.tagName).toBe('DIV');
        expect(host.classList.contains('app-input')).toBe(true);
        expect(host.classList.contains('app-input-label-start')).toBe(true);
        expect(label?.getAttribute('for')).toBe(native.id);
        expect(native.id).toMatch(/^app-input-/);
        expect(native.parentElement?.classList.contains('app-input-native-wrapper')).toBe(true);
        expect(native.classList.contains('app-input-native')).toBe(true);
        // No label text, clear button or bottom row unless asked for.
        expect(host.querySelector('.app-input-label-wrapper')).toBeNull();
        expect(host.querySelector('.app-input-clear')).toBeNull();
        expect(host.querySelector('.app-input-bottom')).toBeNull();
    });

    it("applies ion-input's native defaults", () => {
        render(<AppInput />);
        const native = input();

        expect(native.type).toBe('text');
        expect(native.getAttribute('autocapitalize')).toBe('off');
        expect(native.getAttribute('autocomplete')).toBe('off');
        expect(native.getAttribute('autocorrect')).toBe('off');
        expect(native.getAttribute('spellcheck')).toBe('false');
        expect(native.name).toBe(native.id);
        expect(native.getAttribute('placeholder')).toBe('');
    });

    it('moves aria-label and title onto the input and passes native attributes through', () => {
        render(
            <AppInput
                data-testid="host"
                aria-label="Email"
                title="Your email"
                type="email"
                inputmode="email"
                maxlength={22}
                autocapitalize="on"
            />
        );
        const native = screen.getByLabelText('Email') as HTMLInputElement;

        expect(native.title).toBe('Your email');
        expect(native.type).toBe('email');
        expect(native.getAttribute('inputmode')).toBe('email');
        expect(native.maxLength).toBe(22);
        expect(native.getAttribute('autocapitalize')).toBe('on');
        expect(screen.getByTestId('host').getAttribute('title')).toBeNull();
    });

    it('fires onValueInput for every edit and keeps typed text in an uncontrolled input', async () => {
        const onValueInput = vi.fn();
        render(<AppInput onValueInput={onValueInput} />);

        await userEvent.type(input(), 'Hi');

        expect(onValueInput.mock.calls.map(([value]) => value)).toEqual(['H', 'Hi']);
        expect(input().value).toBe('Hi');
    });

    it('re-applies `value` on every parent re-render, as Ionic React did', async () => {
        const Parent: React.FC = () => {
            const [renders, setRenders] = useState(0);
            return (
                <>
                    <AppInput value="Parent value" aria-label="field" />
                    <button type="button" onClick={() => setRenders(renders + 1)}>
                        rerender
                    </button>
                </>
            );
        };
        render(<Parent />);

        await userEvent.type(input(), '!');
        expect(input().value).toBe('Parent value!');

        await userEvent.click(screen.getByRole('button', { name: 'rerender' }));
        expect(input().value).toBe('Parent value');
    });

    it('debounces onValueInput (trailing, last value only), including debounce 0', () => {
        vi.useFakeTimers();
        const onValueInput = vi.fn();
        const { rerender } = render(<AppInput debounce={500} onValueInput={onValueInput} />);

        fireEvent.change(input(), { target: { value: 'H' } });
        fireEvent.change(input(), { target: { value: 'Hi' } });
        expect(onValueInput).not.toHaveBeenCalled();
        expect(input().value).toBe('Hi');

        act(() => vi.advanceTimersByTime(500));
        expect(onValueInput.mock.calls.map(([value]) => value)).toEqual(['Hi']);

        rerender(<AppInput debounce={0} onValueInput={onValueInput} />);
        fireEvent.change(input(), { target: { value: 'Hi!' } });
        expect(onValueInput).toHaveBeenCalledTimes(1);
        act(() => vi.advanceTimersByTime(0));
        expect(onValueInput).toHaveBeenLastCalledWith('Hi!', expect.anything());
    });

    it('fires onValueChange on the native change event and on blur after an edit, once', async () => {
        const onValueChange = vi.fn();
        render(<AppInput onValueChange={onValueChange} />);

        await userEvent.type(input(), 'Hi');
        fireEvent(input(), new Event('change', { bubbles: true }));
        expect(onValueChange.mock.calls).toEqual([['Hi']]);

        // Already reported: blurring without a further edit does not fire again.
        fireEvent.blur(input());
        expect(onValueChange).toHaveBeenCalledTimes(1);

        await userEvent.type(input(), '!');
        fireEvent.blur(input());
        expect(onValueChange.mock.calls).toEqual([['Hi'], ['Hi!']]);
    });

    it('fires onFocus / onBlur from the input and onKeyDown / onPaste from the host', async () => {
        const onFocus = vi.fn();
        const onBlur = vi.fn();
        const onKeyDown = vi.fn();
        const onPaste = vi.fn();
        render(
            <AppInput onFocus={onFocus} onBlur={onBlur} onKeyDown={onKeyDown} onPaste={onPaste} />
        );

        await userEvent.type(input(), '{enter}');
        fireEvent.paste(input());
        fireEvent.blur(input());

        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(onKeyDown).toHaveBeenCalledWith(expect.objectContaining({ key: 'Enter' }));
        expect(onPaste).toHaveBeenCalledTimes(1);
    });

    it('clears with the clear button, keeps focus in the input, and hides it when disabled', async () => {
        const onValueInput = vi.fn();
        const { rerender } = render(
            <AppInput data-testid="host" value="Clear me" clearInput onValueInput={onValueInput} />
        );
        const host = screen.getByTestId('host');
        expect(host.classList.contains('app-input-has-value')).toBe(true);

        await userEvent.click(screen.getByRole('button', { name: 'reset' }));

        expect(input().value).toBe('');
        expect(onValueInput).toHaveBeenCalledWith('', expect.anything());
        expect(document.activeElement).toBe(input());
        expect(host.classList.contains('app-input-has-value')).toBe(false);

        rerender(<AppInput data-testid="host" value="x" clearInput disabled />);
        expect(screen.queryByRole('button', { name: 'reset' })).toBeNull();
        rerender(<AppInput data-testid="host" value="x" clearInput readonly />);
        expect(screen.queryByRole('button', { name: 'reset' })).toBeNull();
    });

    it('clears a password on the first edit after focus (clearOnEdit), ignoring Tab / Enter', async () => {
        const onValueInput = vi.fn();
        const { container } = render(
            <AppInput type="password" value="secret" onValueInput={onValueInput} />
        );
        const native = container.querySelector('input') as HTMLInputElement;

        await userEvent.type(native, '{enter}');
        expect(native.value).toBe('secret');
        await userEvent.type(native, 'H', { skipClick: true });

        expect(native.value).toBe('H');
        expect(onValueInput.mock.calls.map(([value]) => value)).toEqual(['', 'H']);
    });

    it('renders label text before the input or stacked above it', () => {
        const { rerender } = render(<AppInput data-testid="host" label="Name*" />);
        const host = screen.getByTestId('host');

        expect(screen.getByLabelText('Name*')).toBe(input());
        expect(host.querySelector('.app-input-label-text')?.textContent).toBe('Name*');

        rerender(<AppInput data-testid="host" label="Name" labelPlacement="stacked" />);
        expect(host.classList.contains('app-input-label-stacked')).toBe(true);
    });

    it('renders helper text, error text (when touched and invalid) and the counter', () => {
        const { rerender } = render(
            <AppInput
                data-testid="host"
                value="Twelve chars"
                helperText="Help"
                errorText="Bad"
                counter
                maxlength={20}
            />
        );
        const host = screen.getByTestId('host');
        const helper = host.querySelector('.app-input-helper') as HTMLElement;

        expect(input().getAttribute('aria-describedby')).toBe(helper.id);
        expect(input().getAttribute('aria-invalid')).toBeNull();
        expect(host.querySelector('.app-input-counter')?.textContent).toBe('12 / 20');

        rerender(
            <AppInput
                data-testid="host"
                className="ion-touched ion-invalid"
                helperText="Help"
                errorText="Bad"
            />
        );
        const error = host.querySelector('.app-input-error') as HTMLElement;
        expect(input().getAttribute('aria-describedby')).toBe(error.id);
        expect(input().getAttribute('aria-invalid')).toBe('true');
    });

    it('exposes setFocus / getInputElement / host through ref', async () => {
        const Harness: React.FC = () => {
            const ref = useRef<AppInputHandle>(null);
            return (
                <>
                    <AppInput ref={ref} data-testid="host" />
                    <button type="button" onClick={() => ref.current?.setFocus()}>
                        focus
                    </button>
                </>
            );
        };
        render(<Harness />);

        await userEvent.click(screen.getByRole('button', { name: 'focus' }));
        expect(document.activeElement).toBe(input());

        const ref = React.createRef<AppInputHandle>();
        render(<AppInput ref={ref} data-testid="second" />);
        expect(ref.current?.host).toBe(screen.getByTestId('second'));
        expect(await ref.current?.getInputElement()).toBe(
            screen.getByTestId('second').querySelector('input')
        );
    });

    it("renders `end` content inside the native-wrapper, and follows the document's Ionic mode", () => {
        document.documentElement.setAttribute('mode', 'ios');
        render(<AppInput data-testid="host" end={<button type="button">pick</button>} />);
        const host = screen.getByTestId('host');

        expect(host.classList.contains('ios')).toBe(true);
        expect(
            screen.getByRole('button', { name: 'pick' }).closest('.app-input-native-wrapper')
        ).not.toBeNull();
    });
});
