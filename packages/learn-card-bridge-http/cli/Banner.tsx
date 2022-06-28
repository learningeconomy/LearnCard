import React from 'react';
import { Text, Box } from 'ink';
import Gradient from 'ink-gradient';
import figlet from 'figlet';

const banner = figlet.textSync('Learn Card', 'Big Money-ne');

const Banner: React.FC = () => {
    return (
        <Box marginBottom={4}>
            <Gradient colors={['cyan', 'green']}>
                <Text>{banner}</Text>
            </Gradient>
        </Box>
    );
};

export default Banner;
