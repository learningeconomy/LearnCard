import { ChainId, ChainIdParams } from "./chain";
import { IdentifierSpec } from "./types";
export interface AccountIdSplitParams extends ChainIdParams {
    address: string;
}
export interface AccountIdParams {
    chainId: string | ChainIdParams;
    address: string;
}
export declare class AccountId {
    static spec: IdentifierSpec;
    static parse(id: string): AccountIdParams;
    static format(params: AccountIdParams): string;
    chainId: ChainId;
    address: string;
    constructor(params: AccountIdParams | string);
    toString(): string;
    toJSON(): AccountIdParams;
}
//# sourceMappingURL=account.d.ts.map