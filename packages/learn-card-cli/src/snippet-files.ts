import fs from 'node:fs/promises';
import path from 'node:path';
import { out } from './out';

/** Preserve files a developer may already have customized. Returns whether this run wrote it. */
export const writeSnippet = async (filename: string, source: string): Promise<boolean> => {
    try {
        await fs.writeFile(path.join(process.cwd(), filename), source, { flag: 'wx' });
        out.log(`Wrote ./${filename}`);
        return true;
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
        out.log(`Kept existing ./${filename}`);
        return false;
    }
};
