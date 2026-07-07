import fs from 'fs/promises';
import dns from 'node:dns';
import { emitKeypressEvents } from 'node:readline';
import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';

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

type ReplCompletion = [string[], string];
type ReplKey = {
    ctrl?: boolean;
    name?: string;
    sequence?: string;
};

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

    const [, name, initializer] = match;

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
    try {
        return await globalThis.eval(`(async () => (${source}))()`);
    } catch {
        const globalAssignment = parseGlobalAssignment(source);

        if (globalAssignment) {
            const value = await globalThis.eval(
                `(async () => (${globalAssignment.initializer}))()`
            );
            (globalThis as Record<string, unknown>)[globalAssignment.name] = value;
            return value;
        }

        return await globalThis.eval(`(async () => { ${source} })()`);
    }
};

const getSharedCompletion = (matches: string[]): string | undefined => {
    if (!matches.length) return;

    return matches.reduce((prefix, match) => {
        let index = 0;

        while (index < prefix.length && prefix[index] === match[index]) index += 1;

        return prefix.slice(0, index);
    });
};

const renderBunReplLine = (
    prompt: string,
    line: string,
    cursor: number,
    colorize: (input: string) => string
): void => {
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(prompt + colorize(line));

    const trailingLength = line.length - cursor;

    if (trailingLength > 0) process.stdout.write(`\x1b[${trailingLength}D`);
};

const startReadlineRepl = async (colorize?: (input: string) => string): Promise<void> => {
    const rl = createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: '> ',
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

            if (result !== undefined) console.dir(result, { depth: 6 });
        } catch (error) {
            console.error(error);
        }

        if (colorize) process.stdout.write(colorize(''));

        rl.prompt();
    }

    rl.close();
};

const startBunRepl = async (colorize: (input: string) => string): Promise<void> => {
    if (!process.stdin.isTTY || !process.stdin.setRawMode) {
        await startReadlineRepl(colorize);

        return;
    }

    const prompt = '> ';
    const history: string[] = [];

    let line = '';
    let cursor = 0;
    let historyIndex = 0;
    let draft = '';
    let pending = Promise.resolve();

    const resetHistory = (): void => {
        historyIndex = history.length;
        draft = '';
    };

    const setLine = (nextLine: string): void => {
        line = nextLine;
        cursor = line.length;
        renderBunReplLine(prompt, line, cursor, colorize);
    };

    const insertText = (text: string): void => {
        line = line.slice(0, cursor) + text + line.slice(cursor);
        cursor += text.length;
        renderBunReplLine(prompt, line, cursor, colorize);
    };

    const applyCompletion = (): void => {
        const linePrefix = line.slice(0, cursor);
        const [matches, token] = completeBunReplInput(linePrefix);
        const completion = matches.length === 1 ? matches[0] : getSharedCompletion(matches);

        if (completion && completion !== token) {
            line = line.slice(0, cursor - token.length) + completion + line.slice(cursor);
            cursor += completion.length - token.length;
            renderBunReplLine(prompt, line, cursor, colorize);

            return;
        }

        if (matches.length > 1) {
            process.stdout.write(`\n${matches.join('    ')}\n`);
            renderBunReplLine(prompt, line, cursor, colorize);
        }
    };

    const evaluateLine = async (): Promise<boolean> => {
        process.stdout.write('\n');

        const source = line.trim();

        if (source === '.exit') return false;

        if (source) {
            history.push(source);

            try {
                const result = await evaluateBunReplInput(source);

                if (result !== undefined) console.dir(result, { depth: 6 });
            } catch (error) {
                console.error(error);
            }
        }

        line = '';
        cursor = 0;
        resetHistory();
        renderBunReplLine(prompt, line, cursor, colorize);

        return true;
    };

    const handleKey = async (input: string, key: ReplKey): Promise<boolean> => {
        if (key.ctrl && key.name === 'c') return false;

        if (key.name === 'return' || key.name === 'enter') return await evaluateLine();

        if (key.ctrl && key.name === 'd' && !line) return false;

        if (key.name === 'tab') {
            applyCompletion();

            return true;
        }

        if (key.name === 'backspace') {
            if (cursor === 0) return true;

            line = line.slice(0, cursor - 1) + line.slice(cursor);
            cursor -= 1;
            renderBunReplLine(prompt, line, cursor, colorize);

            return true;
        }

        if (key.name === 'delete') {
            if (cursor >= line.length) return true;

            line = line.slice(0, cursor) + line.slice(cursor + 1);
            renderBunReplLine(prompt, line, cursor, colorize);

            return true;
        }

        if (key.name === 'left') {
            if (cursor > 0) cursor -= 1;

            renderBunReplLine(prompt, line, cursor, colorize);

            return true;
        }

        if (key.name === 'right') {
            if (cursor < line.length) cursor += 1;

            renderBunReplLine(prompt, line, cursor, colorize);

            return true;
        }

        if (key.name === 'home') {
            cursor = 0;
            renderBunReplLine(prompt, line, cursor, colorize);

            return true;
        }

        if (key.name === 'end') {
            cursor = line.length;
            renderBunReplLine(prompt, line, cursor, colorize);

            return true;
        }

        if (key.name === 'up') {
            if (historyIndex === history.length) draft = line;
            if (historyIndex > 0) historyIndex -= 1;

            setLine(history[historyIndex] ?? draft);

            return true;
        }

        if (key.name === 'down') {
            if (historyIndex < history.length) historyIndex += 1;

            setLine(historyIndex === history.length ? draft : history[historyIndex] ?? '');

            return true;
        }

        if (input && !key.ctrl && input >= ' ') {
            insertText(input);
            resetHistory();
        }

        return true;
    };

    await new Promise<void>(resolve => {
        const onKeypress = (input: string, key: ReplKey): void => {
            pending = pending.then(async () => {
                const keepRunning = await handleKey(input, key);

                if (!keepRunning) cleanup();
            });
        };

        const cleanup = (): void => {
            process.stdin.off('keypress', onKeypress);
            process.stdin.setRawMode?.(false);
            process.stdin.pause();
            process.stdout.write('\n');
            resolve();
        };

        emitKeypressEvents(process.stdin);
        process.stdin.setRawMode?.(true);
        process.stdin.resume();

        console.log('Bun dev REPL ready. Tab completes globals/properties. Type .exit to quit.');
        renderBunReplLine(prompt, line, cursor, colorize);
        process.stdin.on('keypress', onKeypress);
    });
};

const startCliRepl = async (colorize: (input: string) => string): Promise<void> => {
    if (!('Bun' in globalThis)) {
        const repl = await import('pretty-repl');

        repl.default.start({ colorize });

        return;
    }

    await startBunRepl(colorize);
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
            await getSimpleSigningPlugin(_learnCard, 'https://api.learncard.app/trpc')
        );

        globalThis.learnCard = await simpleSigningLc.addPlugin(getLerRsPlugin(simpleSigningLc));
        // Add LinkedClaims plugin so endorse/verify/store/getEndorsements are available in the CLI
        globalThis.learnCard = await globalThis.learnCard.addPlugin(
            getLinkedClaimsPlugin(globalThis.learnCard)
        );

        // Add OpenBadge v2 wrapper plugin for backwards-compatible OBv2 -> VC wrapping
        globalThis.learnCard = await globalThis.learnCard.addPlugin(
            openBadgeV2Plugin(globalThis.learnCard)
        );

        // Add Render Method plugin for attaching W3C renderMethod to VCs
        globalThis.learnCard = await globalThis.learnCard.addPlugin(
            getRenderMethodPlugin(globalThis.learnCard)
        );

        globalThis.types = types;
        globalThis.getTestCache = getTestCache;

        globalThis.copy = copyFunction;
        globalThis.getLearnCardBundlePassword = getLearnCardBundlePassword;
        globalThis.exportLearnCardBundle = createExportLearnCardBundleHelper(
            writeLearnCardBundle,
            globalThis.learnCard
        );

        globalThis.restoreLearnCardFromBundle = createRestoreLearnCardFromBundleHelper(
            restoreBundle,
            {
                network: true,
                allowRemoteContexts: true,
                didkit,
            }
        );
        globalThis.importLearnCardBundle = importLearnCardBundle;
        globalThis.createLearnCardBundle = createLearnCardBundle;
        globalThis.readLearnCardBundle = readLearnCardBundle;

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
