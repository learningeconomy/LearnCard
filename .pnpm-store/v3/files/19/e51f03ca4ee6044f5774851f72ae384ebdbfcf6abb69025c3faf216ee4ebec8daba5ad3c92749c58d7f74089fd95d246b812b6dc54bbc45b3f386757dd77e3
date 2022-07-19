import { AssetName, AssetNameParams } from "./assetName";
import { ChainId, ChainIdParams } from "./chain";
import { IdentifierSpec } from "./types";
export interface AssetIdParams {
    chainId: string | ChainIdParams;
    assetName: string | AssetNameParams;
    tokenId: string;
}
export declare class AssetId {
    static spec: IdentifierSpec;
    static parse(id: string): AssetIdParams;
    static format(params: AssetIdParams): string;
    chainId: ChainId;
    assetName: AssetName;
    tokenId: string;
    constructor(params: AssetIdParams | string);
    toString(): string;
    toJSON(): AssetIdParams;
}
//# sourceMappingURL=assetId.d.ts.map