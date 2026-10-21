import React, { useEffect, useRef } from 'react';
import ReactCodeInput, { ReactCodeInputProps } from 'react-code-input';

type AccessibleCodeInputProps = ReactCodeInputProps & {
    label: string;
    errorId?: string;
};

/** Adds per-digit names to react-code-input without changing its visual output. */
const AccessibleCodeInput: React.FC<AccessibleCodeInputProps> = ({
    label,
    errorId,
    fields = 6,
    isValid = true,
    ...props
}) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const inputs = containerRef.current?.querySelectorAll<HTMLInputElement>('input') ?? [];

        inputs.forEach((input, index) => {
            input.setAttribute('aria-label', `${label}, digit ${index + 1} of ${fields}`);
            input.setAttribute('aria-invalid', String(!isValid));

            if (errorId) {
                input.setAttribute('aria-describedby', errorId);
            } else {
                input.removeAttribute('aria-describedby');
            }
        });
    }, [errorId, fields, isValid, label]);

    return (
        <fieldset className="m-0 min-w-0 border-0 p-0">
            <legend className="sr-only">{label}</legend>
            <div ref={containerRef}>
                <ReactCodeInput {...props} fields={fields} isValid={isValid} />
            </div>
        </fieldset>
    );
};

export default AccessibleCodeInput;
