/* Port of @ionic/core 8.7.2 components/datetime/utils/comparison.js. */
import type { DatetimeParts } from './types';
import { printWarning } from './warn';

type DayParts = Pick<DatetimeParts, 'month' | 'day' | 'year'>;

export const isSameDay = (baseParts: DayParts, compareParts: DayParts): boolean =>
    baseParts.month === compareParts.month &&
    baseParts.day === compareParts.day &&
    baseParts.year === compareParts.year;

// `day` may be null on the compared side; like Ionic, `<` / `>` then compare against 0.
export const isBefore = (baseParts: DayParts, compareParts: DayParts): boolean =>
    !!(
        baseParts.year < compareParts.year ||
        (baseParts.year === compareParts.year && baseParts.month < compareParts.month) ||
        (baseParts.year === compareParts.year &&
            baseParts.month === compareParts.month &&
            baseParts.day !== null &&
            baseParts.day < (compareParts.day as number))
    );

export const isAfter = (baseParts: DayParts, compareParts: DayParts): boolean =>
    !!(
        baseParts.year > compareParts.year ||
        (baseParts.year === compareParts.year && baseParts.month > compareParts.month) ||
        (baseParts.year === compareParts.year &&
            baseParts.month === compareParts.month &&
            baseParts.day !== null &&
            baseParts.day > (compareParts.day as number))
    );

export const warnIfValueOutOfBounds = (
    value: DatetimeParts | DatetimeParts[],
    min: DatetimeParts | undefined,
    max: DatetimeParts | undefined
): void => {
    const valueArray = Array.isArray(value) ? value : [value];
    for (const val of valueArray) {
        if ((min !== undefined && isBefore(val, min)) || (max !== undefined && isAfter(val, max))) {
            printWarning(
                'The value provided to AppDatetime is out of bounds.\n\n' +
                    `Min: ${JSON.stringify(min)}\n` +
                    `Max: ${JSON.stringify(max)}\n` +
                    `Value: ${JSON.stringify(value)}`
            );
            break;
        }
    }
};
