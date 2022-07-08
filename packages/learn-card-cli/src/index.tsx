import repl from 'pretty-repl';

import { walletFromKey } from '@learncard/core';
import gradient from 'gradient-string';
import figlet from 'figlet';
import { program } from 'commander';

import { generateRandomSeed } from './random';

import packageJson from '../package.json';

program
    .version(packageJson.version)
    .argument('[seed]')
    .action(async (_seed: string = generateRandomSeed()) => {
        console.clear();

        const seed = _seed.padStart(64, '0');

        console.log(gradient(['cyan', 'green'])(figlet.textSync('Learn Card', 'Big Money-ne')));
        console.log('Welcome to the Learn Card CLI!');
        console.log(`You're seed is ${seed}\n`);

        console.log('Creating wallet...');

        globalThis.walletFromKey = walletFromKey;
        globalThis.wallet = await walletFromKey(seed);

        // delete 'Creating wallet...' message
        process.stdout.moveCursor(0, -1);
        process.stdout.clearLine(1);

        console.log('Wallet created!\n');

        console.log('Your wallet has been stored in the variable wallet');
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
        console.log('│           View your did │ wallet.did;                          │');
        console.log('│ Generate an unsigned VC │ wallet.getTestVc();                  │');
        console.log('│       Issue a signed VC │ await wallet.issueCredential(uvc);   │');
        console.log('│      Verify a signed VC │ await wallet.verifyCredential(vc);   │');
        console.log('│       Issue a signed VP │ await wallet.issuePresentation(vc);  │');
        console.log('│      Verify a signed VP │ await wallet.verifyPresentation(vp); │');
        console.log('└─────────────────────────┴──────────────────────────────────────┘');

        console.log('');

        repl.start({
            colorize: (input: string) => {
                return input
                    .replace('walletFromKey', gradient(['cyan', 'green'])('walletFromKey'))
                    .replace('wallet', gradient(['cyan', 'green'])('wallet'));
            },
        });
    })
    .parse(process.argv);
