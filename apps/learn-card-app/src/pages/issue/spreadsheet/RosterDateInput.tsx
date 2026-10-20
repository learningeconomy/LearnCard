import React from 'react';
import { useLocale } from '../../../i18n';
import * as m from '../../../paraglide/messages.js';

/** Only explicit ISO calendar dates or timestamps with a zone are safe to interpret. */
export const parseRosterDate = (value: string): Date | undefined => {
    if (!/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))?$/.test(value))
        return;
    const calendar = new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
    if (
        !Number.isFinite(calendar.getTime()) ||
        calendar.toISOString().slice(0, 10) !== value.slice(0, 10)
    )
        return;
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date : undefined;
};

/** Keep untouched timestamps byte-for-byte; an explicit calendar edit keeps the UTC time. */
export const changeRosterDate = (value: string, day: string): string => {
    if (!day) return '';
    const previous = parseRosterDate(value);
    if (previous?.toISOString().slice(0, 10) === day) return value;
    if (!previous || value.length === 10) return `${day}T00:00:00.000Z`;
    return `${day}T${previous.toISOString().slice(11)}`;
};

export const RosterDateInput: React.FC<{
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    className: string;
    'aria-label': string;
}> = ({ value, onChange, ...inputProps }) => {
    const locale = useLocale();
    const date = parseRosterDate(value);
    const timestamp = Boolean(date && value.length > 10);
    const hasTime = timestamp && date!.toISOString().slice(11, 23) !== '00:00:00.000';
    const display = date
        ? new Intl.DateTimeFormat(locale, {
              dateStyle: 'medium',
              ...(hasTime ? { timeStyle: 'short' as const } : {}),
              timeZone: 'UTC',
          }).format(date)
        : undefined;
    return (
        <div className="min-w-0 space-y-v3-1.5">
            <input
                {...inputProps}
                type="date"
                value={date?.toISOString().slice(0, 10) ?? ''}
                aria-invalid={Boolean(value && !date)}
                onChange={event => {
                    const next = changeRosterDate(value, event.target.value);
                    if (next !== value) onChange(next);
                }}
            />
            {display && <p className="text-xs text-grayscale-700">{display}</p>}
            {timestamp && (
                <p className="text-xs leading-relaxed text-grayscale-500">
                    {m['issueFlow.sheet.design.dateUtc']()}
                </p>
            )}
            {value && !date && (
                <p className="break-words text-xs text-red-700">
                    {m['issueFlow.sheet.design.originalDate']({ value })}
                </p>
            )}
        </div>
    );
};
