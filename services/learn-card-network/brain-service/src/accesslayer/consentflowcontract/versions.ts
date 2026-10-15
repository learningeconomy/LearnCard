import { getContractById } from './read';
import { getIdFromUri } from '@helpers/uri.helpers';
import { flattenObject } from '@helpers/objects.helpers';
import {
    classifyContractChange,
    diffContractChange,
    buildContractUpdatePreview,
} from '@learncard/helpers';
import {
    ConsentFlowContractValidator,
    ConsentFlowContractChangeKindValidator,
} from '@learncard/types';
import type {
    ConsentFlowContract as ConsentFlowContractType,
    ConsentFlowContractChangeKind,
    ConsentFlowContractUpdateResult,
    ConsentFlowContractChanges,
    ConsentFlowContractDetails,
    ConsentFlowTermsStatus,
} from '@learncard/types';
import { z } from 'zod';
import { neogma } from '@instance';
import { TRPCError } from '@trpc/server';
import { v4 as uuid } from 'uuid';
import { getProfileByProfileId } from '@accesslayer/profile/read';
import { getSigningAuthorityForUserByName } from '@accesslayer/signing-authority/relationships/read';
import { tryDispatchContractEvent } from '@helpers/contract-events.helpers';

export type StoredContractVersion = {
    id: string;
    version: number;
    createdAt: string;
    reason?: string;
    kind?: ConsentFlowContractChangeKind;
    contract: ConsentFlowContractType;
    name: string;
    subtitle?: string;
    description?: string;
    reasonForAccessing?: string;
    image?: string;
    needsGuardianConsent?: boolean;
    redirectUrl?: string;
    frontDoorBoostUri?: string;
    expiresAt?: string;
    autoboosts: {
        id: string;
        signingAuthorityEndpoint: string;
        signingAuthorityName: string;
        issuer?: string;
    }[];
    writers: string[];
};

const StoredAutoBoostValidator = z.object({
    id: z.string(),
    signingAuthorityEndpoint: z.string(),
    signingAuthorityName: z.string(),
    issuer: z
        .string()
        .nullable()
        .optional()
        .transform(value => value ?? undefined),
});

const parseJson = <T>(value: unknown, validator: z.ZodType<T>, field: string): T => {
    try {
        const parsed = typeof value === 'string' ? JSON.parse(value) : value;
        return validator.parse(parsed);
    } catch {
        throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: `Stored contract version has invalid ${field}`,
        });
    }
};

const parseVersion = (raw: Record<string, unknown>): StoredContractVersion =>
    ({
        ...raw,
        version: Number(raw.version),
        contract: parseJson(raw.contract, ConsentFlowContractValidator, 'contract'),
        autoboosts: parseJson(raw.autoboosts, z.array(StoredAutoBoostValidator), 'autoboosts'),
        writers: parseJson(raw.writers, z.array(z.string()), 'writers'),
        ...(raw.kind ? { kind: ConsentFlowContractChangeKindValidator.parse(raw.kind) } : {}),
    }) as StoredContractVersion;

const mergeConsentFlowContractPatch = (
    current: ConsentFlowContractType,
    patch: ConsentFlowContractChanges['contract']
): ConsentFlowContractType => {
    const read = patch?.read
        ? {
              ...current.read,
              ...patch.read,
              credentials: patch.read.credentials
                  ? {
                        ...current.read.credentials,
                        ...patch.read.credentials,
                        categories:
                            patch.read.credentials.categories ??
                            current.read.credentials.categories,
                    }
                  : current.read.credentials,
              personal: patch.read.personal ?? current.read.personal,
          }
        : current.read;
    const write = patch?.write
        ? {
              ...current.write,
              ...patch.write,
              credentials: patch.write.credentials
                  ? {
                        ...current.write.credentials,
                        ...patch.write.credentials,
                        categories:
                            patch.write.credentials.categories ??
                            current.write.credentials.categories,
                    }
                  : current.write.credentials,
              personal: patch.write.personal ?? current.write.personal,
          }
        : current.write;
    return ConsentFlowContractValidator.parse({ ...current, read, write });
};
export const getConsentFlowContractVersionRecord = async (
    contractId: string,
    versionNumber: number
): Promise<StoredContractVersion | null> => {
    const result = await neogma.queryRunner.run(
        `MATCH (:ConsentFlowContract {id:$contractId})-[:HAS_VERSION]->(v:ConsentFlowContractVersion {version:$version})
         RETURN properties(v) AS version LIMIT 1`,
        { contractId, version: versionNumber }
    );
    const raw = result.records[0]?.get('version') as Record<string, unknown> | undefined;
    return raw ? parseVersion(raw) : null;
};

export const getConsentFlowContractVersion = getConsentFlowContractVersionRecord;

export const getConsentFlowContractVersions = async (uri: string) => {
    const contractId = getIdFromUri(uri);
    const result = await neogma.queryRunner.run(
        `MATCH (c:ConsentFlowContract {id:$contractId})-[:HAS_VERSION]->(v:ConsentFlowContractVersion)
         RETURN properties(v) AS version ORDER BY v.version DESC`,
        { contractId }
    );
    return result.records.map(record =>
        parseVersion(record.get('version') as Record<string, unknown>)
    );
};

export const getContractVersions = getConsentFlowContractVersions;
export const getCumulativeContractUpdateById = async (
    contractId: string,
    acceptedVersion: number,
    status?: ConsentFlowTermsStatus,
    reconsentDeadline?: string
): Promise<ConsentFlowContractDetails['latestUpdate']> => {
    const contract = await getContractById(contractId);
    if (!contract) throw new TRPCError({ code: 'NOT_FOUND', message: 'Contract not found' });
    const currentVersion = contract.currentVersion ?? contract.version ?? 1;
    if (acceptedVersion >= currentVersion) return undefined;
    const [accepted, current] = await Promise.all([
        getConsentFlowContractVersionRecord(contractId, acceptedVersion),
        getConsentFlowContractVersionRecord(contractId, currentVersion),
    ]);
    if (!accepted || !current) {
        throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: 'Contract version snapshot is missing',
        });
    }
    const diff = diffContractChange(accepted, current);
    const requiresApproval = status === 'needs_reconsent' || status === 'suspended';
    const kind = requiresApproval ? 'requires_consent' : classifyContractChange(accepted, current);
    const versions = await neogma.queryRunner.run(
        `MATCH (c:ConsentFlowContract {id:$id})-[:HAS_VERSION]->(version:ConsentFlowContractVersion)
         WHERE version.version > $acceptedVersion AND version.version <= $currentVersion
         RETURN properties(version) AS version ORDER BY version.version ASC`,
        { id: contractId, acceptedVersion, currentVersion }
    );
    const firstRequiredVersion = versions.records
        .map(record => parseVersion(record.get('version') as Record<string, unknown>))
        .find(version => version.kind === 'requires_consent');
    const reason = requiresApproval
        ? (firstRequiredVersion?.reason ?? contract.latestUpdate?.reason)
        : contract.latestUpdate?.reason;
    const deadline = requiresApproval
        ? (reconsentDeadline ?? contract.latestUpdate?.reconsentDeadline)
        : undefined;
    return {
        fromVersion: acceptedVersion,
        toVersion: currentVersion,
        kind,
        ...(reason ? { reason } : {}),
        diff,
        ...(deadline ? { reconsentDeadline: deadline } : {}),
        createdAt: current.createdAt,
        preview: buildContractUpdatePreview({ name: current.name, kind, diff, status }),
    };
};

export const getCumulativeContractUpdate = async (
    uri: string,
    acceptedVersion: number,
    status?: ConsentFlowTermsStatus,
    reconsentDeadline?: string
): Promise<ConsentFlowContractDetails['latestUpdate']> =>
    getCumulativeContractUpdateById(getIdFromUri(uri), acceptedVersion, status, reconsentDeadline);

type ContractChanges = {
    contract?: ConsentFlowContractChanges['contract'];
    name?: string;
    subtitle?: string;
    description?: string;
    reasonForAccessing?: string;
    image?: string;
    needsGuardianConsent?: boolean;
    redirectUrl?: string;
    frontDoorBoostUri?: string;
    expiresAt?: string;
    autoboosts?: Omit<StoredContractVersion['autoboosts'][number], 'issuer'>[];
    writers?: string[];
    recipients?: string[];
};

export const updateConsentFlowContractVersion = async (
    {
        uri,
        changes,
        reason,
        reconsentDeadline,
        dryRun,
    }: {
        uri: string;
        changes: ContractChanges;
        reason?: string;
        reconsentDeadline?: string;
        dryRun?: boolean;
    },
    actorProfileId: string,
    domain: string,
    appBaseUrl?: string,
    options?: { legacyAutoBoostMutation?: boolean }
): Promise<ConsentFlowContractUpdateResult> => {
    const contractId = getIdFromUri(uri);
    const storedResult = await neogma.queryRunner.run(
        `MATCH (c:ConsentFlowContract {id:$id})
         RETURN properties(c) AS contract, c.status AS contractStatus, c.currentVersion AS currentVersion,
         [(c)-[r:AUTO_RECEIVE]->(b:Boost) | {id:b.id,signingAuthorityEndpoint:r.signingAuthorityEndpoint,signingAuthorityName:r.signingAuthorityName,issuer:r.issuer}] AS autoBoosts,
         [(c)-[:CREATED_BY]->(owner:Profile) | owner.profileId][0] AS ownerProfileId,
         EXISTS { MATCH (c)-[:CREATED_BY]->(:Profile {profileId:$actor}) } AS owner,
         EXISTS { MATCH (c)-[:CAN_WRITE]->(:Profile {profileId:$actor}) } AS writer`,
        { id: contractId, actor: actorProfileId }
    );
    const stored = storedResult.records[0];
    if (!stored) throw new TRPCError({ code: 'NOT_FOUND', message: 'Contract not found' });
    const isOwner = Boolean(stored.get('owner'));
    if (!isOwner && !(options?.legacyAutoBoostMutation && stored.get('writer'))) {
        throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Only the contract owner can update it',
        });
    }
    if (
        options?.legacyAutoBoostMutation &&
        !isOwner &&
        Object.entries(changes).some(([key, value]) => key !== 'autoboosts' && value !== undefined)
    ) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Legacy writer updates may only change autoboosts',
        });
    }
    if (stored.get('contractStatus') === 'retired') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Retired contracts cannot be updated' });
    }
    if (changes.recipients !== undefined) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Use addContractRecipient or removeContractRecipient to update recipients',
        });
    }
    const currentVersion = Number(stored.get('currentVersion') ?? 1);
    const current = await getConsentFlowContractVersionRecord(contractId, currentVersion);
    if (!current)
        throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: 'Contract version snapshot is missing',
        });
    const existingAutoBoosts =
        (stored.get('autoBoosts') as StoredContractVersion['autoboosts'] | null) ?? [];
    const requestedAutoBoosts = changes.autoboosts ?? current.autoboosts;
    const uniqueAutoBoosts = new Map<string, (typeof requestedAutoBoosts)[number]>();
    for (const config of requestedAutoBoosts) {
        const previous = uniqueAutoBoosts.get(config.id);
        if (
            previous &&
            (previous.signingAuthorityEndpoint !== config.signingAuthorityEndpoint ||
                previous.signingAuthorityName !== config.signingAuthorityName)
        ) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: `Conflicting signing authorities for autoboost: ${config.id}`,
            });
        }
        uniqueAutoBoosts.set(config.id, config);
    }
    const autoboosts = await Promise.all(
        [...uniqueAutoBoosts.values()].map(async config => {
            const existing = existingAutoBoosts.find(item => item.id === config.id);
            const unchanged =
                existing &&
                existing.signingAuthorityEndpoint === config.signingAuthorityEndpoint &&
                existing.signingAuthorityName === config.signingAuthorityName;
            const issuer = unchanged ? (existing.issuer ?? actorProfileId) : actorProfileId;
            if (!unchanged) {
                const issuerProfile = await getProfileByProfileId(issuer);
                const signingAuthority =
                    issuerProfile &&
                    (await getSigningAuthorityForUserByName(
                        issuerProfile,
                        config.signingAuthorityEndpoint,
                        config.signingAuthorityName.toLowerCase()
                    ));
                if (!signingAuthority) {
                    throw new TRPCError({
                        code: 'FORBIDDEN',
                        message: `Signing authority ${config.signingAuthorityName} is not registered for autoboost issuer ${issuer}`,
                    });
                }
            }
            return {
                id: config.id,
                signingAuthorityEndpoint: config.signingAuthorityEndpoint,
                signingAuthorityName: config.signingAuthorityName,
                issuer,
            };
        })
    );
    const next: StoredContractVersion = {
        ...current,
        ...Object.fromEntries(
            Object.entries(changes).filter(
                ([key, value]) => key !== 'contract' && key !== 'recipients' && value !== undefined
            )
        ),
        contract: changes.contract
            ? mergeConsentFlowContractPatch(current.contract, changes.contract)
            : current.contract,
        autoboosts,
        writers: changes.writers ?? current.writers,
    };
    const kind = classifyContractChange(current, next);
    const diff = diffContractChange(current, next);
    if (kind === 'requires_consent' && (!reason || reason.length > 140)) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'A reason is required when asking users for more access',
        });
    }
    if (next.expiresAt && !z.iso.datetime().safeParse(next.expiresAt).success) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'expiresAt must be a valid ISO date' });
    }
    if (reconsentDeadline && !z.iso.datetime().safeParse(reconsentDeadline).success) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'reconsentDeadline must be a valid ISO date',
        });
    }
    const effectiveDeadline =
        kind === 'requires_consent'
            ? (reconsentDeadline ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())
            : undefined;
    const preview = buildContractUpdatePreview({ name: next.name, kind, diff });
    const reviewUrl = `${(appBaseUrl ?? domain).replace(/\/+$/, '')}/consent-flow/review?uri=${encodeURIComponent(uri)}`;
    const contractOwnerProfileId = stored.get('ownerProfileId');
    if (typeof contractOwnerProfileId !== 'string') {
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Contract owner is missing' });
    }
    const affectedUsers = await neogma.queryRunner
        .run(
            `MATCH (profile:Profile)-[:CREATED_BY]->(t:ConsentFlowTerms)-[:CONSENTS_TO]->(c:ConsentFlowContract {id:$id})
         WHERE t.status IN ['live','needs_reconsent','suspended'] RETURN count(DISTINCT profile.profileId) AS count`,
            { id: contractId }
        )
        .then(r => Number(r.records[0]?.get('count') ?? 0));
    const eventId = `${contractId}:version:${currentVersion + 1}`;
    const notificationData = {
        contractUri: uri,
        fromVersion: currentVersion,
        toVersion: currentVersion + 1,
        kind,
        ...(reason ? { reason } : {}),
        diff,
        ...(effectiveDeadline ? { reconsentDeadline: effectiveDeadline } : {}),
        reviewUrl,
        preview,
    };
    const result = { version: currentVersion + 1, kind, affectedUsers, preview };
    if (dryRun) return result;
    const createdAt = new Date().toISOString();
    const versionId = uuid();
    const removedTermPrefixes = diff.removed.map(
        scope =>
            `terms.${scope.area}.${scope.type === 'credential' ? 'credentials.categories' : 'personal'}.${scope.key}`
    );
    const optionalOffValues: { key: string; value: boolean | string | string[] }[] = diff.added
        .filter(scope => !scope.required)
        .flatMap<{ key: string; value: boolean | string | string[] }>(scope => {
            const prefix = `terms.${scope.area}.${scope.type === 'credential' ? 'credentials.categories' : 'personal'}.${scope.key}`;
            if (scope.area === 'write') return [{ key: prefix, value: false }];
            if (scope.type === 'personal') return [{ key: prefix, value: '' }];
            return [
                { key: `${prefix}.sharing`, value: false },
                { key: `${prefix}.shared`, value: [] as string[] },
                { key: `${prefix}.shareAll`, value: false },
            ];
        });
    const disableReadShareAll =
        kind === 'expanded_optional' &&
        diff.added.some(
            scope => scope.area === 'read' && scope.type === 'credential' && !scope.required
        );
    const preservedReadGrantKeys = Object.keys(next.contract.read.credentials.categories)
        .filter(
            key =>
                Object.prototype.hasOwnProperty.call(
                    current.contract.read.credentials.categories,
                    key
                ) &&
                !diff.added.some(
                    scope =>
                        scope.area === 'read' && scope.type === 'credential' && scope.key === key
                )
        )
        .map(key => `terms.read.credentials.categories.${key}.shareAll`);
    const writerIds = [...new Set(next.writers)];
    const contractProperties = flattenObject({
        ...Object.fromEntries(
            Object.entries(next).filter(
                ([key]) =>
                    ![
                        'id',
                        'version',
                        'createdAt',
                        'reason',
                        'kind',
                        'contract',
                        'autoboosts',
                        'writers',
                    ].includes(key)
            )
        ),
        contract: next.contract,
        currentVersion: currentVersion + 1,
        status: 'active',
        updatedAt: createdAt,
    });
    const committed = await neogma.queryRunner.run(
        `MATCH (c:ConsentFlowContract {id:$id})
         SET c._contractVersionLock=coalesce(c._contractVersionLock,0)+1
         WITH c,
             (EXISTS { MATCH (c)-[:CREATED_BY]->(:Profile {profileId:$actor}) }
                 OR ($legacyAutoBoostMutation AND EXISTS { MATCH (c)-[:CAN_WRITE]->(:Profile {profileId:$actor}) })) AS authorized,
             coalesce(c.currentVersion,1) = $expectedVersion AS currentMatches,
             coalesce(c.status,'active') <> 'retired' AS active
         FOREACH (_ IN CASE WHEN authorized AND currentMatches AND active THEN [] ELSE [1] END |
             REMOVE c._contractVersionLock)
         WITH c WHERE authorized AND currentMatches AND active
         OPTIONAL MATCH (c)-[:CONSENTS_TO]-(t:ConsentFlowTerms)
         WITH c, collect(DISTINCT t) AS terms
         MATCH (c)-[:CREATED_BY]->(owner:Profile)
         OPTIONAL MATCH (c)-[:CONSENTS_TO]-(holderTerms:ConsentFlowTerms)<-[:CREATED_BY]-(holder:Profile)
         WHERE holderTerms.status IN ['live','needs_reconsent','suspended']
         WITH c, terms, owner, collect(DISTINCT holder.profileId) AS holderIds
         OPTIONAL MATCH (c)-[oldAuto:AUTO_RECEIVE]->(:Boost)
         WITH c, terms, owner, holderIds, collect(oldAuto) AS oldAuto
         OPTIONAL MATCH (c)-[oldWriter:CAN_WRITE]->(:Profile)
         WITH c, terms, owner, holderIds, oldAuto, collect(oldWriter) AS oldWriters
         OPTIONAL MATCH (boost:Boost) WHERE boost.id IN $boostIds
         WITH c, terms, owner, holderIds, oldAuto, oldWriters, collect(DISTINCT boost) AS boosts
         WHERE size(boosts) = size($boostIds)
         OPTIONAL MATCH (writer:Profile) WHERE writer.profileId IN $writerIds
         WITH c, terms, owner, holderIds, oldAuto, oldWriters, boosts, collect(DISTINCT writer) AS writers
         WHERE size(writers) = size($writerIds)
         CREATE (v:ConsentFlowContractVersion {id:$versionId, version:$nextVersion, createdAt:$createdAt,
             contract:$contract, autoboosts:$autoboostSnapshot, writers:$writerSnapshot, reason:$reason, kind:$kind,
             name:$name, subtitle:$subtitle, description:$description, reasonForAccessing:$reasonForAccessing,
             image:$image, needsGuardianConsent:$needsGuardianConsent, redirectUrl:$redirectUrl,
             frontDoorBoostUri:$frontDoorBoostUri, expiresAt:$expiresAt})
         CREATE (c)-[:HAS_VERSION]->(v)
         FOREACH (key IN [key IN keys(c)
             WHERE (key STARTS WITH 'contract.' OR key IN ['name','subtitle','description','reasonForAccessing','image','needsGuardianConsent','redirectUrl','frontDoorBoostUri','expiresAt'])
                 AND NOT (key IN keys($contractProperties))] | SET c[key]=null)
         SET c.currentVersion=$nextVersion, c.status='active', c += $contractProperties,
             c.latestUpdate=$latestUpdate, c.updatedAt=$createdAt
         FOREACH (relationship IN oldAuto | DELETE relationship)
         FOREACH (relationship IN oldWriters | DELETE relationship)
         FOREACH (config IN $autoBoostConfigs |
             FOREACH (boost IN [target IN boosts WHERE target.id=config.id] |
                 CREATE (c)-[:AUTO_RECEIVE {signingAuthorityEndpoint:config.signingAuthorityEndpoint,
                     signingAuthorityName:config.signingAuthorityName, issuer:config.issuer}]->(boost)))
         FOREACH (writer IN writers | CREATE (c)-[:CAN_WRITE]->(writer))
         REMOVE c._contractVersionLock
         FOREACH (term IN terms |
             FOREACH (_ IN CASE WHEN term.status IN ['live','needs_reconsent','suspended'] THEN [1] ELSE [] END |
                 SET term.mutationVersion=coalesce(term.mutationVersion,0)+1
                 CREATE (transaction:ConsentFlowTransaction {
                     id:randomUUID(), action:'update', date:$createdAt, version:$nextVersion, kind:$kind
                 })-[:IS_FOR]->(term))
             FOREACH (_ IN CASE WHEN term.status = 'live' AND $kind <> 'requires_consent' THEN [1] ELSE [] END |
                 FOREACH (key IN [key IN keys(term) WHERE any(prefix IN $removedTermPrefixes WHERE key = prefix OR key STARTS WITH prefix + '.')] | SET term[key] = null)
                 FOREACH (entry IN $optionalOffValues | SET term[entry.key] = entry.value)
                 FOREACH (_ IN CASE WHEN $disableReadShareAll AND coalesce(term['terms.read.credentials.shareAll'],false) THEN [1] ELSE [] END |
                     SET term['terms.read.credentials.shareAll']=false
                     FOREACH (key IN $preservedReadGrantKeys | SET term[key]=true))
                 FOREACH (_ IN CASE WHEN term['guardianApproval.contractUpdatedAt'] = $previousVersionCreatedAt THEN [1] ELSE [] END |
                     SET term['guardianApproval.contractUpdatedAt']=$createdAt)
                 SET term.consentedVersion=$nextVersion,
                     term.newOptionsUntil=CASE WHEN $kind = 'expanded_optional' THEN $optionsUntil ELSE term.newOptionsUntil END,
                     term.updatedAt=$createdAt)
             FOREACH (_ IN CASE WHEN $kind = 'requires_consent' AND term.status = 'live' THEN [1] ELSE [] END |
                 SET term.status='needs_reconsent', term.reconsentDeadline=coalesce(term.reconsentDeadline,$deadline), term.updatedAt=$createdAt))
         CREATE (event:ConsentFlowEvent {
             id:$eventId, contractId:c.id, fromId:owner.profileId, ownerId:owner.profileId,
             domain:$eventDomain, kind:'contract_updated', payload:$eventPayload,
             cleanupPending:true, createdAt:$createdAt
         })
         FOREACH (holderId IN [id IN holderIds WHERE id <> owner.profileId] |
             CREATE (event)-[:HAS_DELIVERY]->(:ConsentFlowEventDelivery {
                 id:event.id + ':' + holderId, toId:holderId, state:'pending',
                 nextAttemptAt:$createdAt, eventCreatedAt:$createdAt, attempts:0, role:'target'
             }))
         RETURN c.currentVersion AS version`,
        {
            id: contractId,
            actor: actorProfileId,
            legacyAutoBoostMutation: options?.legacyAutoBoostMutation ?? false,
            expectedVersion: currentVersion,
            nextVersion: currentVersion + 1,
            versionId,
            createdAt,
            contract: JSON.stringify(next.contract),
            autoboostSnapshot: JSON.stringify(next.autoboosts),
            writerSnapshot: JSON.stringify(next.writers),
            autoBoostConfigs: next.autoboosts,
            boostIds: next.autoboosts.map(config => config.id),
            writerIds,
            reason: reason ?? null,
            kind,
            contractProperties,
            name: next.name,
            subtitle: next.subtitle ?? null,
            description: next.description ?? null,
            reasonForAccessing: next.reasonForAccessing ?? null,
            image: next.image ?? null,
            needsGuardianConsent: next.needsGuardianConsent ?? false,
            redirectUrl: next.redirectUrl ?? null,
            frontDoorBoostUri: next.frontDoorBoostUri ?? null,
            expiresAt: next.expiresAt ?? null,
            latestUpdate: JSON.stringify({
                fromVersion: currentVersion,
                toVersion: currentVersion + 1,
                kind,
                reason,
                diff,
                reconsentDeadline: effectiveDeadline,
                createdAt,
                preview,
            }),
            deadline: effectiveDeadline ?? null,
            optionsUntil:
                kind === 'expanded_optional'
                    ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
                    : null,
            removedTermPrefixes,
            optionalOffValues,
            disableReadShareAll,
            preservedReadGrantKeys,
            previousVersionCreatedAt: current.createdAt,
            eventId,
            eventDomain: domain,
            eventPayload: JSON.stringify(notificationData),
        }
    );
    if (!committed.records.length)
        throw new TRPCError({
            code: 'CONFLICT',
            message: 'Contract changed concurrently; retry the update',
        });
    await tryDispatchContractEvent(eventId);
    return result;
};
