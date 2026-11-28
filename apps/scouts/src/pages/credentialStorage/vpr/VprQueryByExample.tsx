import React, { useState, useEffect } from 'react';
import { initLearnCard } from '@learncard/init';

import { useWallet, useCurrentUser, chapiStore, redirectStore } from 'learn-card-base';
import * as m from '../../../paraglide/messages.js';
import { getLogger } from 'learn-card-base';
const log = getLogger('vpr-query-by-example');

import {
    getImageUrlFromCredential,
    getCredentialName,
} from 'learn-card-base/helpers/credentialHelpers';
import { AppContent, AppPage } from 'learn-card-base/ui/chrome';
import { AppToggle } from 'learn-card-base/ui/controls/AppToggle';
import { AppSpinner } from 'learn-card-base/ui/feedback/AppSpinner';
import { AppCol, AppGrid, AppRow } from 'learn-card-base/ui/layout';
import { AppItem, AppLabel, AppList } from 'learn-card-base/ui/list';

const VprQueryByExample: React.FC = ({ event, currentUser }) => {
    const [vcs, setVcs] = useState<VC[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isLoadingCredentials, setIsLoadingCredentials] = useState<boolean>(false);
    const { getVCsFromWallet } = useWallet();
    const [emptyState, setEmptyState] = useState<boolean>(false);
    const [selectedVcs, setSelectedVcs] = useState<VC[]>([]);

    useEffect(() => {
        const loadWalletContents = async () => {
            setIsLoadingCredentials(true);
            const vcList = await getVCsFromWallet();
            setVcs(vcList);
            setIsLoadingCredentials(false);
            return vcList;
        };

        loadWalletContents().then(res => {
            if (!res || res?.length === 0) setEmptyState(true);
        });
    }, [currentUser]);

    const addVcToSelection = index => {
        if (!selectedVcs.includes(index)) {
            setSelectedVcs([...selectedVcs, index]);
        }
    };

    const removeVcFromSelection = index => {
        if (selectedVcs.includes(index)) {
            setSelectedVcs(selectedVcs.filter(n => n !== index));
        }
    };

    const renderCredentialList = vcs.map((vc, index) => {
        const isSelected = selectedVcs.includes(index);
        const selectToggle = (checked: boolean) => {
            if (checked) {
                addVcToSelection(index);
            } else {
                removeVcFromSelection(index);
            }
        };
        return (
            <AppItem key={index}>
                <AppLabel>{vc && getCredentialName(vc)}</AppLabel>
                <AppToggle onCheckedChange={selectToggle}></AppToggle>
            </AppItem>
        );
    });

    const reason =
        event?.credentialRequestOptions?.web?.VerifiablePresentation?.query?.[0]?.credentialQuery
            ?.reason;

    const accept = async () => {
        setIsLoading(true);
        const wallet = await initLearnCard({ seed: currentUser?.privateKey });

        const presentation = event?.credentialRequestOptions?.web?.VerifiablePresentation;
        const { challenge, domain } = presentation;

        try {
            chapiStore.set.isChapiInteraction(null);
            redirectStore.set.authRedirect(null);
        } catch (e) {
            log.error(e);
        }

        const sharedCredentials = vcs.filter((vc, index) => selectedVcs.includes(index));

        // TODO: Move this logic into LearnCard - LearnCard should handle presentation flow.
        const vpToShare = {
            '@context': [
                'https://www.w3.org/2018/credentials/v1',
                'https://w3id.org/security/suites/ed25519-2020/v1',
            ],
            type: 'VerifiablePresentation',
            verifiableCredential: sharedCredentials,
            holder: wallet.id.did(),
        };

        const data = await wallet.invoke.issuePresentation(vpToShare, {
            challenge,
            domain,
        });

        event.respondWith(
            Promise.resolve({
                dataType: 'VerifiablePresentation',
                data,
            })
        );
        setIsLoading(false);
    };

    const reject = () => {
        try {
            chapiStore.set.isChapiInteraction(null);
            redirectStore.set.authRedirect(null);
        } catch (e) {
            log.error(e);
        }
        event.respondWith(Promise.resolve(null));
    };

    return (
        <AppPage>
            <AppContent fullscreen>
                <AppRow className="w-full flex items-center justify-center h-full">
                    <AppCol className="w-full flex flex-col items-center justify-center text-center">
                        <h2 className="mt-6 font-bold">{reason}</h2>
                        {!isLoadingCredentials && vcs.length > 0 && (
                            <>
                                <AppList>{renderCredentialList}</AppList>
                                <AppCol className="flex m-auto items-center flex-wrap w-full  achievements-list-container">
                                    <div className="flex items-center justify-center w-full mt-4 mb-10">
                                        <button
                                            type="button"
                                            className="bg-emerald-700 rounded-full text-white font-bold border px-4 py-2 mr-2 w-full max-w-[200px]"
                                            onClick={accept}
                                        >
                                            {isLoading
                                                ? m['credentialStorage.sharing']()
                                                : m['credentialStorage.share']()}
                                        </button>
                                        <button
                                            type="button"
                                            className="bg-rose-600 rounded-full text-white font-bold border px-4 py-2 w-full max-w-[200px]"
                                            onClick={reject}
                                        >
                                            {m['credentialStorage.reject']()}
                                        </button>
                                    </div>
                                </AppCol>
                            </>
                        )}
                        {isLoadingCredentials && (
                            <section className="loading-spinner-container flex items-center justify-center h-[80%] w-full mt-10">
                                <AppSpinner color="dark" />
                            </section>
                        )}
                        {!isLoadingCredentials && vcs.length === 0 && (
                            <section className="flex relative flex-col achievements-list-container pt-[10px] px-[20px] text-center justify-center">
                                <strong>{m['credentialStorage.noCredsToShare']()}</strong>
                                <button
                                    type="button"
                                    className="bg-rose-600 rounded-full text-white font-bold border px-4 py-2 w-full max-w-[200px]"
                                    onClick={reject}
                                >
                                    {m['credentialStorage.cancel']()}
                                </button>
                            </section>
                        )}
                    </AppCol>
                </AppRow>
            </AppContent>
        </AppPage>
    );
};

export default VprQueryByExample;
