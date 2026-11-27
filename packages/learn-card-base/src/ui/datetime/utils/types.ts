/** Ionic 8.7.2 `DatetimeParts` (datetime-interface.d.ts). */
export type DatetimeParts = {
    month: number;
    day: number | null;
    year: number;
    dayOfWeek?: number | null;
    hour?: number;
    minute?: number;
    ampm?: 'am' | 'pm';
    isAdjacentDay?: boolean;
};

export type DatetimeHourCycle = 'h11' | 'h12' | 'h23' | 'h24';

export type DatetimePresentation =
    'date-time' | 'time-date' | 'date' | 'time' | 'month' | 'year' | 'month-year';

export type PickerValue = string | number;

export type PickerColumnItem = {
    text: string;
    value: PickerValue;
    disabled?: boolean;
};

export type DatetimeChangeEventDetail = {
    value?: string | string[] | null;
};

export type DatetimeChangeEvent = { detail: DatetimeChangeEventDetail };
