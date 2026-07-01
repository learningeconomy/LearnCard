import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { DynamicFieldsSection, type VariableScope } from './DynamicFieldsSection';
import type { Recipient, RecipientMode } from './recipientTypes';

/**
 * `DynamicFieldsSection` is a pure, prop-driven form. These stories drive its
 * permutations via a stateful wrapper so the inputs and scope toggle behave
 * exactly as they do inside `IssueCredentialPage`, without any wallet/network.
 */
const meta: Meta<typeof DynamicFieldsSection> = {
    title: 'Issue/DynamicFieldsSection',
    component: DynamicFieldsSection,
    parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof DynamicFieldsSection>;

const PROFILE_A: Recipient = {
    kind: 'profile',
    profileId: 'ada',
    displayName: 'Ada Lovelace',
};
const PROFILE_B: Recipient = {
    kind: 'profile',
    profileId: 'grace',
    displayName: 'Grace Hopper',
};
const EMAIL_C: Recipient = { kind: 'email', email: 'katherine@example.com' };

type HarnessProps = {
    variables: string[];
    recipientMode: RecipientMode;
    recipients: Recipient[];
    initialScope?: VariableScope;
};

const Harness: React.FC<HarnessProps> = ({
    variables,
    recipientMode,
    recipients,
    initialScope = 'shared',
}) => {
    const [scope, setScope] = useState<VariableScope>(initialScope);
    const [sharedValues, setSharedValues] = useState<Record<string, string>>({});
    const [recipientValues, setRecipientValues] = useState<Record<string, Record<string, string>>>(
        {}
    );

    return (
        <div className="max-w-xl mx-auto">
            <DynamicFieldsSection
                variables={variables}
                recipientMode={recipientMode}
                recipients={recipients}
                scope={scope}
                onScopeChange={setScope}
                sharedValues={sharedValues}
                onSharedChange={(name, value) =>
                    setSharedValues(prev => ({ ...prev, [name]: value }))
                }
                recipientValues={recipientValues}
                onRecipientChange={(key, name, value) =>
                    setRecipientValues(prev => ({
                        ...prev,
                        [key]: { ...(prev[key] ?? {}), [name]: value },
                    }))
                }
            />
        </div>
    );
};

/** Shared placeholders — single set of inputs for everyone. */
export const SharedValues: Story = {
    render: () => (
        <Harness
            variables={['recipientName', 'courseTitle', 'completionDate']}
            recipientMode="self"
            recipients={[]}
        />
    ),
};

/** Inferred input types: number / date / url derive from the variable name. */
export const InferredInputTypes: Story = {
    render: () => (
        <Harness
            variables={['score', 'issueDate', 'evidenceUrl', 'notes']}
            recipientMode="self"
            recipients={[]}
        />
    ),
};

/**
 * Multiple recipients unlock the "Same for everyone" / "Per recipient" toggle.
 * Starts in per-recipient scope so the per-person cards are visible immediately.
 */
export const PerRecipientScope: Story = {
    render: () => (
        <Harness
            variables={['grade', 'remarks']}
            recipientMode="people"
            recipients={[PROFILE_A, PROFILE_B, EMAIL_C]}
            initialScope="perRecipient"
        />
    ),
};

/**
 * A single recipient does NOT expose the per-recipient toggle (needs 2+),
 * so only the shared inputs render.
 */
export const SingleRecipientNoToggle: Story = {
    render: () => <Harness variables={['grade']} recipientMode="people" recipients={[PROFILE_A]} />,
};

/** No variables → the section renders nothing (returns null). */
export const NoVariables: Story = {
    render: () => <Harness variables={[]} recipientMode="self" recipients={[]} />,
};
