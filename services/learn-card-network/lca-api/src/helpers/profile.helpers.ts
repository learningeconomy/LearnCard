export const transformProfileId = (rawInput: string): string =>
    rawInput.toLowerCase().replace(':', '%3A');
