export const isAddress = (maybeAddress: string) => {
    return maybeAddress.startsWith('0x') && maybeAddress.length === 42;
}
