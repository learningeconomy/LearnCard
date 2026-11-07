import type { Command } from 'commander';

import { registerCallCommand } from './call';
import { registerApiCommand } from './api';
import type { RunCommand } from './doctor';

/**
 * Register the escape-hatch commands that reach beyond the curated CLI surface:
 * `call` (any `learnCard.invoke.*` SDK method) and `api` (any LearnCard Network REST route).
 * Both gate writes behind `--write` and support `--dry-run`. `run` is the shared
 * command runner (`runCommand` in program.ts) so both print the standard JSON envelope.
 */
export const registerBridgeCommands = (program: Command, run: RunCommand): void => {
    registerCallCommand(program, run);
    registerApiCommand(program, run);
};
