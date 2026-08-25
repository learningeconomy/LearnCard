import type { UnsignedVC, VC } from '@learncard/types';

import {
    isCredentialFixture,
    type CredentialFixture,
    type FixtureFilter,
    type FixtureKind,
    type LibraryFixture,
    type SdJwtVcFixture,
} from './types';
import { ALL_FIXTURES } from './fixtures';

// ---------------------------------------------------------------------------
// Internal store — fixtures register themselves here via `registerFixture`
// ---------------------------------------------------------------------------

const fixtures: LibraryFixture[] = [];

const fixtureIndex = new Map<string, LibraryFixture>();

// ---------------------------------------------------------------------------
// Lazy initialization — populate the registry on first query so consumers
// don't need to rely on import side effects (keeps `sideEffects: false`
// truthful). The ALL_FIXTURES import above is pure data — no mutation
// happens until ensureInitialized() is called.
// ---------------------------------------------------------------------------

let initialized = false;

const ensureInitialized = (): void => {
    if (initialized) return;

    initialized = true;

    for (const fixture of ALL_FIXTURES) {
        if (!fixtureIndex.has(fixture.id)) {
            fixtures.push(fixture);
            fixtureIndex.set(fixture.id, fixture);
        }
    }
};

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export const registerFixture = (fixture: LibraryFixture): void => {
    if (fixtureIndex.has(fixture.id)) {
        throw new Error(
            `Duplicate fixture ID: "${fixture.id}". Each fixture must have a unique id.`
        );
    }

    fixtures.push(fixture);
    fixtureIndex.set(fixture.id, fixture);
};

export const registerFixtures = (batch: LibraryFixture[]): void => {
    for (const fixture of batch) {
        registerFixture(fixture);
    }
};

// ---------------------------------------------------------------------------
// Reset — for test isolation (vitest watch, jest --watch)
// ---------------------------------------------------------------------------

export const resetRegistry = (): void => {
    fixtures.length = 0;
    fixtureIndex.clear();
    initialized = false;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const toArray = <T>(value: T | T[]): T[] => (Array.isArray(value) ? value : [value]);

const fixtureKind = (fixture: LibraryFixture): FixtureKind => fixture.kind ?? 'w3c-vc';

const matchesFilter = (fixture: LibraryFixture, filter: FixtureFilter): boolean => {
    if (filter.kind !== undefined) {
        const kinds = toArray(filter.kind);

        if (!kinds.includes(fixtureKind(fixture))) return false;
    }

    if (filter.spec !== undefined) {
        const specs = toArray(filter.spec);

        if (!specs.includes(fixture.spec)) return false;
    }

    if (filter.profile !== undefined) {
        const profiles = toArray(filter.profile);

        if (!profiles.includes(fixture.profile)) return false;
    }

    if (filter.features !== undefined) {
        for (const feat of filter.features) {
            if (!fixture.features.includes(feat)) return false;
        }
    }

    if (filter.featuresAny !== undefined) {
        const hasAny = filter.featuresAny.some(feat => fixture.features.includes(feat));

        if (!hasAny) return false;
    }

    if (filter.signed !== undefined) {
        if (fixture.signed !== filter.signed) return false;
    }

    if (filter.validity !== undefined) {
        const validities = toArray(filter.validity);

        if (!validities.includes(fixture.validity)) return false;
    }

    if (filter.source !== undefined) {
        const sources = toArray(filter.source);

        if (!sources.includes(fixture.source)) return false;
    }

    if (filter.tags !== undefined) {
        for (const tag of filter.tags) {
            if (!fixture.tags?.includes(tag)) return false;
        }
    }

    return true;
};

// ---------------------------------------------------------------------------
// Public query API
// ---------------------------------------------------------------------------

export const getAllFixtures = (): readonly LibraryFixture[] => {
    ensureInitialized();

    return fixtures;
};

export function getFixture(id: `sd-jwt-vc/${string}`): SdJwtVcFixture;
export function getFixture(id: string): CredentialFixture;
export function getFixture(id: string): LibraryFixture {
    ensureInitialized();

    const fixture = fixtureIndex.get(id);

    if (!fixture) {
        throw new Error(
            `Fixture "${id}" not found. Available: ${[...fixtureIndex.keys()].join(', ')}`
        );
    }

    return fixture;
}

export function findFixture(id: `sd-jwt-vc/${string}`): SdJwtVcFixture | undefined;
export function findFixture(id: string): CredentialFixture | undefined;
export function findFixture(id: string): LibraryFixture | undefined {
    ensureInitialized();

    return fixtureIndex.get(id);
}

export const getFixtures = (filter: FixtureFilter): LibraryFixture[] => {
    ensureInitialized();

    return fixtures.filter(f => matchesFilter(f, filter));
};

export const getUnsignedFixtures = (filter?: FixtureFilter): CredentialFixture<UnsignedVC>[] =>
    getFixtures({ ...filter, signed: false }).filter(
        isCredentialFixture
    ) as CredentialFixture<UnsignedVC>[];

export const getSignedFixtures = (filter?: FixtureFilter): CredentialFixture<VC>[] =>
    getFixtures({ ...filter, signed: true }).filter(isCredentialFixture) as CredentialFixture<VC>[];

export const getValidFixtures = (filter?: FixtureFilter): LibraryFixture[] =>
    getFixtures({ ...filter, validity: 'valid' });

export const getInvalidFixtures = (filter?: FixtureFilter): LibraryFixture[] =>
    getFixtures({ ...filter, validity: ['invalid', 'tampered'] });

// ---------------------------------------------------------------------------
// Stats — useful for debugging / README generation
// ---------------------------------------------------------------------------

export interface RegistryStats {
    total: number;
    bySpec: Record<string, number>;
    byProfile: Record<string, number>;
    byValidity: Record<string, number>;
    signed: number;
    unsigned: number;
}

export const getStats = (): RegistryStats => {
    ensureInitialized();

    const stats: RegistryStats = {
        total: fixtures.length,
        bySpec: {},
        byProfile: {},
        byValidity: {},
        signed: 0,
        unsigned: 0,
    };

    for (const f of fixtures) {
        stats.bySpec[f.spec] = (stats.bySpec[f.spec] ?? 0) + 1;
        stats.byProfile[f.profile] = (stats.byProfile[f.profile] ?? 0) + 1;
        stats.byValidity[f.validity] = (stats.byValidity[f.validity] ?? 0) + 1;

        if (f.signed) {
            stats.signed++;
        } else {
            stats.unsigned++;
        }
    }

    return stats;
};
