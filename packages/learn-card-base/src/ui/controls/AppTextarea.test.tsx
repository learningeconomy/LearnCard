import React, { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppTextarea } from './AppTextarea';

afterEach(() => {
    cleanup();
    document.documentElement.removeAttribute('mode');
});

const textarea = (): HTMLTextAreaElement => screen.getByRole('textbox') as HTMLTextAreaElement;

describe('AppTextarea', () => {
    it("renders ion-textarea's structure: host > label[for] > native-wrapper > textarea, no hidden input", () => {
        const { container } = render(<AppTextarea data-testid="host" rows={3} />);
        const host = screen.getByTestId('host');
        const native = textarea();
        const label = host.querySelector('label.app-textarea-wrapper');

        expect(host.tagName).toBe('DIV');
        expect(host.classList.contains('app-textarea')).toBe(true);
        expect(label?.getAttribute('for')).toBe(native.id);
        expect(native.id).toMatch(/^app-textarea-/);
        expect(native.parentElement?.classList.contains('app-textarea-native-wrapper')).toBe(true);
        expect(native.classList.contains('app-textarea-native')).toBe(true);
        expect(native.rows).toBe(3);
        expect(container.querySelector('input')).toBeNull();
        // The counter row only renders with `counter` + `maxlength`.
        expect(host.querySelector('.app-textarea-bottom')).toBeNull();
    });

    it("applies ion-textarea's native defaults: autocapitalize none, spellcheck false, name = id, placeholder attribute", () => {
        render(<AppTextarea />);
        const native = textarea();

        expect(native.getAttribute('autocapitalize')).toBe('none');
        expect(native.getAttribute('spellcheck')).toBe('false');
        expect(native.name).toBe(native.id);
        expect(native.getAttribute('placeholder')).toBe('');
        expect(native.hasAttribute('autocorrect')).toBe(false);
    });

    it('passes id, name, placeholder, maxlength, autocapitalize, enterkeyhint and inputmode through', () => {
        render(
            <AppTextarea
                id="motto"
                name="family-motto"
                placeholder="Motto"
                maxlength={620}
                autocapitalize="on"
                enterkeyhint="send"
                inputmode="text"
            />
        );
        const native = textarea();

        expect(native.id).toBe('motto');
        expect(native.name).toBe('family-motto');
        expect(native.placeholder).toBe('Motto');
        expect(native.maxLength).toBe(620);
        expect(native.getAttribute('autocapitalize')).toBe('on');
        expect(native.getAttribute('enterkeyhint')).toBe('send');
        expect(native.getAttribute('inputmode')).toBe('text');
    });

    it('moves aria-label and title to the textarea and keeps data-testid, class and style on the host', () => {
        render(
            <AppTextarea
                aria-label="motto"
                title="Family motto"
                data-testid="host"
                className="bg-grayscale-100 ion-no-padding"
                style={{ '--placeholder-color': 'rgb(156 163 175)', '--padding-top': '10px' }}
            />
        );
        const host = screen.getByTestId('host');

        expect(screen.getByRole('textbox', { name: 'motto' })).toBe(textarea());
        expect(textarea().title).toBe('Family motto');
        expect(host.hasAttribute('aria-label')).toBe(false);
        expect(host.classList.contains('bg-grayscale-100')).toBe(true);
        expect(host.classList.contains('ion-no-padding')).toBe(true);
        expect(host.style.getPropertyValue('--placeholder-color')).toBe('rgb(156 163 175)');
        expect(host.style.getPropertyValue('--padding-top')).toBe('10px');
    });

    it('puts `end` content inside the label, after the native wrapper, so it is part of the label text', () => {
        render(
            <AppTextarea
                value=""
                end={<p className="absolute right-[10px] bottom-[10px] text-xs">0/100</p>}
            />
        );
        const end = screen.getByText('0/100');

        expect(end.parentElement?.classList.contains('app-textarea-end-slot-wrapper')).toBe(true);
        expect(end.closest('label')).not.toBeNull();
        // The skipped credentials e2e located the title textarea with getByLabel('/100').
        expect(screen.getByLabelText(/\/100/)).toBe(textarea());
    });

    it('fires onValueInput for every keystroke with the value and event, and no change until blur', () => {
        const onValueInput = vi.fn();
        const onValueChange = vi.fn();
        render(<AppTextarea onValueInput={onValueInput} onValueChange={onValueChange} />);

        userEvent.type(textarea(), 'abc');

        expect(onValueInput.mock.calls.map(([value]) => value)).toEqual(['a', 'ab', 'abc']);
        expect(onValueInput.mock.calls[0][1].target).toBe(textarea());
        expect(onValueChange).not.toHaveBeenCalled();
        expect(textarea().value).toBe('abc');
    });

    it('trails onValueInput by `debounce` ms with the last value, as ion-textarea did', () => {
        vi.useFakeTimers();
        try {
            const onValueInput = vi.fn();
            render(<AppTextarea debounce={300} onValueInput={onValueInput} />);
            fireEvent.change(textarea(), { target: { value: 'a' } });
            fireEvent.change(textarea(), { target: { value: 'ab' } });
            expect(onValueInput).not.toHaveBeenCalled();
            vi.advanceTimersByTime(300);
            expect(onValueInput).toHaveBeenCalledTimes(1);
            expect(onValueInput.mock.calls[0][0]).toBe('ab');
        } finally {
            vi.useRealTimers();
        }
    });

    it('lets aria-describedby and aria-invalid from the caller reach the textarea', () => {
        render(<AppTextarea aria-label="Bio" aria-describedby="bio-error" aria-invalid />);
        expect(textarea()).toHaveAttribute('aria-describedby', 'bio-error');
        expect(textarea()).toHaveAttribute('aria-invalid', 'true');
    });

    it('fires onValueChange on blur only when the value differs from the value at focus', () => {
        const calls: string[] = [];
        render(
            <AppTextarea
                value="start"
                onValueChange={value => calls.push(`change:${value}`)}
                onFocus={() => calls.push('focus')}
                onBlur={() => calls.push('blur')}
            />
        );
        const native = textarea();

        fireEvent.focus(native);
        fireEvent.blur(native);
        expect(calls).toEqual(['focus', 'blur']);

        fireEvent.focus(native);
        fireEvent.change(native, { target: { value: 'start!' } });
        fireEvent.blur(native);
        fireEvent.focus(native);
        fireEvent.blur(native);
        expect(calls).toEqual(['focus', 'blur', 'focus', 'change:start!', 'blur', 'focus', 'blur']);
    });

    it('re-applies `value` on every parent re-render (Ionic React), without firing any event', () => {
        const onValueInput = vi.fn();
        const onValueChange = vi.fn();
        const Parent: React.FC = () => {
            const [renders, setRenders] = useState(0);
            return (
                <>
                    <AppTextarea
                        value="Parent value"
                        onValueInput={onValueInput}
                        onValueChange={onValueChange}
                    />
                    <button type="button" onClick={() => setRenders(renders + 1)}>
                        rerender
                    </button>
                </>
            );
        };
        render(<Parent />);

        fireEvent.change(textarea(), { target: { value: 'Typed, never stored' } });
        expect(textarea().value).toBe('Typed, never stored');
        expect(onValueInput).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByRole('button', { name: 'rerender' }));
        expect(textarea().value).toBe('Parent value');
        expect(onValueInput).toHaveBeenCalledTimes(1);
        expect(onValueChange).not.toHaveBeenCalled();
    });

    it('follows a controlled parent value, and clears on null / undefined', () => {
        const Controlled: React.FC<{ initial?: string | null }> = ({ initial }) => {
            const [value, setValue] = useState<string | null | undefined>(initial);
            return (
                <>
                    <AppTextarea value={value} onValueInput={setValue} />
                    <button type="button" onClick={() => setValue(null)}>
                        clear
                    </button>
                </>
            );
        };
        render(<Controlled initial={undefined} />);

        expect(textarea().value).toBe('');
        userEvent.type(textarea(), 'hi');
        expect(textarea().value).toBe('hi');
        fireEvent.click(screen.getByRole('button', { name: 'clear' }));
        expect(textarea().value).toBe('');
    });

    it('keeps typed text across parent re-renders when uncontrolled (no `value` prop)', () => {
        const onValueInput = vi.fn();
        const { rerender } = render(<AppTextarea onValueInput={onValueInput} />);

        fireEvent.change(textarea(), { target: { value: 'Notes' } });
        rerender(<AppTextarea onValueInput={onValueInput} />);

        expect(textarea().value).toBe('Notes');
        expect(onValueInput).toHaveBeenCalledWith('Notes', expect.anything());
    });

    it('autoGrow mirrors the value into data-replicated-value (the grid ::after that sizes the field)', () => {
        const { container, rerender } = render(<AppTextarea autoGrow rows={1} value="one" />);
        const wrapper = container.querySelector<HTMLElement>('.app-textarea-native-wrapper');

        expect(container.firstElementChild?.classList.contains('app-textarea-auto-grow')).toBe(
            true
        );
        expect(wrapper?.dataset.replicatedValue).toBe('one');

        fireEvent.change(textarea(), { target: { value: 'one\ntwo\nthree' } });
        expect(wrapper?.dataset.replicatedValue).toBe('one\ntwo\nthree');

        rerender(<AppTextarea rows={1} value="one" />);
        expect(wrapper?.hasAttribute('data-replicated-value')).toBe(false);
    });

    it('renders the counter as "<length> / <maxlength>" only with counter and maxlength', () => {
        const { container, rerender } = render(
            <AppTextarea counter maxlength={20} value="Twelve chars" />
        );
        const counter = (): Element | null => container.querySelector('.app-textarea-counter');

        expect(counter()?.textContent).toBe('12 / 20');
        fireEvent.change(textarea(), { target: { value: 'Twelve chars!' } });
        expect(counter()?.textContent).toBe('13 / 20');

        rerender(<AppTextarea counter value="x" />);
        expect(counter()).toBeNull();
        rerender(<AppTextarea maxlength={20} value="x" />);
        expect(counter()).toBeNull();
    });

    it('disables / makes the native textarea readonly and marks a disabled host', () => {
        const { rerender } = render(<AppTextarea disabled data-testid="host" value="x" />);

        expect(textarea().disabled).toBe(true);
        expect(screen.getByTestId('host').classList.contains('app-textarea-disabled')).toBe(true);

        rerender(<AppTextarea readonly data-testid="host" value="x" />);
        expect(textarea().disabled).toBe(false);
        expect(textarea().readOnly).toBe(true);
        expect(screen.getByTestId('host').classList.contains('app-textarea-disabled')).toBe(false);
    });

    it('delivers keydown to a host onKeyDown (AiPassport submits on Enter)', () => {
        const onKeyDown = vi.fn((event: React.KeyboardEvent) => {
            if (event.key === 'Enter') event.preventDefault();
        });
        render(<AppTextarea onKeyDown={onKeyDown} />);

        const notPrevented = fireEvent.keyDown(textarea(), { key: 'Enter' });

        expect(onKeyDown).toHaveBeenCalledTimes(1);
        expect(notPrevented).toBe(false);
    });

    it('lets one click reach an ancestor, whether the textarea or the label padding is clicked', () => {
        const onAncestorClick = vi.fn();
        const { container } = render(
            // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- mirrors AiPassport's clickable wrapper
            <div onClick={onAncestorClick}>
                <AppTextarea />
            </div>
        );

        fireEvent.click(textarea());
        expect(onAncestorClick).toHaveBeenCalledTimes(1);

        // A click on the label itself also activates (clicks) the textarea; only that one bubbles.
        fireEvent.click(container.querySelector('label') as HTMLLabelElement);
        expect(onAncestorClick).toHaveBeenCalledTimes(2);
    });

    it('takes its mode from the document (Ionic <html mode>) unless pinned', () => {
        document.documentElement.setAttribute('mode', 'ios');
        const { rerender } = render(<AppTextarea data-testid="host" />);
        expect(screen.getByTestId('host').classList.contains('ios')).toBe(true);

        rerender(<AppTextarea data-testid="host" mode="md" />);
        expect(screen.getByTestId('host').classList.contains('md')).toBe(true);
        expect(screen.getByTestId('host').classList.contains('ios')).toBe(false);
    });
});
