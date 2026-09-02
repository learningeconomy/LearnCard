import { createHash } from 'node:crypto';

import { canonicalConsentScopeString, canonicalJsonString } from '@learncard/partner-connect-core';
import type { NormalizedConsentScopes } from '@learncard/partner-connect-core';
import type { AppManifest, AppManifestDiff, AppManifestTemplateRef } from '@learncard/types';

const sortStrings = <T extends string>(values: T[]): T[] =>
    Array.from(new Set(values)).sort() as T[];

const normalizeTemplateRecord = (template: AppManifest['templates'][number]) => ({
    alias: template.alias,
    template: template.template,
    version: template.version,
});

const normalizeConsentRecord = (
    record: AppManifest['consentRequests'][number]
): { scopes: NormalizedConsentScopes; reason?: string } => ({
    scopes: {
        read: {
            credentialCategories: sortStrings(record.scopes.read.credentialCategories),
            personalFields: sortStrings(record.scopes.read.personalFields),
        },
        write: {
            credentialCategories: sortStrings(record.scopes.write.credentialCategories),
        },
    },
    ...(record.reason ? { reason: record.reason } : {}),
});

const normalizeManifestForHash = (manifest: AppManifest): Record<string, unknown> => ({
    manifestVersion: manifest.manifestVersion,
    appUrl: manifest.appUrl,
    ...(manifest.suggestedName ? { suggestedName: manifest.suggestedName } : {}),
    ...(manifest.suggestedIconUrl ? { suggestedIconUrl: manifest.suggestedIconUrl } : {}),
    permissions: sortStrings(manifest.permissions),
    templates: [...manifest.templates]
        .map(normalizeTemplateRecord)
        .sort((a, b) => a.alias.localeCompare(b.alias) || a.version - b.version),
    consentRequests: [...manifest.consentRequests]
        .map(normalizeConsentRecord)
        .sort((a, b) =>
            canonicalConsentScopeString(a.scopes).localeCompare(
                canonicalConsentScopeString(b.scopes)
            )
        ),
    featuresLaunched: sortStrings(manifest.featuresLaunched),
    counterKeys: sortStrings(manifest.counterKeys),
    usedLearnerContext: manifest.usedLearnerContext,
    usedNotifications: manifest.usedNotifications,
});

const buildStringDiff = (current: string[], next: string[]) => {
    const currentSet = new Set(current);
    const nextSet = new Set(next);

    return {
        added: sortStrings(next.filter(value => !currentSet.has(value))),
        removed: sortStrings(current.filter(value => !nextSet.has(value))),
        changed: [] as string[],
    };
};

const templateSignature = (template: AppManifest['templates'][number]): string => {
    return canonicalJsonString({ template: template.template, version: template.version });
};

const toTemplateRef = (template: AppManifest['templates'][number]): AppManifestTemplateRef => ({
    alias: template.alias,
    version: template.version,
});

const getConsentExpansionSurface = (
    manifest: AppManifest
): {
    readCredentialCategories: Set<string>;
    readPersonalFields: Set<string>;
    writeCredentialCategories: Set<string>;
} => {
    const readCredentialCategories = new Set<string>();
    const readPersonalFields = new Set<string>();
    const writeCredentialCategories = new Set<string>();

    for (const request of manifest.consentRequests) {
        request.scopes.read.credentialCategories.forEach(category =>
            readCredentialCategories.add(category)
        );
        request.scopes.read.personalFields.forEach(field => readPersonalFields.add(field));
        request.scopes.write.credentialCategories.forEach(category =>
            writeCredentialCategories.add(category)
        );
    }

    return {
        readCredentialCategories,
        readPersonalFields,
        writeCredentialCategories,
    };
};

const isConsentExpanded = (current: AppManifest, next: AppManifest): boolean => {
    const currentSurface = getConsentExpansionSurface(current);
    const nextSurface = getConsentExpansionSurface(next);

    return (
        [...nextSurface.readCredentialCategories].some(
            category => !currentSurface.readCredentialCategories.has(category)
        ) ||
        [...nextSurface.readPersonalFields].some(
            field => !currentSurface.readPersonalFields.has(field)
        ) ||
        [...nextSurface.writeCredentialCategories].some(
            category => !currentSurface.writeCredentialCategories.has(category)
        )
    );
};

export const canonicalizeManifest = (manifest: AppManifest): string => {
    return canonicalJsonString(normalizeManifestForHash(manifest));
};

export const hashManifest = (manifest: AppManifest): string => {
    return createHash('sha256').update(canonicalizeManifest(manifest)).digest('hex');
};

export const diffManifests = (current: AppManifest, next: AppManifest): AppManifestDiff => {
    const currentTemplates = new Map(current.templates.map(template => [template.alias, template]));
    const nextTemplates = new Map(next.templates.map(template => [template.alias, template]));

    const addedTemplates: AppManifestTemplateRef[] = [];
    const removedTemplates: AppManifestTemplateRef[] = [];
    const changedTemplates: AppManifestDiff['templates']['changed'] = [];

    for (const [alias, template] of nextTemplates.entries()) {
        const existing = currentTemplates.get(alias);

        if (!existing) {
            addedTemplates.push(toTemplateRef(template));
            continue;
        }

        if (templateSignature(existing) !== templateSignature(template)) {
            changedTemplates.push({
                alias,
                fromVersion: existing.version,
                toVersion: template.version,
            });
        }
    }

    for (const [alias, template] of currentTemplates.entries()) {
        if (!nextTemplates.has(alias)) {
            removedTemplates.push(toTemplateRef(template));
        }
    }

    const permissionDiff = buildStringDiff(current.permissions, next.permissions);
    const consentScopeDiff = buildStringDiff(
        current.consentRequests.map(record =>
            canonicalConsentScopeString(normalizeConsentRecord(record).scopes)
        ),
        next.consentRequests.map(record =>
            canonicalConsentScopeString(normalizeConsentRecord(record).scopes)
        )
    );

    return {
        permissions: permissionDiff,
        templates: {
            added: addedTemplates.sort(
                (a, b) => a.alias.localeCompare(b.alias) || a.version - b.version
            ),
            removed: removedTemplates.sort(
                (a, b) => a.alias.localeCompare(b.alias) || a.version - b.version
            ),
            changed: changedTemplates.sort(
                (a, b) => a.alias.localeCompare(b.alias) || a.toVersion - b.toVersion
            ),
        },
        consentScopes: consentScopeDiff,
        featurePaths: buildStringDiff(current.featuresLaunched, next.featuresLaunched),
        counterKeys: buildStringDiff(current.counterKeys, next.counterKeys),
        // Advisory flag only: surfaced to clients for review UX. The server does not
        // currently gate applyManifestVersion on it (enforcement is a deferred product
        // decision).
        requiresReview: permissionDiff.added.length > 0 || isConsentExpanded(current, next),
    };
};
