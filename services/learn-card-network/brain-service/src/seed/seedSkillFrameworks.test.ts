import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_SKILL_FRAMEWORKS } from './skill-frameworks.fixtures';

const mockFs = vi.hoisted(() => ({
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
}));

const mockQueryRun = vi.hoisted(() => vi.fn());
const mockDriverClose = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockUpsertSkillEmbeddings = vi.hoisted(() => vi.fn());

vi.mock('fs', () => mockFs);
vi.mock('neogma', () => ({
    Neogma: vi.fn().mockImplementation(() => ({
        queryRunner: {
            run: mockQueryRun,
        },
        driver: {
            close: mockDriverClose,
        },
    })),
}));
vi.mock('@helpers/skill-embedding.helpers', () => ({
    upsertSkillEmbeddings: mockUpsertSkillEmbeddings,
}));

describe('seedSkillFrameworks staging env resolution', () => {
    beforeEach(() => {
        vi.resetModules();
        mockFs.existsSync.mockReset();
        mockFs.readFileSync.mockReset();
        mockQueryRun.mockReset();
        mockDriverClose.mockClear();
        mockUpsertSkillEmbeddings.mockReset();
        delete process.env.NEO4J_URI;
        delete process.env.NEO4J_USERNAME;
        delete process.env.NEO4J_PASSWORD;
        delete process.env.SKILL_FRAMEWORKS_DEBUG;
    });

    it('prefers the service .env.staging values over package env files', async () => {
        mockFs.existsSync.mockImplementation(
            (filePath: string) =>
                filePath.includes('brain-client/.env') ||
                filePath.includes('cloud-client/.env') ||
                filePath.endsWith('/services/learn-card-network/brain-service/.env.staging')
        );

        mockFs.readFileSync.mockImplementation((filePath: string) => {
            if (filePath.includes('brain-client/.env')) {
                return [
                    'NEO4J_URI=neo4j+s://ab9edde2.databases.neo4j.io',
                    'NEO4J_USERNAME=neo4j',
                    'NEO4J_PASSWORD=package-password',
                ].join('\n');
            }

            if (filePath.includes('cloud-client/.env')) {
                return [
                    'NEO4J_URI=neo4j+s://ab9edde2.databases.neo4j.io',
                    'NEO4J_USERNAME=neo4j',
                    'NEO4J_PASSWORD=package-password',
                ].join('\n');
            }

            if (filePath.endsWith('/services/learn-card-network/brain-service/.env.staging')) {
                return [
                    'NEO4J_URI="7f5bdf65.databases.neo4j.io"',
                    'NEO4J_USERNAME="neo4j"',
                    'NEO4J_PASSWORD="service-password"',
                ].join('\n');
            }

            return '';
        });
        mockQueryRun.mockResolvedValue({ records: [] });

        const { resolveSkillFrameworkNeo4jConnection } = await import('./seedSkillFrameworks');
        const result = await resolveSkillFrameworkNeo4jConnection('staging');

        expect(result.candidate.url).toBe('bolt+s://7f5bdf65.databases.neo4j.io');
        expect(result.candidate.username).toBe('neo4j');
        expect(result.candidate.password).toBe('service-password');
    });

    it('includes staging-specific guidance when the connection fails', async () => {
        mockFs.existsSync.mockImplementation(
            (filePath: string) =>
                filePath.includes('brain-client/.env') ||
                filePath.includes('cloud-client/.env') ||
                filePath.endsWith('/services/learn-card-network/brain-service/.env.staging')
        );

        mockFs.readFileSync.mockImplementation((filePath: string) => {
            if (filePath.includes('brain-client/.env')) {
                return [
                    'NEO4J_URI=neo4j+s://ab9edde2.databases.neo4j.io',
                    'NEO4J_USERNAME=neo4j',
                    'NEO4J_PASSWORD=package-password',
                ].join('\n');
            }

            if (filePath.includes('cloud-client/.env')) {
                return [
                    'NEO4J_URI=neo4j+s://ab9edde2.databases.neo4j.io',
                    'NEO4J_USERNAME=neo4j',
                    'NEO4J_PASSWORD=package-password',
                ].join('\n');
            }

            if (filePath.endsWith('/services/learn-card-network/brain-service/.env.staging')) {
                return [
                    'NEO4J_URI="7f5bdf65.databases.neo4j.io"',
                    'NEO4J_USERNAME="neo4j"',
                    'NEO4J_PASSWORD="service-password"',
                ].join('\n');
            }

            return '';
        });
        mockQueryRun.mockRejectedValue(new Error('timed out'));

        const { resolveSkillFrameworkNeo4jConnection } = await import('./seedSkillFrameworks');

        await expect(resolveSkillFrameworkNeo4jConnection('staging')).rejects.toThrow(
            /\.env\.staging|pnpm env:pull --env=staging|staging Neo4j instance/i
        );
    });

    it('falls back to shell/package env wording when .env.staging is missing', async () => {
        mockFs.existsSync.mockImplementation((filePath: string) => {
            if (filePath.endsWith('/services/learn-card-network/brain-service/.env.staging')) {
                return false;
            }

            return filePath.includes('brain-client/.env') || filePath.includes('cloud-client/.env');
        });

        mockFs.readFileSync.mockImplementation((filePath: string) => {
            if (filePath.includes('brain-client/.env')) {
                return [
                    'NEO4J_URI=neo4j+s://ab9edde2.databases.neo4j.io',
                    'NEO4J_USERNAME=neo4j',
                    'NEO4J_PASSWORD=package-password',
                ].join('\n');
            }

            if (filePath.includes('cloud-client/.env')) {
                return [
                    'NEO4J_URI=neo4j+s://ab9edde2.databases.neo4j.io',
                    'NEO4J_USERNAME=neo4j',
                    'NEO4J_PASSWORD=package-password',
                ].join('\n');
            }

            return '';
        });
        mockQueryRun.mockRejectedValue(new Error('timed out'));

        const { resolveSkillFrameworkNeo4jConnection, getStagingNeo4jSourceDescription } =
            await import('./seedSkillFrameworks');

        expect(getStagingNeo4jSourceDescription()).toBe(
            'your shell environment or package .env files'
        );

        await expect(resolveSkillFrameworkNeo4jConnection('staging')).rejects.toThrow(
            /your shell environment or package \.env files|pnpm env:pull --env=staging/i
        );
    });

    it('only links the canonical seeded skill frameworks when adding an admin', async () => {
        const seededIds = DEFAULT_SKILL_FRAMEWORKS.map(({ id }) => id);

        mockQueryRun.mockImplementation((query: string, params?: Record<string, unknown>) => {
            if (query.includes('WHERE f.id IN $frameworkIds')) {
                expect(params?.frameworkIds).toEqual(seededIds);

                return Promise.resolve({
                    records: [
                        {
                            get: (key: string) => {
                                if (key === 'frameworkIds') return seededIds;
                                if (key === 'count') return seededIds.length;
                                return undefined;
                            },
                        },
                    ],
                });
            }

            if (query.includes('MERGE (p)-[:MANAGES]->(f)')) {
                return Promise.resolve({
                    records: [
                        {
                            get: (key: string) => {
                                if (key === 'r') return true;
                                return undefined;
                            },
                        },
                    ],
                });
            }

            return Promise.resolve({ records: [] });
        });

        const { addSkillFrameworkAdmin } = await import('./seedSkillFrameworks');
        const result = await addSkillFrameworkAdmin(mockQueryRun, 'profile-123');

        expect(result).toBe(seededIds.length);
        expect(mockQueryRun.mock.calls[0]?.[0]).toContain('WHERE f.id IN $frameworkIds');
        expect(mockQueryRun.mock.calls[0]?.[1]).toEqual({ frameworkIds: seededIds });
        expect(
            mockQueryRun.mock.calls
                .filter(([query]) => String(query).includes('MERGE (p)-[:MANAGES]->(f)'))
                .map(([, params]) => params)
        ).toEqual(
            seededIds.map(frameworkId => ({
                profileId: 'profile-123',
                frameworkId,
            }))
        );
    });
});
