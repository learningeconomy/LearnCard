import React from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { ArrowLeft, Code, Database, RotateCcw, X, AlertCircle } from 'lucide-react';

import MainHeader from '../../components/main-header/MainHeader';
import { IssuePalette } from './components/IssuePalette';
import { JsonStudio } from './components/JsonStudio';
import { DynamicFieldsSection, type VariableScope } from './components/DynamicFieldsSection';
import { RecipientPicker } from './components/RecipientPicker';
import { RecipientEvidenceSection } from './components/RecipientEvidenceSection';
import { IssueSuccess } from './components/IssueSuccess';
import { HeroCanvas } from './components/HeroCanvas';
import type { CredentialTypeEntry } from './components/credentialTypeCatalog';
import type { CredentialIdentity } from './components/useCredentialIdentity';
import type { RecipientMode, Recipient, LinkOptions } from './components/recipientTypes';
import type { ImportProvenance, NormalizedImport } from './import/normalizeToObv3';
import type { IssueError } from './issueErrors';
import type { ResolvedSkill } from './components/skillAlignment';
import type { SelectedSkill } from '../skills/skillTypes';
import type { SimpleMediaAttachment } from './components/MediaAttachments';
import type { OBv3CredentialTemplate } from '../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';

export interface IssueCredentialViewProps {
    issuedUri: string | null;
    previewCredential: Record<string, unknown> | null;
    selectedType: CredentialTypeEntry | null;
    template: OBv3CredentialTemplate | null;
    recipientMode: RecipientMode;
    recipients: Recipient[];
    linkOptions: LinkOptions;
    claimLink: string | null;
    provenance: ImportProvenance | null;
    provenanceLabel: string | null;
    error: IssueError | null;
    isSubmitting: boolean;
    canIssue: boolean;
    missingHint: string | null;
    showJson: boolean;
    jsonOnly: boolean;
    viewingJson: boolean;
    issuableJson: Record<string, unknown> | null;
    identity: CredentialIdentity;
    dynamicVars: string[];
    variableScope: VariableScope;
    variableValues: Record<string, string>;
    recipientValues: Record<string, Record<string, string>>;
    recipientEvidence: Record<string, SimpleMediaAttachment[]>;
    selectedSkills: SelectedSkill[];
    resolvedSkills: ResolvedSkill[];
    onBack: () => void;
    onIssue: () => void;
    onIssueAnother: () => void;
    onViewWallet: () => void;
    onLinkConsumed: () => void;
    onToggleJson: () => void;
    onDismissProvenance: () => void;
    onSelectType: (entry: CredentialTypeEntry) => void;
    onChangeTemplate: (template: OBv3CredentialTemplate) => void;
    onImport: (result: NormalizedImport) => void;
    onRecipientModeChange: (mode: RecipientMode) => void;
    onRecipientsChange: (recipients: Recipient[]) => void;
    onLinkOptionsChange: (options: LinkOptions) => void;
    onSelectedSkillsChange: (skills: SelectedSkill[]) => void;
    onResolvedSkillsChange: (resolved: ResolvedSkill[]) => void;
    onJsonChange: (json: Record<string, unknown>) => void;
    onParseError: (error: string | null) => void;
    onScopeChange: (scope: VariableScope) => void;
    onSharedVariableChange: (name: string, value: string) => void;
    onRecipientVariableChange: (recipientKey: string, name: string, value: string) => void;
    onRecipientEvidenceChange: (recipientKey: string, attachments: SimpleMediaAttachment[]) => void;
}

export const IssueCredentialView: React.FC<IssueCredentialViewProps> = ({
    issuedUri,
    previewCredential,
    selectedType,
    template,
    recipientMode,
    recipients,
    linkOptions,
    claimLink,
    provenance,
    provenanceLabel,
    error,
    isSubmitting,
    canIssue,
    missingHint,
    showJson,
    jsonOnly,
    viewingJson,
    issuableJson,
    identity,
    dynamicVars,
    variableScope,
    variableValues,
    recipientValues,
    recipientEvidence,
    selectedSkills,
    resolvedSkills,
    onBack,
    onIssue,
    onIssueAnother,
    onViewWallet,
    onLinkConsumed,
    onToggleJson,
    onDismissProvenance,
    onSelectType,
    onChangeTemplate,
    onImport,
    onRecipientModeChange,
    onRecipientsChange,
    onLinkOptionsChange,
    onSelectedSkillsChange,
    onResolvedSkillsChange,
    onJsonChange,
    onParseError,
    onScopeChange,
    onSharedVariableChange,
    onRecipientVariableChange,
    onRecipientEvidenceChange,
}) => {
    const ach = template?.credentialSubject?.achievement;
    const credentialType = selectedType?.baseSimpleType ?? null;

    return (
        <IonPage className="bg-white">
            <MainHeader showBackButton customClassName="bg-white" />
            <IonContent>
                {issuedUri ? (
                    <IssueSuccess
                        credential={previewCredential}
                        credentialType={credentialType}
                        recipientMode={recipientMode}
                        recipients={recipients}
                        claimLink={claimLink}
                        linkOptions={linkOptions}
                        onIssueAnother={onIssueAnother}
                        onLinkConsumed={onLinkConsumed}
                        onViewWallet={onViewWallet}
                    />
                ) : (
                    <div className="font-poppins min-h-full bg-grayscale-10">
                        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-grayscale-200/60 transition-all duration-300">
                            <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-2 sm:gap-4">
                                <button
                                    type="button"
                                    onClick={onBack}
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
                                            onClick={onToggleJson}
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
                                        data-testid="issue-submit"
                                        onClick={onIssue}
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
                                            onClick={onDismissProvenance}
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
                                                    onClick={onIssue}
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
                                    <div className="space-y-5">
                                        <section className="bg-white border border-grayscale-200 rounded-[20px] p-5 space-y-4">
                                            <RecipientPicker
                                                mode={recipientMode}
                                                onModeChange={onRecipientModeChange}
                                                recipients={recipients}
                                                onRecipientsChange={onRecipientsChange}
                                                linkOptions={linkOptions}
                                                onLinkOptionsChange={onLinkOptionsChange}
                                            />
                                        </section>
                                        <JsonStudio
                                            credential={issuableJson}
                                            identity={identity}
                                            onChange={onJsonChange}
                                            onParseError={onParseError}
                                        />
                                        <DynamicFieldsSection
                                            variables={dynamicVars}
                                            recipientMode={recipientMode}
                                            recipients={recipients}
                                            scope={variableScope}
                                            onScopeChange={onScopeChange}
                                            sharedValues={variableValues}
                                            onSharedChange={onSharedVariableChange}
                                            recipientValues={recipientValues}
                                            onRecipientChange={onRecipientVariableChange}
                                        />
                                        {recipientMode === 'people' && (
                                            <RecipientEvidenceSection
                                                recipients={recipients}
                                                recipientEvidence={recipientEvidence}
                                                onChange={onRecipientEvidenceChange}
                                            />
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-5">
                                        <IssuePalette
                                            selectedType={selectedType}
                                            template={template}
                                            onSelectType={onSelectType}
                                            onChangeTemplate={onChangeTemplate}
                                            onImport={onImport}
                                            recipientMode={recipientMode}
                                            recipients={recipients}
                                            linkOptions={linkOptions}
                                            onRecipientModeChange={onRecipientModeChange}
                                            onRecipientsChange={onRecipientsChange}
                                            onLinkOptionsChange={onLinkOptionsChange}
                                            selectedSkills={selectedSkills}
                                            resolvedSkills={resolvedSkills}
                                            onSelectedSkillsChange={onSelectedSkillsChange}
                                            onResolvedSkillsChange={onResolvedSkillsChange}
                                        />
                                        <DynamicFieldsSection
                                            variables={dynamicVars}
                                            recipientMode={recipientMode}
                                            recipients={recipients}
                                            scope={variableScope}
                                            onScopeChange={onScopeChange}
                                            sharedValues={variableValues}
                                            onSharedChange={onSharedVariableChange}
                                            recipientValues={recipientValues}
                                            onRecipientChange={onRecipientVariableChange}
                                        />
                                        {recipientMode === 'people' && (
                                            <RecipientEvidenceSection
                                                recipients={recipients}
                                                recipientEvidence={recipientEvidence}
                                                onChange={onRecipientEvidenceChange}
                                            />
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="desktop:w-[340px] [@media(min-width:992px)_and_(max-width:1155px)]:w-[240px] shrink-0 desktop:sticky desktop:top-[84px]">
                                <HeroCanvas
                                    credential={previewCredential}
                                    credentialType={credentialType}
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
