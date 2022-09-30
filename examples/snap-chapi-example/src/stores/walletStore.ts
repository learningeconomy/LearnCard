import { LearnCard } from '@learncard/core';
import { atom } from 'nanostores';
import { persistentAtom } from '@nanostores/persistent';

export const _wallet = atom<LearnCard | null>(null);

/**
 * Storing seed in localStorage for demo.
 *
 * DO NOT DO THIS ON A REAL SITE. THIS IS INSECURE!!
 */
export const _seed = persistentAtom<string>('seed', '');
