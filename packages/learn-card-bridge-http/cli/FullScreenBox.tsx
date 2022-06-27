import React from 'react';
import { Box } from 'ink';
import useStdOutDimensions from 'ink-use-stdout-dimensions';

const FullScreenBox: typeof Box = React.forwardRef(function FullScreenBox(
    { children, ...props },
    ref
) {
    const [width, height] = useStdOutDimensions();

    return (
        // eslint-disable-next-line react/jsx-props-no-spreading
        <Box width={Math.min(width, 150)} height={Math.min(height - 1, 50)} {...props} ref={ref}>
            {children}
        </Box>
    );
});

export default FullScreenBox;
