import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { useQueryClient } from '@tanstack/react-query';

import { IssuePalette } from './IssuePalette';
import { getTypeByObv3, type CredentialTypeEntry } from './credentialTypeCatalog';
import type { LinkOptions, Recipient, RecipientMode } from './recipientTypes';
import type { ResolvedSkill } from './skillAlignment';
import { buildSimpleTemplate } from '../../../components/simple-send/simpleSend.helpers';
import type { OBv3CredentialTemplate } from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';
import type { SelectedSkill } from '../../skills/skillTypes';

/**
 * `IssuePalette` is the full left-column authoring form. It nests `TypePicker`,
 * `RecipientPicker`, `TemplatableField`, `MediaAttachments`, and `SkillsSection`.
 * A stateful harness owns the template/type/recipient/skill state, and
 * `SeedProfiles` primes connections so the nested `RecipientPicker` resolves.
 */
const meta: Meta<typeof IssuePalette> = {
    title: 'Issue/IssuePalette',
    component: IssuePalette,
    parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof IssuePalette>;

const CONNECTIONS = [
    { profileId: 'ada', displayName: 'Ada Lovelace', did: 'did:example:ada' },
    { profileId: 'grace', displayName: 'Grace Hopper', did: 'did:example:grace' },
];

const SeedProfiles: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const queryClient = useQueryClient();
    const seeded = React.useRef(false);
    if (!seeded.current) {
        queryClient.setQueryData(['connections', ''], CONNECTIONS);
        seeded.current = true;
    }
    return <>{children}</>;
};

const badgeTemplate = (): OBv3CredentialTemplate =>
    buildSimpleTemplate({
        credentialType: 'badge',
        name: 'Intro to Storybook',
        description: 'Completed the Storybook fundamentals module.',
        issuerName: 'Learning Economy',
    });

type HarnessProps = {
    initialType: CredentialTypeEntry | null;
    initialTemplate: OBv3CredentialTemplate | null;
};

const Harness: React.FC<HarnessProps> = ({ initialType, initialTemplate }) => {
    const [selectedType, setSelectedType] = useState<CredentialTypeEntry | null>(initialType);
    const [template, setTemplate] = useState<OBv3CredentialTemplate | null>(initialTemplate);
    const [recipientMode, setRecipientMode] = useState<RecipientMode>('self');
    const [recipients, setRecipients] = useState<Recipient[]>([]);
    const [linkOptions, setLinkOptions] = useState<LinkOptions>({});
    const [selectedSkills, setSelectedSkills] = useState<SelectedSkill[]>([]);
    const [resolvedSkills, setResolvedSkills] = useState<ResolvedSkill[]>([]);

    return (
        <SeedProfiles>
            <div className="max-w-2xl mx-auto">
                <IssuePalette
                    selectedType={selectedType}
                    template={template}
                    onSelectType={entry => {
                        setSelectedType(entry);
                        if (!template) setTemplate(badgeTemplate());
                    }}
                    onChangeTemplate={setTemplate}
                    onImport={() => {}}
                    recipientMode={recipientMode}
                    recipients={recipients}
                    linkOptions={linkOptions}
                    onRecipientModeChange={setRecipientMode}
                    onRecipientsChange={setRecipients}
                    onLinkOptionsChange={setLinkOptions}
                    selectedSkills={selectedSkills}
                    resolvedSkills={resolvedSkills}
                    onSelectedSkillsChange={setSelectedSkills}
                    onResolvedSkillsChange={setResolvedSkills}
                />
            </div>
        </SeedProfiles>
    );
};

/** Fresh start — only the type picker shows until a type is chosen. */
export const TypeSelection: Story = {
    render: () => <Harness initialType={null} initialTemplate={null} />,
};

/** Type chosen — the full authoring form (details, media, skills, advanced) unfolds. */
export const BadgeAuthoring: Story = {
    render: () => (
        <Harness initialType={getTypeByObv3('Badge') ?? null} initialTemplate={badgeTemplate()} />
    ),
};

/** A Course exposes extra activity fields (course code, completion date, score). */
export const CourseWithActivityFields: Story = {
    render: () => (
        <Harness
            initialType={getTypeByObv3('Course') ?? null}
            initialTemplate={buildSimpleTemplate({
                credentialType: 'course',
                name: 'Async JavaScript',
                description: 'A deep dive into promises and async/await.',
                issuerName: 'Learning Economy',
            })}
        />
    ),
};
