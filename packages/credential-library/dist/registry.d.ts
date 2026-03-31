import type { UnsignedVC, VC } from '@learncard/types';
import type { CredentialFixture, FixtureFilter } from './types';
export declare const registerFixture: <T extends UnsignedVC | VC>(fixture: CredentialFixture<T>) => void;
export declare const registerFixtures: (batch: CredentialFixture[]) => void;
export declare const resetRegistry: () => void;
export declare const getAllFixtures: () => readonly CredentialFixture[];
export declare const getFixture: (id: string) => CredentialFixture;
export declare const findFixture: (id: string) => CredentialFixture | undefined;
export declare const getFixtures: (filter: FixtureFilter) => CredentialFixture[];
export declare const getUnsignedFixtures: (filter?: FixtureFilter) => CredentialFixture<UnsignedVC>[];
export declare const getSignedFixtures: (filter?: FixtureFilter) => CredentialFixture<VC>[];
export declare const getValidFixtures: (filter?: FixtureFilter) => CredentialFixture[];
export declare const getInvalidFixtures: (filter?: FixtureFilter) => CredentialFixture[];
export interface RegistryStats {
    total: number;
    bySpec: Record<string, number>;
    byProfile: Record<string, number>;
    byValidity: Record<string, number>;
    signed: number;
    unsigned: number;
}
export declare const getStats: () => RegistryStats;
//# sourceMappingURL=registry.d.ts.map