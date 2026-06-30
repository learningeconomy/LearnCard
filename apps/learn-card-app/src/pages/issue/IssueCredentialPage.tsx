import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { IonContent, IonPage, useIonAlert } from '@ionic/react';
import { ArrowLeft, Code, Database, RotateCcw, X, AlertCircle } from 'lucide-react';

import MainHeader from '../../components/main-header/MainHeader';
import {
    buildSimpleTemplate,
    issueViaBoost,
} from '../../components/simple-send/simpleSend.helpers';
import { getTypeByObv3, type CredentialTypeEntry } from './components/credentialTypeCatalog';
import { prepareImportedTemplate } from './import/prepareImport';
import type { NormalizedImport, ImportProvenance } from './import/normalizeToObv3';
import { RecipientMode, Recipient, LinkOptions } from './components/recipientTypes';
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
} from '../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/utils';
import {
    staticField,
    type OBv3CredentialTemplate,
} from '../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';

import { getDefaultCategoryForCredential } from 'learn-card-base/helpers/credentialHelpers';
import { CATEGORY_TO_ROUTE } from '../../helpers/categoryRoutes';
import type { CredentialCategoryEnum } from 'learn-card-base';

import { HeroCanvas } from './components/HeroCanvas';
import { IssuePalette } from './components/IssuePalette';
import { JsonStudio } from './components/JsonStudio';
import { useCredentialIdentity } from './components/useCredentialIdentity';
import { IssueSuccess } from './components/IssueSuccess';
import { skillsToAlignmentTemplates, type ResolvedSkill } from './components/skillAlignment';
import type { SelectedSkill } from '../skills/skillTypes';

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
    const { initWallet } = useWallet();
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
    const nameValid = Boolean(ach?.name?.value?.trim());
    const detailsValid = nameValid;
    const recipientValid =
        recipientMode === 'self' ||
        recipientMode === 'link' ||
        (recipientMode === 'people' && recipients.length > 0);

    // CLR / custom VCs are authored as raw JSON: the single-achievement form
    // can't represent them and would drop their rawJson, so the form is locked off.
    const jsonOnly = Boolean(template?.schemaType && template.schemaType !== 'obv3');
    const viewingJson = showJson || jsonOnly;

    const issuableJson = useMemo<Record<string, unknown> | null>(
        () => (template ? templateToJson(template) : null),
        [template]
    );
    const identity = useCredentialIdentity(issuableJson, jsonError);

    const canIssue =
        Boolean(template) &&
        recipientValid &&
        !isSubmitting &&
        !jsonError &&
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
        : !recipientValid
        ? 'Add a recipient to continue'
        : null;

    const handleSelectType = useCallback((entry: CredentialTypeEntry) => {
        log.info('issue.type_selected', { obv3Type: entry.obv3Type });
        setSelectedType(entry);
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
            const alignment = skillsToAlignmentTemplates(resolved);
            return {
                ...prev,
                credentialSubject: {
                    ...prev.credentialSubject,
                    achievement: {
                        ...prev.credentialSubject.achievement,
                        alignment: alignment.length > 0 ? alignment : undefined,
                    },
                },
            };
        });
    }, []);

    const handleJsonChange = useCallback((json: Record<string, unknown>) => {
        setTemplate(jsonToTemplate(json));
        setError(null);
    }, []);

    const previewCredential = useMemo<Record<string, unknown> | null>(() => {
        if (!template) return null;
        const json = templateToJson(template);
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

        let credentialSubjectName: string | undefined;
        let credentialSubjectImage: string | undefined;
        let showIssuerImage = true;

        // getImageUrlFromCredential ranks credentialSubject.image above
        // achievement.image, so a recipient photo would hide the badge artwork.
        // The issued credential never sets credentialSubject.image; only inject
        // it here when there's no badge image, keeping the preview faithful.
        const hasBadgeImage = Boolean(ach?.image?.value);

        if (recipientMode === 'self') {
            credentialSubjectName = currentLCNUser?.displayName || issuerName;
            credentialSubjectImage = hasBadgeImage ? undefined : issuerImage;
        } else if (
            recipientMode === 'people' &&
            recipients.length === 1 &&
            recipients[0].kind === 'profile'
        ) {
            credentialSubjectName = recipients[0].displayName;
            credentialSubjectImage = hasBadgeImage ? undefined : recipients[0].image;
        } else {
            // No specific recipient yet (link / anyone / email / multiple): don't
            // let the badge fall back to the issuer's photo — show the category's
            // default artwork instead so the issuer isn't mistaken for the holder.
            showIssuerImage = false;
        }

        const filledJson = fill(json) as Record<string, unknown>;
        const rawSubject = filledJson.credentialSubject;
        // A custom VC may carry an array (or absent) credentialSubject; only the
        // single-object case can take the preview's name/image injection.
        const subjectObject =
            rawSubject && typeof rawSubject === 'object' && !Array.isArray(rawSubject)
                ? (rawSubject as Record<string, unknown>)
                : undefined;

        return {
            ...filledJson,
            issuer: {
                id: currentLCNUser?.did || 'did:web:preview',
                name: issuerName,
                ...(showIssuerImage && issuerImage ? { image: issuerImage } : {}),
            },
            credentialSubject: subjectObject
                ? {
                      ...subjectObject,
                      ...(credentialSubjectName ? { name: credentialSubjectName } : {}),
                      ...(credentialSubjectImage ? { image: credentialSubjectImage } : {}),
                  }
                : rawSubject,
            validFrom: new Date().toISOString(),
        };
    }, [
        template,
        issuerName,
        issuerImage,
        currentLCNUser?.did,
        currentLCNUser?.displayName,
        recipientMode,
        recipients,
    ]);

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
                    currentLCNUser,
                    claimLinkSA,
                })
            );

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

    return (
        <IonPage className="bg-white">
            <MainHeader showBackButton customClassName="bg-white" />
            <IonContent>
                {issuedUri ? (
                    <IssueSuccess
                        credential={previewCredential}
                        credentialType={selectedType?.baseSimpleType ?? null}
                        recipientMode={recipientMode}
                        recipients={recipients}
                        claimLink={claimLink}
                        linkOptions={linkOptions}
                        onIssueAnother={handleIssueAnother}
                        onLinkConsumed={() => setLinkConsumed(true)}
                        onViewWallet={() => {
                            clearSuccessSnapshot();
                            const category = previewCredential
                                ? getDefaultCategoryForCredential(previewCredential as any)
                                : undefined;
                            const route =
                                recipientMode === 'self' && category
                                    ? CATEGORY_TO_ROUTE[category as CredentialCategoryEnum]
                                    : undefined;
                            history.push(route ?? '/wallet');
                        }}
                    />
                ) : (
                    <div className="font-poppins min-h-full bg-grayscale-10">
                        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-grayscale-200/60 transition-all duration-300">
                            <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-2 sm:gap-4">
                                <button
                                    type="button"
                                    onClick={() => history.goBack()}
                                    className="flex items-center gap-1.5 text-sm font-medium text-grayscale-500 hover:text-grayscale-900 transition-colors group shrink-0"
                                >
                                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                                    Back
                                </button>

                                <div className="flex items-center gap-2 sm:gap-3">
                                    {!canIssue && !isSubmitting && missingHint && (
                                        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-100/50 animate-fade-in-up">
                                            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                                            <span className="text-xs font-medium text-amber-700">
                                                {missingHint}
                                            </span>
                                        </div>
                                    )}

                                    {template && jsonOnly ? (
                                        <span className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-full text-xs font-medium bg-grayscale-900 text-white shadow-md">
                                            <Code className="w-3.5 h-3.5" />
                                            <span className="hidden sm:inline">JSON</span>
                                        </span>
                                    ) : template ? (
                                        <button
                                            type="button"
                                            onClick={() => setShowJson(v => !v)}
                                            className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-full text-xs font-medium transition-all duration-200 ${
                                                showJson
                                                    ? 'bg-grayscale-900 text-white shadow-md'
                                                    : 'bg-grayscale-100 text-grayscale-700 hover:bg-grayscale-200 hover:text-grayscale-900'
                                            }`}
                                        >
                                            <Code className="w-3.5 h-3.5" />
                                            <span className="hidden sm:inline">JSON</span>
                                        </button>
                                    ) : null}

                                    <button
                                        type="button"
                                        onClick={handleIssue}
                                        disabled={!canIssue}
                                        className="relative overflow-hidden py-2.5 px-4 sm:px-6 rounded-full bg-grayscale-900 text-white font-medium text-sm hover:bg-grayscale-800 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-grayscale-900 shadow-sm hover:shadow-md active:scale-[0.98] shrink-0"
                                    >
                                        {isSubmitting ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Issuing...
                                            </span>
                                        ) : (
                                            <>
                                                <span className="sm:hidden">Issue</span>
                                                <span className="hidden sm:inline">
                                                    Issue Credential
                                                </span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                            {!canIssue && !isSubmitting && missingHint && (
                                <div className="sm:hidden bg-amber-50 border-t border-amber-100/50 px-4 py-2 flex items-center justify-center gap-1.5 animate-fade-in-up">
                                    <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                                    <span className="text-xs font-medium text-amber-700">
                                        {missingHint}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="max-w-[1100px] mx-auto px-6 py-8 flex flex-col-reverse desktop:flex-row desktop:items-start gap-8">
                            <div className="flex-1 desktop:min-w-0">
                                {provenance && !showJson && (
                                    <div className="mb-4 inline-flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 animate-fade-in-up">
                                        {provenance.source === 'reuse' ? (
                                            <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                                        ) : (
                                            <Database className="w-3.5 h-3.5 text-emerald-600" />
                                        )}
                                        <span className="text-xs font-medium text-emerald-700">
                                            Imported from {provenanceLabel}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setProvenance(null)}
                                            className="text-emerald-500 hover:text-emerald-700 transition-colors"
                                            aria-label="Dismiss"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}
                                {error && (
                                    <div className="mb-5 p-3 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5">
                                        <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <span className="text-sm text-red-700 leading-relaxed">
                                                {error.message}
                                            </span>
                                            {error.canRetry && (
                                                <button
                                                    type="button"
                                                    onClick={handleIssue}
                                                    disabled={isSubmitting}
                                                    className="mt-2 flex items-center gap-1.5 text-sm font-medium text-red-700 hover:text-red-900 transition-colors disabled:opacity-50"
                                                >
                                                    <RotateCcw className="w-3.5 h-3.5" />
                                                    Try Again
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {viewingJson && issuableJson ? (
                                    <JsonStudio
                                        credential={issuableJson}
                                        identity={identity}
                                        onChange={handleJsonChange}
                                        onParseError={setJsonError}
                                    />
                                ) : (
                                    <IssuePalette
                                        selectedType={selectedType}
                                        template={template}
                                        onSelectType={handleSelectType}
                                        onChangeTemplate={setTemplate}
                                        onImport={handleImport}
                                        recipientMode={recipientMode}
                                        recipients={recipients}
                                        linkOptions={linkOptions}
                                        onRecipientModeChange={setRecipientMode}
                                        onRecipientsChange={setRecipients}
                                        onLinkOptionsChange={setLinkOptions}
                                        selectedSkills={selectedSkills}
                                        resolvedSkills={resolvedSkills}
                                        onSelectedSkillsChange={setSelectedSkills}
                                        onResolvedSkillsChange={handleResolvedSkillsChange}
                                    />
                                )}
                            </div>

                            <div className="desktop:w-[340px] shrink-0 desktop:sticky desktop:top-[84px]">
                                <HeroCanvas
                                    credential={previewCredential}
                                    credentialType={selectedType?.baseSimpleType ?? null}
                                    cardTitle={ach?.name?.value ?? ''}
                                    hasImage={Boolean(ach?.image?.value)}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </IonContent>
        </IonPage>
    );
};

export default IssueCredentialPage;
