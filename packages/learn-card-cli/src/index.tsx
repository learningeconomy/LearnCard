import fs from 'fs/promises';
import dns from 'node:dns';
import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import { inspect } from 'node:util';

import { getTestCache } from '@learncard/core';
import { initLearnCard, emptyLearnCard, learnCardFromSeed } from '@learncard/init';
import { getSimpleSigningPlugin } from '@learncard/simple-signing-plugin';
import { openBadgeV2Plugin } from '@learncard/open-badge-v2-plugin';
import * as types from '@learncard/types';
import { getLinkedClaimsPlugin } from '@learncard/linked-claims-plugin';
import gradient from 'gradient-string';
import figlet from 'figlet';
import { program } from 'commander';
import clipboard from 'clipboardy';

import { getLerRsPlugin } from '@learncard/ler-rs-plugin';
import { getRenderMethodPlugin } from '@learncard/render-method-plugin';

import { generateRandomSeed } from './random';
import {
    createLearnCardBundle,
    exportLearnCardBundle as writeLearnCardBundle,
    importLearnCardBundle,
    readLearnCardBundle,
    restoreLearnCardFromBundle as restoreBundle,
} from '@learncard/holder-continuity';
import {
    createExportLearnCardBundleHelper,
    createRestoreLearnCardFromBundleHelper,
} from './replHelpers';

import packageJson from '../package.json';

dns.setDefaultResultOrder('ipv4first');

type CliGlobals = {
    seed: string;
    generateRandomSeed: typeof generateRandomSeed;
    emptyLearnCard: typeof emptyLearnCard;
    learnCardFromSeed: typeof learnCardFromSeed;
    initLearnCard: typeof initLearnCard;
    learnCard: any;
    types: typeof types;
    getTestCache: typeof getTestCache;
    copy: typeof copyFunction;
    getLearnCardBundlePassword: typeof getLearnCardBundlePassword;
    exportLearnCardBundle: ReturnType<typeof createExportLearnCardBundleHelper>;
    importLearnCardBundle: typeof importLearnCardBundle;
    createLearnCardBundle: typeof createLearnCardBundle;
    readLearnCardBundle: typeof readLearnCardBundle;
    restoreLearnCardFromBundle: ReturnType<typeof createRestoreLearnCardFromBundleHelper>;
};

const cliGlobals = globalThis as typeof globalThis & CliGlobals;

type ReplCompletion = [string[], string];

const replGlobals = [
    'learnCard',
    'emptyLearnCard',
    'learnCardFromSeed',
    'initLearnCard',
    'seed',
    'generateRandomSeed',
    'types',
    'getTestCache',
    'copy',
    'getLearnCardBundlePassword',
    'exportLearnCardBundle',
    'importLearnCardBundle',
    'createLearnCardBundle',
    'readLearnCardBundle',
    'restoreLearnCardFromBundle',
];

const replCommands = ['.exit'];

const identifierPattern = /^[A-Za-z_$][\w$]*$/;

const colorizeName = (name: string): string => {
    const colorizedName = gradient(['cyan', 'green'])(name);

    if (colorizedName !== name || !process.stdout.isTTY) return colorizedName;

    return `\x1b[36m${name}\x1b[39m`;
};

const g = {
    learnCard: colorizeName('learnCard'),
    emptyLearnCard: colorizeName('emptyLearnCard'),
    learnCardFromSeed: colorizeName('learnCardFromSeed'),
    initLearnCard: colorizeName('initLearnCard'),
    seed: colorizeName('seed'),
    generateRandomSeed: colorizeName('generateRandomSeed'),
    types: colorizeName('types'),
    getTestCache: colorizeName('getTestCache'),
    getLearnCardBundlePassword: colorizeName('getLearnCardBundlePassword'),
    copy: colorizeName('copy'),
    exportLearnCardBundle: colorizeName('exportLearnCardBundle'),
    importLearnCardBundle: colorizeName('importLearnCardBundle'),
    createLearnCardBundle: colorizeName('createLearnCardBundle'),
    readLearnCardBundle: colorizeName('readLearnCardBundle'),
    restoreLearnCardFromBundle: colorizeName('restoreLearnCardFromBundle'),
};

const colorizeReplInput = (input: string): string => {
    return [...replGlobals]
        .sort((a, b) => b.length - a.length)
        .reduce((output, name) => {
            const colorizedName = g[name as keyof typeof g];

            if (!colorizedName) return output;

            return output.replace(new RegExp(`\\b${name}\\b`, 'g'), colorizedName);
        }, input);
};

const copyFunction = (text: string | object | number) => {
    if (typeof text === 'object') {
        text = JSON.stringify(text);
    }
    if (typeof text === 'number') {
        text = text.toString();
    }
    try {
        clipboard.writeSync(text);
        console.log('Copied to clipboard!');
    } catch (error) {
        console.error(
            'Failed to copy to clipboard:',
            error instanceof Error ? error.message : 'Unknown error'
        );
    }
};

const getLearnCardBundlePassword = async (prompt = 'Bundle password: '): Promise<string> => {
    process.stdout.write(prompt);

    const mutedOutput = new Writable({
        write(_chunk, _encoding, callback) {
            callback();
        },
    });
    const rl = createInterface({ input: process.stdin, output: mutedOutput, terminal: true });

    try {
        return await rl.question('');
    } finally {
        rl.close();
        process.stdout.write('\n');
    }
};

const globalAssignmentPattern = /^(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*([\s\S]*?);?\s*$/;

const parseGlobalAssignment = (
    source: string
): { name: string; initializer: string } | undefined => {
    const match = source.match(globalAssignmentPattern);

    if (!match) return;

    const name = match[1];
    const initializer = match[2];

    if (!name || !initializer) return;

    return { name, initializer };
};

const getCurrentToken = (line: string): string => {
    return line.match(/(?:[A-Za-z_$][\w$]*\.)*[A-Za-z_$][\w$]*\.?$/)?.[0] ?? '';
};

const getCompletionBase = (token: string): string | undefined => {
    const lastDotIndex = token.lastIndexOf('.');

    if (lastDotIndex === -1) return;

    return token.slice(0, lastDotIndex);
};

const getCompletionPrefix = (token: string): string => {
    const lastDotIndex = token.lastIndexOf('.');

    if (lastDotIndex === -1) return token;

    return token.slice(lastDotIndex + 1);
};

const getOwnPropertyNames = (value: unknown): string[] => {
    if (value === null || value === undefined) return [];

    const names = new Set<string>();

    let current: unknown = Object(value);

    while (current && current !== Object.prototype) {
        for (const name of Object.getOwnPropertyNames(current)) names.add(name);

        current = Object.getPrototypeOf(current);
    }

    return [...names];
};

const completeBunReplInput = (line: string): ReplCompletion => {
    const token = getCurrentToken(line);

    if (!token) return [replCommands, ''];

    const base = getCompletionBase(token);
    const prefix = getCompletionPrefix(token);

    if (!base) {
        const completions = [...replCommands, ...replGlobals].filter(name =>
            name.startsWith(prefix)
        );

        return [completions.length ? completions : replGlobals, token];
    }

    try {
        const target = globalThis.eval(base) as unknown;
        const completions = getOwnPropertyNames(target)
            .filter(name => identifierPattern.test(name))
            .filter(name => name.startsWith(prefix))
            .map(name => `${base}.${name}`);

        return [completions, token];
    } catch {
        return [[], token];
    }
};

const evaluateBunReplInput = async (source: string): Promise<unknown> => {
    const trimmedSource = source.trim();
    const expressionSource = trimmedSource.replace(/;+\s*$/, '');
    const statements = trimmedSource
        .split(';')
        .map(statement => statement.trim())
        .filter(Boolean);

    try {
        return await globalThis.eval(`(async () => (${expressionSource}))()`);
    } catch {
        if (statements.length > 1) {
            const lastStatement = statements[statements.length - 1];

            if (lastStatement && !/^(?:const|let|var)\b/.test(lastStatement)) {
                const body = statements.slice(0, -1).join(';\n');
                const wrappedSource = `${body ? `${body};\n` : ''}return (${lastStatement});`;

                return await globalThis.eval(`(async () => { ${wrappedSource} })()`);
            }
        }

        const globalAssignment = parseGlobalAssignment(trimmedSource);

        if (globalAssignment) {
            const value = await globalThis.eval(
                `(async () => (${globalAssignment.initializer}))()`
            );
            (globalThis as Record<string, unknown>)[globalAssignment.name] = value;
            return value;
        }

        return await globalThis.eval(`(async () => { ${trimmedSource} })()`);
    }
};

const startReadlineRepl = async (colorize?: (input: string) => string): Promise<void> => {
    const rl = createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: colorize ? colorize('> ') : '> ',
        completer: completeBunReplInput,
    });

    rl.prompt();

    for await (const line of rl) {
        const source = line.trim();

        if (source === '.exit') break;

        if (!source) {
            rl.prompt();

            continue;
        }

        try {
            const result = await evaluateBunReplInput(source);

            process.stdout.write(
                `${inspect(result, { depth: 6, colors: process.stdout.isTTY })}\n`
            );
        } catch (error) {
            process.stdout.write(
                `${error instanceof Error ? error.stack ?? error.message : String(error)}\n`
            );
        }

        rl.prompt();
    }

    rl.close();
};

const startBunRepl = async (colorize: (input: string) => string): Promise<void> => {
    await startReadlineRepl(colorize);
};

const startCliRepl = async (colorize: (input: string) => string): Promise<void> => {
    if (!('Bun' in globalThis)) {
        const repl = await import('pretty-repl');

        repl.default.start();

        return;
    }

    await startBunRepl(colorize);
};

program
    .version(packageJson.version)
    .argument('[seed]')
    .action(async (_seed: string = generateRandomSeed()) => {
        console.clear();

        const envSeed = process.env.LEARNCARD_CLI_SEED ?? process.env.SEED;
        const seedInput = envSeed ?? _seed;
        const seed = seedInput.padStart(64, '0');

        console.log(
            gradient(['cyan', 'green'])(figlet.textSync('Learn Card', 'Big Money-ne' as any))
        );
        console.log('Welcome to the Learn Card CLI!\n');

        console.log(`Your seed is ${seed}\n`);

        if (envSeed) {
            console.log('Using seed from LEARNCARD_CLI_SEED / SEED.\n');
        }

        console.log('Creating wallet...');

        cliGlobals.seed = seed;
        cliGlobals.generateRandomSeed = generateRandomSeed;
        cliGlobals.emptyLearnCard = emptyLearnCard;
        cliGlobals.learnCardFromSeed = learnCardFromSeed;
        cliGlobals.initLearnCard = initLearnCard;

        const didkit = fs.readFile(
            require.resolve('@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm')
        );

        const _learnCard = await initLearnCard({
            seed,
            network: true,
            allowRemoteContexts: true,
            didkit,
        });

        const simpleSigningLc = await _learnCard.addPlugin(
            await getSimpleSigningPlugin(_learnCard as any, 'https://api.learncard.app/trpc')
        );

        cliGlobals.learnCard = await simpleSigningLc.addPlugin(getLerRsPlugin(simpleSigningLc));
        // Add LinkedClaims plugin so endorse/verify/store/getEndorsements are available in the CLI
        cliGlobals.learnCard = await cliGlobals.learnCard.addPlugin(
            getLinkedClaimsPlugin(cliGlobals.learnCard)
        );

        // Add OpenBadge v2 wrapper plugin for backwards-compatible OBv2 -> VC wrapping
        cliGlobals.learnCard = await cliGlobals.learnCard.addPlugin(
            openBadgeV2Plugin(cliGlobals.learnCard)
        );

        // Add Render Method plugin for attaching W3C renderMethod to VCs
        cliGlobals.learnCard = await cliGlobals.learnCard.addPlugin(
            getRenderMethodPlugin(cliGlobals.learnCard)
        );

        cliGlobals.types = types;
        cliGlobals.getTestCache = getTestCache;

        cliGlobals.copy = copyFunction;
        cliGlobals.getLearnCardBundlePassword = getLearnCardBundlePassword;
        cliGlobals.exportLearnCardBundle = createExportLearnCardBundleHelper(
            writeLearnCardBundle,
            cliGlobals.learnCard
        );

        cliGlobals.restoreLearnCardFromBundle = createRestoreLearnCardFromBundleHelper(
            restoreBundle,
            {
                network: true,
                allowRemoteContexts: true,
                didkit,
            }
        );
        cliGlobals.importLearnCardBundle = importLearnCardBundle;
        cliGlobals.createLearnCardBundle = createLearnCardBundle;
        cliGlobals.readLearnCardBundle = readLearnCardBundle;

        // delete 'Creating wallet...' message
        process.stdout.moveCursor?.(0, -1);
        process.stdout.clearLine?.(1);

        console.log('Wallet created!\n');

        console.log('┌───────────────────────────────────────────────────────────────┐');
        console.log('│                        Variables Available                    │');
        console.log('├────────────────────────────┬──────────────────────────────────┤');
        console.log('│      Variable              │             Description          │');
        console.log('├────────────────────────────┼──────────────────────────────────┤');
        console.log(`│                  ${g.learnCard} │ Learn Card Wallet                │`);
        console.log(`│              ${g.initLearnCard} │ Wallet Instantiation Function    │`);
        console.log(`│                       ${g.seed} │ Seed used to generate wallet     │`);
        console.log(`│         ${g.generateRandomSeed} │ Generates a random seed          │`);
        console.log(`│                      ${g.types} │ Helpful zod validators           │`);
        console.log(`│                       ${g.copy} │ Copy text to clipboard           │`);
        console.log(`│ ${g.getLearnCardBundlePassword} │ Prompt for bundle password      │`);
        console.log(`│      ${g.exportLearnCardBundle} │ Export wallet continuity ZIP     │`);
        console.log(`│      ${g.importLearnCardBundle} │ Import continuity ZIP            │`);
        console.log(`│ ${g.restoreLearnCardFromBundle} │ Restore original wallet from ZIP │`);
        console.log('└────────────────────────────┴──────────────────────────────────┘');

        console.log('');

        console.log(
            'For help/documentation regarding your wallet, please read the documentation at\n'
        );

        console.log('https://docs.learncard.com/sdks/learncard-core/construction\n');

        console.log("To get a feel for what's possible, try some of the following commands\n");

        console.log(
            '┌─────────────────────────┬───────────────────────────────────────────────────────────────────────────────────┐'
        );
        console.log(
            '│        Description      │                       Command                                                     │'
        );
        console.log(
            '├─────────────────────────┼───────────────────────────────────────────────────────────────────────────────────┤'
        );
        console.log(
            `│           View your did │ ${g.learnCard}.id.did();                                                               │`
        );
        console.log(
            `│ Generate an unsigned VC │ ${g.learnCard}.invoke.getTestVc();                                                     │`
        );
        console.log(
            `│       Issue a signed VC │ await ${g.learnCard}.invoke.issueCredential(uvc);                                      │`
        );
        console.log(
            `│      Verify a signed VC │ await ${g.learnCard}.invoke.verifyCredential(vc);                                      │`
        );
        console.log(
            `│       Issue a signed VP │ await ${g.learnCard}.invoke.issuePresentation(vc);                                     │`
        );
        console.log(
            `│      Verify a signed VP │ await ${g.learnCard}.invoke.verifyPresentation(vp);                                    │`
        );
        console.log(
            `│  Prompt bundle password │ const password = await ${g.getLearnCardBundlePassword}();                         │`
        );
        console.log(
            `│       Export wallet ZIP │ await ${g.exportLearnCardBundle}(${g.learnCard}, { out: './export.zip', password }); │`
        );
        console.log(
            `│ Restore original wallet │ await ${g.restoreLearnCardFromBundle}('./export.zip', { password });                │`
        );
        console.log(
            '└─────────────────────────┴───────────────────────────────────────────────────────────────────────────────────┘'
        );

        console.log('');

        await startCliRepl(colorizeReplInput);
    })
    .parse(process.argv);
