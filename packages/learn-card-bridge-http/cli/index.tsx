import React from 'react';
import { render } from 'ink';
import { program } from 'commander';
import { lookpath } from 'lookpath';

import App from './App';

import packageJson from '../package.json';

program
    .version(packageJson.version)
    .argument('[name]')
    .action(async name => {
        console.clear();

        render(<App name={name} />);

        // const awsPath = await lookpath('aws');
        // const serverlessPath = await lookpath('serverless');

        // if (!awsPath || !serverlessPath || true) {
        //     console.warn('\nIt looks like you might not have serverless/AWS set up yet!');
        //     console.warn(
        //         'Please review the instructions at https://www.serverless.com/framework/docs/tutorial if you have any issues deploying the Learn Card HTTP Bridge!\n'
        //     );
        // }
    })
    .parse(process.argv);
