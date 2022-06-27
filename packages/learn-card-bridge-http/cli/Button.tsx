import React, { ComponentPropsWithRef } from 'react';
import { Text, Box, useFocus, useFocusManager, useInput, DOMElement } from 'ink';

type RawButtonProps = ComponentPropsWithRef<typeof Box> & {
    autoFocus?: boolean;
    focusId?: string;
    focusedProps?: Partial<ComponentPropsWithRef<typeof Box>>;
    onClick: () => void;
};

export const RawButton = React.forwardRef<DOMElement, RawButtonProps>(function RawButton(
    { children, autoFocus = false, focusId, focusedProps = {}, onClick, ...props },
    ref
) {
    const { focusPrevious, focusNext } = useFocusManager();
    const { isFocused } = useFocus({ autoFocus, id: focusId });
    useInput((input, key) => {
        if (isFocused) {
            if (key.leftArrow || key.upArrow || input === 'h' || input === 'k') focusPrevious();
            if (key.rightArrow || key.downArrow || input === 'l' || input === 'j') focusNext();
            if (key.return || input === ' ') onClick();
        }
    });

    return (
        // eslint-disable-next-line react/jsx-props-no-spreading
        <Box {...props} ref={ref} {...(isFocused ? focusedProps : {})}>
            {children}
        </Box>
    );
});

type ButtonProps = ComponentPropsWithRef<typeof Box> & {
    autoFocus?: boolean;
    focusId?: string;
    onClick: () => void;
};

const Button = React.forwardRef<DOMElement, ButtonProps>(function Button(
    { children, ...props },
    ref
) {
    return (
        <RawButton
            height={3}
            width={15}
            borderStyle="round"
            justifyContent="center"
            alignItems="center"
            focusedProps={{
                borderColor: 'cyan',
            }}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...props}
            ref={ref}
        >
            <Text>{children}</Text>
        </RawButton>
    );
});

export default Button;
