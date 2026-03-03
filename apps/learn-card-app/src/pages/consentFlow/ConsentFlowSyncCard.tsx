import React, { useState, useEffect } from 'react';
import queryString from 'query-string';
import { useImmer } from 'use-immer';
import { useHistory, useLocation } from 'react-router-dom';

import { ConsentFlowContractDetails, ConsentFlowTerms } from '@learncard/types';

import { IonCol, IonLoading, IonRow, IonSkeletonText } from '@ionic/react';
import RightArrow from 'learn-card-base/svgs/RightArrow';
import HandshakeIcon from '../../components/svgs/HandshakeIcon';
import { getMinimumTermsForContract } from '../../helpers/contract.helpers';

import {
    BoostCategoryOptionsEnum,
    useConsentToContract,
    useContract,
    useCurrentUser,
    useModal,
    ModalTypes,
    useWallet,
    useSyncConsentFlow,
} from 'learn-card-base';
import NewMyData from '../../components/new-my-data/NewMyData';
import ConsentFlowEditAccess from '../launchPad/ConsentFlowEditAccess';

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

type ConsentFlowSyncCardProps = {
    contractDetails?: ConsentFlowContractDetails;
    contractUri?: string;
    showSyncNewData?: boolean;
    isPreview?: boolean;
};

const ConsentFlowSyncCard: React.FC<ConsentFlowSyncCardProps> = ({
    contractDetails: _contractDetails,
    contractUri,
    showSyncNewData = false,
    isPreview,
}) => {
    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const { newModal, closeModal, closeAllModals } = useModal();

    const { initWallet } = useWallet();

    const [loading, setLoading] = useState(false);

    const { data: contract } = useContract(contractUri);

    const contractDetails = _contractDetails || contract;

    const currentUser = useCurrentUser()!!!!!!!!!;

    const { refetch: fetchNewContractCredentials } = useSyncConsentFlow();
    const { mutateAsync: consentToContract, isPending } = useConsentToContract(
        contractDetails?.uri ?? '',
        contractDetails?.owner?.did ?? ''
    );
    const [terms, setTerms] = useImmer(
        contractDetails?.contract
            ? getMinimumTermsForContract(contractDetails.contract, currentUser)
            : ({} as ConsentFlowTerms)
    );

    useEffect(() => {
        if (contractDetails?.contract) {
            setTerms(getMinimumTermsForContract(contractDetails.contract, currentUser));
        }
    }, [JSON.stringify(contractDetails?.contract ?? '')]);

    const history = useHistory();
    const location = useLocation();

    const { returnTo } = queryString.parse(location.search);

    // state for handling - data share duration
    const [shareDuration, setShareDuration] = useState<{
        oneTimeShare: boolean;
        customDuration: string;
    }>({ oneTimeShare: false, customDuration: '' });

    return (
        <section className="disable-scrollbars safe-area-top-margin w-full flex flex-col gap-[20px] items-center px-[20px] py-[30px] bg-white shadow-bottom rounded-[24px] max-w-[400px]">
            <div className="flex flex-col pt-8 w-full">
                <div className="w-full flex items-center justify-center pt-2">
                    <h6 className="tracking-[12px] text-base font-bold text-black">LEARNCARD</h6>
                </div>

                <div className="w-full flex flex-col items-center justify-center mt-8 px-4">
                    <div className="h-[60px] w-[60px] rounded-[12px] overflow-hidden">
                        {contractDetails?.contract ? (
                            <img
                                src={contractDetails?.image}
                                alt={contractDetails?.name}
                                className="h-full w-full m-0 object-cover"
                            />
                        ) : (
                            <IonSkeletonText animated className="h-full w-full m-0" />
                        )}
                    </div>
                    {contractDetails?.contract ? (
                        <h3 className="font-normal text-black text-xl mt-2 font-poppins tracking-wide">
                            {contractDetails?.name}
                        </h3>
                    ) : (
                        <IonSkeletonText animated className="mt-2 w-64" />
                    )}
                    {contractDetails?.contract ? (
                        <>
                            {contractDetails?.subtitle && (
                                <p className="text-center text-sm font-poppins text-grayscale-800 italic mt-2">
                                    {contractDetails.subtitle}
                                </p>
                            )}
                            <p className="text-center text-sm font-semibold px-[16px] text-grayscale-800 mt-4">
                                {contractDetails?.description}
                            </p>
                        </>
                    ) : (
                        <>
                            <IonSkeletonText animated className="mt-4 w-[calc(100%-32px)]" />
                            <IonSkeletonText animated className="w-[calc(100%-32px)]" />
                        </>
                    )}
                </div>

                <div className="w-full text-center flex flex-col items-center justify-center">
                    <HandshakeIcon className="text-grayscale-900 w-[40px] h-[40px] mt-4" />
                    {showSyncNewData && (
                        <button
                            onClick={() => {
                                newModal(
                                    <NewMyData />,
                                    { sectionClassName: '!max-w-[350px]' },
                                    { desktop: ModalTypes.Cancel }
                                );
                            }}
                            className={`text-${primaryColor} font-bold text-base flex mt-2 items-center justify-center disabled:opacity-50`}
                            disabled={!contractDetails?.contract}
                        >
                            Sync New Data <RightArrow className="w-[20px] h-[20px]" />
                        </button>
                    )}
                    <button
                        onClick={() => {
                            newModal(
                                <ConsentFlowEditAccess
                                    contractDetails={contractDetails}
                                    terms={terms}
                                    setTerms={setTerms}
                                />,
                                undefined,
                                { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
                            );
                        }}
                        className={`text-${primaryColor} font-bold text-base flex mt-2 items-center justify-center disabled:opacity-50`}
                        disabled={!contractDetails?.contract || isPreview}
                    >
                        Edit Access <RightArrow className="w-[20px] h-[20px]" />
                    </button>
                </div>

                <div className="w-full flex items-center justify-center flex-col mt-8">
                    <button
                        onClick={async () => {
                            if (!contractDetails?.contract) return;

                            setLoading(true);

                            try {
                                const { redirectUrl: contractRedirectUrl } =
                                    await consentToContract({
                                        terms,
                                        expiresAt: shareDuration.customDuration,
                                        oneTime: shareDuration.oneTimeShare,
                                    });

                                // Sync any auto-boost credentials (if any). No need to wait.
                                //   this displays a toast that says "Successfully synced X credentials" when done
                                fetchNewContractCredentials();

                                if (contractRedirectUrl) {
                                    // If the consentToContract call returned a specific redirect url, use it over everything else
                                    window.location.href = contractRedirectUrl;
                                    return;
                                }

                                if (returnTo && !Array.isArray(returnTo)) {
                                    if (
                                        returnTo.startsWith('http://') ||
                                        returnTo.startsWith('https://')
                                    ) {
                                        const wallet = await initWallet();

                                        // add user's did to returnTo url
                                        const urlObj = new URL(returnTo);
                                        urlObj.searchParams.set('did', wallet.id.did());
                                        if (contractDetails.owner.did) {
                                            const unsignedDelegateCredential =
                                                wallet.invoke.newCredential({
                                                    type: 'delegate',
                                                    subject: contractDetails.owner.did,
                                                    access: ['read', 'write'],
                                                });

                                            const delegateCredential =
                                                await wallet.invoke.issueCredential(
                                                    unsignedDelegateCredential
                                                );

                                            const unsignedDidAuthVp =
                                                await wallet.invoke.newPresentation(
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
                                } else history.push(`/launchpad?uri=${contractDetails.uri}`);
                            } finally {
                                setLoading(false);
                            }

                            closeAllModals();
                        }}
                        type="button"
                        className="flex items-center justify-center text-white rounded-full px-[18px] py-[12px] bg-emerald-700 font-poppins text-xl w-full shadow-3xl normal max-w-[320px] disabled:opacity-50"
                        disabled={!contractDetails?.contract || loading || isPreview}
                    >
                        {loading ? 'Allowing...' : 'Allow'}
                    </button>
                    <IonLoading isOpen={isPending} message="Consenting..." mode="ios" />
                    <button
                        onClick={closeModal}
                        type="button"
                        className="text-grayscale-900 text-center text-base w-full font-medium mt-4"
                    >
                        Cancel
                    </button>
                </div>
            </div>
            <IonRow className="flex items-center justify-center mt-4 w-full">
                <IonCol className="flex flex-col items-center justify-center text-center">
                    <p className="text-center text-sm font-normal w-[90%] px-16 text-grayscale-600 border-t border-t-grayscale-200 pb-[30px] pt-[20px]">
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

export default ConsentFlowSyncCard;
