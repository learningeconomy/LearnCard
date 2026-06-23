export type TimeOfDay = 'morning' | 'afternoon' | 'evening';

/**
 * Returns a stable time-of-day id (not a display string) so callers can map it
 * to a localized greeting. Keeping this id-based avoids baking English copy into
 * a helper and sidesteps the "never compare against a translated string" trap.
 */
export const getTimeOfDay = (now: Date = new Date()): TimeOfDay => {
    const hour = now.getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    return 'evening';
};

/** First name, or '' when there's no name — callers supply a localized fallback. */
export const getFirstName = (name: string): string => {
    const trimmed = name.trim();
    if (!trimmed) return '';
    return trimmed.split(/\s+/)[0];
};
