import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { JsonStudio } from './JsonStudio';
import type { CredentialIdentity } from './useCredentialIdentity';

/**
 * `JsonStudio` is the raw-JSON editor with a live identity badge. The badge is
 * a pure `identity` prop, so each story pins a different `CredentialIdentity`
 * state; a small wrapper owns the edited credential for two-way editing.
 */
const meta: Meta<typeof JsonStudio> = {
    title: 'Issue/JsonStudio',
    component: JsonStudio,
    parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof JsonStudio>;

const SAMPLE_CREDENTIAL: Record<string, unknown> = {
    '@context': [
        'https://www.w3.org/ns/credentials/v2',
        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
    ],
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    credentialSubject: {
        type: ['AchievementSubject'],
        achievement: {
            type: ['Achievement'],
            name: 'Intro to Storybook',
            description: 'Completed the Storybook fundamentals module.',
        },
    },
};

const Harness: React.FC<{ identity: CredentialIdentity }> = ({ identity }) => {
    const [credential, setCredential] = useState<Record<string, unknown>>(SAMPLE_CREDENTIAL);
    const [, setParseError] = useState<string | null>(null);

    return (
        <div className="max-w-2xl mx-auto">
            <JsonStudio
                credential={credential}
                identity={identity}
                onChange={setCredential}
                onParseError={setParseError}
            />
        </div>
    );
};

/** Valid credential — emerald badge with the detected schema label. */
export const Valid: Story = {
    render: () => (
        <Harness identity={{ status: 'valid', schema: 'obv3', label: 'Open Badges 3.0' }} />
    ),
};

/** Validation in flight — the debounced JSON-LD check is still running. */
export const Checking: Story = {
    render: () => <Harness identity={{ status: 'checking', schema: 'obv3' }} />,
};

/** Invalid — red badge surfaces the first validation error to the user. */
export const Invalid: Story = {
    render: () => (
        <Harness
            identity={{
                status: 'invalid',
                schema: 'obv3',
                reason: 'Missing required property: issuer.',
            }}
        />
    ),
};

/** Empty — no credential yet, so the badge is hidden entirely. */
export const Empty: Story = {
    render: () => <Harness identity={{ status: 'empty' }} />,
};
