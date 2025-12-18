import React, { useEffect } from 'react';
import queryString from 'query-string';
import { useLocation, useHistory } from 'react-router-dom';

import { IonContent, IonSpinner } from '@ionic/react';
import ConsentFlowSyncButton from './ConsentFlowSyncButton';
import ConsentFlowSyncCard from './ConsentFlowSyncCard';

import useCurrentUser from 'learn-card-base/hooks/useGetCurrentUser';

import { ModalTypes, ProfilePicture, useContract, useModal, useWallet } from 'learn-card-base';
import { oauth2ReducerArgStore } from '../sync-my-school/ExternalAuthServiceProvider';
import { useConsentedContracts } from 'learn-card-base/hooks/useConsentedContracts';
import PostConsentFlowSyncCard from '../launchPad/PostConsentFlowSyncCard';
import { useRegistryState } from '../../hooks/useRegistryEntryState';

// Deprecated - ConsentFlow happens on LaunchPad now
const ConsentFlowSyncData: React.FC = () => {
    const currentUser = useCurrentUser();
    const { initWallet } = useWallet();

    const location = useLocation();
    const history = useHistory();

    const { newModal } = useModal();

    const { uri, returnTo } = queryString.parse(location.search);

    const contractUri = Array.isArray(uri) ? uri[0] ?? '' : uri ?? '';

    const { data: contractDetails } = useContract(contractUri);
    const { data: consentedContracts, isLoading } = useConsentedContracts();
    const entries = useRegistryState();
    const consentedContract = consentedContracts?.find(
        c => c?.contract?.uri === contractDetails?.uri
    );

    const entriesLoading = entries.some(entry => entry.isLoading);

    const showNextStep = () => {
        if (consentedContract) {
            newModal(
                <PostConsentFlowSyncCard consentedContract={consentedContract} />,
                {
                    sectionClassName: '!max-w-[400px]',
                },
                { desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel }
            );
        } else {
            newModal(
                <ConsentFlowSyncCard contractDetails={contractDetails} contractUri={contractUri} />,
                { sectionClassName: '!max-w-[400px] !bg-transparent !shadow-none' }
            );
        }
    };

    const allSynced = entries
        .filter(entry => entry.data.state !== 'Hidden')
        .every(entry => entry.data.state === 'Synced');

    useEffect(() => {
        if (!entriesLoading && allSynced && contractDetails && !isLoading) showNextStep();
    }, [entriesLoading, contractDetails, isLoading]);

    return (
        <IonContent className="fs-ion-content-fix bg-emerald-700 [&::part(scroll)]:justify-end">
            <section className="max-h-full py-[20px] overflow-y-auto disable-scrollbars safe-area-top-margin">
                <section className="w-full flex flex-col gap-[20px] items-center px-[20px] py-[30px] bg-white shadow-bottom rounded-[24px] max-w-[350px]">
                    <header className="flex items-center flex-col gap-[10px] border-solid border-b-[1px] border-grayscale-200 pb-[20px] w-full">
                        <span className="text-grayscale-900 text-[14px] font-montserrat normal font-[700] tracking-[7px] text-center">
                            LearnCard
                        </span>

                        <div className="flex flex-col items-center">
                            <ProfilePicture customContainerClass="flex justify-center items-center h-[60px] w-[60px] rounded-full overflow-hidden border-white border-solid border-2 text-white font-medium text-4xl" />
                            <span className="text-grayscale-900 font-poppins text-[31px] leading-[130%]">
                                {currentUser?.name}
                            </span>
                        </div>

                        <span className="text-grayscale-700 text-[14px]">
                            Universal Learning & Work Portfolio
                        </span>
                    </header>

                    <div className="flex flex-col gap-[10px] items-center">
                        <span className="text-grayscale-900 text-[20px] font-poppins font-[600] leading-[160%]">
                            Sync My Data
                        </span>
                        <span className="text-grayscale-800 text-[17px] font-poppins text-center">
                            Connect Your Learning and Employment Data
                        </span>
                    </div>

                    <div className="flex flex-col gap-[10px]">
                        {!entriesLoading &&
                            (entries?.filter(entry => entry?.data?.state !== 'Hidden').length ??
                                0) === 0 && (
                                <span className="text-center">
                                    You haven't connected to any data sources yet.
                                </span>
                            )}

                        {entries?.map(entry => {
                            return (
                                <ConsentFlowSyncButton
                                    preLogin={() => {
                                        oauth2ReducerArgStore.set.args({
                                            action: 'redirect',
                                            data: {
                                                path: location.pathname,
                                                params: queryString.stringify({
                                                    ...queryString.parse(location.search),
                                                    dataSource: entry.data.id,
                                                }),
                                            },
                                        });
                                    }}
                                    entry={entry.data}
                                    key={entry.data.id}
                                />
                            );
                        })}

                        {entriesLoading && <IonSpinner />}
                    </div>

                    <footer className="flex items-center w-full border-t border-solid border-r-grayscale-200 pt-[20px]">
                        <button
                            className="w-full flex items-center justify-center text-white px-[10px] py-[10px] rounded-[40px] bg-emerald-700 disabled:bg-grayscale-400 font-montserrat text-center text-lg font-semibold"
                            onClick={showNextStep}
                            type="button"
                            disabled={!contractDetails || !allSynced}
                        >
                            Next
                        </button>
                    </footer>
                </section>

                <button
                    className="w-full bg-white flex items-center justify-center px-[20px] py-[15px] rounded-[24px] shadow-bottom font-montserrat text-center text-xl font-normal max-w-[350px] mt-[10px]"
                    type="button"
                    onClick={async () => {
                        if (returnTo && !Array.isArray(returnTo)) {
                            if (returnTo.startsWith('http://') || returnTo.startsWith('https://')) {
                                const wallet = await initWallet();

                                // add user's did to returnTo url
                                const urlObj = new URL(returnTo);
                                urlObj.searchParams.set('did', wallet.id.did());
                                if (contractDetails?.owner?.did) {
                                    const unsignedDelegateCredential = wallet.invoke.newCredential({
                                        type: 'delegate',
                                        subject: contractDetails.owner.did,
                                        access: ['read', 'write'],
                                    });

                                    const delegateCredential = await wallet.invoke.issueCredential(
                                        unsignedDelegateCredential
                                    );

                                    const unsignedDidAuthVp = await wallet.invoke.newPresentation(
                                        delegateCredential
                                    );
                                    const vp = (await wallet.invoke.issuePresentation(
                                        unsignedDidAuthVp,
                                        {
                                            proofPurpose: 'authentication',
                                            proofFormat: 'jwt',
                                        }
                                    )) as any as string;

                                    urlObj.searchParams.set('vp', vp);
                                }

                                window.location.href = urlObj.toString();
                            } else history.push(returnTo);
                        } else history.push('/home');
                    }}
                >
                    Close
                </button>
            </section>
        </IonContent>
    );
};

export default ConsentFlowSyncData;
