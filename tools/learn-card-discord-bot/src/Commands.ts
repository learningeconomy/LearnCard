import { Command } from './Command';
import { Tally } from './commands/Tally';
import { IssueCredential } from './commands/IssueCredential';

export const Commands: Command[] = [Tally, IssueCredential];
