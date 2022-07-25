import { Command } from './Command';
import { IssueCredential } from './commands/IssueCredential';
import { AddCredential, AddCredentialModal } from './commands/AddCredential';
import { ListCredentials } from './commands/ListCredentials';

export const Commands: Command[] = [IssueCredential, AddCredential, ListCredentials];
export const Modals: object[] = [AddCredentialModal];
