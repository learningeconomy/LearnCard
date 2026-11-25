import React, { useMemo, useState } from 'react';

import { IssueCredentialView } from '../../src/pages/issue/IssueCredentialView';
import {
    getTypeByObv3,
    type CredentialTypeEntry,
} from '../../src/pages/issue/components/credentialTypeCatalog';
import type { CredentialIdentity } from '../../src/pages/issue/components/useCredentialIdentity';
import type { VariableScope } from '../../src/pages/issue/components/DynamicFieldsSection';
import type {
    LinkOptions,
    Recipient,
    RecipientMode,
} from '../../src/pages/issue/components/recipientTypes';
import type { ResolvedSkill } from '../../src/pages/issue/components/skillAlignment';
import { getResultValidationError } from '../../src/pages/issue/components/resultField';
import type { SimpleMediaAttachment } from '../../src/pages/issue/components/MediaAttachments';
import type { SelectedSkill } from '../../src/pages/skills/skillTypes';
import { buildSimpleTemplate } from '../../src/components/simple-send/simpleSend.helpers';
import {
    templateToJson,
    extractVariablesByType,
} from '../../src/pages/appStoreDeveloper/partner-onboarding/components/CredentialBuilder/utils';
import type { OBv3CredentialTemplate } from '../../src/pages/appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';

// Same presentation and template helpers as IssueComposition; signing is disabled.
const noop = () => undefined;
const initialTemplate = (
    credentialType: CredentialTypeEntry['baseSimpleType'] = 'badge'
): OBv3CredentialTemplate =>
    buildSimpleTemplate({
        credentialType,
        name: 'Community Leadership',
        description:
            'Completed a community leadership program covering teamwork, facilitation, and project planning.',
        issuerName: 'Learning Economy',
    });

export const IssueVisualFixture: React.FC<{ initialObv3Type?: string }> = ({
    initialObv3Type = 'Badge',
}) => {
    const initialCredentialType = getTypeByObv3(initialObv3Type) ?? null;
    const [selectedType, setSelectedType] = useState<CredentialTypeEntry | null>(
        initialCredentialType
    );
    const [template, setTemplate] = useState<OBv3CredentialTemplate | null>(() =>
        initialTemplate(initialCredentialType?.baseSimpleType)
    );
    const [recipientMode, setRecipientMode] = useState<RecipientMode>('self');
    const [recipients, setRecipients] = useState<Recipient[]>([]);
    const [linkOptions, setLinkOptions] = useState<LinkOptions>({});
    const [selectedSkills, setSelectedSkills] = useState<SelectedSkill[]>([]);
    const [resolvedSkills, setResolvedSkills] = useState<ResolvedSkill[]>([]);
    const [showJson, setShowJson] = useState(false);
    const [jsonError, setJsonError] = useState<string | null>(null);
    const [variableScope, setVariableScope] = useState<VariableScope>('shared');
    const [variableValues, setVariableValues] = useState<Record<string, string>>({});
    const [recipientValues, setRecipientValues] = useState<Record<string, Record<string, string>>>(
        {}
    );
    const [recipientEvidence, setRecipientEvidence] = useState<
        Record<string, SimpleMediaAttachment[]>
    >({});

    const issuableJson = useMemo(() => (template ? templateToJson(template) : null), [template]);
    const previewCredential = useMemo(
        () => (issuableJson ? { ...issuableJson, validFrom: '2026-01-01T00:00:00.000Z' } : null),
        [issuableJson]
    );
    const identity: CredentialIdentity = {
        status: 'valid',
        schema: 'obv3',
        label: 'Open Badges 3.0',
    };
    const dynamicVars = useMemo(
        () => (template ? extractVariablesByType(template).dynamic : []),
        [template]
    );
    const resultValidationError = template
        ? getResultValidationError(template, variableValues)
        : null;

    const jsonOnly = Boolean(template?.schemaType && template.schemaType !== 'obv3');
    const viewingJson = showJson || jsonOnly;

    return (
        <IssueCredentialView
            issuedUri={null}
            previewCredential={previewCredential}
            selectedType={selectedType}
            template={template}
            recipientMode={recipientMode}
            recipients={recipients}
            linkOptions={linkOptions}
            claimLink={null}
            provenance={null}
            provenanceLabel={null}
            error={null}
            isSubmitting={false}
            canIssue={Boolean(template) && !jsonError && !resultValidationError}
            missingHint={template ? resultValidationError : 'Pick a type to begin'}
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
            onBack={noop}
            onIssue={noop}
            onIssueAnother={noop}
            onViewWallet={noop}
            onLinkConsumed={noop}
            onToggleJson={() => setShowJson(v => !v)}
            onDismissProvenance={noop}
            onSelectType={entry => {
                setSelectedType(entry);
                if (!template) {
                    setTemplate(
                        buildSimpleTemplate({
                            credentialType: entry.baseSimpleType,
                            name: '',
                            description: '',
                        })
                    );
                }
            }}
            onChangeTemplate={setTemplate}
            onImport={noop}
            onRecipientModeChange={setRecipientMode}
            onRecipientsChange={setRecipients}
            onLinkOptionsChange={setLinkOptions}
            onSelectedSkillsChange={setSelectedSkills}
            onResolvedSkillsChange={setResolvedSkills}
            onJsonChange={json => setTemplate(json as unknown as OBv3CredentialTemplate)}
            onParseError={setJsonError}
            onScopeChange={setVariableScope}
            onSharedVariableChange={(name, value) =>
                setVariableValues(prev => ({ ...prev, [name]: value }))
            }
            onRecipientVariableChange={(key, name, value) =>
                setRecipientValues(prev => ({
                    ...prev,
                    [key]: { ...(prev[key] ?? {}), [name]: value },
                }))
            }
            onRecipientEvidenceChange={(key, attachments) =>
                setRecipientEvidence(prev => ({ ...prev, [key]: attachments }))
            }
        />
    );
};
