import { Plugin } from 'types/wallet';
import { VerifyExtension } from '../vc';

export type ExpirationPlugin = Plugin<'Expiration', any, VerifyExtension>;
