import React, { useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { useQueryClient } from '@tanstack/react-query';
import { within, userEvent, expect, waitFor } from '@storybook/test';

import { IssueCredentialView } from './IssueCredentialView';
import { getTypeByObv3, type CredentialTypeEntry } from './components/credentialTypeCatalog';
import { useCredentialIdentity } from './components/useCredentialIdentity';
import { applyVariableValues } from './components/variableSubstitution';
import type { VariableScope } from './components/DynamicFieldsSection';
import type { LinkOptions, Recipient, RecipientMode } from './components/recipientTypes';
import type { ResolvedSkill } from './components/skillAlignment';
import { getResultValidationError } from './components/resultField';
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
const initialTemplate = (
    credentialType: CredentialTypeEntry['baseSimpleType'] = 'badge'
): OBv3CredentialTemplate =>
    buildSimpleTemplate({
        credentialType,
        name: 'Intro to Storybook',
        description: 'Completed the Storybook fundamentals module.',
        issuerName: 'Learning Economy',
    });

const ViewHarness: React.FC<{ initialObv3Type?: string }> = ({ initialObv3Type = 'Badge' }) => {
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
    const validationJson = useMemo(
        () => (issuableJson ? applyVariableValues(issuableJson, variableValues) : null),
        [issuableJson, variableValues]
    );
    const identity = useCredentialIdentity(validationJson, jsonError);
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
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        const nameField = await canvas.findByPlaceholderText('e.g. Web Development Fundamentals');
        await expect(nameField).toHaveValue('Intro to Storybook');

        await userEvent.click(canvas.getByRole('button', { name: /specific people|^people$/i }));
        await expect(await canvas.findByPlaceholderText('Search people...')).toBeVisible();

        await userEvent.click(canvas.getByRole('button', { name: 'JSON' }));
        await waitFor(() =>
            expect(canvasElement.querySelector('textarea.font-mono')).not.toBeNull()
        );
    },
};

export const SkillAlignedResult: Story = {
    render: () => (
        <SeedProfiles>
            <ViewHarness initialObv3Type="Course" />
        </SeedProfiles>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const submit = canvas.getByTestId('issue-submit');
        const resultInput = canvas.getByPlaceholderText('e.g. 95');

        await userEvent.type(resultInput, '101');
        await expect(canvas.getByRole('alert')).toHaveTextContent('Enter a result from 0 to 100.');
        await expect(submit).toBeDisabled();

        await userEvent.clear(resultInput);
        await userEvent.type(resultInput, '95');
        await waitFor(() =>
            expect(canvas.queryByText('Enter a result from 0 to 100.')).not.toBeInTheDocument()
        );

        await userEvent.click(canvas.getByRole('button', { name: 'Rubric level' }));
        const rubricSection = canvas.getByText('Rubric levels').closest('.rounded-2xl');
        if (!(rubricSection instanceof HTMLElement)) throw new Error('Rubric editor not found');
        const rubric = within(rubricSection);

        await userEvent.type(canvas.getByPlaceholderText('e.g. 3'), '3');
        await userEvent.type(rubric.getByPlaceholderText('Proficient'), 'Proficient');
        const rubricValues = rubric.getAllByPlaceholderText('3');
        await userEvent.type(rubricValues[0], '3');
        await userEvent.type(rubricValues[1], '3');
        await userEvent.selectOptions(
            rubric.getByRole('combobox', { name: 'Achieved level' }),
            rubric.getByRole('option', { name: 'Proficient' })
        );

        await userEvent.click(canvas.getByText('Result alignments'));
        await userEvent.click(canvas.getByRole('button', { name: 'Add Result Alignment' }));
        await userEvent.type(canvas.getByPlaceholderText('Skill or competency'), 'Data analysis');
        await userEvent.type(
            canvas.getByPlaceholderText('https://credentialengineregistry.org/resources/...'),
            'https://credentialengineregistry.org/resources/ce-123'
        );
        await expect(submit).toBeEnabled();

        await userEvent.click(canvas.getByRole('button', { name: 'JSON' }));
        await waitFor(() =>
            expect(canvasElement.querySelector('textarea.font-mono')).not.toBeNull()
        );
        const jsonEditor = canvasElement.querySelector('textarea.font-mono');
        if (!(jsonEditor instanceof HTMLTextAreaElement)) throw new Error('JSON editor not found');
        expect(jsonEditor.value).toContain('"rubricCriterionLevel"');
        expect(jsonEditor.value).toContain('"achievedLevel"');
        expect(jsonEditor.value).toContain('"alignment"');
    },
};
