import { UnlockedWallet, VC } from '@learncard/types';
import { Client } from 'discord.js';
import { Cache } from 'src/cache/index';

export interface Context {
    wallet: UnlockedWallet;
    client: Client;
    cache: Cache;
}

export interface CredentialTemplate {
    _id: string;
    name: string;
    description?: string;
    criteria?: string;
    image?: string;
    type?: string;
}

export enum DIDAssociationType {
    DiscordAccount,
}

export interface DIDAssocation {
    _id?: string;
    type: DIDAssociationType;
    source: string;
    did: string;
}

export interface DIDChallenge {
    _id?: string;
    type: DIDAssociationType;
    source: string;
    challenge: string;
}

export interface IssuerConfig {
    _id: string;
    seed: string;
    guildId: string;
    issuer: Issuer;
}

export interface Issuer {
    type?: string;
    id: string;
    name?: string;
    url?: string;
    image?: string;
}

export interface PendingVc {
    _id?: string;
    guildId: string;
    issuerConfigId: string;
    subjectId: string;
    credentialTemplateId: string;
}

export interface SendCredentialResponse {
    data: SendCredentialData;
    error?: object | undefined;
}

export interface SendCredentialData {
    credentialTemplate?: CredentialTemplate
    claimCredentialLink?: string;
    subjectUserName?: string;
    subjectDID?: string;
    pendingVc?: PendingVc | undefined;
}