import repl from 'pretty-repl';

import { initLearnCard, emptyWallet, walletFromKey } from '@learncard/core';
import gradient from 'gradient-string';
import figlet from 'figlet';
import { program } from 'commander';

import { generateRandomSeed } from './random';

import packageJson from '../package.json';

const g = {
    wallet: gradient(['cyan', 'green'])('wallet'),
    emptyWallet: gradient(['cyan', 'green'])('emptyWallet'),
    walletFromKey: gradient(['cyan', 'green'])('walletFromKey'),
    initLearnCard: gradient(['cyan', 'green'])('initLearnCard'),
    seed: gradient(['cyan', 'green'])('seed'),
    generateRandomSeed: gradient(['cyan', 'green'])('generateRandomSeed'),
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
        globalThis.emptyWallet = emptyWallet;
        globalThis.walletFromKey = walletFromKey;
        globalThis.initLearnCard = initLearnCard;
        globalThis.wallet = await initLearnCard({ seed });

        // delete 'Creating wallet...' message
        process.stdout.moveCursor(0, -1);
        process.stdout.clearLine(1);

        console.log('Wallet created!\n');

        console.log('┌────────────────────────────────────────────────────┐');
        console.log('│                Variables Available                 │');
        console.log('├────────────────────┬───────────────────────────────┤');
        console.log('│      Variable      │           Description         │');
        console.log('├────────────────────┼───────────────────────────────┤');
        console.log(`│             ${g.wallet} │ Learn Card Wallet             │`);
        console.log(`│        ${g.emptyWallet} │ Wallet Instantiation Function │`);
        console.log(`│      ${g.walletFromKey} │ Wallet Instantiation Function │`);
        console.log(`│      ${g.initLearnCard} │ Wallet Instantiation Function │`);
        console.log(`│               ${g.seed} │ Seed used to generate wallet  │`);
        console.log(`│ ${g.generateRandomSeed} │ Generates a random seed       │`);
        console.log('└────────────────────┴───────────────────────────────┘');

        console.log('');

        console.log(
            'For help/documentation regarding your wallet, please read the documentation at\n'
        );

        console.log(
            'https://app.gitbook.com/o/6uDv1QDlxaaZC7i8EaGb/s/FXvEJ9j3Vf3FW5Nc557n/learn-card-packages/learncard-core/quick-start\n'
        );

        console.log("To get a feel for what's possible, try some of the following commands\n");

        console.log('┌─────────────────────────┬──────────────────────────────────────┐');
        console.log('│        Description      │            Command                   │');
        console.log('├─────────────────────────┼──────────────────────────────────────┤');
        console.log(`│           View your did │ ${g.wallet}.did();                        │`);
        console.log(`│ Generate an unsigned VC │ ${g.wallet}.getTestVc();                  │`);
        console.log(`│       Issue a signed VC │ await ${g.wallet}.issueCredential(uvc);   │`);
        console.log(`│      Verify a signed VC │ await ${g.wallet}.verifyCredential(vc);   │`);
        console.log(`│       Issue a signed VP │ await ${g.wallet}.issuePresentation(vc);  │`);
        console.log(`│      Verify a signed VP │ await ${g.wallet}.verifyPresentation(vp); │`);
        console.log('└─────────────────────────┴──────────────────────────────────────┘');

        console.log('');

        repl.start({
            colorize: (input: string) => {
                return input
                    .replace('emptyWallet', g.emptyWallet)
                    .replace('walletFromKey', g.walletFromKey)
                    .replace('initLearnCard', g.initLearnCard)
                    .replace('wallet', g.wallet)
                    .replace('seed', g.seed)
                    .replace('generateRandomSeed', g.generateRandomSeed);
            },
        });
    })
    .parse(process.argv);
