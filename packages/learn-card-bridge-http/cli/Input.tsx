import React, { ComponentPropsWithRef } from 'react';
import { Text, Box, useFocus, DOMElement } from 'ink';
import TextInput from 'ink-text-input';

type InputProps = ComponentPropsWithRef<typeof Box> & {
    disabled?: boolean;
    autoFocus?: boolean;
    focusId?: string;
    prompt: string;
    value: string;
    onChange: (value: string) => void;
    onSubmit: (value: string) => void;
};

const Input = React.forwardRef<DOMElement, InputProps>(function Input(
    { disabled = false, autoFocus = false, focusId, prompt, value, onChange, onSubmit, ...props },
    ref
) {
    const { isFocused } = useFocus({ autoFocus, id: focusId, isActive: !disabled });

    return (
        // eslint-disable-next-line react/jsx-props-no-spreading
        <Box ref={ref} {...props}>
            <Box marginRight={1}>
                <Text color="blueBright">{prompt}</Text>
            </Box>

            <TextInput value={value} onChange={onChange} focus={isFocused} onSubmit={onSubmit} />
        </Box>
    );
});

export default Input;
