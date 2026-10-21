import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge, validators } from 'tailwind-merge';

const mergeClasses = extendTailwindMerge({
    extend: {
        classGroups: {
            'space-x': [
                {
                    'space-x-v3': [
                        'px',
                        validators.isNumber,
                        validators.isArbitraryValue,
                        validators.isArbitraryVariable,
                    ],
                },
            ],
            'space-y': [
                {
                    'space-y-v3': [
                        'px',
                        validators.isNumber,
                        validators.isArbitraryValue,
                        validators.isArbitraryVariable,
                    ],
                },
            ],
            'space-x-reverse': ['space-x-v3-reverse'],
            'space-y-reverse': ['space-y-v3-reverse'],
        },
    },
});

/** Merge consumer overrides, including the utilities preserving legacy sibling spacing. */
export const cn = (...inputs: ClassValue[]): string => mergeClasses(clsx(inputs));
