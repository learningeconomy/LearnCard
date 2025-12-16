import React, { useMemo, useState } from 'react';
import type { AppStoreListing, InstalledApp } from '@learncard/types';

import { IonSpinner, IonFooter } from '@ionic/react';
import { Sparkles, History, Send, ChevronLeft, Settings } from 'lucide-react';

import {
    useModal,
    ModalTypes,
    useGetAllAiTopicCredentials,
    useWallet,
    useWithdrawConsent,
    useConfirmation,
} from 'learn-card-base';
import { ThreeDotVertical } from '@learncard/react';

import TrashBin from '../../components/svgs/TrashBin';
import useAppStore from './useAppStore';
import { useConsentFlowByUri } from '../consentFlow/useConsentFlow';
import ConsentFlowPrivacyAndData from '../consentFlow/ConsentFlowPrivacyAndData';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyCredential = any;

type ExtendedAppStoreListing = (AppStoreListing | InstalledApp) & {
    highlights?: string[];
    screenshots?: string[];
    promo_video_url?: string;
};

interface AiTutorConnectedViewProps {
    listing: ExtendedAppStoreListing;
    launchConfig: {
        aiTutorUrl: string;
        contractUri?: string;
    };
}

type ViewStep = 'main' | 'new' | 'existing';

const AiTutorConnectedView: React.FC<AiTutorConnectedViewProps> = ({ listing, launchConfig }) => {
    const { closeModal, newModal, closeAllModals } = useModal();
    const confirm = useConfirmation();

    const { initWallet } = useWallet();

    const [step, setStep] = useState<ViewStep>('main');
    const [newTopic, setNewTopic] = useState('');
    const [isLaunching, setIsLaunching] = useState(false);

    // Get all AI topics and filter by this app's contract
    const { data: allTopics, isLoading: loadingTopics } = useGetAllAiTopicCredentials();

    const existingTopics = useMemo(() => {
        if (!allTopics || !launchConfig.contractUri) return [];

        return allTopics.filter(
            (t: AnyCredential) => t?.credentialSubject?.contractUri === launchConfig.contractUri
        );
    }, [allTopics, launchConfig.contractUri]);

    // Consent flow hooks
    const { contract, consentedContract, hasConsented } = useConsentFlowByUri(launchConfig.contractUri);
    const termsUri = consentedContract?.uri;
    const { mutateAsync: withdrawConsent } = useWithdrawConsent(termsUri ?? '');

    // Uninstall handling
    const { useUninstallApp } = useAppStore();
    const uninstallMutation = useUninstallApp();

    const handleLaunch = async (topic: string) => {
        if (!launchConfig.aiTutorUrl || !topic.trim()) return;

        setIsLaunching(true);

        try {
            const wallet = await initWallet();
            const userDid = wallet.id.did();

            const url = new URL(`${launchConfig.aiTutorUrl}/chats`);
            url.searchParams.set('did', userDid);
            url.searchParams.set('topic', topic.trim());

            window.open(url.toString(), '_blank');
            closeAllModals();
        } catch (error) {
            console.error('Failed to launch AI tutor:', error);
        } finally {
            setIsLaunching(false);
        }
    };

    const handleNewTopic = () => {
        if (newTopic.trim()) {
            handleLaunch(newTopic.trim());
        }
    };

    const handleExistingTopic = (topicCredential: AnyCredential) => {
        const topicName =
            topicCredential?.credentialSubject?.topic ||
            topicCredential?.credentialSubject?.name ||
            '';

        handleLaunch(topicName);
    };

    const handleUninstall = async () => {
        try {
            if (termsUri) {
                try {
                    await withdrawConsent(termsUri);
                } catch (error) {
                    console.error('Failed to withdraw consent:', error);
                }
            }

            await uninstallMutation.mutateAsync(listing.listing_id);
            closeAllModals();
        } catch (error) {
            console.error('Failed to uninstall app:', error);
        }
    };

    const handleUninstallConfirm = async () => {
        await confirm({
            text: `Are you sure you want to uninstall ${listing.display_name}?`,
            onConfirm: handleUninstall,
            cancelButtonClassName:
                'cancel-btn text-grayscale-900 bg-grayscale-200 py-2 rounded-[40px] font-bold px-2 w-[100px]',
            confirmButtonClassName:
                'confirm-btn bg-red-600 text-white py-2 rounded-[40px] font-bold px-2 w-[100px]',
        });
    };

    const handleEditPermissions = () => {
        if (!contract || !consentedContract?.terms) return;

        closeModal();

        newModal(
            <ConsentFlowPrivacyAndData
                contractDetails={contract}
                terms={consentedContract.terms}
                setTerms={() => {}}
                isPostConsent={true}
            />,
            {},
            { desktop: ModalTypes.Right, mobile: ModalTypes.Right }
        );
    };

    const handleOpenOptionsMenu = () => {
        newModal(
            <ul className="w-full flex flex-col items-center justify-center ion-padding">
                {hasConsented && contract && (
                    <li className="w-full border-b border-grayscale-200">
                        <button
                            className="text-[17px] font-poppins w-full flex items-center justify-between py-3 px-2"
                            type="button"
                            onClick={handleEditPermissions}
                        >
                            <p className="text-grayscale-900">Edit Permissions</p>
                            <Settings className="w-5 h-5 text-grayscale-600" />
                        </button>
                    </li>
                )}

                <li className="w-full">
                    <button
                        className="text-[17px] font-poppins w-full flex items-center justify-between py-3 px-2"
                        type="button"
                        onClick={() => {
                            closeModal();
                            handleUninstallConfirm();
                        }}
                    >
                        <p className="text-red-600">Uninstall</p>
                        <TrashBin className="text-red-600" />
                    </button>
                </li>
            </ul>,
            { sectionClassName: '!max-w-[400px]' },
            { desktop: ModalTypes.Center, mobile: ModalTypes.Center }
        );
    };

    // Main view - shows topics and options to start new or revisit
    const renderMainView = () => (
        <div className="h-full w-full flex flex-col">
            {/* Header */}
            <div className="bg-white rounded-t-[24px] border-solid border-white border-[3px]">
                <div className="w-full flex items-center justify-center flex-col bg-opacity-70 rounded-t-[20px] backdrop-blur-[5px] bg-white pt-6 pb-4">
                    <div className="h-[100px] w-[100px] rounded-[20px] overflow-hidden">
                        <img
                            className="w-full h-full object-cover bg-white rounded-[20px] overflow-hidden border-[1px] border-solid"
                            alt={`${listing.display_name} logo`}
                            src={listing.icon_url}
                        />
                    </div>

                    <p className="text-center text-[22px] font-poppins mt-4 text-grayscale-900 font-semibold">
                        {listing.display_name}
                    </p>

                    <p className="text-center text-sm font-poppins text-grayscale-500 mt-1">
                        {listing.tagline}
                    </p>
                </div>
            </div>

            {/* Topics Section */}
            <div className="bg-white ion-padding rounded-b-[20px] shadow-soft-bottom">
                <div className="w-full flex items-center justify-center mb-4">
                    <p className="text-grayscale-700 font-poppins font-semibold text-[17px] flex items-center justify-center">
                        AI Sessions
                        <span className="text-2xl">&nbsp;·&nbsp;</span>
                        {loadingTopics ? (
                            <IonSpinner name="crescent" color="dark" className="scale-[0.8] mr-1" />
                        ) : (
                            existingTopics.length
                        )}
                        &nbsp;Topics
                    </p>
                </div>

                {loadingTopics ? (
                    <div className="flex justify-center py-8">
                        <IonSpinner name="crescent" />
                    </div>
                ) : existingTopics.length > 0 ? (
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {existingTopics.slice(0, 5).map((topicCred: AnyCredential, index: number) => {
                            const topicName =
                                topicCred?.credentialSubject?.topic ||
                                topicCred?.credentialSubject?.name ||
                                'Untitled Topic';

                            return (
                                <button
                                    key={index}
                                    onClick={() => handleExistingTopic(topicCred)}
                                    disabled={isLaunching}
                                    className="w-full px-4 py-3 bg-grayscale-50 hover:bg-grayscale-100 rounded-xl text-left text-sm font-medium text-grayscale-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    <History className="w-4 h-4 text-grayscale-400" />
                                    {topicName}
                                </button>
                            );
                        })}

                        {existingTopics.length > 5 && (
                            <button
                                onClick={() => setStep('existing')}
                                className="w-full text-center text-sm text-cyan-600 font-medium py-2"
                            >
                                View all {existingTopics.length} topics
                            </button>
                        )}
                    </div>
                ) : (
                    <p className="text-center text-sm text-grayscale-500 py-4">
                        No topics yet. Start a new conversation!
                    </p>
                )}
            </div>

            {/* Actions Section */}
            <div className="rounded-[20px] bg-white mt-4 w-full ion-padding">
                <button
                    onClick={() => setStep('new')}
                    className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-violet-50 to-indigo-50 rounded-xl hover:from-violet-100 hover:to-indigo-100 transition-colors mb-3"
                >
                    <div className="w-12 h-12 rounded-full bg-violet-500 flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-white" />
                    </div>

                    <div className="text-left">
                        <p className="font-semibold text-grayscale-900">New Topic</p>
                        <p className="text-sm text-grayscale-500">Start a fresh AI tutoring session</p>
                    </div>
                </button>

                <button
                    onClick={() => setStep('existing')}
                    disabled={existingTopics.length === 0}
                    className="w-full flex items-center gap-4 p-4 bg-grayscale-50 rounded-xl hover:bg-grayscale-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <div className="w-12 h-12 rounded-full bg-grayscale-200 flex items-center justify-center">
                        <History className="w-6 h-6 text-grayscale-600" />
                    </div>

                    <div className="text-left">
                        <p className="font-semibold text-grayscale-900">Revisit Topic</p>
                        <p className="text-sm text-grayscale-500">
                            {existingTopics.length > 0
                                ? `Continue from ${existingTopics.length} previous topics`
                                : 'No previous topics yet'}
                        </p>
                    </div>
                </button>
            </div>
        </div>
    );

    // New topic view
    const renderNewTopicView = () => (
        <div className="flex flex-col h-full">
            <div className="bg-white rounded-[20px] p-6">
                <button
                    onClick={() => setStep('main')}
                    className="flex items-center gap-2 text-grayscale-600 hover:text-grayscale-900 mb-4"
                >
                    <ChevronLeft className="w-5 h-5" />
                    Back
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-violet-500 flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-white" />
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-grayscale-900">New Topic</h3>
                        <p className="text-sm text-grayscale-500">What would you like to learn?</p>
                    </div>
                </div>

                <div className="relative">
                    <input
                        type="text"
                        value={newTopic}
                        onChange={e => setNewTopic(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleNewTopic()}
                        placeholder="Enter your topic..."
                        className="w-full px-4 py-3 pr-12 bg-grayscale-50 rounded-xl text-grayscale-900 placeholder-grayscale-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                        autoFocus
                    />

                    <button
                        onClick={handleNewTopic}
                        disabled={!newTopic.trim() || isLaunching}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-violet-500 rounded-lg flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLaunching ? (
                            <IonSpinner name="crescent" className="w-4 h-4" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                    </button>
                </div>

                <p className="text-xs text-grayscale-400 mt-3 text-center">
                    Press Enter or click the button to start
                </p>
            </div>
        </div>
    );

    // Existing topics view
    const renderExistingTopicsView = () => (
        <div className="flex flex-col h-full">
            <div className="bg-white rounded-[20px] p-6">
                <button
                    onClick={() => setStep('main')}
                    className="flex items-center gap-2 text-grayscale-600 hover:text-grayscale-900 mb-4"
                >
                    <ChevronLeft className="w-5 h-5" />
                    Back
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-grayscale-200 flex items-center justify-center">
                        <History className="w-6 h-6 text-grayscale-600" />
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-grayscale-900">Your Topics</h3>
                        <p className="text-sm text-grayscale-500">
                            {existingTopics.length} previous sessions
                        </p>
                    </div>
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {existingTopics.map((topicCred: AnyCredential, index: number) => {
                        const topicName =
                            topicCred?.credentialSubject?.topic ||
                            topicCred?.credentialSubject?.name ||
                            'Untitled Topic';

                        return (
                            <button
                                key={index}
                                onClick={() => handleExistingTopic(topicCred)}
                                disabled={isLaunching}
                                className="w-full px-4 py-3 bg-grayscale-50 hover:bg-grayscale-100 rounded-xl text-left text-sm font-medium text-grayscale-700 transition-colors disabled:opacity-50"
                            >
                                {topicName}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );

    return (
        <div className="h-full w-full flex flex-col bg-gradient-to-b from-violet-500 to-indigo-600">
            <div className="flex-1 overflow-y-auto ion-padding pb-[100px]">
                <div className="max-w-[600px] mx-auto">
                    {step === 'main' && renderMainView()}
                    {step === 'new' && renderNewTopicView()}
                    {step === 'existing' && renderExistingTopicsView()}
                </div>
            </div>

            {/* Footer */}
            <IonFooter
                mode="ios"
                className="w-full flex justify-center items-center ion-no-border bg-opacity-60 backdrop-blur-[10px] py-4 absolute bottom-0 bg-white !max-h-[100px]"
            >
                <div className="w-full flex items-center justify-center">
                    <div className="w-full flex items-center justify-between max-w-[600px] ion-padding gap-2">
                        <button
                            onClick={closeModal}
                            className="py-[9px] pl-[20px] pr-[15px] bg-white rounded-[30px] font-notoSans text-[17px] leading-[24px] tracking-[0.25px] text-grayscale-900 shadow-button-bottom flex gap-[5px] justify-center flex-1"
                        >
                            Back
                        </button>

                        <button
                            onClick={handleOpenOptionsMenu}
                            className="p-2 rounded-full bg-white shadow-button-bottom flex items-center justify-center"
                            aria-label="More options"
                        >
                            <ThreeDotVertical className="w-6 h-6 text-grayscale-600" />
                        </button>
                    </div>
                </div>
            </IonFooter>
        </div>
    );
};

export default AiTutorConnectedView;
