import type { Obv3Alignment, Options, Skill, SkillsProvider } from '../types';

type CfDocument = {
    identifier?: string;
    uri?: string;
    title?: string;
    creator?: string;
    adoptionStatus?: string;
    description?: string;
    CFPackageURI?: { uri?: string };
};

type CfItem = {
    identifier?: string;
    uri?: string;
    fullStatement?: string;
    notes?: string;
    humanCodingScheme?: string;
    listEnumeration?: string;
    CFItemType?: string;
};

type CfAssociation = {
    associationType?: string;
    originNodeURI?: { identifier?: string };
    destinationNodeURI?: { identifier?: string };
};

type CfPackage = {
    CFDocument?: CfDocument;
    CFItems?: CfItem[];
    CFAssociations?: CfAssociation[];
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const toStatus = (value?: string): string => {
    const normalized = value?.toLowerCase();
    if (normalized === 'deprecated' || normalized === 'archived' || normalized === 'inactive') {
        return 'archived';
    }
    return 'active';
};

const toType = (value?: string): string => {
    const normalized = value?.toLowerCase();
    if (!normalized) return 'skill';
    if (
        normalized.includes('cluster') ||
        normalized.includes('strand') ||
        normalized.includes('component') ||
        normalized.includes('grade level')
    ) {
        return 'container';
    }
    return 'skill';
};

const normalizeFrameworkRef = (frameworkRef: string): string | null => {
    const trimmed = frameworkRef.trim();
    if (!trimmed) return null;

    if (UUID_PATTERN.test(trimmed)) return trimmed;

    const noTrailingSlash = trimmed.replace(/\/+$/, '');

    const cfDocumentsMatch = noTrailingSlash.match(/\/CFDocuments\/([^/?#]+)/i);
    if (cfDocumentsMatch?.[1]) return decodeURIComponent(cfDocumentsMatch[1]);

    const uriPackageMatch = noTrailingSlash.match(/\/uri\/p([^/?#]+)/i);
    if (uriPackageMatch?.[1]) return decodeURIComponent(uriPackageMatch[1]);

    const uriObjectMatch = noTrailingSlash.match(/\/uri\/([^/?#]+)/i);
    if (uriObjectMatch?.[1]) return decodeURIComponent(uriObjectMatch[1]);

    return null;
};

export function createOpenSaltProvider(options?: Options): SkillsProvider {
    const baseUrl = (options?.baseUrl || 'https://opensalt.net').replace(/\/$/, '');
    const apiKey = options?.apiKey;

    const buildHeaders = (): HeadersInit => {
        if (!apiKey) return {};
        return {
            Authorization: `Bearer ${apiKey}`,
            'x-api-key': apiKey,
        };
    };

    const fetchJson = async <T>(url: string): Promise<T | null> => {
        const response = await fetch(url, { headers: buildHeaders() });
        if (!response.ok) return null;
        return (await response.json()) as T;
    };

    const getPackageForFramework = async (frameworkRef: string): Promise<CfPackage | null> => {
        const frameworkId = normalizeFrameworkRef(frameworkRef);
        if (!frameworkId) return null;

        const packageByCasePath = await fetchJson<CfPackage>(
            `${baseUrl}/ims/case/v1p0/CFPackages/${encodeURIComponent(frameworkId)}`
        );
        if (packageByCasePath?.CFDocument) return packageByCasePath;

        const packageByUriPath = await fetchJson<CfPackage>(
            `${baseUrl}/uri/p${encodeURIComponent(frameworkId)}.json`
        );
        if (packageByUriPath?.CFDocument) return packageByUriPath;

        return null;
    };

    const getFrameworkById: SkillsProvider['getFrameworkById'] = async frameworkRef => {
        const packageData = await getPackageForFramework(frameworkRef);
        const document = packageData?.CFDocument;
        if (!document?.identifier || !document?.title) return null;

        return {
            id: document.identifier,
            name: document.title,
            description: document.description,
            sourceURI: document.uri ?? document.CFPackageURI?.uri,
            status: toStatus(document.adoptionStatus),
        };
    };

    const getSkillsForFramework: SkillsProvider['getSkillsForFramework'] = async frameworkRef => {
        const packageData = await getPackageForFramework(frameworkRef);
        const frameworkId = packageData?.CFDocument?.identifier;
        if (!frameworkId) return [];

        const parentByChildId = new Map<string, string>();
        for (const association of packageData.CFAssociations || []) {
            if (association.associationType !== 'isChildOf') continue;
            const childId = association.originNodeURI?.identifier;
            const parentId = association.destinationNodeURI?.identifier;
            if (!childId || !parentId) continue;
            if (parentId === frameworkId) continue;
            parentByChildId.set(childId, parentId);
        }

        const skills: Skill[] = [];
        for (const item of packageData.CFItems || []) {
            if (!item.identifier || !item.fullStatement) continue;
            skills.push({
                id: item.identifier,
                statement: item.fullStatement,
                description: item.notes,
                code: item.humanCodingScheme ?? item.listEnumeration,
                type: toType(item.CFItemType),
                status: 'active',
                parentId: parentByChildId.get(item.identifier) ?? null,
            });
        }

        return skills;
    };

    const getSkillsByIds: SkillsProvider['getSkillsByIds'] = async (frameworkId, skillIds) => {
        if (skillIds.length === 0) return [];
        const allSkills = await getSkillsForFramework(frameworkId);
        const wantedIds = new Set(skillIds);
        return allSkills.filter(skill => wantedIds.has(skill.id));
    };

    const buildObv3Alignments: SkillsProvider['buildObv3Alignments'] = async (
        frameworkRef,
        skillIds,
        _domain
    ) => {
        const packageData = await getPackageForFramework(frameworkRef);
        const document = packageData?.CFDocument;
        if (!document?.identifier || !document?.title) return [];

        const itemsById = new Map<string, CfItem>();
        for (const item of packageData?.CFItems || []) {
            if (!item.identifier) continue;
            itemsById.set(item.identifier, item);
        }

        const alignments: Obv3Alignment[] = [];

        for (const id of skillIds) {
            const item = itemsById.get(id);
            if (!item?.fullStatement) continue;

            alignments.push({
                type: ['Alignment'],
                targetCode: item.humanCodingScheme ?? item.listEnumeration ?? item.identifier,
                targetName: item.fullStatement,
                targetDescription: item.notes,
                targetFramework: document.title,
                targetType: 'CFItem',
                targetUrl: item.uri || `${baseUrl}/ims/case/v1p0/CFItems/${encodeURIComponent(id)}`,
            });
        }

        return alignments;
    };

    return {
        id: 'opensalt',
        getFrameworkById,
        getSkillsForFramework,
        getSkillsByIds,
        buildObv3Alignments,
    };
}
