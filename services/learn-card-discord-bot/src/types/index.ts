import type { LearnCardFromSeed } from '@learncard/init';
import type { Client } from 'discord.js';
import type { Cache } from 'src/cache/index';

export type Context = {
    wallet: LearnCardFromSeed['returnValue'];
    client: Client;
    cache: Cache;
}

export type CredentialTemplate = {
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

export type DIDAssocation = {
    _id?: string;
    type: DIDAssociationType;
    source: string;
    did: string;
}

export type DIDChallenge = {
    _id?: string;
    type: DIDAssociationType;
    source: string;
    challenge: string;
}

export type IssuerConfig = {
    _id: string;
    seed: string;
    guildId: string;
    issuer: Issuer;
}

export type Issuer = {
    type?: string;
    id: string;
    name?: string;
    url?: string;
    image?: string;
}

export type PendingVc = {
    _id?: string;
    guildId: string;
    issuerConfigId: string;
    subjectId: string;
    credentialTemplateId: string;
}

export type SendCredentialResponse = {
    data: SendCredentialData;
    error?: object | undefined;
}

export type SendCredentialData = {
    credentialTemplate?: CredentialTemplate;
    claimCredentialLink?: string;
    subjectUserName?: string;
    subjectDID?: string;
    pendingVc?: PendingVc | undefined;
}
