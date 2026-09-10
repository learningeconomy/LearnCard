import fs from 'node:fs/promises';
import path from 'node:path';

/** Preserve files a developer may already have customized. */
export const writeSnippet = async (filename: string, source: string): Promise<void> => {
    try {
        await fs.writeFile(path.join(process.cwd(), filename), source, { flag: 'wx' });
        console.log(`Wrote ./${filename}`);
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
        console.log(`Kept existing ./${filename}`);
    }
};
