export const getTimeOfDayGreeting = (now: Date = new Date()): string => {
    const hour = now.getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    return 'Good evening';
};

export const getFirstName = (name: string): string => {
    const trimmed = name.trim();
    if (!trimmed) return 'there';
    return trimmed.split(/\s+/)[0];
};
