import {
    OBV3_ACHIEVEMENT_TYPES,
    DEFAULT_CONTEXTS,
    DEFAULT_TYPES,
} from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';

export type ProvenanceSource = 'credential-engine' | 'url' | 'file' | 'paste' | 'reuse';

export interface ImportProvenance {
    source: ProvenanceSource;
    label: string;
    ctid?: string;
    sourceUrl?: string;
}

export interface CtdlCreator {
    id?: string;
    name?: string;
    url?: string;
    image?: string;
}

export interface NormalizedImport {
    obv3Json: Record<string, unknown>;
    provenance: ImportProvenance;
    warnings: string[];
}

const isObject = (v: unknown): v is Record<string, unknown> =>
    typeof v === 'object' && v !== null && !Array.isArray(v);

export const isCredentialLike = (json: unknown): json is Record<string, unknown> => {
    if (!isObject(json)) return false;
    const hasContext = '@context' in json;
    const hasSubject = 'credentialSubject' in json || 'achievement' in json;
    return hasContext && hasSubject;
};

export const isCtdlResource = (json: unknown): boolean => {
    if (!isObject(json)) return false;
    if ('ceterms:ctid' in json || 'ceterms:name' in json) return true;
    const type = json['@type'] ?? json.type;
    const typeStr = Array.isArray(type) ? type.join(' ') : String(type ?? '');
    return typeStr.includes('ceterms:');
};

/**
 * The Credential Engine registry returns a JSON-LD graph envelope
 * (`{ "@graph": [...] }`) whose nodes are the requested resource plus its
 * referenced entities. Select the primary node: the one matching the requested
 * CTID, else the first node that looks like a named CTDL resource.
 */
export const unwrapCtdlGraph = (parsed: unknown, ctidHint?: string): unknown => {
    if (!isObject(parsed) || !Array.isArray(parsed['@graph'])) return parsed;
    const graph = (parsed['@graph'] as unknown[]).filter(isObject);
    if (ctidHint) {
        const byCtid = graph.find(
            node => String(node['ceterms:ctid'] ?? '').toLowerCase() === ctidHint.toLowerCase()
        );
        if (byCtid) return byCtid;
    }
    return graph.find(node => 'ceterms:name' in node) ?? graph[0] ?? parsed;
};

/**
 * CTDL strings are often language maps (`{ "en-US": "…" }`); pick the best
 * available language, falling back to the first entry, or pass through a plain
 * string. Arrays take their first element.
 */
const langString = (value: unknown): string | undefined => {
    if (value == null) return undefined;
    if (typeof value === 'string') return value.trim() || undefined;
    if (Array.isArray(value)) return langString(value[0]);
    if (isObject(value)) {
        const preferred = value['en-US'] ?? value.en ?? value['en-us'];
        if (typeof preferred === 'string') return preferred.trim() || undefined;
        const first = Object.values(value).find(v => typeof v === 'string') as string | undefined;
        return first?.trim() || undefined;
    }
    return undefined;
};

/** CTDL images can be a URL string or an object carrying a URL under common keys. */
const imageUrl = (value: unknown): string | undefined => {
    if (typeof value === 'string') return value.trim() || undefined;
    if (Array.isArray(value)) return imageUrl(value[0]);
    if (isObject(value)) {
        const candidate = value['ceterms:url'] ?? value.url ?? value.id ?? value['@id'];
        return typeof candidate === 'string' ? candidate.trim() || undefined : undefined;
    }
    return undefined;
};

/** Reduce a `ceterms:credentialType` URI/term to its bare local name. */
const localName = (value: unknown): string | undefined => {
    const raw = langString(value) ?? (typeof value === 'string' ? value : undefined);
    if (!raw) return undefined;
    const afterColon = raw.includes(':') ? raw.split(':').pop()! : raw;
    return afterColon.includes('/') ? afterColon.split('/').pop()! : afterColon;
};

const OBV3_TYPE_SET = new Set<string>(OBV3_ACHIEVEMENT_TYPES as readonly string[]);

/**
 * Explicit map from every CTDL credential (and learning-opportunity) subclass to
 * the closest OBv3 `AchievementType`. CTDL's vocabulary is strictly finer-grained
 * than OBv3's — it encodes the field of study (`BachelorOfArtsDegree`) where OBv3
 * only encodes the level (`BachelorDegree`) — so this is a deliberate many-to-one
 * collapse. The lost specificity is preserved elsewhere: the exact CTDL class
 * round-trips via the Credential Engine alignment, and field-of-study survives in
 * the CIP/SOC alignments. Keyed by the bare local name (post-`localName`).
 *
 * Sources: https://credreg.net/ctdl/terms  •  https://www.imsglobal.org/spec/ob/v3p0#AchievementType
 */
const CTDL_TO_OBV3_TYPE: Record<string, string> = {
    Badge: 'Badge',
    DigitalBadge: 'Badge',
    OpenBadge: 'Badge',
    DigitalBadgeCredential: 'Badge',

    AssociateDegree: 'AssociateDegree',
    AssociateOfArtsDegree: 'AssociateDegree',
    AssociateOfScienceDegree: 'AssociateDegree',
    AssociateOfAppliedArtsDegree: 'AssociateDegree',
    AssociateOfAppliedScienceDegree: 'AssociateDegree',

    BachelorDegree: 'BachelorDegree',
    BachelorOfArtsDegree: 'BachelorDegree',
    BachelorOfScienceDegree: 'BachelorDegree',

    MasterDegree: 'MasterDegree',
    MasterOfArtsDegree: 'MasterDegree',
    MasterOfScienceDegree: 'MasterDegree',

    DoctoralDegree: 'DoctoralDegree',
    ResearchDoctorate: 'ResearchDoctorate',
    ProfessionalDoctorate: 'ProfessionalDoctorate',

    Degree: 'Degree',
    SpecialistDegree: 'Degree',

    Certificate: 'Certificate',
    AcademicCertificate: 'Certificate',
    BasicTechnicalCertificate: 'Certificate',
    CertificateOfCompletion: 'CertificateOfCompletion',
    CertificateOfParticipation: 'Certificate',
    PostBaccalaureateCertificate: 'Certificate',
    PostMasterCertificate: 'Certificate',
    ProfessionalCertificate: 'Certificate',
    ProficiencyCertificate: 'Certificate',
    WorkBasedLearningCertificate: 'Certificate',
    SecondaryEducationCertificate: 'Certificate',
    MasterCertificate: 'MasterCertificate',

    ApprenticeshipCertificate: 'ApprenticeshipCertificate',
    PreApprenticeshipCertificate: 'ApprenticeshipCertificate',
    JourneymanCertificate: 'JourneymanCertificate',

    Diploma: 'Diploma',
    SecondarySchoolDiploma: 'SecondarySchoolDiploma',

    Certification: 'Certification',
    License: 'License',
    MicroCredential: 'MicroCredential',
    GeneralEducationDevelopment: 'GeneralEducationDevelopment',
    QualityAssuranceCredential: 'QualityAssuranceCredential',

    Course: 'Course',
    LearningProgram: 'LearningProgram',
    LearningOpportunityProfile: 'LearningProgram',
    Assessment: 'Assessment',
    Competency: 'Competency',
};

/**
 * Suffix-based fallback for CTDL classes not enumerated above (the registry adds
 * new subclasses over time). Collapses any `*Degree` / `*Certificate` / etc. to
 * the right OBv3 bucket by inspecting the level prefix and the trailing noun.
 */
const heuristicObv3Type = (term: string): string | undefined => {
    if (/Degree$/i.test(term)) {
        if (/^Associate/i.test(term)) return 'AssociateDegree';
        if (/^Bachelor|^Baccalaureate/i.test(term)) return 'BachelorDegree';
        if (/^Master/i.test(term)) return 'MasterDegree';
        if (/Doctor|Doctoral|Phd/i.test(term)) return 'DoctoralDegree';
        return 'Degree';
    }
    if (/SecondarySchoolDiploma$/i.test(term)) return 'SecondarySchoolDiploma';
    if (/Diploma$/i.test(term)) return 'Diploma';
    if (/Certification$/i.test(term)) return 'Certification';
    if (/Certificate$/i.test(term)) return 'Certificate';
    if (/MicroCredential$/i.test(term)) return 'MicroCredential';
    if (/License$/i.test(term)) return 'License';
    if (/Badge$/i.test(term)) return 'Badge';
    return undefined;
};

/**
 * Collect candidate type terms from a CTDL type-bearing value. Handles plain
 * strings (`"ceterms:BachelorDegree"`), arrays, and `CredentialAlignmentObject`
 * wrappers (`ceterms:credentialType` is often `{ ceterms:targetNode: "…" }`) —
 * for objects we read `targetNode`, never the wrapper's own `@type`.
 */
const typeTerms = (value: unknown): string[] => {
    if (value == null) return [];
    if (typeof value === 'string') {
        const name = localName(value);
        return name ? [name] : [];
    }
    if (Array.isArray(value)) return value.flatMap(typeTerms);
    if (isObject(value)) {
        const target = value['ceterms:targetNode'] ?? value['targetNode'] ?? value['@id'];
        return typeof target === 'string' ? typeTerms(target) : [];
    }
    return [];
};

/**
 * Resolve a CTDL resource's OBv3 `achievementType`. Tries, in order of
 * specificity: the explicit `ceterms:credentialType`, then the RDF `@type`/`type`.
 * For each candidate: exact OBv3 match → explicit alias table → suffix heuristic.
 * Falls back to the generic `'Achievement'` only when nothing resolves.
 */
const inferAchievementType = (ctdl: Record<string, unknown>): string => {
    const candidates = [
        ...typeTerms(ctdl['ceterms:credentialType']),
        ...typeTerms(ctdl['@type']),
        ...typeTerms(ctdl['type']),
    ];

    for (const term of candidates) {
        if (OBV3_TYPE_SET.has(term)) return term;

        const mapped = CTDL_TO_OBV3_TYPE[term];
        if (mapped && OBV3_TYPE_SET.has(mapped)) return mapped;

        const heuristic = heuristicObv3Type(term);
        if (heuristic && OBV3_TYPE_SET.has(heuristic)) return heuristic;
    }

    return 'Achievement';
};

const httpUrl = (value: string | undefined): string | undefined =>
    value && /^https?:\/\//i.test(value) ? value : undefined;

const flattenStrings = (value: unknown): string[] => {
    if (typeof value === 'string') return value.trim() ? [value.trim()] : [];
    if (Array.isArray(value)) return value.flatMap(flattenStrings);
    if (isObject(value)) return Object.values(value).flatMap(flattenStrings);
    return [];
};

const isAlignmentObject = (node: Record<string, unknown>): boolean =>
    typeof node['@type'] === 'string' &&
    (node['@type'] as string).includes('CredentialAlignmentObject');

/**
 * CTDL expresses occupations (SOC), instructional programs (CIP), industries
 * and competencies as inline `CredentialAlignmentObject`s. Collect every one
 * whose target resolves to a URL into an OBv3 alignment, deduped by target URL —
 * skipping framework-coded nodes (cost, status) whose targetNode is a bare term.
 */
const collectAlignments = (root: unknown): Record<string, unknown>[] => {
    const out: Record<string, unknown>[] = [];
    const seen = new Set<string>();

    const visit = (node: unknown): void => {
        if (Array.isArray(node)) return node.forEach(visit);
        if (!isObject(node)) return;

        if (isAlignmentObject(node)) {
            const targetUrl =
                typeof node['ceterms:targetNode'] === 'string'
                    ? node['ceterms:targetNode']
                    : undefined;
            const targetName = langString(node['ceterms:targetNodeName']);
            if (
                targetUrl &&
                /^https?:\/\//i.test(targetUrl) &&
                targetName &&
                !seen.has(targetUrl)
            ) {
                seen.add(targetUrl);
                const alignment: Record<string, unknown> = {
                    type: ['Alignment'],
                    targetType: 'CTDL',
                    targetName,
                    targetUrl,
                };
                const targetDescription = langString(node['ceterms:targetNodeDescription']);
                if (targetDescription) alignment.targetDescription = targetDescription;
                const framework =
                    langString(node['ceterms:frameworkName']) ??
                    (typeof node['ceterms:framework'] === 'string'
                        ? node['ceterms:framework']
                        : undefined);
                if (framework) alignment.targetFramework = framework;
                const code =
                    typeof node['ceterms:codedNotation'] === 'string'
                        ? node['ceterms:codedNotation']
                        : undefined;
                if (code) alignment.targetCode = code;
                out.push(alignment);
            }
            return;
        }

        Object.values(node).forEach(visit);
    };

    visit(root);
    return out;
};

const firstResourceUrl = (value: unknown): string | undefined => {
    if (typeof value === 'string') return httpUrl(value);
    if (Array.isArray(value)) {
        for (const entry of value) {
            const url = firstResourceUrl(entry);
            if (url) return url;
        }
    }
    if (isObject(value))
        return httpUrl(typeof value['@id'] === 'string' ? value['@id'] : undefined);
    return undefined;
};

/** The registry URL of the org that owns (or, failing that, offers) a credential. */
export const ctdlOwnerRef = (resource: unknown): string | undefined =>
    isObject(resource)
        ? firstResourceUrl(resource['ceterms:ownedBy']) ??
          firstResourceUrl(resource['ceterms:offeredBy'])
        : undefined;

export const readOrgProfile = (org: unknown): CtdlCreator | undefined => {
    if (!isObject(org)) return undefined;
    const name = langString(org['ceterms:name']);
    const url = httpUrl(langString(org['ceterms:subjectWebpage']));
    const image = imageUrl(org['ceterms:image']);
    const id = typeof org['@id'] === 'string' ? org['@id'] : undefined;
    if (!name && !url && !id) return undefined;
    return { id, name, url, image };
};

/**
 * Map a Credential Engine CTDL resource onto a standards-pure OBv3 credential.
 * The CTID is emitted as the canonical Credential Engine alignment entry, which
 * `parseAchievement` extracts back into the editable `ctid` field — preserving
 * verifiable provenance without any special-casing downstream.
 */
export const ctdlToObv3Json = (
    ctdl: Record<string, unknown>,
    ctidHint?: string,
    creator?: CtdlCreator
): { obv3Json: Record<string, unknown>; warnings: string[] } => {
    const warnings: string[] = [];

    const name = langString(ctdl['ceterms:name']) ?? 'Imported credential';
    const description = langString(ctdl['ceterms:description']);
    const ctid = (langString(ctdl['ceterms:ctid']) ?? ctidHint)?.toLowerCase();
    const resourceId = httpUrl(
        typeof ctdl['@id'] === 'string' ? (ctdl['@id'] as string) : undefined
    );
    const subjectWebpage = httpUrl(langString(ctdl['ceterms:subjectWebpage']));
    const image = imageUrl(ctdl['ceterms:image']);
    const achievementType = inferAchievementType(ctdl);
    const inLanguage = langString(ctdl['ceterms:inLanguage']);
    const requiresNarrative = (
        Array.isArray(ctdl['ceterms:requires']) ? ctdl['ceterms:requires'] : []
    )
        .map(profile =>
            isObject(profile) ? langString(profile['ceterms:description']) : undefined
        )
        .filter((v): v is string => Boolean(v))
        .join('\n\n');
    const humanCode =
        typeof ctdl['ceterms:codedNotation'] === 'string'
            ? (ctdl['ceterms:codedNotation'] as string).trim() || undefined
            : undefined;
    const credentialId =
        typeof ctdl['ceterms:credentialId'] === 'string'
            ? (ctdl['ceterms:credentialId'] as string).trim() || undefined
            : undefined;
    const tags = flattenStrings(ctdl['ceterms:keyword']);

    if (!description) warnings.push('No description was provided by the registry.');

    const ctidAlignment = ctid
        ? [
              {
                  type: ['Alignment'],
                  targetName: name,
                  targetUrl: `https://credentialfinder.org/credential/${ctid}`,
                  targetType: 'ceterms:Credential',
                  targetCode: ctid,
                  targetFramework: 'Credential Engine Registry',
              },
          ]
        : [];
    const alignment = [...ctidAlignment, ...collectAlignments(ctdl)];

    const criteria: Record<string, unknown> = {};
    if (subjectWebpage) criteria.id = subjectWebpage;
    if (requiresNarrative) criteria.narrative = requiresNarrative;
    if (!criteria.id && !criteria.narrative) criteria.narrative = `Awarded for: ${name}`;

    const achievement: Record<string, unknown> = {
        type: ['Achievement'],
        name,
        description: description ?? '',
        achievementType,
        criteria,
    };

    if (resourceId) achievement.id = resourceId;
    if (image) achievement.image = image;
    if (inLanguage) achievement.inLanguage = inLanguage;
    if (humanCode) achievement.humanCode = humanCode;
    if (tags.length > 0) achievement.tag = tags;
    if (alignment.length > 0) achievement.alignment = alignment;
    if (credentialId) {
        achievement.otherIdentifier = [
            { type: 'IdentifierEntry', identifier: credentialId, identifierType: 'credentialId' },
        ];
    }
    if (creator && (creator.name || creator.url || creator.id)) {
        achievement.creator = {
            type: ['Profile'],
            ...(creator.id ? { id: creator.id } : {}),
            ...(creator.name ? { name: creator.name } : {}),
            ...(creator.url ? { url: creator.url } : {}),
            ...(creator.image ? { image: creator.image } : {}),
        };
    }

    const obv3Json: Record<string, unknown> = {
        '@context': DEFAULT_CONTEXTS,
        type: DEFAULT_TYPES,
        name,
        issuer: '{{issuer_did}}',
        credentialSubject: { type: ['AchievementSubject'], achievement },
        validFrom: '{{issue_date}}',
    };

    return { obv3Json, warnings };
};

/**
 * Turn any recognized parsed input into OBv3-shaped JSON ready for
 * `jsonToTemplate`. Already-credential inputs pass through untouched (the
 * existing parser handles OBv3 / VC / OBv2 / CLR); CTDL resources are mapped.
 */
export const normalizeToObv3 = (
    parsed: unknown,
    context: {
        source: ProvenanceSource;
        label: string;
        ctid?: string;
        sourceUrl?: string;
        creator?: CtdlCreator;
    }
): NormalizedImport => {
    const resource = unwrapCtdlGraph(parsed, context.ctid);

    if (isCtdlResource(resource)) {
        const { obv3Json, warnings } = ctdlToObv3Json(
            resource as Record<string, unknown>,
            context.ctid,
            context.creator
        );
        return {
            obv3Json,
            provenance: {
                source: 'credential-engine',
                label: context.label,
                ctid:
                    context.ctid ??
                    (obv3Json as any)?.credentialSubject?.achievement?.alignment?.[0]?.targetCode,
                sourceUrl: context.sourceUrl,
            },
            warnings,
        };
    }

    if (isCredentialLike(resource)) {
        return {
            obv3Json: resource,
            provenance: {
                source: context.source,
                label: context.label,
                sourceUrl: context.sourceUrl,
            },
            warnings: [],
        };
    }

    throw new Error(
        "We couldn't recognize this as a credential. Try a different link, file, or ID."
    );
};
