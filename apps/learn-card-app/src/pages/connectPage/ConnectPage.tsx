import React from 'react';
import { useParams, useNavigate } from 'react-router';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { getLogger } from 'learn-card-base';
const log = getLogger('connect-page');

import MainHeader from '../../components/main-header/MainHeader';

import * as m from '../../paraglide/messages.js';
import { useWallet, usePathQuery, useIsLoggedIn } from 'learn-card-base';
import { getAnonymousNetworkClient } from 'learn-card-base/helpers/anonymousNetworkClient';
import { useAuthSettled } from '../../providers/useAuthSettled';

import type { NetworkContact } from '../addressBook/addressBookHelpers';
import AddContactView, { AddContactViewMode } from '../addressBook/addContactView/AddContactView';
import { AppContent, AppPage } from 'learn-card-base/ui/chrome';
import { AppSpinner } from 'learn-card-base/ui/feedback/AppSpinner';

/** The network profile id in a `/connect?did=did:web:…:users:<id>` link, if there is one. */
const profileIdFromDid = (did: string | null): string | undefined => {
    if (!did?.includes('did:web')) return undefined;
    return did.match(/(users:)(.*)/)?.[2] || undefined;
};

/**
 * Renders before sign-in settles (routing/authGate). Until then, and for signed-out visitors, the
 * profile is read through the no-auth client: nothing here builds a wallet or writes to the network
 * before we know who is signed in. Once a signed-in user is known, the profile is re-read through
 * their wallet (connections can see more), and AddContactView shows the actions for them.
 */
const ConnectPage: React.FC = () => {
    const isLoggedIn = useIsLoggedIn();
    const authSettled = useAuthSettled();
    const { initWallet } = useWallet();
    const navigate = useNavigate();
    const query = usePathQuery();
    const { profileId: profileIdParam } = useParams() as { profileId?: string };

    const profileId = profileIdParam || profileIdFromDid(query.get('did'));
    const viewer = authSettled && isLoggedIn ? 'signed-in' : 'anonymous';

    const {
        data: profile,
        isPending,
        isPlaceholderData,
    } = useQuery<NetworkContact | null>({
        queryKey: ['connectPageProfile', profileId, viewer],
        queryFn: async () => {
            try {
                const result =
                    viewer === 'signed-in'
                        ? await (await initWallet()).invoke.getProfile(profileId)
                        : await getAnonymousNetworkClient().profile.getOtherProfile.query({
                              profileId: profileId!,
                          });
                // Private or missing profiles can come back as an empty object-like payload.
                // Treat anything without a profileId as "not found".
                return result?.profileId ? result : null;
            } catch (error) {
                log.info('connect::getProfile::err', error);
                return null;
            }
        },
        enabled: Boolean(profileId),
        // Keep the public profile on screen while a signed-in viewer's copy loads.
        placeholderData: keepPreviousData,
    });

    // A profile only connections can see isn't found anonymously: keep loading until the signed-in
    // read (if any) is back rather than flashing "not found".
    const loading =
        Boolean(profileId) && (isPending || (!profile && (!authSettled || isPlaceholderData)));

    return (
        <AppPage className="bg-white">
            <MainHeader customClassName="bg-white" />
            <AppContent fullscreen>
                {loading && (
                    <section className="relative loading-spinner-container flex flex-col items-center justify-center h-[80%] w-full ">
                        <AppSpinner color="black" />
                        <p className="mt-2 font-bold text-lg">{m['common.loading']()}</p>
                    </section>
                )}
                {!loading && !profile && (
                    <section className="flex flex-col h-full pt-[10px] px-[20px] text-center justify-center items-center">
                        <h1 className="text-center text-xl font-bold text-grayscale-800">Eeek!</h1>
                        <strong className="text-center font-medium text-grayscale-600">
                            Unable to find user
                        </strong>
                    </section>
                )}
                {!loading && profile && (
                    <AddContactView
                        user={profile}
                        handleCancel={() => navigate('/')}
                        customContainerClass="mb-20"
                        mode={AddContactViewMode.requestConnection}
                        actionsPending={!authSettled}
                    />
                )}
            </AppContent>
        </AppPage>
    );
};

export default ConnectPage;
