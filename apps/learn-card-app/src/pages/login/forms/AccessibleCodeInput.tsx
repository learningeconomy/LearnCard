import React, { useId, useRef, useState } from 'react';

type CodeInputType = 'text' | 'number' | 'password' | 'tel';

export type AccessibleCodeInputProps = {
    /** Accessible name for the whole code; each box is announced as "<label>, digit N of M". */
    label: string;
    /** Id of an element describing the current error, wired to every box via aria-describedby. */
    errorId?: string;
    /** Called with the joined code (empty boxes are skipped) after every edit. */
    onChange?: (value: string) => void;
    /** Kept for call-site compatibility with react-code-input; not rendered. */
    name?: string;
    fields?: number;
    type?: CodeInputType;
    inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
    isValid?: boolean;
    disabled?: boolean;
    autoFocus?: boolean;
    autoComplete?: string;
    className?: string;
};

// Characters the old react-code-input dropped by default.
const FILTERED_CHARS = /[-.]/g;

const sanitize = (raw: string, type: CodeInputType) => {
    const value = raw.replace(FILTERED_CHARS, '');
    return type === 'number' ? value.replace(/\D/g, '') : value;
};

/**
 * One-character-per-box verification code entry. Replaces react-code-input (unmaintained,
 * peer range stops at React 17) and keeps its DOM shape so login.scss still applies:
 * a `.react-code-input` container with one <input> per digit.
 *
 * Typing a character fills the box and moves to the next one. Pasting (or an OS one-time-code
 * autofill) spreads the characters from the focused box. Backspace clears the focused box and
 * moves back. Arrow keys move between boxes.
 */
const AccessibleCodeInput: React.FC<AccessibleCodeInputProps> = ({
    label,
    errorId,
    onChange,
    fields = 6,
    type = 'text',
    inputMode,
    isValid = true,
    disabled = false,
    autoFocus = true,
    autoComplete = 'off',
    className,
}) => {
    const [digits, setDigits] = useState<string[]>(() => Array(fields).fill(''));
    const inputs = useRef<(HTMLInputElement | null)[]>([]);
    const idPrefix = useId();

    const focusBox = (index: number) => {
        const box = inputs.current[index];
        if (!box) return;
        box.focus();
        box.select();
    };

    const commit = (next: string[]) => {
        setDigits(next);
        onChange?.(next.join(''));
    };

    // Writes `chars` starting at box `start` and focuses the box after the last one written.
    const fillFrom = (start: number, chars: string) => {
        if (!chars) return;
        const next = digits.slice();
        const written = Math.min(chars.length, fields - start);
        for (let i = 0; i < written; i += 1) next[start + i] = chars[i];
        commit(next);
        focusBox(Math.min(start + written, fields - 1));
    };

    const handleChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
        const raw = sanitize(event.target.value, type);
        if (!raw) return;
        // Typing into a box that already holds a character yields old + new (or new + old,
        // depending on the caret); keep only the new one. Anything longer is a paste/autofill.
        const previous = digits[index];
        if (previous && raw.length === 2) {
            fillFrom(index, raw.startsWith(previous) ? raw.slice(1) : raw.slice(0, 1));
            return;
        }
        fillFrom(index, raw);
    };

    const handlePaste = (index: number, event: React.ClipboardEvent<HTMLInputElement>) => {
        event.preventDefault();
        fillFrom(index, sanitize(event.clipboardData.getData('text').trim(), type));
    };

    const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
        switch (event.key) {
            case 'Backspace': {
                event.preventDefault();
                const next = digits.slice();
                next[index] = '';
                commit(next);
                if (index > 0) focusBox(index - 1);
                break;
            }
            case 'ArrowLeft':
                event.preventDefault();
                if (index > 0) focusBox(index - 1);
                break;
            case 'ArrowRight':
                event.preventDefault();
                if (index < fields - 1) focusBox(index + 1);
                break;
            case 'ArrowUp':
            case 'ArrowDown':
                event.preventDefault();
                break;
            case 'e':
            case 'E':
                if (type === 'number') event.preventDefault();
                break;
            case '-':
            case '.':
                event.preventDefault();
                break;
            default:
                break;
        }
    };

    return (
        <fieldset className="m-0 min-w-0 border-0 p-0">
            <legend className="sr-only">{label}</legend>
            <div
                className={['react-code-input', className].filter(Boolean).join(' ')}
                style={{ display: 'inline-block' }}
            >
                {digits.map((digit, index) => (
                    <input
                        // Fixed-length list of positional boxes; the index is the identity.
                        key={index}
                        ref={element => {
                            inputs.current[index] = element;
                        }}
                        id={`${idPrefix}-${index}`}
                        data-id={index}
                        data-valid={isValid}
                        value={digit}
                        type={type}
                        inputMode={inputMode}
                        autoComplete={autoComplete}
                        autoFocus={autoFocus && index === 0}
                        min={type === 'number' ? 0 : undefined}
                        max={type === 'number' ? 9 : undefined}
                        disabled={disabled}
                        aria-label={`${label}, digit ${index + 1} of ${fields}`}
                        aria-invalid={!isValid}
                        aria-describedby={errorId}
                        onFocus={event => event.target.select()}
                        onChange={event => handleChange(index, event)}
                        onPaste={event => handlePaste(index, event)}
                        onKeyDown={event => handleKeyDown(index, event)}
                    />
                ))}
            </div>
        </fieldset>
    );
};

export default AccessibleCodeInput;
