import { UnlockedWallet } from '@learncard/types';
import { Client } from 'discord.js';
import { Cache } from 'src/cache/index';

export interface Context {
    wallet: UnlockedWallet;
    client: Client;
    cache: Cache;
}

export interface CredentialTemplate {
    name: string;
    description?: string;
    criteria?: string;
    image?: string;
}
