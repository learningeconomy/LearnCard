import { beforeEach, describe, expect, it, vi } from 'vitest';

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
});
