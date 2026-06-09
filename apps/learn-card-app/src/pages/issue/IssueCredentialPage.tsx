import React, { useCallback, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { IonContent, IonPage } from '@ionic/react';
import { ArrowLeft, Code } from 'lucide-react';

import MainHeader from '../../components/main-header/MainHeader';
import {
    SimpleSendRecipient,
    buildSimpleTemplate,
    issueAndSendCredential,
    issueViaBoost,
} from '../../components/simple-send/simpleSend.helpers';
import type { CredentialTypeEntry } from './components/credentialTypeCatalog';
import { RecipientMode, Recipient, LinkOptions } from './components/recipientTypes';
import {
    useWallet,
    useToast,
    ToastTypeEnum,
    getLogger,
    useGetCurrentLCNUser,
} from 'learn-card-base';
import { validateCredentialJsonLd } from '../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/validateJsonLd';
import { templateToJson } from '../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/utils';
import {
    staticField,
    type OBv3CredentialTemplate,
} from '../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';

import { HeroCanvas } from './components/HeroCanvas';
import { IssuePalette } from './components/IssuePalette';
import { JsonLens } from './components/JsonLens';
import { IssueSuccess } from './components/IssueSuccess';
import { skillsToAlignmentTemplates, type ResolvedSkill } from './components/skillAlignment';
import type { SelectedSkill } from '../skills/skillTypes';

const log = getLogger('issue-page');

const IssueCredentialPage: React.FC = () => {
    const history = useHistory();
    const { initWallet } = useWallet();
    const { presentToast } = useToast();
    const { currentLCNUser } = useGetCurrentLCNUser();

    const [selectedType, setSelectedType] = useState<CredentialTypeEntry | null>(null);
    const [template, setTemplate] = useState<OBv3CredentialTemplate | null>(null);
    const [showJson, setShowJson] = useState(false);

    const [recipientMode, setRecipientMode] = useState<RecipientMode>('self');
    const [recipients, setRecipients] = useState<Recipient[]>([]);
    const [linkOptions, setLinkOptions] = useState<LinkOptions>({});

    const [selectedSkills, setSelectedSkills] = useState<SelectedSkill[]>([]);
    const [resolvedSkills, setResolvedSkills] = useState<ResolvedSkill[]>([]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [issuedUri, setIssuedUri] = useState<string | null>(null);
    const [claimLink, setClaimLink] = useState<string | null>(null);

    const ach = template?.credentialSubject?.achievement;
    const nameValid = Boolean(ach?.name?.value?.trim());
    const detailsValid = nameValid;
    const recipientValid =
        recipientMode === 'self' ||
        recipientMode === 'link' ||
        (recipientMode === 'people' && recipients.length > 0);
    const canIssue = Boolean(template) && detailsValid && recipientValid && !isSubmitting;

    const issuerName = currentLCNUser?.displayName?.trim() || 'You';
    const issuerImage = currentLCNUser?.image || undefined;

    const missingHint = !template
        ? 'Pick a type to begin'
        : !nameValid
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

        let credentialSubjectName = undefined;
        let credentialSubjectImage = undefined;

        if (
            recipientMode === 'people' &&
            recipients.length === 1 &&
            recipients[0].kind === 'profile'
        ) {
            credentialSubjectName = recipients[0].displayName;
            credentialSubjectImage = recipients[0].image;
        }

        return {
            ...(fill(json) as Record<string, unknown>),
            issuer: {
                id: currentLCNUser?.did || 'did:web:preview',
                name: issuerName,
                ...(issuerImage ? { image: issuerImage } : {}),
            },
            credentialSubject: {
                ...((fill(json) as any).credentialSubject || {}),
                ...(credentialSubjectName ? { name: credentialSubjectName } : {}),
                ...(credentialSubjectImage ? { image: credentialSubjectImage } : {}),
            },
            validFrom: new Date().toISOString(),
        };
    }, [template, issuerName, issuerImage, currentLCNUser?.did, recipientMode, recipients]);

    const handleIssue = useCallback(async () => {
        if (!template || !canIssue) return;
        setError(null);
        setIsSubmitting(true);
        try {
            const wallet = await initWallet();
            const jsonLd = await validateCredentialJsonLd(templateToJson(template));
            if (!jsonLd.valid) {
                setError(jsonLd.errors.join('; '));
                setIsSubmitting(false);
                return;
            }

            const result = await issueViaBoost(wallet, template, {
                mode: recipientMode,
                recipients,
                linkOptions,
                currentLCNUser,
            });

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
            const message = (e as Error)?.message ?? '';
            setError(
                /network|fetch|connection/i.test(message)
                    ? 'Connection issue. Please check your internet and try again.'
                    : 'Something went wrong issuing your credential. Please try again.'
            );
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
    ]);

    const reset = useCallback(() => {
        setIssuedUri(null);
        setClaimLink(null);
        setSelectedType(null);
        setTemplate(null);
        setRecipientMode('self');
        setRecipients([]);
        setLinkOptions({});
        setSelectedSkills([]);
        setResolvedSkills([]);
        setError(null);
    }, []);

    return (
        <IonPage className="bg-white">
            <MainHeader showBackButton customClassName="bg-white" />
            <IonContent>
                {issuedUri ? (
                    <IssueSuccess
                        credentialUri={issuedUri}
                        credential={previewCredential}
                        credentialType={selectedType?.baseSimpleType ?? null}
                        claimLink={claimLink}
                        onIssueAnother={reset}
                        onViewWallet={() => history.push('/wallet')}
                    />
                ) : (
                    <div className="font-poppins min-h-full bg-grayscale-10">
                        <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-grayscale-200">
                            <div className="max-w-[1100px] mx-auto px-6 py-3 flex items-center justify-between gap-3">
                                <button
                                    type="button"
                                    onClick={() => history.goBack()}
                                    className="flex items-center gap-1 text-sm text-grayscale-600 hover:text-grayscale-900 transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Back
                                </button>

                                <div className="flex items-center gap-2">
                                    {template && (
                                        <button
                                            type="button"
                                            onClick={() => setShowJson(v => !v)}
                                            className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-colors ${
                                                showJson
                                                    ? 'bg-grayscale-900 text-white'
                                                    : 'bg-grayscale-100 text-grayscale-700 hover:bg-grayscale-200'
                                            }`}
                                        >
                                            <Code className="w-3.5 h-3.5" />
                                            JSON
                                        </button>
                                    )}
                                    <div className="flex flex-col items-end gap-1">
                                        <button
                                            type="button"
                                            onClick={handleIssue}
                                            disabled={!canIssue}
                                            className="py-2.5 px-5 rounded-full bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            {isSubmitting ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    Issuing...
                                                </span>
                                            ) : (
                                                'Issue Credential'
                                            )}
                                        </button>
                                        {!canIssue && !isSubmitting && missingHint && (
                                            <span className="text-xs font-medium text-amber-600 leading-none animate-fade-in-up">
                                                {missingHint}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="max-w-[1100px] mx-auto px-6 py-8 flex flex-col-reverse desktop:flex-row desktop:items-start gap-8">
                            <div className="flex-1 desktop:min-w-0">
                                {error && (
                                    <div className="mb-5 p-3 bg-red-50 border border-red-100 rounded-2xl">
                                        <span className="text-sm text-red-700 leading-relaxed">
                                            {error}
                                        </span>
                                    </div>
                                )}

                                {showJson && previewCredential ? (
                                    <JsonLens credential={previewCredential} />
                                ) : (
                                    <IssuePalette
                                        selectedType={selectedType}
                                        template={template}
                                        onSelectType={handleSelectType}
                                        onChangeTemplate={setTemplate}
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
