import { atom } from 'nanostores';
import { persistentAtom } from '@nanostores/persistent';

import type { LearnCardFromSeed } from '@learncard/init';

export const _wallet = atom<LearnCardFromSeed['returnValue'] | null>(null);

/**
 * Storing seed in localStorage for demo.
 *
 * DO NOT DO THIS ON A REAL SITE. THIS IS INSECURE!!
 */
export const _seed = persistentAtom<string>('seed', '');
