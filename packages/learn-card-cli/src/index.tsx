import fs from 'fs/promises';
import dns from 'node:dns';

import repl from 'pretty-repl';
import { getTestCache } from '@learncard/core';
import { initLearnCard, emptyLearnCard, learnCardFromSeed } from '@learncard/init';
import types from '@learncard/types';
import gradient from 'gradient-string';
import figlet from 'figlet';
import { program } from 'commander';

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

        const learnCard = await initLearnCard({
            seed: 'a',
            network: 'http://localhost:4000/trpc',
            cloud: { url: 'http://localhost:4100/trpc' },
            didkit: fs.readFile(
                require.resolve('@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm')
            ),
        });
        const customJwk = learnCard.invoke.generateEd25519KeyFromBytes(new Uint8Array(32));
        const customDidKey = learnCard.invoke.keyToDid('key', customJwk);
        const customDidDoc = await learnCard.invoke.resolveDid(customDidKey);

        try {
            await learnCard.invoke.createProfile({ profileId: 'ugh' });
        } catch (error) { }

        await learnCard.invoke.addDidMetadata({
            verificationMethod: customDidDoc.verificationMethod,
            keyAgreement: customDidDoc.keyAgreement,
        });

        globalThis.learnCard = learnCard;
        globalThis.types = types;
        globalThis.getTestCache = getTestCache;

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
        console.log('└────────────────────┴───────────────────────────────┘');

        console.log('');

        console.log(
            'For help/documentation regarding your wallet, please read the documentation at\n'
        );

        console.log('https://docs.learncard.com/learn-card-sdk/learncard-core/quick-start\n');

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
                    .replace('generateRandomSeed', g.generateRandomSeed);
            },
        });
    })
    .parse(process.argv);
