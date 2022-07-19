import { AccountId } from 'caip';
export function normalizeAccountId(accountId) {
    if (typeof accountId === 'string' && accountId.includes('@')) {
        const [address, chainId] = accountId.split('@');
        if (!address || !chainId) {
            throw new Error(`Invalid accountId provided`);
        }
        return new AccountId({ address, chainId });
    }
    return new AccountId(accountId);
}
export function toLegacyAccountId(accountId) {
    if (!accountId.includes('@')) {
        const _accountSplit = accountId.split(':');
        const address = _accountSplit.pop();
        const chainId = _accountSplit.join(':');
        return `${address}@${chainId}`;
    }
    return accountId;
}
//# sourceMappingURL=accountid-utils.js.map