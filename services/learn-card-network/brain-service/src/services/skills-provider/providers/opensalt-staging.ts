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
    abbreviatedStatement?: string;
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

const toItemStatement = (item: CfItem): string | undefined => {
    const short = item.abbreviatedStatement?.trim();
    if (short) return short;
    return item.fullStatement?.trim();
};

const toItemDescription = (item: CfItem): string | undefined => {
    const notes = item.notes?.trim();
    if (notes) return notes;

    const full = item.fullStatement?.trim();
    const short = item.abbreviatedStatement?.trim();
    if (short && full && full !== short) return full;

    return undefined;
};

const normalizeFrameworkRef = (frameworkRef: string): string | null => {
    const trimmed = frameworkRef.trim();
    if (!trimmed) return null;

    if (UUID_PATTERN.test(trimmed)) return trimmed;

    const noTrailingSlash = trimmed.replace(/\/+$/, '');

    const cfDocumentsMatch = noTrailingSlash.match(/\/CFDocuments\/([^/?#]+)/i);
    if (cfDocumentsMatch?.[1]) return decodeURIComponent(cfDocumentsMatch[1]);

    const cftreeDocMatch = noTrailingSlash.match(/\/cftree\/doc\/([^/?#]+)/i);
    if (cftreeDocMatch?.[1]) return decodeURIComponent(cftreeDocMatch[1]);

    const cfpackageDocMatch = noTrailingSlash.match(/\/cfpackage\/doc\/([^/?#]+)/i);
    if (cfpackageDocMatch?.[1])
        return decodeURIComponent(cfpackageDocMatch[1].replace(/\.json$/i, ''));

    const uriPackageMatch = noTrailingSlash.match(/\/uri\/p([^/?#]+)/i);
    if (uriPackageMatch?.[1]) return decodeURIComponent(uriPackageMatch[1]);

    const uriObjectMatch = noTrailingSlash.match(/\/uri\/([^/?#]+)/i);
    if (uriObjectMatch?.[1]) return decodeURIComponent(uriObjectMatch[1]);

    return null;
};

export function createOpenSaltStagingProvider(options?: Options): SkillsProvider {
    const baseUrl = (options?.baseUrl || 'https://staging.opensalt.net').replace(/\/$/, '');
    const apiKey = options?.apiKey;

    const buildHeaders = (): HeadersInit => {
        const headers: HeadersInit = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        };
        if (apiKey && apiKey !== 'notARealKey') {
            headers.Authorization = `Bearer ${apiKey}`;
            headers['x-api-key'] = apiKey;
        }
        return headers;
    };

    const fetchJson = async <T>(url: string): Promise<T | null> => {
        try {
            const response = await fetch(url, { headers: buildHeaders() });
            if (!response.ok) {
                console.warn(
                    `[opensalt-staging] Fetch failed: ${url} - Status: ${response.status} ${response.statusText}`
                );
                return null;
            }
            return (await response.json()) as T;
        } catch (error) {
            console.error(`[opensalt-staging] Fetch error for ${url}:`, error);
            return null;
        }
    };

    const getPackageForFramework = async (frameworkRef: string): Promise<CfPackage | null> => {
        const frameworkId = normalizeFrameworkRef(frameworkRef);
        console.log(
            `[opensalt-staging] Looking up framework: ${frameworkRef} (extracted ID: ${frameworkId})`
        );
        if (!frameworkId) {
            console.warn(`[opensalt-staging] Could not extract framework ID from: ${frameworkRef}`);
            return null;
        }

        const caseUrl = `${baseUrl}/ims/case/v1p0/CFPackages/${encodeURIComponent(frameworkId)}`;
        console.log(`[opensalt-staging] Trying CASE API: ${caseUrl}`);
        const packageByCasePath = await fetchJson<CfPackage>(caseUrl);
        if (packageByCasePath?.CFDocument) {
            console.log('[opensalt-staging] Found framework via CASE API');
            return packageByCasePath;
        }

        const uriUrl = `${baseUrl}/uri/p${encodeURIComponent(frameworkId)}.json`;
        console.log(`[opensalt-staging] Trying URI path: ${uriUrl}`);
        const packageByUriPath = await fetchJson<CfPackage>(uriUrl);
        if (packageByUriPath?.CFDocument) {
            console.log('[opensalt-staging] Found framework via URI path');
            return packageByUriPath;
        }

        const docUrl = `${baseUrl}/cfpackage/doc/${encodeURIComponent(frameworkId)}.json`;
        console.log(`[opensalt-staging] Trying doc path: ${docUrl}`);
        const packageByDocPath = await fetchJson<CfPackage>(docUrl);
        if (packageByDocPath?.CFDocument) {
            console.log('[opensalt-staging] Found framework via doc path');
            return packageByDocPath;
        }

        console.error(
            `[opensalt-staging] Framework not found after trying all endpoints. Framework ID: ${frameworkId}`
        );
        return null;
    };

    const getFrameworkById: SkillsProvider['getFrameworkById'] = async frameworkRef => {
        const packageData = await getPackageForFramework(frameworkRef);
        const document = packageData?.CFDocument;
        if (!document?.identifier || !document?.title) return null;

        const isUrl = frameworkRef.startsWith('http://') || frameworkRef.startsWith('https://');
        const sourceURI = isUrl ? frameworkRef : document.uri ?? document.CFPackageURI?.uri;

        return {
            id: document.identifier,
            name: document.title,
            description: document.description,
            sourceURI,
            status: toStatus(document.adoptionStatus),
        };
    };

    const getSkillsForFramework: SkillsProvider['getSkillsForFramework'] = async frameworkRef => {
        console.log(`[opensalt-staging] Getting skills for framework: ${frameworkRef}`);
        const packageData = await getPackageForFramework(frameworkRef);
        const frameworkId = packageData?.CFDocument?.identifier;
        console.log(
            `[opensalt-staging] Framework ID from package: ${frameworkId}, CFItems count: ${
                packageData?.CFItems?.length ?? 0
            }`
        );
        if (!frameworkId) {
            console.warn('[opensalt-staging] No framework ID found in package data');
            return [];
        }

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
            const statement = toItemStatement(item);
            if (!item.identifier || !statement) continue;

            skills.push({
                id: item.identifier,
                statement,
                description: toItemDescription(item),
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
            if (!item) continue;

            const statement = toItemStatement(item);
            if (!statement) continue;

            alignments.push({
                type: ['Alignment'],
                targetCode: item.humanCodingScheme ?? item.listEnumeration ?? item.identifier,
                targetName: statement,
                targetDescription: toItemDescription(item),
                targetFramework: document.title,
                targetType: 'CFItem',
                targetUrl: `${baseUrl}/uri/${encodeURIComponent(id)}`,
            });
        }

        return alignments;
    };

    return {
        id: 'opensalt-staging',
        getFrameworkById,
        getSkillsForFramework,
        getSkillsByIds,
        buildObv3Alignments,
    };
}
