export const getGreetingAndEmoji = (hour: number) => {
    if (hour >= 6 && hour < 12) {
        // Morning (6:00 AM to 11:59 AM)
        return {
            greeting: 'Good morning',
            emoji: '🌞',
        };
    } else if (hour >= 12 && hour < 18) {
        // Afternoon (12:00 PM to 5:59 PM)
        return {
            greeting: 'Good afternoon',
            emoji: '☀️',
        };
    } else if (hour >= 18 && hour < 24) {
        // Evening (6:00 PM to 11:59 PM)
        return {
            greeting: 'Good evening',
            emoji: '🌙',
        };
    } else {
        // Early morning (12:00 AM to 5:59 AM) - use a neutral greeting
        return {
            greeting: 'Hello',
            emoji: '🌌',
        };
    }
};
