import { AssetName, AssetNameParams } from "./assetName";
import { ChainId, ChainIdParams } from "./chain";
import { IdentifierSpec } from "./types";
export interface AssetTypeParams {
    chainId: string | ChainIdParams;
    assetName: string | AssetNameParams;
}
export declare class AssetType {
    static spec: IdentifierSpec;
    static parse(id: string): AssetTypeParams;
    static format(params: AssetTypeParams): string;
    chainId: ChainId;
    assetName: AssetName;
    constructor(params: AssetTypeParams | string);
    toString(): string;
    toJSON(): AssetTypeParams;
}
//# sourceMappingURL=assetType.d.ts.map