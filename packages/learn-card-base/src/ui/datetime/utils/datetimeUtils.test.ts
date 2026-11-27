import { describe, expect, it } from 'vitest';

import {
    getDaysOfMonth,
    getDaysOfWeek,
    getMonthColumnData,
    getTimeColumnsData,
    getYearColumnData,
} from './data';
import {
    addTimePadding,
    formatValue,
    getFormattedHour,
    getLocalizedTime,
    getMonthAndYear,
} from './format';
import {
    calculateHourFromAMPM,
    convert12HourTo24Hour,
    convertDataToISO,
    getNextMonth,
    getPreviousMonth,
    validateParts,
} from './manipulation';
import { parseDate, parseMaxParts, parseMinParts } from './parse';
import { isDayDisabled, isNextMonthDisabled, isPrevMonthDisabled } from './state';
import type { DatetimeParts } from './types';

const parts = (p: Partial<DatetimeParts>): DatetimeParts =>
    ({ month: 1, day: 1, year: 2026, ...p }) as DatetimeParts;

describe('datetime utils (ion-datetime 8.7.2 ports)', () => {
    it('parses ISO values and serializes them like ion-datetime (date, or date-time with seconds)', () => {
        expect(convertDataToISO(parseDate('2026-12-05') as DatetimeParts)).toBe('2026-12-05');
        expect(convertDataToISO(parseDate('2026-12-05T14:45') as DatetimeParts)).toBe(
            '2026-12-05T14:45:00'
        );
        expect(convertDataToISO(parts({ year: 2027, month: 3, day: 9, hour: 7, minute: 5 }))).toBe(
            '2027-03-09T07:05:00'
        );
        expect(parseDate(undefined)).toBeUndefined();
    });

    it('keeps only the date and time of a value with a time zone, like ion-datetime', () => {
        expect(formatValue('2026-12-05T14:45:00.000Z')).toBe('2026-12-05T14:45:00.000Z');
        const p = parseDate('2026-12-05T14:45:00Z') as DatetimeParts;
        expect([p.year, p.month, p.day, p.hour, p.minute]).toEqual([2026, 12, 5, 14, 45]);
    });

    it('parses min and max, filling missing parts toward the widest range', () => {
        const today = parts({ year: 2026, month: 11, day: 26 });
        expect(parseMinParts('2026-03', today)).toMatchObject({ year: 2026, month: 3, day: 1 });
        expect(parseMaxParts('2027', today)).toMatchObject({ year: 2027, month: 12, day: 31 });
    });

    it('disables days and month navigation outside min / max', () => {
        const min = parts({ year: 2026, month: 12, day: 3 });
        const max = parts({ year: 2026, month: 12, day: 28 });
        expect(isDayDisabled(parts({ year: 2026, month: 12, day: 2 }), min, max)).toBe(true);
        expect(isDayDisabled(parts({ year: 2026, month: 12, day: 3 }), min, max)).toBe(false);
        expect(isDayDisabled(parts({ year: 2026, month: 12, day: 29 }), min, max)).toBe(true);
        expect(isPrevMonthDisabled(parts({ year: 2026, month: 12, day: 5 }), min, max)).toBe(true);
        expect(isNextMonthDisabled(parts({ year: 2026, month: 12, day: 5 }), max)).toBe(true);
    });

    it('steps months across year boundaries and clamps the day', () => {
        expect(getNextMonth(parts({ year: 2026, month: 12, day: 31 }))).toMatchObject({
            year: 2027,
            month: 1,
        });
        expect(getPreviousMonth(parts({ year: 2026, month: 1, day: 31 }))).toMatchObject({
            year: 2025,
            month: 12,
        });
        expect(getPreviousMonth(parts({ year: 2026, month: 3, day: 31 }))).toMatchObject({
            month: 2,
            day: 28,
        });
    });

    it('converts between 12- and 24-hour clocks', () => {
        expect(convert12HourTo24Hour(12, 'am')).toBe(0);
        expect(convert12HourTo24Hour(12, 'pm')).toBe(12);
        expect(convert12HourTo24Hour(7, 'pm')).toBe(19);
        expect(calculateHourFromAMPM(parts({ hour: 14, ampm: 'pm' }), 'am')).toBe(2);
        expect(getFormattedHour(0, 'h12')).toBe('12');
        expect(getFormattedHour(7, 'h23')).toBe('07');
        expect(addTimePadding(5)).toBe('05');
    });

    it('clamps parts into min / max', () => {
        const min = parts({ year: 2026, month: 12, day: 3 });
        const out = validateParts(parts({ year: 2026, month: 12, day: 1 }), min);
        expect(out).toMatchObject({ year: 2026, month: 12, day: 3 });
    });

    it('lays out a month with leading blanks for the first day of the week', () => {
        // December 2026 starts on a Tuesday.
        const days = getDaysOfMonth(12, 2026, 0);
        expect(days.slice(0, 3).map(d => d.day)).toEqual([null, null, 1]);
        expect(days.filter(d => d.day !== null)).toHaveLength(31);
        expect(getDaysOfMonth(12, 2026, 1)[1].day).toBe(1);
        expect(getDaysOfWeek('en-US', 'md', 0)).toEqual(['S', 'M', 'T', 'W', 'T', 'F', 'S']);
        expect(getDaysOfWeek('en-US', 'ios', 1)[0]).toBe('Mon');
    });

    it('builds wheel columns with out-of-range entries removed', () => {
        const ref = parts({ year: 2026, month: 12, day: 5 });
        const min = parts({ year: 2026, month: 3, day: 1 });
        const months = getMonthColumnData('en-US', ref, min, undefined);
        expect(months[0]).toMatchObject({ text: 'March', value: 3 });
        const years = getYearColumnData(
            'en-US',
            ref,
            min,
            parts({ year: 2028, month: 12, day: 31 })
        );
        expect(years.map(y => y.value)).toEqual([2026, 2027, 2028]);
        const time = getTimeColumnsData(
            'en-US',
            parts({ ...ref, hour: 14, minute: 45, ampm: 'pm' }),
            'h12'
        );
        expect(time.hoursData.map(h => h.text).slice(0, 2)).toEqual(['12', '1']);
        expect(time.minutesData).toHaveLength(60);
        expect(time.dayPeriodData.map(p => p.value)).toEqual(['am', 'pm']);
    });

    it('formats labels with Intl like ion-datetime', () => {
        expect(getMonthAndYear('en-US', parts({ year: 2026, month: 12, day: 5 }))).toBe(
            'December 2026'
        );
        expect(
            getLocalizedTime(
                'en-US',
                parts({ year: 2026, month: 12, day: 5, hour: 14, minute: 45 }),
                'h12'
            )
        ).toBe('2:45 PM');
    });
});
