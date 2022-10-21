import { Command } from './Command';
import { IssueCredential } from './commands/IssueCredential';
import { AddCredential, AddCredentialModal, CredentialTypeSelection } from './commands/AddCredential';
import { ListCredentials } from './commands/ListCredentials';
import {
    SendCredential,
    SendCredentialSelection,
    PickIssuerSelection,
} from './commands/SendCredential';
import { RegisterDID } from './commands/RegisterDID';
import { ConfigureIssuer, ConfigureIssuerModal } from './commands/ConfigureIssuer';

export const Commands: Command[] = [
    IssueCredential,
    AddCredential,
    ListCredentials,
    SendCredential,
    RegisterDID,
    ConfigureIssuer,
];
export const Modals: object[] = [AddCredentialModal, ConfigureIssuerModal];
export const MessageComponents: object[] = [SendCredentialSelection, PickIssuerSelection, CredentialTypeSelection];
