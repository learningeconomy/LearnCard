import React from 'react';
import { Box, useFocusManager } from 'ink';
import { Updater } from 'use-immer';

import { curriedStateSlice } from './curriedStateSlice';

import Input from './Input';
import Button from './Button';

import { FormState } from './types';
import { generateRandomSeed } from './random';

type FormProps = {
    state: FormState;
    setState: Updater<FormState>;
    onSubmit: () => void;
    onCancel: () => void;
};

const Form: React.FC<FormProps> = ({ state, setState, onSubmit, onCancel }) => {
    const { focus } = useFocusManager();

    const updateSlice = curriedStateSlice(setState);

    return (
        <Box
            flexGrow={1}
            flexDirection="column"
            padding={2}
            borderStyle="round"
            borderColor="yellow"
        >
            <Box flexGrow={1} flexDirection="column" alignItems="center">
                <Box marginBottom={2} padding={1} flexDirection="column" borderStyle="round">
                    <Input
                        disabled
                        focusId="name"
                        prompt="Name:"
                        value={state.name}
                        onChange={updateSlice('name')}
                        onSubmit={() => focus('editName')}
                    />
                    <Input
                        marginTop={1}
                        disabled
                        focusId="seed"
                        prompt="Seed:"
                        value={state.seed}
                        onChange={updateSlice('seed')}
                        onSubmit={() => focus('editSeed')}
                    />
                </Box>

                <Button autoFocus focusId="editName" onClick={() => focus('name')} width={25}>
                    Edit Name
                </Button>
                <Button onClick={() => updateSlice('seed', generateRandomSeed())} width={25}>
                    Generate Random Seed
                </Button>
                <Button
                    focusId="editSeed"
                    onClick={() => {
                        updateSlice('seed', '');
                        focus('seed');
                    }}
                    width={25}
                >
                    Enter Custom Seed
                </Button>
            </Box>

            <Box height={5} width="100%" padding={2} justifyContent="space-between">
                <Button onClick={onSubmit}>Ok</Button>
                <Button onClick={onCancel}>Cancel</Button>
            </Box>
        </Box>
    );
};

export default Form;
