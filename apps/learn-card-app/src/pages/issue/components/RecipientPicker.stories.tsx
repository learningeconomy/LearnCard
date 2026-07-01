import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { useQueryClient } from '@tanstack/react-query';

import { RecipientPicker } from './RecipientPicker';
import type { LinkOptions, Recipient, RecipientMode } from './recipientTypes';

/**
 * `RecipientPicker` reads connections and search results from react-query
 * (`useGetConnections`, `useGetSearchProfiles`). Storybook has no wallet, so
 * `SeedProfiles` primes those query keys with fixtures. A stateful wrapper owns
 * the mode/recipients/linkOptions so the tabs and chips are fully interactive.
 */
const meta: Meta<typeof RecipientPicker> = {
    title: 'Issue/RecipientPicker',
    component: RecipientPicker,
    parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof RecipientPicker>;

const CONNECTIONS = [
    { profileId: 'ada', displayName: 'Ada Lovelace', did: 'did:example:ada' },
    { profileId: 'grace', displayName: 'Grace Hopper', did: 'did:example:grace' },
    { profileId: 'katherine', displayName: 'Katherine Johnson', did: 'did:example:katherine' },
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

type HarnessProps = { initialMode: RecipientMode; initialRecipients?: Recipient[] };

const Harness: React.FC<HarnessProps> = ({ initialMode, initialRecipients = [] }) => {
    const [mode, setMode] = useState<RecipientMode>(initialMode);
    const [recipients, setRecipients] = useState<Recipient[]>(initialRecipients);
    const [linkOptions, setLinkOptions] = useState<LinkOptions>({});

    return (
        <SeedProfiles>
            <div className="max-w-xl mx-auto bg-white p-6 rounded-[20px] border border-grayscale-200">
                <RecipientPicker
                    mode={mode}
                    onModeChange={setMode}
                    recipients={recipients}
                    onRecipientsChange={setRecipients}
                    linkOptions={linkOptions}
                    onLinkOptionsChange={setLinkOptions}
                    inlineResults
                />
            </div>
        </SeedProfiles>
    );
};

/** "Just me" — no recipient inputs, the credential goes to the issuer. */
export const SelfMode: Story = {
    render: () => <Harness initialMode="self" />,
};

/** "Specific people" — seeded connections appear inline; type to search. */
export const PeopleModeEmpty: Story = {
    render: () => <Harness initialMode="people" />,
};

/** People mode pre-populated with selected recipient chips (profile + email). */
export const PeopleModeWithRecipients: Story = {
    render: () => (
        <Harness
            initialMode="people"
            initialRecipients={[
                { kind: 'profile', profileId: 'ada', displayName: 'Ada Lovelace' },
                { kind: 'email', email: 'katherine@example.com' },
            ]}
        />
    ),
};

/** "Anyone with a link" — exposes optional expiry and max-claims controls. */
export const LinkMode: Story = {
    render: () => <Harness initialMode="link" />,
};
