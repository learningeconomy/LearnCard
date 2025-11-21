import React, { useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import queryString from 'query-string';
import { useImmer } from 'use-immer';
import isEqual from 'lodash/isEqual';

import {
    ConsentFlowContractDetails,
    ConsentFlowTerms,
    ConsentFlowTermsStatus,
    LCNProfile,
} from '@learncard/types';

import { IonCol, IonRow } from '@ionic/react';
import ConsentFlowEditAccess from './ConsentFlowEditAccess';
import PostConsentFlowActivityFeed from './PostConsentFlowActivityFeed';
import RightArrow from 'learn-card-base/svgs/RightArrow';
import HandshakeIcon from '../../components/svgs/HandshakeIcon';
import NewMyData from '../../components/new-my-data/NewMyData';

import { BoostCategoryOptionsEnum } from '../../components/boost/boost-options/boostOptions';
import {
    useUpdateTerms,
    useConsentToContract,
    useModal,
    ModalTypes,
    useWallet,
    useSyncConsentFlow,
} from 'learn-card-base';
import { IonLoading } from '@ionic/react';

import useTheme from '../../theme/hooks/useTheme';

export type ConsentFlowWriteAccessType = {
    [BoostCategoryOptionsEnum.socialBadge]: boolean;
    [BoostCategoryOptionsEnum.skill]: boolean;
    [BoostCategoryOptionsEnum.achievement]: boolean;
    [BoostCategoryOptionsEnum.learningHistory]: boolean;
    [BoostCategoryOptionsEnum.course]?: boolean;
    [BoostCategoryOptionsEnum.job]?: boolean;
    [BoostCategoryOptionsEnum.id]: boolean;
    [BoostCategoryOptionsEnum.workHistory]: boolean;
    [BoostCategoryOptionsEnum.membership]: boolean;
};

export type ConsentFlowReadAccessType = ConsentFlowWriteAccessType & {
    name: boolean;
    age: boolean;
    race: boolean;
    gender: boolean;
    postalCode: boolean;
    language: boolean;
};

type PostConsentFlowSyncCardProps = {
    consentedContract: {
        expiresAt?: string;
        liveSyncing?: boolean;
        oneTime?: boolean;
        terms: ConsentFlowTerms;
        contract: ConsentFlowContractDetails;
        uri: string;
        consenter: LCNProfile;
        status: ConsentFlowTermsStatus;
    };
    showSyncNewData?: boolean;
};

const PostConsentFlowSyncCard: React.FC<PostConsentFlowSyncCardProps> = ({
    consentedContract,
    showSyncNewData = false,
}) => {
    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const { newModal, closeModal } = useModal();
    const { initWallet } = useWallet();

    const { mutateAsync: updateTerms, isPending: updatingTerms } = useUpdateTerms(
        consentedContract?.uri,
        consentedContract?.contract?.owner.did ?? ''
    );
    const { mutateAsync: consentToContract, isPending: consentingToContract } =
        useConsentToContract(
            consentedContract?.contract?.uri,
            consentedContract?.contract?.owner.did ?? ''
        );
    const { refetch: fetchNewContractCredentials } = useSyncConsentFlow();

    const isDisconnected = consentedContract?.status === 'withdrawn';

    const [terms, setTerms] = useImmer(consentedContract?.terms);
    const [loading, setLoading] = useState(false);

    const history = useHistory();
    const location = useLocation();

    const { returnTo } = queryString.parse(location.search);

    // state for handling - data share duration
    const [shareDuration, setShareDuration] = useState<{
        oneTimeShare: boolean;
        customDuration: string;
    }>({
        oneTimeShare: consentedContract?.oneTime ?? false,
        customDuration: consentedContract?.expiresAt ?? '',
    });

    const handleCloseModal = async () => {
        if (returnTo && !Array.isArray(returnTo)) {
            if (returnTo.startsWith('http://') || returnTo.startsWith('https://')) {
                const wallet = await initWallet();

                // add user's did to returnTo url
                const urlObj = new URL(returnTo);
                urlObj.searchParams.set('did', wallet.id.did());
                if (consentedContract?.contract?.owner?.did) {
                    const unsignedDelegateCredential = wallet.invoke.newCredential({
                        type: 'delegate',
                        subject: consentedContract?.contract?.owner.did,
                        access: ['read', 'write'],
                    });

                    const delegateCredential = await wallet.invoke.issueCredential(
                        unsignedDelegateCredential
                    );

                    const unsignedDidAuthVp = await wallet.invoke.newPresentation(
                        delegateCredential
                    );
                    const vp = (await wallet.invoke.issuePresentation(unsignedDidAuthVp, {
                        proofPurpose: 'authentication',
                        proofFormat: 'jwt',
                    })) as any as string;

                    urlObj.searchParams.set('vp', vp);
                }

                window.location.href = urlObj.toString();
            } else history.push(returnTo);
        }

        closeModal();
    };

    if (!consentedContract) {
        closeModal();

        return <></>;
    }

    return (
        <section className="w-full flex flex-col gap-[20px] items-center px-[20px] py-[30px] bg-white shadow-bottom rounded-[24px] max-w-[400px] disable-scrollbars safe-area-top-margin">
            <div className="w-full flex items-center justify-center pt-2">
                <h6 className="tracking-[12px] text-base font-bold text-black">LEARNCARD</h6>
            </div>

            <div className="w-full flex flex-col items-center justify-center mt-8 px-4">
                <div className="h-[60px] w-[60px] rounded-[12px] overflow-hidden">
                    <img
                        src={consentedContract?.contract?.image}
                        alt={consentedContract?.contract?.name}
                        className="h-full w-full object-cover"
                    />
                </div>
                <h3 className="text-center font-normal text-xl mt-2 font-poppins tracking-wide text-black">
                    {consentedContract?.contract?.name}
                </h3>
                <p className="text-center text-sm text-grayscale-600 mt-2">
                    {consentedContract?.contract?.description}
                </p>
            </div>

            <div className="w-full text-center flex flex-col items-center justify-center">
                <HandshakeIcon className="text-grayscale-900 w-[40px] h-[40px]" />
                {showSyncNewData && (
                    <button
                        onClick={() => {
                            newModal(
                                <NewMyData />,
                                { sectionClassName: '!max-w-[350px]' },
                                { desktop: ModalTypes.Cancel }
                            );
                        }}
                        className={`text-${primaryColor} font-bold text-base flex mt-2 items-center justify-center`}
                    >
                        Sync New Data <RightArrow className="w-[20px] h-[20px]" />
                    </button>
                )}
                <button
                    onClick={() => {
                        newModal(
                            <ConsentFlowEditAccess
                                contractDetails={consentedContract?.contract}
                                termsUri={consentedContract?.uri}
                                terms={terms}
                                setTerms={setTerms}
                                onWithdrawConsent={handleCloseModal}
                            />,
                            undefined,
                            { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
                        );
                    }}
                    className={`text-${primaryColor} font-bold text-base flex mt-2 items-center justify-center`}
                >
                    Edit Access <RightArrow className="w-[20px] h-[20px]" />
                </button>
                <button
                    onClick={() => {
                        newModal(
                            <PostConsentFlowActivityFeed
                                shareDuration={shareDuration}
                                setShareDuration={setShareDuration}
                                consentedContract={consentedContract}
                            />,
                            undefined,
                            { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
                        );
                    }}
                    className={`text-${primaryColor} font-bold text-base flex mt-2 items-center justify-center`}
                >
                    Activity Feed
                    <RightArrow className="w-[20px] h-[20px]" />
                </button>
            </div>

            <div className="w-full flex items-center justify-center flex-col mt-8">
                <button
                    onClick={async () => {
                        setLoading(true);
                        try {
                            if (isDisconnected) {
                                await consentToContract({
                                    terms,
                                    oneTime: shareDuration.oneTimeShare,
                                    expiresAt: shareDuration.customDuration,
                                });

                                // Sync any auto-boost credentials (if any). No need to wait.
                                //   this displays a toast that says "Successfully synced X credentials" when done
                                fetchNewContractCredentials();
                            } else {
                                await updateTerms({
                                    terms,
                                    oneTime: shareDuration.oneTimeShare,
                                    expiresAt: shareDuration.customDuration,
                                });
                            }
                        } finally {
                            setLoading(false);
                        }

                        handleCloseModal();
                    }}
                    disabled={
                        loading ||
                        (!isDisconnected &&
                            isEqual(terms, consentedContract?.terms) &&
                            isEqual(shareDuration, {
                                oneTimeShare: consentedContract?.oneTime ?? false,
                                customDuration: consentedContract?.expiresAt ?? '',
                            }))
                    }
                    type="button"
                    className="flex items-center justify-center text-white rounded-full px-[18px] py-[12px] bg-emerald-700 font-poppins text-xl w-full shadow-3xl normal max-w-[320px] disabled:opacity-50"
                >
                    {loading && (isDisconnected ? 'Reconnecting...' : 'Updating...')}
                    {!loading && (isDisconnected ? 'Reconnect' : 'Update')}
                </button>
                <button
                    onClick={handleCloseModal}
                    type="button"
                    className="text-gray-600 flex items-center justify-center px-[18px] py-[12px] font-poppins text-lg w-full normal max-w-[320px] disabled:opacity-50"
                >
                    {returnTo ? 'Back' : 'Cancel'}
                </button>
                <IonLoading
                    isOpen={updatingTerms || consentingToContract}
                    message={isDisconnected ? 'Reconnecting...' : 'Updating Terms...'}
                    mode="ios"
                />
            </div>

            <div className="w-full flex items-center justify-center mt-8">
                <div className="bg-grayscale-200 w-[90%] h-[1px]" />
            </div>

            <IonRow className="flex items-center justify-center mt-4 w-full">
                <IonCol className="flex flex-col items-center justify-center text-center">
                    <p className="text-center text-sm font-normal text-grayscale-600">
                        All connections are{' '}
                        <b>
                            <u>encrypted.</u>
                        </b>
                    </p>
                </IonCol>
            </IonRow>
        </section>
    );
};

export default PostConsentFlowSyncCard;
