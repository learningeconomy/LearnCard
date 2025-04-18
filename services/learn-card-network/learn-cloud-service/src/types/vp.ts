import type { UnsignedVP } from '@learncard/types';

export type DidAuthVP = {
    iss: string;
    vp: UnsignedVP;
    nonce?: string;
};
