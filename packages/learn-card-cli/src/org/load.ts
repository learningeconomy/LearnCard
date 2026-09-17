import fs from 'node:fs/promises';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';
import { z } from 'zod';
import { OrgSpecValidator, type OrgSpec } from './schema';

const SUPPORTED_EXTENSIONS = ['.yaml', '.yml', '.json'];

const formatIssues = (error: z.ZodError): string =>
    error.issues
        .map(
            issue =>
                `${issue.path.length ? issue.path.map(String).join('.') : '(root)'}: ${issue.message}`
        )
        .join('\n');

export const loadOrgSpec = async (file: string): Promise<OrgSpec> => {
    const absolute = path.resolve(file);
    const ext = path.extname(absolute).toLowerCase();
    if (!SUPPORTED_EXTENSIONS.includes(ext))
        throw new Error(`Unsupported file type "${ext || file}". Use .yaml, .yml, or .json.`);

    let text: string;
    try {
        text = await fs.readFile(absolute, 'utf8');
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT')
            throw new Error(`Could not find ${file}.`, { cause: error });
        throw error;
    }

    let parsed: unknown;
    try {
        parsed = ext === '.json' ? JSON.parse(text) : parseYaml(text);
    } catch (error) {
        throw new Error(
            `Could not parse ${file}: ${error instanceof Error ? error.message : String(error)}`,
            { cause: error }
        );
    }

    const result = OrgSpecValidator.safeParse(parsed);
    if (!result.success)
        throw new Error(`Invalid org spec in ${file}:\n${formatIssues(result.error)}`);
    return result.data;
};
