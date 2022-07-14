import React from 'react';
import { render } from 'ink';
import { program } from 'commander';

import App from './App';

import packageJson from '../package.json';

program
    .version(packageJson.version)
    .argument('[name]')
    .action(async name => {
        console.clear();

        render(<App name={name} />);
    })
    .parse(process.argv);
