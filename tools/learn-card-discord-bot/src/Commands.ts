import { Command } from './Command';
import { IssueCredential } from './commands/IssueCredential';
import { AddCredential, AddCredentialModal } from './commands/AddCredential';
import { ListCredentials } from './commands/ListCredentials';
import { SendCredential, SendCredentialSelection } from './commands/SendCredential';
import { RegisterDID } from './commands/RegisterDID';

export const Commands: Command[] = [
    IssueCredential,
    AddCredential,
    ListCredentials,
    SendCredential,
    RegisterDID,
];
export const Modals: object[] = [AddCredentialModal];
export const MessageComponents: object[] = [SendCredentialSelection];
