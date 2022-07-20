import { Command } from './Command';
import { Tally } from './commands/Tally';
import { IssueCredential } from './commands/IssueCredential';
import { AddCredential, AddCredentialModal } from './commands/AddCredential';

export const Commands: Command[] = [Tally, IssueCredential, AddCredential];
export const Modals: object[] = [AddCredentialModal];
