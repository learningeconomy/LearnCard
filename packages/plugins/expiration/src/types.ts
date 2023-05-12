import { Plugin } from '@learncard/core';
import { VerifyExtension } from '@learncard/vc-plugin';

export type ExpirationPlugin = Plugin<'Expiration', any, VerifyExtension>;
