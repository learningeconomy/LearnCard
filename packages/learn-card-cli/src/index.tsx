import fs from 'fs/promises';
import dns from 'node:dns';

import repl from 'pretty-repl';
import { getTestCache } from '@learncard/core';
import { initLearnCard, emptyLearnCard, learnCardFromSeed } from '@learncard/init';
import types from '@learncard/types';
import gradient from 'gradient-string';
import figlet from 'figlet';
import { program } from 'commander';
import clipboard from 'clipboardy';


import { generateRandomSeed } from './random';

import packageJson from '../package.json';

dns.setDefaultResultOrder('ipv4first');

const g = {
    learnCard: gradient(['cyan', 'green'])('learnCard'),
    emptyLearnCard: gradient(['cyan', 'green'])('emptyLearnCard'),
    learnCardFromKey: gradient(['cyan', 'green'])('learnCardFromKey'),
    initLearnCard: gradient(['cyan', 'green'])('initLearnCard'),
    seed: gradient(['cyan', 'green'])('seed'),
    generateRandomSeed: gradient(['cyan', 'green'])('generateRandomSeed'),
    types: gradient(['cyan', 'green'])('types'),
    copy: gradient(['cyan', 'green'])('copy'),
};

const copyFunction = (text: string | object | number) => {
    if (typeof text === 'object') {
        text = JSON.stringify(text);
    }
    if (typeof text === 'number') {
        text = text.toString();
    }
    clipboard.writeSync(text);
    console.log('Copied to clipboard!');
};

program
    .version(packageJson.version)
    .argument('[seed]')
    .action(async (_seed: string = generateRandomSeed()) => {
        console.clear();

        const seed = _seed.padStart(64, '0');

        console.log(gradient(['cyan', 'green'])(figlet.textSync('Learn Card', 'Big Money-ne')));
        console.log('Welcome to the Learn Card CLI!\n');

        console.log(`Your seed is ${seed}\n`);

        console.log('Creating wallet...');

        globalThis.seed = seed;
        globalThis.generateRandomSeed = generateRandomSeed;
        globalThis.emptyLearnCard = emptyLearnCard;
        globalThis.learnCardFromSeed = learnCardFromSeed;
        globalThis.initLearnCard = initLearnCard;

        globalThis.learnCard = await initLearnCard({
            seed,
            network: true,
            allowRemoteContexts: true,
            didkit: fs.readFile(
                require.resolve('@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm')
            ),
        });
        globalThis.types = types;
        globalThis.getTestCache = getTestCache;

        globalThis.copy = copyFunction;

        // delete 'Creating wallet...' message
        process.stdout.moveCursor?.(0, -1);
        process.stdout.clearLine?.(1);

        console.log('Wallet created!\n');

        console.log('┌────────────────────────────────────────────────────┐');
        console.log('│                Variables Available                 │');
        console.log('├────────────────────┬───────────────────────────────┤');
        console.log('│      Variable      │           Description         │');
        console.log('├────────────────────┼───────────────────────────────┤');
        console.log(`│          ${g.learnCard} │ Learn Card Wallet             │`);
        console.log(`│      ${g.initLearnCard} │ Wallet Instantiation Function │`);
        console.log(`│               ${g.seed} │ Seed used to generate wallet  │`);
        console.log(`│ ${g.generateRandomSeed} │ Generates a random seed       │`);
        console.log(`│              ${g.types} │ Helpful zod validators        │`);
        console.log(`│              ${g.copy}  │ Copy text to clipboard        │`);
        console.log('└────────────────────┴───────────────────────────────┘');

        console.log('');

        console.log(
            'For help/documentation regarding your wallet, please read the documentation at\n'
        );

        console.log('https://docs.learncard.com/sdks/learncard-core/construction\n');

        console.log("To get a feel for what's possible, try some of the following commands\n");

        console.log('┌─────────────────────────┬────────────────────────────────────────────────┐');
        console.log('│        Description      │                    Command                     │');
        console.log('├─────────────────────────┼────────────────────────────────────────────────┤');
        console.log(
            `│           View your did │ ${g.learnCard}.id.did();                            │`
        );
        console.log(
            `│ Generate an unsigned VC │ ${g.learnCard}.invoke.getTestVc();                  │`
        );
        console.log(
            `│       Issue a signed VC │ await ${g.learnCard}.invoke.issueCredential(uvc);   │`
        );
        console.log(
            `│      Verify a signed VC │ await ${g.learnCard}.invoke.verifyCredential(vc);   │`
        );
        console.log(
            `│       Issue a signed VP │ await ${g.learnCard}.invoke.issuePresentation(vc);  │`
        );
        console.log(
            `│      Verify a signed VP │ await ${g.learnCard}.invoke.verifyPresentation(vp); │`
        );
        console.log('└─────────────────────────┴────────────────────────────────────────────────┘');

        console.log('');

        repl.start({
            colorize: (input: string) => {
                return input
                    .replace('emptyLearnCard', g.emptyLearnCard)
                    .replace('learnCardFromKey', g.learnCardFromKey)
                    .replace('initLearnCard', g.initLearnCard)
                    .replace('learnCard', g.learnCard)
                    .replace('seed', g.seed)
                    .replace('generateRandomSeed', g.generateRandomSeed)
                    .replace('copy', g.copy);
            },
        });
    })
    .parse(process.argv);
