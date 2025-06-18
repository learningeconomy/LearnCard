import path from 'node:path';
import { writeFile } from 'node:fs/promises';

import React, { useState } from 'react';
import { Box, useApp } from 'ink';
import { useImmer } from 'use-immer';

import FullScreenBox from './FullScreenBox';
import Banner from './Banner';
import Form from './Form';
import Cloning from './Cloning';
import Info from './Info';

import { generateRandomSeed } from './random';

import type { FormState } from './types';

type Step = 'form' | 'cloning' | 'info';

type AppProps = {
    name?: string;
};

const randomSeed = generateRandomSeed();

const App: React.FC<AppProps> = ({ name = 'LearnCardHTTPBridge' }) => {
    const app = useApp();

    const [step, setStep] = useState<Step>('form');

    const [state, setState] = useImmer<FormState>({
        name,
        seed: randomSeed,
    });

    const postClone = async () => {
        await writeFile(
            path.join(process.cwd(), `${state.name}/packages/learn-card-bridge-http`, '.env'),
            `WALLET_SEED=${state.seed}`
        );
        setStep('info');
    };

    const COMPONENTS: Record<Step, React.ReactNode> = {
        form: (
            <Form
                state={state}
                setState={setState}
                onSubmit={() => setStep('cloning')}
                onCancel={() => app.exit()}
            />
        ),
        cloning: <Cloning path={state.name} onFinished={postClone} />,
        info: <Info path={state.name} />,
    };

    return (
        <FullScreenBox
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            borderStyle="double"
            borderColor="green"
        >
            <Box flexDirection="column" padding={2} height="100%">
                <Banner />

                {COMPONENTS[step]}
            </Box>
        </FullScreenBox>
    );
};

export default App;
