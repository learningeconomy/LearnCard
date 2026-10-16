import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { isAbsolute, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { expect } from './expect';
import { runLearnCardCli } from './learncard-cli';
import type { CliTranscript } from './learncard-cli';
import { REPO_ROOT, STACK } from './constants';
import type { VerificationContext } from './types';

/** Everything an ad-hoc verification script can use. Scripts need no imports of their own. */
export interface ScriptContext extends VerificationContext {
    expect: typeof expect;
    stack: typeof STACK;
    /** Run the checkout's `learncard` CLI against the owned network in a named workdir. */
    cli: (args: string[], workdir?: string) => Promise<CliTranscript>;
    /** Alias of `inspect`: read-only Neo4j/Mongo corroboration. */
    db: VerificationContext['inspect'];
}

/** `export default (async v => { ... }) satisfies VerificationScript;` */
export type VerificationScript = (v: ScriptContext) => Promise<unknown>;

/** Turn `-e` code into a module whose body sees the script context as `v`. */
export const writeInlineScript = async (directory: string, code: string): Promise<string> => {
    const file = join(directory, 'inline-script.ts');
    await writeFile(file, `export default async (v: any) => {\n${code}\n};\n`, { mode: 0o600 });
    return file;
};

/**
 * `bun run --cwd apps/learn-card-app lc …` loses the caller's directory, so a relative path is
 * tried against the caller (when known), the app directory, then the repo root.
 */
export const resolveCallerPath = (file: string): string => {
    if (isAbsolute(file)) return file;
    const bases = [process.env.INIT_CWD, process.cwd(), REPO_ROOT].filter(Boolean) as string[];
    return (
        bases.map(base => resolve(base, file)).find(candidate => existsSync(candidate)) ??
        resolve(bases[0]!, file)
    );
};

export const loadScript = async (file: string): Promise<VerificationScript> => {
    const path = resolveCallerPath(file);
    const module = (await import(pathToFileURL(path).href)) as { default?: unknown };
    if (typeof module.default !== 'function') {
        throw new Error(`${path} must default-export an async function (v) => { ... }`);
    }
    return module.default as VerificationScript;
};

export const createScriptContext = (
    context: VerificationContext,
    directory: string
): ScriptContext => {
    let cliCalls = 0;
    return {
        ...context,
        expect,
        stack: STACK,
        cli: (args, workdir = 'default') =>
            runLearnCardCli(
                args,
                join(directory, 'cli', workdir.replace(/[^\w-]/g, '-')),
                join(directory, `cli-${String(++cliCalls).padStart(2, '0')}.json`)
            ),
        db: context.inspect,
    };
};
