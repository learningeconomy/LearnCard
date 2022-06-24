import React, { useEffect } from 'react';
import { Text, Box, useApp } from 'ink';
import simpleGit from 'simple-git';
import Gradient from 'ink-gradient';
import Spinner from 'ink-spinner';

const git = simpleGit();

type CloningProps = {
    path: string;
    onFinished: () => void;
};

const Cloning: React.FC<CloningProps> = ({ path, onFinished }) => {
    const app = useApp();

    useEffect(() => {
        git.clone('https://github.com/TaylorBeeston/init.vim', path, ['-q'])
            .then(onFinished)
            .catch(error => {
                app.exit();
                console.error(error);
            });
    }, []);

    return (
        <Box
            flexGrow={1}
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            padding={2}
            borderStyle="round"
            borderColor="yellow"
        >
            <Gradient name="rainbow">
                <Text>
                    <Spinner type="material" />
                </Text>
            </Gradient>
            <Text>Cloning into {path}...</Text>
            <Gradient name="rainbow">
                <Text>
                    <Spinner type="material" />
                </Text>
            </Gradient>
        </Box>
    );
};

export default Cloning;
