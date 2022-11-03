import { atom } from 'nanostores';
import { persistentAtom } from '@nanostores/persistent';

import type { LearnCardFromKey } from '@learncard/core';

export const _wallet = atom<LearnCardFromKey | null>(null);

/**
 * Storing seed in localStorage for demo.
 *
 * DO NOT DO THIS ON A REAL SITE. THIS IS INSECURE!!
 */
export const _seed = persistentAtom<string>('seed', '');
