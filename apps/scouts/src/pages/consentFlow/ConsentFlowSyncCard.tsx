import React, { useState, useEffect } from 'react';
import queryString from 'query-string';
import { useImmer } from 'use-immer';
import { useHistory, useLocation } from 'react-router-dom';

import { ConsentFlowContractDetails, ConsentFlowTerms } from '@learncard/types';

import { IonCol, IonLoading, IonRow, IonSkeletonText } from '@ionic/react';
import RightArrow from 'learn-card-base/svgs/RightArrow';
import HandshakeIcon from '../../components/svgs/HandshakeIcon';
import { getMinimumTermsForContract } from '../../helpers/contract.helpers';

import { BoostCategoryOptionsEnum } from 'learn-card-base';

import {
    useModal,
    useToast,
    useWallet,
    useContract,
    useCurrentUser,
    useSyncConsentFlow,
    useConsentToContract,
    ModalTypes,
    ToastTypeEnum,
} from 'learn-card-base';
import ConsentFlowEditAccess from './ConsentFlowEditAccess';

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
    isPreview?: boolean;
};

const ConsentFlowSyncCard: React.FC<ConsentFlowSyncCardProps> = ({
    contractDetails: _contractDetails,
    contractUri,
    isPreview,
}) => {
    const { newModal, closeAllModals } = useModal();
    const { presentToast } = useToast();

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

    const _returnTo = Array.isArray(returnTo) ? returnTo[0] ?? '' : returnTo ?? '';

    // state for handling - data share duration
    const [shareDuration, setShareDuration] = useState<{
        oneTimeShare: boolean;
        customDuration: string;
    }>({ oneTimeShare: false, customDuration: '' });

    // Extract httpStatus from various possible error shapes (tRPC, fetch, stringified JSON, etc.)
    const getHttpStatusFromError = (err: unknown): number | undefined => {
        const asRecord = (val: unknown): Record<string, unknown> | null =>
            val !== null && typeof val === 'object' ? (val as Record<string, unknown>) : null;

        // Direct object shapes (e.g., TRPCClientError)
        const rec = asRecord(err);
        if (rec) {
            const direct = rec['httpStatus'];
            if (typeof direct === 'number') return direct;

            const data = asRecord(rec['data']);
            const dataStatus = data?.['httpStatus'];
            if (typeof dataStatus === 'number') return dataStatus;

            const shape = asRecord(rec['shape']);
            const shapeData = asRecord(shape?.['data']);
            const shapeStatus = shapeData?.['httpStatus'];
            if (typeof shapeStatus === 'number') return shapeStatus;

            const response = asRecord(rec['response']);
            const responseStatus = response?.['status'];
            if (typeof responseStatus === 'number') return responseStatus;
        }

        // Stringified JSON in error.message or error string
        const msg = err instanceof Error ? err.message : String(err);
        try {
            const firstBrace = msg.indexOf('{');
            const firstBracket = msg.indexOf('[');
            const starts: number[] = [firstBrace, firstBracket].filter(i => i >= 0);
            const start = starts.length ? Math.min(...starts) : -1;

            if (start >= 0) {
                const jsonText = msg.slice(start).trim();
                const parsed: unknown = JSON.parse(jsonText);

                if (Array.isArray(parsed)) {
                    for (const item of parsed) {
                        const itemRec = asRecord(item);
                        const errorRec = asRecord(itemRec?.['error']);
                        const dataRec = asRecord(errorRec?.['data']) ?? asRecord(itemRec?.['data']);
                        const hs = dataRec?.['httpStatus'] ?? itemRec?.['httpStatus'];
                        if (typeof hs === 'number') return hs as number;
                    }
                } else {
                    const objRec = asRecord(parsed);
                    const errorRec = asRecord(objRec?.['error']);
                    const dataRec = asRecord(errorRec?.['data']) ?? asRecord(objRec?.['data']);
                    const hs = dataRec?.['httpStatus'] ?? objRec?.['httpStatus'];
                    if (typeof hs === 'number') return hs as number;
                }
            }
        } catch {
            // ignore JSON parse errors
        }

        return undefined;
    };

    const handleAcceptContract = async () => {
        if (!contractDetails?.contract) return;

        setLoading(true);

        try {
            const { redirectUrl: contractRedirectUrl } = await consentToContract({
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

            const redirectUrl = contractDetails?.redirectUrl || _returnTo;

            if (redirectUrl) {
                if (redirectUrl.startsWith('http://') || redirectUrl.startsWith('https://')) {
                    const wallet = await initWallet();

                    // add user's did to returnTo url
                    const urlObj = new URL(redirectUrl);
                    urlObj.searchParams.set('did', wallet.id.did());

                    // uncomment if we want the vp param
                    // if (contractDetails.owner.did) {
                    //     const unsignedDelegateCredential = wallet.invoke.newCredential({
                    //         type: 'delegate',
                    //         subject: contractDetails.owner.did,
                    //         access: ['read', 'write'],
                    //     });

                    //     const delegateCredential = await wallet.invoke.issueCredential(
                    //         unsignedDelegateCredential
                    //     );

                    //     const unsignedDidAuthVp = await wallet.invoke.newPresentation(
                    //         delegateCredential
                    //     );
                    //     const vp = (await wallet.invoke.issuePresentation(unsignedDidAuthVp, {
                    //         proofPurpose: 'authentication',
                    //         proofFormat: 'jwt',
                    //     })) as any as string;

                    //     urlObj.searchParams.set('vp', vp);
                    // }

                    window.location.href = urlObj.toString();
                } else history.push(redirectUrl);
                // } else
            } else {
                presentToast(`You are now connected with ${contractDetails.name}!`, {
                    type: ToastTypeEnum.Success,
                });
                history.push(`/`);
                // history.push(`/launchpad?uri=${contractDetails.uri}`);
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            const httpStatus = getHttpStatusFromError(err);
            if (httpStatus === 409 || msg.includes("You've already consented to this contract")) {
                const redirectUrl = contractDetails?.redirectUrl;

                newModal(
                    <div className="w-full bg-white rounded-[16px] shadow-3xl p-5 text-center">
                        <h3 className="text-xl font-semibold text-grayscale-900 mb-2">
                            Already Consented
                        </h3>
                        <p className="text-sm text-grayscale-700 mb-5">
                            You've already consented to this connection. Any new credentials will be
                            synced to your account soon!
                        </p>
                        <div className="flex items-center justify-center gap-3">
                            {redirectUrl ? (
                                <button
                                    className="px-4 py-2 rounded-full bg-sp-purple-base text-white font-medium"
                                    onClick={async () => {
                                        try {
                                            if (
                                                redirectUrl.startsWith('http://') ||
                                                redirectUrl.startsWith('https://')
                                            ) {
                                                const wallet = await initWallet();
                                                const urlObj = new URL(redirectUrl);
                                                urlObj.searchParams.set('did', wallet.id.did());
                                                window.location.href = urlObj.toString();
                                            } else {
                                                closeAllModals();
                                                history.push(redirectUrl);
                                            }
                                        } catch (e) {
                                            console.error('Redirect failed:', e);
                                        }
                                    }}
                                >
                                    Continue
                                </button>
                            ) : (
                                <button
                                    className="px-4 py-2 rounded-full bg-sp-purple-base text-white font-medium"
                                    onClick={() => {
                                        closeAllModals();
                                        history.push('/campfire');
                                    }}
                                >
                                    Take me Home
                                </button>
                            )}
                        </div>
                    </div>,
                    { sectionClassName: '!max-w-[400px]' },
                    { desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel }
                );

                // Prevent the unconditional navigation at the end of the function
                return;
            }

            // Show generic unknown error modal for all other errors
            newModal(
                <div className="w-full bg-white rounded-[16px] shadow-3xl p-5 text-center">
                    <h3 className="text-xl font-semibold text-grayscale-900 mb-2">Unknown Error</h3>
                    <p className="text-sm text-grayscale-700 mb-5">
                        There was an unknown error. Please try again.
                    </p>
                    <div className="flex items-center justify-center gap-3">
                        <button
                            className="px-4 py-2 rounded-full bg-sp-purple-base text-white font-medium"
                            onClick={() => {
                                closeAllModals();
                            }}
                        >
                            Okay
                        </button>
                    </div>
                </div>,
                { sectionClassName: '!max-w-[400px]' },
                { desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel }
            );

            // Prevent the unconditional navigation at the end of the function
            return;
        } finally {
            setLoading(false);
        }

        closeAllModals();
        history.push('/');
    };

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
                        className="text-indigo-500 font-bold text-base flex mt-2 items-center justify-center disabled:opacity-50"
                        disabled={!contractDetails?.contract || isPreview}
                    >
                        Edit Access <RightArrow className="w-[20px] h-[20px]" />
                    </button>
                </div>

                <div className="w-full flex items-center justify-center flex-col mt-8">
                    <button
                        onClick={handleAcceptContract}
                        type="button"
                        className="flex items-center justify-center text-white rounded-full px-[18px] py-[12px] bg-sp-purple-base font-poppins text-xl w-full shadow-3xl normal max-w-[320px] disabled:opacity-50"
                        disabled={!contractDetails?.contract || loading || isPreview}
                    >
                        {loading ? 'Allowing...' : 'Allow'}
                    </button>
                    <IonLoading isOpen={isPending} message="Consenting..." mode="ios" />
                    <button
                        onClick={() => {
                            history.push('/');
                        }}
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
