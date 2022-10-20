import { UnlockedWallet } from '@learncard/types';
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
}

export enum DIDAssociationType {
    DiscordAccount,
}

export interface DIDAssocation {
    _id: string;
    type: DIDAssociationType;
    source: string;
    did: string;
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
