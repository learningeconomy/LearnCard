import React, { useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { useQueryClient } from '@tanstack/react-query';

import { IssueCredentialView } from './IssueCredentialView';
import { getTypeByObv3, type CredentialTypeEntry } from './components/credentialTypeCatalog';
import { useCredentialIdentity } from './components/useCredentialIdentity';
import { applyVariableValues } from './components/variableSubstitution';
import type { VariableScope } from './components/DynamicFieldsSection';
import type { LinkOptions, Recipient, RecipientMode } from './components/recipientTypes';
import type { ResolvedSkill } from './components/skillAlignment';
import type { SimpleMediaAttachment } from './components/MediaAttachments';
import type { SelectedSkill } from '../skills/skillTypes';
import { buildSimpleTemplate } from '../../components/simple-send/simpleSend.helpers';
import {
    templateToJson,
    extractVariablesByType,
} from '../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/utils';
import type { OBv3CredentialTemplate } from '../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';

/**
 * Whole-page composition rendering the REAL `IssueCredentialView` — the exact
 * presentational tree the production `IssueCredentialPage` renders. The page's
 * container (wallet, signing authority, toasts, `handleIssue`) is replaced by a
 * Storybook-only harness that owns the authoring state and derives the view's
 * props with the same helpers the page uses (`templateToJson`,
 * `useCredentialIdentity`, `extractVariablesByType`). No wallet, no network.
 */
const meta: Meta<typeof IssueCredentialView> = {
    title: 'Issue/IssueComposition',
    component: IssueCredentialView,
    parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof IssueCredentialView>;

const noop = () => {};

const SeedProfiles: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const queryClient = useQueryClient();
    const seeded = React.useRef(false);
    if (!seeded.current) {
        queryClient.setQueryData(
            ['connections', ''],
            [
                { profileId: 'ada', displayName: 'Ada Lovelace', did: 'did:example:ada' },
                { profileId: 'grace', displayName: 'Grace Hopper', did: 'did:example:grace' },
            ]
        );
        seeded.current = true;
    }
    return <>{children}</>;
};

const initialTemplate = (): OBv3CredentialTemplate =>
    buildSimpleTemplate({
        credentialType: 'badge',
        name: 'Intro to Storybook',
        description: 'Completed the Storybook fundamentals module.',
        issuerName: 'Learning Economy',
    });

const ViewHarness: React.FC = () => {
    const [selectedType, setSelectedType] = useState<CredentialTypeEntry | null>(
        getTypeByObv3('Badge') ?? null
    );
    const [template, setTemplate] = useState<OBv3CredentialTemplate | null>(initialTemplate);
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
    const validationJson = useMemo(
        () => (issuableJson ? applyVariableValues(issuableJson, variableValues) : null),
        [issuableJson, variableValues]
    );
    const identity = useCredentialIdentity(validationJson, jsonError);
    const dynamicVars = useMemo(
        () => (template ? extractVariablesByType(template).dynamic : []),
        [template]
    );

    const jsonOnly = Boolean(template?.schemaType && template.schemaType !== 'obv3');
    const viewingJson = showJson || jsonOnly;

    return (
        <IssueCredentialView
            issuedUri={null}
            previewCredential={issuableJson}
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
            canIssue={Boolean(template) && !jsonError}
            missingHint={template ? null : 'Pick a type to begin'}
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

/**
 * Full issue page: edit the form on the left and watch the live `HeroCanvas`
 * preview on the right — the real production view, no wallet or network.
 */
export const FullPage: Story = {
    render: () => (
        <SeedProfiles>
            <ViewHarness />
        </SeedProfiles>
    ),
};
