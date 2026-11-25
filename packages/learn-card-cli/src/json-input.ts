import fs from 'node:fs/promises';

import { UsageError } from './errors';

/** Where `--args` / `--data` read `@file` and `-` from; injected in tests. */
export interface JsonInputIo {
    readStdin: () => Promise<string>;
    readFile: (file: string) => Promise<string>;
}

const readStdin = async (): Promise<string> => {
    if (process.stdin.isTTY)
        throw new UsageError(
            'Reading JSON from stdin ("-"), but stdin is a terminal.',
            "Pipe the JSON in (e.g. `echo '[...]' | npx @learncard/cli ...`) or pass it inline or as @file."
        );
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
    return Buffer.concat(chunks).toString('utf8');
};

export const defaultJsonInputIo: JsonInputIo = {
    readStdin,
    readFile: file => fs.readFile(file, 'utf8'),
};

/**
 * Parse a JSON flag value: inline JSON, `@path` (read that file), or `-` (read stdin).
 * Any problem — unreadable file, invalid JSON — is a `UsageError` naming the flag.
 */
export const readJsonInput = async (
    value: string,
    flag: string,
    io: JsonInputIo = defaultJsonInputIo
): Promise<unknown> => {
    let text: string;
    let source: string;
    if (value === '-') {
        text = await io.readStdin();
        source = 'stdin';
    } else if (value.startsWith('@')) {
        const file = value.slice(1);
        if (!file) throw new UsageError(`${flag} @ needs a file path, e.g. ${flag} @args.json.`);
        try {
            text = await io.readFile(file);
        } catch (error) {
            const code = (error as NodeJS.ErrnoException).code;
            throw new UsageError(
                code === 'ENOENT'
                    ? `${flag}: file not found: ${file}`
                    : `${flag}: cannot read ${file}: ${(error as Error).message}`
            );
        }
        source = file;
    } else {
        text = value;
        source = flag;
    }
    try {
        return JSON.parse(text);
    } catch (error) {
        throw new UsageError(
            `Invalid JSON in ${source === flag ? flag : `${flag} (${source})`}: ${(error as Error).message}`,
            `Pass valid JSON inline (quote it for your shell), as ${flag} @file.json, or ${flag} - to read stdin.`
        );
    }
};
