import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useIonAlert } from '@ionic/react';
import { useQueryClient } from '@tanstack/react-query';

import {
    buildSimpleTemplate,
    getCurrentLCNUserDid,
    issueViaBoost,
} from '../../components/simple-send/simpleSend.helpers';
import { getTypeByObv3, type CredentialTypeEntry } from './components/credentialTypeCatalog';
import { prepareImportedTemplate } from './import/prepareImport';
import type { NormalizedImport, ImportProvenance } from './import/normalizeToObv3';
import { RecipientMode, Recipient, LinkOptions, recipientKey } from './components/recipientTypes';
import { getFriendlyIssueError, withTransientRetry, type IssueError } from './issueErrors';
import {
    useWallet,
    useToast,
    ToastTypeEnum,
    getLogger,
    useGetCurrentLCNUser,
    useSigningAuthority,
} from 'learn-card-base';
import { validateCredentialJsonLd } from '../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/validateJsonLd';
import {
    templateToJson,
    jsonToTemplate,
    extractVariablesByType,
} from '../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/utils';
import {
    staticField,
    type OBv3CredentialTemplate,
} from '../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';

import { getDefaultCategoryForCredential } from 'learn-card-base/helpers/credentialHelpers';
import { getFallBackImage } from 'learn-card-base/helpers/credentialHelpers';
import { CATEGORY_TO_ROUTE } from '../../helpers/categoryRoutes';
import type { CredentialCategoryEnum } from 'learn-card-base';

import { type VariableScope } from './components/DynamicFieldsSection';
import { applyVariableValues } from './components/variableSubstitution';
import { attachmentsToEvidence } from './components/mediaEvidence';
import type { SimpleMediaAttachment } from './components/MediaAttachments';
import { useCredentialIdentity } from './components/useCredentialIdentity';
import { mergeSkillAlignments, type ResolvedSkill } from './components/skillAlignment';
import type { SelectedSkill } from '../skills/skillTypes';
import { IssueCredentialView } from './IssueCredentialView';

const log = getLogger('issue-page');

interface IssueSuccessSnapshot {
    issuedUri: string;
    claimLink: string | null;
    template: OBv3CredentialTemplate;
    selectedType: CredentialTypeEntry | null;
    recipientMode: RecipientMode;
    recipients: Recipient[];
    linkOptions: LinkOptions;
    linkConsumed: boolean;
    variableValues: Record<string, string>;
    variableScope: VariableScope;
    recipientValues: Record<string, Record<string, string>>;
    recipientEvidence: Record<string, SimpleMediaAttachment[]>;
}

const SUCCESS_SNAPSHOT_KEY = 'issue-success-snapshot';

const readSuccessSnapshot = (): IssueSuccessSnapshot | null => {
    try {
        const raw = sessionStorage.getItem(SUCCESS_SNAPSHOT_KEY);
        return raw ? (JSON.parse(raw) as IssueSuccessSnapshot) : null;
    } catch (e) {
        log.warn('issue.snapshot_read_failed', e);
        return null;
    }
};

const writeSuccessSnapshot = (snapshot: IssueSuccessSnapshot): void => {
    try {
        sessionStorage.setItem(SUCCESS_SNAPSHOT_KEY, JSON.stringify(snapshot));
    } catch (e) {
        log.warn('issue.snapshot_write_failed', e);
    }
};

const clearSuccessSnapshot = (): void => {
    try {
        sessionStorage.removeItem(SUCCESS_SNAPSHOT_KEY);
    } catch (e) {
        log.warn('issue.snapshot_clear_failed', e);
    }
};

const IssueCredentialPage: React.FC = () => {
    const history = useHistory();
    const { initWallet, addVCtoWallet } = useWallet();
    const queryClient = useQueryClient();
    const { presentToast } = useToast();
    const { currentLCNUser } = useGetCurrentLCNUser();
    const { getRegisteredSigningAuthority, getRegisteredSigningAuthorities } =
        useSigningAuthority();
    const [presentAlert] = useIonAlert();

    const initialSnapshot = useMemo(() => readSuccessSnapshot(), []);

    const [selectedType, setSelectedType] = useState<CredentialTypeEntry | null>(
        initialSnapshot?.selectedType ?? null
    );
    const [template, setTemplate] = useState<OBv3CredentialTemplate | null>(
        initialSnapshot?.template ?? null
    );
    const [provenance, setProvenance] = useState<ImportProvenance | null>(null);
    const [showJson, setShowJson] = useState(false);
    const [jsonError, setJsonError] = useState<string | null>(null);
    const [variableValues, setVariableValues] = useState<Record<string, string>>(
        initialSnapshot?.variableValues ?? {}
    );
    const [variableScope, setVariableScope] = useState<VariableScope>(
        initialSnapshot?.variableScope ?? 'shared'
    );
    const [recipientValues, setRecipientValues] = useState<Record<string, Record<string, string>>>(
        initialSnapshot?.recipientValues ?? {}
    );
    const [recipientEvidence, setRecipientEvidence] = useState<
        Record<string, SimpleMediaAttachment[]>
    >(initialSnapshot?.recipientEvidence ?? {});

    const [recipientMode, setRecipientMode] = useState<RecipientMode>(
        initialSnapshot?.recipientMode ?? 'self'
    );
    const [recipients, setRecipients] = useState<Recipient[]>(initialSnapshot?.recipients ?? []);
    const [linkOptions, setLinkOptions] = useState<LinkOptions>(initialSnapshot?.linkOptions ?? {});

    const [selectedSkills, setSelectedSkills] = useState<SelectedSkill[]>([]);
    const [resolvedSkills, setResolvedSkills] = useState<ResolvedSkill[]>([]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<IssueError | null>(null);
    const [issuedUri, setIssuedUri] = useState<string | null>(initialSnapshot?.issuedUri ?? null);
    const [claimLink, setClaimLink] = useState<string | null>(initialSnapshot?.claimLink ?? null);
    const [linkConsumed, setLinkConsumed] = useState(initialSnapshot?.linkConsumed ?? false);

    const ach = template?.credentialSubject?.achievement;
    // A dynamic name carries its value in templateData (variableName), not in the
    // field itself, so its required-field check is satisfied by the dynamic-fields
    // gate below rather than a literal value.
    const nameIsDynamic = Boolean(ach?.name?.isDynamic && ach?.name?.variableName);
    const nameValid = nameIsDynamic || Boolean(ach?.name?.value?.trim());
    const detailsValid = nameValid;
    const recipientValid =
        recipientMode === 'self' ||
        recipientMode === 'link' ||
        (recipientMode === 'people' && recipients.length > 0);

    // CLR / custom VCs are authored as raw JSON: the single-achievement form
    // can't represent them and would drop their rawJson, so the form is locked off.
    const jsonOnly = Boolean(template?.schemaType && template.schemaType !== 'obv3');
    const viewingJson = showJson || jsonOnly;

    const dynamicVars = useMemo(
        () => (template ? extractVariablesByType(template).dynamic : []),
        [template]
    );

    const usePerRecipient =
        recipientMode === 'people' && recipients.length > 1 && variableScope === 'perRecipient';

    const unfilledCount = usePerRecipient
        ? recipients.reduce(
              (acc, r) =>
                  acc +
                  dynamicVars.filter(v => !recipientValues[recipientKey(r)]?.[v]?.trim()).length,
              0
          )
        : dynamicVars.filter(v => !variableValues[v]?.trim()).length;
    const allVariablesFilled = dynamicVars.length === 0 || unfilledCount === 0;

    // Validate against a filled copy (the first recipient's values when per-recipient,
    // otherwise the shared values) so required fields are checked against real input,
    // while the editor JSON itself keeps its {{placeholders}}.
    const previewValues = useMemo<Record<string, string>>(() => {
        if (usePerRecipient && recipients[0])
            return recipientValues[recipientKey(recipients[0])] ?? {};
        return variableValues;
    }, [usePerRecipient, recipients, recipientValues, variableValues]);

    const hasRecipientEvidence = recipients.some(
        r => (recipientEvidence[recipientKey(r)]?.length ?? 0) > 0
    );

    // Per-recipient templateData: each recipient's variable values merged with
    // their evidence as OBv3 `evidence`, which the network appends at send time.
    const recipientTemplateData = useMemo<
        Record<string, Record<string, unknown>> | undefined
    >(() => {
        if (recipientMode !== 'people' || (!usePerRecipient && !hasRecipientEvidence)) {
            return undefined;
        }
        const out: Record<string, Record<string, unknown>> = {};
        for (const recipient of recipients) {
            const key = recipientKey(recipient);
            const values = usePerRecipient ? recipientValues[key] ?? {} : variableValues;
            const evidence = attachmentsToEvidence(recipientEvidence[key] ?? []);
            const data: Record<string, unknown> = { ...values };
            if (evidence.length > 0) {
                data.evidence = evidence;
            }
            out[key] = data;
        }
        return out;
    }, [
        recipientMode,
        usePerRecipient,
        hasRecipientEvidence,
        recipients,
        recipientValues,
        variableValues,
        recipientEvidence,
    ]);

    // The template keeps its {{placeholders}} — filled values are applied at
    // issuance via LearnCard's templateData, not baked into the JSON, so the
    // boost stays a reusable dynamic template.
    const issuableJson = useMemo<Record<string, unknown> | null>(
        () => (template ? templateToJson(template) : null),
        [template]
    );
    const validationJson = useMemo<Record<string, unknown> | null>(
        () => (issuableJson ? applyVariableValues(issuableJson, previewValues) : null),
        [issuableJson, previewValues]
    );
    const identity = useCredentialIdentity(validationJson, jsonError);

    const canIssue =
        Boolean(template) &&
        recipientValid &&
        !isSubmitting &&
        !jsonError &&
        allVariablesFilled &&
        (jsonOnly ? identity.status === 'valid' : detailsValid);

    const issuerName = currentLCNUser?.displayName?.trim() || 'You';
    const issuerImage = currentLCNUser?.image || undefined;

    const provenanceLabel = !provenance
        ? null
        : provenance.source === 'credential-engine'
        ? 'Credential Engine'
        : provenance.source === 'reuse'
        ? 'your library'
        : provenance.label || 'an external source';

    const missingHint = !template
        ? 'Pick a type to begin'
        : jsonError
        ? 'Fix the JSON to continue'
        : viewingJson && identity.status === 'invalid'
        ? identity.reason
        : !jsonOnly && !nameValid
        ? 'Add a name to continue'
        : !allVariablesFilled
        ? `Fill in ${unfilledCount} detail${unfilledCount === 1 ? '' : 's'} to continue`
        : !recipientValid
        ? 'Add a recipient to continue'
        : null;

    const handleSelectType = useCallback((entry: CredentialTypeEntry) => {
        log.info('issue.type_selected', { obv3Type: entry.obv3Type });
        setSelectedType(entry);
        setVariableValues({});
        setRecipientValues({});
        setTemplate(() => {
            const base = buildSimpleTemplate({
                credentialType: entry.baseSimpleType,
                name: '',
                description: '',
            });
            return {
                ...base,
                credentialSubject: {
                    ...base.credentialSubject,
                    achievement: {
                        ...base.credentialSubject.achievement,
                        achievementType: staticField(entry.obv3Type),
                    },
                },
            };
        });
    }, []);

    const handleImport = useCallback(
        (result: NormalizedImport) => {
            log.info('issue.imported', { source: result.provenance.source });
            const { template: next, note } = prepareImportedTemplate(result);
            setTemplate(next);
            setVariableValues({});
            setRecipientValues({});
            const achievementType = next.credentialSubject.achievement.achievementType?.value;
            setSelectedType(
                (achievementType ? getTypeByObv3(achievementType) : undefined) ??
                    getTypeByObv3('Badge') ??
                    null
            );
            setProvenance(result.provenance);
            setError(null);
            if (note) {
                presentToast(note, { type: ToastTypeEnum.Success, hasDismissButton: true });
            }
        },
        [presentToast]
    );

    const handleResolvedSkillsChange = useCallback((resolved: ResolvedSkill[]) => {
        setResolvedSkills(resolved);
        setTemplate(prev => {
            if (!prev) return prev;
            const next = mergeSkillAlignments(
                prev.credentialSubject.achievement.alignment,
                resolved
            );
            return {
                ...prev,
                credentialSubject: {
                    ...prev.credentialSubject,
                    achievement: {
                        ...prev.credentialSubject.achievement,
                        alignment: next.length > 0 ? next : undefined,
                    },
                },
            };
        });
    }, []);

    const handleJsonChange = useCallback((json: Record<string, unknown>) => {
        setTemplate(jsonToTemplate(json));
        setError(null);
    }, []);

    const handleVariableChange = useCallback((name: string, value: string) => {
        setVariableValues(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleRecipientVariableChange = useCallback(
        (key: string, name: string, value: string) => {
            setRecipientValues(prev => ({
                ...prev,
                [key]: { ...(prev[key] ?? {}), [name]: value },
            }));
        },
        []
    );

    const handleRecipientEvidenceChange = useCallback(
        (key: string, attachments: SimpleMediaAttachment[]) => {
            setRecipientEvidence(prev => ({ ...prev, [key]: attachments }));
        },
        []
    );

    const previewCredential = useMemo<Record<string, unknown> | null>(() => {
        if (!template) return null;
        const json = applyVariableValues(templateToJson(template), previewValues);
        const fill = (obj: unknown): unknown => {
            if (typeof obj === 'string') {
                return obj.replace(/\{\{(\w+)\}\}/g, (_m, v) =>
                    /date|time/i.test(v) ? new Date().toISOString() : ''
                );
            }
            if (Array.isArray(obj)) return obj.map(fill);
            if (obj && typeof obj === 'object') {
                return Object.fromEntries(Object.entries(obj).map(([k, val]) => [k, fill(val)]));
            }
            return obj;
        };

        const filledJson = fill(json) as Record<string, unknown>;
        const rawSubject = filledJson.credentialSubject;
        // A custom VC may carry an array (or absent) credentialSubject; only the
        // single-object case can take the preview's name/image injection.
        const subjectObject =
            rawSubject && typeof rawSubject === 'object' && !Array.isArray(rawSubject)
                ? (rawSubject as Record<string, unknown>)
                : undefined;

        const previewCategory = getDefaultCategoryForCredential(filledJson as any) || 'Achievement';
        const fallbackImage = getFallBackImage(previewCategory);
        const selfIssuedDid = getCurrentLCNUserDid(currentLCNUser?.profileId);

        let credentialSubjectName: string | undefined;
        let credentialSubjectImage: string | undefined;
        let showIssuerImage = true;

        // getImageUrlFromCredential ranks credentialSubject.image above
        // achievement.image, so a recipient photo would hide the badge artwork.
        // The issued credential never sets credentialSubject.image; only inject
        // it here when there's no badge image, keeping the preview faithful.
        const hasBadgeImage = Boolean(
            (filledJson as Record<string, unknown>).image || ach?.image?.value
        );

        if (recipientMode === 'self') {
            credentialSubjectName = currentLCNUser?.displayName || issuerName;
            credentialSubjectImage = hasBadgeImage ? undefined : fallbackImage;
        } else if (
            recipientMode === 'people' &&
            recipients.length === 1 &&
            recipients[0].kind === 'profile'
        ) {
            credentialSubjectName = recipients[0].displayName;
            credentialSubjectImage = hasBadgeImage ? undefined : fallbackImage;
        } else {
            // No specific recipient yet (link / anyone / email / multiple): don't
            // let the badge fall back to the issuer's photo — show the category's
            // default artwork instead so the issuer isn't mistaken for the holder.
            showIssuerImage = false;
        }

        if (subjectObject && recipientMode === 'self' && selfIssuedDid) {
            subjectObject.id = selfIssuedDid;
        }

        return {
            ...filledJson,
            issuer: {
                id: recipientMode === 'self' && selfIssuedDid ? selfIssuedDid : 'did:web:preview',
                name: issuerName,
                ...(showIssuerImage && issuerImage ? { image: issuerImage } : {}),
            },
            credentialSubject: subjectObject
                ? {
                      ...subjectObject,
                      ...(credentialSubjectName ? { name: credentialSubjectName } : {}),
                      ...(credentialSubjectImage
                          ? { image: credentialSubjectImage }
                          : fallbackImage
                          ? { image: fallbackImage }
                          : {}),
                  }
                : rawSubject,
            validFrom: new Date().toISOString(),
        };
    }, [
        template,
        issuerName,
        issuerImage,
        currentLCNUser?.displayName,
        currentLCNUser?.profileId,
        recipientMode,
        recipients,
        previewValues,
    ]);

    const previewCardCredential = useMemo<Record<string, unknown> | null>(() => {
        if (!previewCredential) return null;

        const credential = { ...previewCredential } as Record<string, unknown>;
        const subject = credential.credentialSubject;
        const hasExplicitImage = Boolean(
            credential.image ||
                (subject &&
                    typeof subject === 'object' &&
                    !Array.isArray(subject) &&
                    (subject as Record<string, unknown>).achievement &&
                    typeof (subject as Record<string, unknown>).achievement === 'object' &&
                    !Array.isArray((subject as Record<string, unknown>).achievement) &&
                    (subject as Record<string, unknown>).achievement &&
                    typeof (
                        (subject as Record<string, unknown>).achievement as Record<string, unknown>
                    ).image === 'string')
        );

        if (hasExplicitImage && subject && typeof subject === 'object' && !Array.isArray(subject)) {
            const sanitizedSubject = { ...(subject as Record<string, unknown>) };
            delete sanitizedSubject.image;
            credential.credentialSubject = sanitizedSubject;
        }

        return credential;
    }, [previewCredential]);

    const handleIssue = useCallback(async () => {
        if (!template || !canIssue) return;
        setError(null);
        setIsSubmitting(true);
        try {
            const wallet = await initWallet();
            const jsonLd = await validateCredentialJsonLd(templateToJson(template), {
                allowRemoteContexts: true,
            });
            if (!jsonLd.valid) {
                log.warn('issue.validation_failed', { errors: jsonLd.errors });
                setError({
                    message:
                        "Some details on this credential aren't valid yet. Please review and try again.",
                    canRetry: false,
                });
                setIsSubmitting(false);
                return;
            }

            let claimLinkSA: { name?: string; endpoint?: string } | undefined;

            // Email recipients are delivered to an inbox and signed server-side,
            // which requires a registered signing authority on the account. Link
            // mode needs one too. Ensure one exists before issuing.
            const hasEmailRecipient =
                recipientMode === 'people' && recipients.some(r => r.kind === 'email');

            if (recipientMode === 'link') {
                const rsas = await getRegisteredSigningAuthorities(wallet);
                if (rsas && rsas.length > 0) {
                    const rsa = rsas[0];
                    claimLinkSA = {
                        name: rsa?.relationship?.name,
                        endpoint: rsa?.signingAuthority?.endpoint,
                    };
                } else {
                    const { registeredSigningAuthority: rsa, signingAuthority: sa } =
                        await getRegisteredSigningAuthority(wallet);
                    if (sa) {
                        claimLinkSA = {
                            name: sa.name,
                            endpoint: sa.endpoint,
                        };
                    }
                }
            } else if (hasEmailRecipient) {
                await getRegisteredSigningAuthority(wallet);
            }

            const result = await withTransientRetry(() =>
                issueViaBoost(wallet, template, {
                    mode: recipientMode,
                    recipients,
                    linkOptions,
                    currentLCNUser: currentLCNUser ?? undefined,
                    claimLinkSA,
                    variableValues,
                    variableValuesByRecipient: recipientTemplateData,
                })
            );

            if (result.credentialUri) {
                await addVCtoWallet({ uri: result.credentialUri });

                await queryClient.invalidateQueries({
                    queryKey: ['useConsentedContracts'],
                });
                await queryClient.invalidateQueries({ queryKey: ['useConsentFlowData'] });
                await queryClient.invalidateQueries({
                    queryKey: ['useConsentFlowDataForDid'],
                });
                await queryClient.invalidateQueries({
                    queryKey: ['useConsentFlowDataForDidByCategory'],
                });
                await queryClient.invalidateQueries({
                    queryKey: ['useResolvedConsentFlowDataForDid'],
                });
            }

            presentToast('Credential issued.', {
                type: ToastTypeEnum.Success,
                hasDismissButton: true,
            });
            setIssuedUri(result.credentialUri);
            if (result.claimLink) {
                setClaimLink(result.claimLink);
            }
        } catch (e) {
            log.error('issue.failed', e);
            setError(getFriendlyIssueError(e, recipientMode));
        } finally {
            setIsSubmitting(false);
        }
    }, [
        template,
        canIssue,
        initWallet,
        recipientMode,
        recipients,
        linkOptions,
        currentLCNUser,
        variableValues,
        recipientTemplateData,
        presentToast,
        getRegisteredSigningAuthorities,
        getRegisteredSigningAuthority,
    ]);

    useEffect(() => {
        if (!issuedUri || !template) return;
        writeSuccessSnapshot({
            issuedUri,
            claimLink,
            template,
            selectedType,
            recipientMode,
            recipients,
            linkOptions,
            linkConsumed,
            variableValues,
            variableScope,
            recipientValues,
            recipientEvidence,
        });
    }, [
        issuedUri,
        claimLink,
        template,
        selectedType,
        recipientMode,
        recipients,
        linkOptions,
        linkConsumed,
        variableValues,
        variableScope,
        recipientValues,
        recipientEvidence,
    ]);

    const reset = useCallback(() => {
        clearSuccessSnapshot();
        setIssuedUri(null);
        setClaimLink(null);
        setLinkConsumed(false);
        setSelectedType(null);
        setTemplate(null);
        setProvenance(null);
        setShowJson(false);
        setJsonError(null);
        setVariableValues({});
        setVariableScope('shared');
        setRecipientValues({});
        setRecipientEvidence({});
        setRecipientMode('self');
        setRecipients([]);
        setLinkOptions({});
        setSelectedSkills([]);
        setResolvedSkills([]);
        setError(null);
    }, []);

    const handleIssueAnother = useCallback(() => {
        if (claimLink && !linkConsumed) {
            presentAlert({
                header: 'Discard this link?',
                message:
                    "You haven't copied or shared this claim link yet. If you start over, it'll be cleared.",
                buttons: [
                    { text: 'Keep', role: 'cancel' },
                    { text: 'Discard', role: 'destructive', handler: () => reset() },
                ],
            });
            return;
        }
        reset();
    }, [claimLink, linkConsumed, presentAlert, reset]);

    const handleBack = useCallback(() => history.goBack(), [history]);
    const handleToggleJson = useCallback(() => setShowJson(v => !v), []);
    const handleDismissProvenance = useCallback(() => setProvenance(null), []);
    const handleLinkConsumed = useCallback(() => setLinkConsumed(true), []);

    const handleViewWallet = useCallback(() => {
        clearSuccessSnapshot();
        const category = previewCredential
            ? getDefaultCategoryForCredential(previewCredential as any)
            : undefined;
        const route =
            recipientMode === 'self' && category
                ? CATEGORY_TO_ROUTE[category as CredentialCategoryEnum]
                : undefined;
        history.push(route ?? '/wallet');
    }, [previewCredential, recipientMode, history]);

    return (
        <IssueCredentialView
            issuedUri={issuedUri}
            previewCredential={previewCardCredential}
            selectedType={selectedType}
            template={template}
            recipientMode={recipientMode}
            recipients={recipients}
            linkOptions={linkOptions}
            claimLink={claimLink}
            provenance={provenance}
            provenanceLabel={provenanceLabel}
            error={error}
            isSubmitting={isSubmitting}
            canIssue={canIssue}
            missingHint={missingHint}
            showJson={showJson}
            jsonOnly={jsonOnly}
            viewingJson={viewingJson}
            issuableJson={issuableJson}
            identity={identity}
            dynamicVars={dynamicVars}
            variableScope={variableScope}
            variableValues={variableValues}
            recipientValues={recipientValues}
            recipientEvidence={recipientEvidence}
            selectedSkills={selectedSkills}
            resolvedSkills={resolvedSkills}
            onBack={handleBack}
            onIssue={handleIssue}
            onIssueAnother={handleIssueAnother}
            onViewWallet={handleViewWallet}
            onLinkConsumed={handleLinkConsumed}
            onToggleJson={handleToggleJson}
            onDismissProvenance={handleDismissProvenance}
            onSelectType={handleSelectType}
            onChangeTemplate={setTemplate}
            onImport={handleImport}
            onRecipientModeChange={setRecipientMode}
            onRecipientsChange={setRecipients}
            onLinkOptionsChange={setLinkOptions}
            onSelectedSkillsChange={setSelectedSkills}
            onResolvedSkillsChange={handleResolvedSkillsChange}
            onJsonChange={handleJsonChange}
            onParseError={setJsonError}
            onScopeChange={setVariableScope}
            onSharedVariableChange={handleVariableChange}
            onRecipientVariableChange={handleRecipientVariableChange}
            onRecipientEvidenceChange={handleRecipientEvidenceChange}
        />
    );
};

export default IssueCredentialPage;
