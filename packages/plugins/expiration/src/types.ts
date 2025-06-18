import type { Plugin } from '@learncard/core';
import type { VerifyExtension } from '@learncard/vc-plugin';

export type ExpirationPlugin = Plugin<'Expiration', any, VerifyExtension>;
