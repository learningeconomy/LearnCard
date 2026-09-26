import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';

import DataSharingCenterView from './DataSharingCenterView';
import { DATA_SHARING_PERSONAS } from './dataSharing.personas';
import type {
    DataSharingCenterViewModel,
    DataSharingSavedCollectionsViewModel,
    SavedCredentialCollection,
} from './DataSharingCenter.types';

const meta: Meta<typeof DataSharingCenterView> = {
    title: 'Pages/PrivacySettings/DataSharingCenterView',
    component: DataSharingCenterView,
    decorators: [
        Story => (
            <div className="min-h-screen w-full">
                <Story />
            </div>
        ),
    ],
    parameters: {
        layout: 'fullscreen',
    },
};

export default meta;
type Story = StoryObj<typeof DataSharingCenterView>;

const sharedLinksPersona = DATA_SHARING_PERSONAS['Active learner · shared links'];

const sharedWithYouPersona = (
    overrides: Partial<DataSharingSavedCollectionsViewModel> = {}
): DataSharingCenterViewModel => {
    if (!sharedLinksPersona.shared) throw new Error('Shared links persona is required');

    return {
        ...sharedLinksPersona,
        shared: {
            ...sharedLinksPersona.shared,
            savedCollections: {
                ...sharedLinksPersona.shared.savedCollections,
                ...overrides,
            },
        },
    };
};

const AVATAR_DATA_URI =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Ccircle cx='16' cy='16' r='16' fill='%234F46E5'/%3E%3Ctext x='16' y='21' font-size='14' text-anchor='middle' fill='white' font-family='sans-serif'%3EJR%3C/text%3E%3C/svg%3E";

const makeCollection = (overrides: Partial<SavedCredentialCollection>): SavedCredentialCollection =>
    ({
        uri: 'lc:network:localhost%3A4000:pres:saved-collection',
        shareId: 'AAAAAAAAAAAAAAAAAAAAAA',
        title: 'Career highlights',
        note: 'Selected credentials for applications',
        sharer: {
            profileId: 'mister-localhost',
            displayName: 'Mister Localhost',
        },
        receivedAt: '2026-09-21T14:30:00.000Z',
        credentialCount: 3,
        presentation: {
            '@context': ['https://www.w3.org/2018/credentials/v1'],
            type: ['VerifiablePresentation'],
            verifiableCredential: [{}, {}, {}],
            proof: { type: 'Ed25519Signature2020' },
        } as unknown as SavedCredentialCollection['presentation'],
        ...overrides,
    }) as SavedCredentialCollection;

export const ActiveLearner: Story = {
    args: { vm: DATA_SHARING_PERSONAS['Active learner'] },
};

export const ActiveLearnerWithSharedLinks: Story = {
    args: { vm: sharedLinksPersona },
};

export const SharedWithYou: Story = {
    args: { vm: sharedWithYouPersona() },
};

export const SharedWithYouEmpty: Story = {
    args: { vm: sharedWithYouPersona({ records: [] }) },
};

export const SharedWithYouLoading: Story = {
    args: { vm: sharedWithYouPersona({ records: [], isLoading: true }) },
};

export const SharedWithYouError: Story = {
    args: { vm: sharedWithYouPersona({ records: [], error: true }) },
};

export const ManyReceivedCollections: Story = {
    args: {
        vm: sharedWithYouPersona({
            records: [
                makeCollection({
                    uri: 'lc:network:localhost%3A4000:pres:collection-1',
                    shareId: 'AAAAAAAAAAAAAAAAAAAAAA',
                    title: 'Career highlights',
                    sharer: { profileId: 'mister-localhost', displayName: 'Mister Localhost' },
                    receivedAt: '2026-09-24T14:30:00.000Z',
                    credentialCount: 3,
                }),
                makeCollection({
                    uri: 'lc:network:localhost%3A4000:pres:collection-2',
                    shareId: 'BBBBBBBBBBBBBBBBBBBBBB',
                    title: 'Portfolio for Ms. Rivera',
                    sharer: {
                        profileId: 'jamie-rivera',
                        displayName: 'Jamie Rivera',
                        avatar: AVATAR_DATA_URI,
                    },
                    receivedAt: '2026-09-23T09:00:00.000Z',
                    credentialCount: 5,
                }),
                makeCollection({
                    uri: 'lc:network:localhost%3A4000:pres:collection-3',
                    shareId: undefined,
                    title: 'Unlabeled bundle',
                    sharer: undefined,
                    receivedAt: '2026-09-22T09:00:00.000Z',
                    credentialCount: 1,
                }),
                makeCollection({
                    uri: 'lc:network:localhost%3A4000:pres:collection-4',
                    shareId: 'CCCCCCCCCCCCCCCCCCCCCC',
                    title: 'Scholarship packet',
                    sharer: { profileId: 'state-university', displayName: 'State University' },
                    receivedAt: '2026-09-21T09:00:00.000Z',
                    credentialCount: 2,
                }),
                makeCollection({
                    uri: 'lc:network:localhost%3A4000:pres:collection-5',
                    shareId: 'DDDDDDDDDDDDDDDDDDDDDD',
                    title: 'Volunteer hours',
                    sharer: { profileId: 'acme-careers', displayName: 'Acme Careers' },
                    receivedAt: '2026-09-20T09:00:00.000Z',
                    credentialCount: 4,
                }),
                makeCollection({
                    uri: 'lc:network:localhost%3A4000:pres:collection-6',
                    shareId: 'EEEEEEEEEEEEEEEEEEEEEE',
                    title: 'Coding bootcamp',
                    sharer: { profileId: 'taylorbot', displayName: 'TaylorBot Dashboard' },
                    receivedAt: '2026-09-19T09:00:00.000Z',
                    credentialCount: 1,
                }),
                makeCollection({
                    uri: 'lc:network:localhost%3A4000:pres:collection-7',
                    shareId: 'FFFFFFFFFFFFFFFFFFFFFF',
                    title: 'Summer camp counselor',
                    sharer: { profileId: 'jobmatch', displayName: 'JobMatch' },
                    receivedAt: '2026-09-18T09:00:00.000Z',
                    credentialCount: 6,
                }),
            ],
        }),
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('button', { name: /View all 7/ })).toBeVisible();
    },
};

export const NothingShared: Story = {
    args: { vm: DATA_SHARING_PERSONAS['Nothing shared'] },
};

export const ManyAppsGrouped: Story = {
    args: { vm: DATA_SHARING_PERSONAS['Many apps · grouped'] },
};

export const AiConsentNeedsRepair: Story = {
    args: { vm: DATA_SHARING_PERSONAS['AI consent needs repair'] },
};

export const Minor: Story = {
    args: { vm: DATA_SHARING_PERSONAS['Minor'] },
};

export const Loading: Story = {
    args: { vm: DATA_SHARING_PERSONAS['Loading'] },
};

export const ManySharedLinks: Story = {
    args: { vm: DATA_SHARING_PERSONAS['Active learner · many links'] },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(
            within(canvas.getByRole('list', { name: 'Your shared links' })).getAllByRole('button', {
                name: name =>
                    !name.startsWith('Copy link for') && /credential|Update in progress/.test(name),
            })
        ).toHaveLength(5);
        await expect(canvas.getByRole('button', { name: /View all 11\+/ })).toBeVisible();
    },
};

export const OnlyExpiredLinks: Story = {
    args: { vm: DATA_SHARING_PERSONAS['Active learner · only expired links'] },
};

export const ShareLinkDetail: Story = {
    args: { vm: DATA_SHARING_PERSONAS['Active learner · many links'] },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: /^Internship application/ }));
        const body = within(canvasElement.ownerDocument.body);
        await expect(await body.findByRole('button', { name: 'Update contents' })).toBeVisible();
    },
};

export const ViewAllSheet: Story = {
    args: { vm: DATA_SHARING_PERSONAS['Active learner · many links'] },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: /View all/ }));
        const body = within(canvasElement.ownerDocument.body);
        await expect(await body.findByRole('tablist', { name: 'Filter links' })).toBeVisible();
    },
};
