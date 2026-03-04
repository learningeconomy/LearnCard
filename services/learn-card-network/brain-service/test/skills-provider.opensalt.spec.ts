import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getSkillsProvider, getSkillsProviderForFramework } from '@services/skills-provider';
import { createOpenSaltProvider } from '@services/skills-provider/providers/opensalt';

const FRAMEWORK_ID = 'c6085394-d7cb-11e8-824f-0242ac160002';
const ROOT_SKILL_ID = '11111111-d7cc-11e8-824f-0242ac160002';
const CHILD_SKILL_ID = '22222222-d7cc-11e8-824f-0242ac160002';

const makePackageResponse = () => ({
    CFDocument: {
        identifier: FRAMEWORK_ID,
        title: 'PCG Compendium for ELA',
        uri: `https://opensalt.net/uri/${FRAMEWORK_ID}`,
        adoptionStatus: 'Draft',
        description: 'framework description',
    },
    CFItems: [
        {
            identifier: ROOT_SKILL_ID,
            fullStatement: 'Root Skill',
            humanCodingScheme: 'A.1',
            CFItemType: 'Cluster',
        },
        {
            identifier: CHILD_SKILL_ID,
            fullStatement: 'Child Skill',
            humanCodingScheme: 'A.1.1',
            CFItemType: 'Standard',
            uri: `https://opensalt.net/uri/${CHILD_SKILL_ID}`,
        },
    ],
    CFAssociations: [
        {
            associationType: 'isChildOf',
            originNodeURI: { identifier: CHILD_SKILL_ID },
            destinationNodeURI: { identifier: ROOT_SKILL_ID },
        },
        {
            associationType: 'isChildOf',
            originNodeURI: { identifier: ROOT_SKILL_ID },
            destinationNodeURI: { identifier: FRAMEWORK_ID },
        },
    ],
});

describe('OpenSALT skills provider', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('maps framework + skills from CASE package', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: true,
            json: async () => makePackageResponse(),
        } as Response);

        const provider = createOpenSaltProvider({ baseUrl: 'https://opensalt.net' });

        const framework = await provider.getFrameworkById(FRAMEWORK_ID);
        expect(framework).toEqual({
            id: FRAMEWORK_ID,
            name: 'PCG Compendium for ELA',
            description: 'framework description',
            sourceURI: `https://opensalt.net/uri/${FRAMEWORK_ID}`,
            status: 'active',
        });

        const skills = await provider.getSkillsForFramework(FRAMEWORK_ID);
        expect(skills).toHaveLength(2);

        const root = skills.find(skill => skill.id === ROOT_SKILL_ID);
        const child = skills.find(skill => skill.id === CHILD_SKILL_ID);

        expect(root?.type).toBe('container');
        expect(root?.parentId).toBeNull();
        expect(child?.type).toBe('skill');
        expect(child?.parentId).toBe(ROOT_SKILL_ID);
    });

    it('accepts CASE/OpenSALT URL refs and builds CFItem alignments', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: true,
            json: async () => makePackageResponse(),
        } as Response);

        const provider = createOpenSaltProvider({ baseUrl: 'https://opensalt.net' });
        const frameworkRef = `https://opensalt.net/ims/case/v1p0/CFDocuments/${FRAMEWORK_ID}`;

        const framework = await provider.getFrameworkById(frameworkRef);
        expect(framework?.id).toBe(FRAMEWORK_ID);

        const alignments = await provider.buildObv3Alignments(
            frameworkRef,
            [CHILD_SKILL_ID],
            'localhost%3A4000'
        );

        expect(alignments).toHaveLength(1);
        expect(alignments[0]).toEqual({
            type: ['Alignment'],
            targetCode: 'A.1.1',
            targetName: 'Child Skill',
            targetDescription: undefined,
            targetFramework: 'PCG Compendium for ELA',
            targetType: 'CFItem',
            targetUrl: `https://opensalt.net/uri/${CHILD_SKILL_ID}`,
        });
    });

    it('falls back to /uri/p{docId}.json when CASE package path fails', async () => {
        const fetchMock = vi.spyOn(globalThis, 'fetch');
        fetchMock.mockResolvedValueOnce({ ok: false } as Response).mockResolvedValueOnce({
            ok: true,
            json: async () => makePackageResponse(),
        } as Response);

        const provider = createOpenSaltProvider({ baseUrl: 'https://opensalt.net' });
        const framework = await provider.getFrameworkById(FRAMEWORK_ID);

        expect(framework?.id).toBe(FRAMEWORK_ID);
        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(fetchMock.mock.calls[1]?.[0]).toBe(`https://opensalt.net/uri/p${FRAMEWORK_ID}.json`);
    });

    it('auto-detects opensalt provider from framework link', () => {
        const provider = getSkillsProviderForFramework(
            `https://opensalt.net/ims/case/v1p0/CFDocuments/${FRAMEWORK_ID}`
        );

        expect(provider.id).toBe('opensalt');
    });

    it('keeps dummy provider for non-opensalt refs in tests', () => {
        getSkillsProvider({ providerId: 'dummy' });

        const provider = getSkillsProviderForFramework('fw-test-001');
        expect(provider.id).toBe('dummy');
    });
});
