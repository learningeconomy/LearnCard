export const transformProfileId = (rawInput: string): string =>
    rawInput.toLowerCase().replaceAll(':', '%3A');
