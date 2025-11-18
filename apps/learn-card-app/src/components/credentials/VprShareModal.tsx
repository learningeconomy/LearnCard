import React, { useState, useEffect, useRef } from 'react';
import BoostEarnedCard from '../boost/boost-earned-card/BoostEarnedCard';
import { TYPE_TO_IMG_SRC } from '@learncard/react';
import { getDefaultCategoryForCredential } from 'learn-card-base/helpers/credentialHelpers';
import { CATEGORY_TO_WALLET_SUBTYPE } from 'learn-card-base/helpers/credentialHelpers';
import { getUniqueId } from 'learn-card-base/helpers/credentials/ids';
import { useGetCredentialList, useGetResolvedCredentials } from 'learn-card-base';
import { queryListOfCredentials } from 'learn-card-base/helpers/credentials/queries';
import { filterMaybes } from '@learncard/helpers';
import { IonSpinner } from '@ionic/react';
import { VerifiablePresentationRequest } from '../../hooks/post-message/useLearnCardPostMessage';
import { VC } from '@learncard/types';

type VprShareModalProps = {
    verifiablePresentationRequest: VerifiablePresentationRequest;
    onShare: (selectedCredentials: VC[]) => void;
    onCancel: () => void;
    sharing?: boolean;
    origin?: string;
};

export const VprShareModal: React.FC<VprShareModalProps> = ({
    verifiablePresentationRequest,
    onShare,
    onCancel,
    sharing = false,
    origin,
}) => {
    const [selectedVcs, setSelectedVcs] = useState<string[]>([]);
    const [searchInput, setSearchInput] = useState('');
    const [hasSuggested, setHasSuggested] = useState(false);
    const [suggestedVcIds, setSuggestedVcIds] = useState<string[]>([]);

    const {
        data: records,
        isLoading: credentialsLoading,
        hasNextPage,
        fetchNextPage,
    } = useGetCredentialList();

    const credentialQuery = verifiablePresentationRequest?.query || [];
    const reason = credentialQuery[0]?.credentialQuery?.reason || 'share credentials';

    const allRecords = records?.pages?.flatMap(page => page?.records) ?? [];
    const resolvedCredentials = useGetResolvedCredentials(allRecords.map(record => record?.uri));

    const allCredentials = resolvedCredentials.map((vc, index) => ({
        vc: vc.data,
        loading: vc.isLoading,
        record: allRecords[index],
        category:
            allRecords[index]?.category ||
            (vc.data && getDefaultCategoryForCredential(vc.data)) ||
            'Achievement',
    }));

    const vcsToDisplay = allCredentials.filter(credential => {
        if (credential.category === 'Hidden') return false;
        if (!credential.loading && !credential.vc) return false;

        if (!searchInput) return true;

        return (
            credential.vc?.boostCredential?.name?.toLowerCase().includes(searchInput) ||
            credential.vc?.name?.toLowerCase().includes(searchInput) ||
            credential.vc?.credentialSubject?.achievement?.name?.toLowerCase().includes(searchInput)
        );
    });

    const selectedCredentials = resolvedCredentials
        .filter(vc => vc.data && selectedVcs.includes(getUniqueId(vc.data)))
        .map(vc => vc.data!);

    const allCredentialsFinishedLoading = resolvedCredentials.every(result => !result.isLoading);

    const handleVcSelection = (id: string) => {
        if (selectedVcs.includes(id)) {
            setSelectedVcs(selectedVcs.filter(n => n !== id));
        } else {
            setSelectedVcs([...selectedVcs, id]);
        }
    };

    const isVcSelected = (id: string) => selectedVcs.includes(id);

    const handleShare = () => {
        if (selectedCredentials.length > 0) {
            onShare(selectedCredentials);
        }
    };

    // Auto-select matching credentials based on VPR query
    useEffect(() => {
        if (hasSuggested || !allCredentialsFinishedLoading || credentialQuery.length === 0) {
            return;
        }

        const suggestedCreds = queryListOfCredentials(
            filterMaybes(vcsToDisplay.map(credential => credential.vc)),
            credentialQuery
        );

        const suggestedIds = suggestedCreds.map(getUniqueId);
        setSuggestedVcIds(suggestedIds);
        setSelectedVcs(suggestedIds);
        setHasSuggested(true);
    }, [allCredentialsFinishedLoading, hasSuggested, credentialQuery, vcsToDisplay]);

    // Filter credentials into suggested and non-suggested
    const suggestedCredentials = allCredentials.filter(credential => {
        if (!credential.vc) return false;
        const uniqueId = getUniqueId(credential.vc);
        return suggestedVcIds.includes(uniqueId);
    });

    const renderCredentialCard = (credential: any, key: string) => {
        const categoryImgUrl = TYPE_TO_IMG_SRC[CATEGORY_TO_WALLET_SUBTYPE[credential.category]];
        const uniqueId = credential.vc ? getUniqueId(credential.vc) : credential.record.uri;

        return (
            <div key={key} className="w-full 2xs:w-1/1 xs:w-1/3 sm:w-1/3 md:w-1/4 lg:w-1/5 2xl:w-1/6 px-2 pb-3">
                <BoostEarnedCard
                    credential={credential.vc}
                    record={credential.record}
                    defaultImg={categoryImgUrl}
                    categoryType={credential.category}
                    verifierState={true}
                    showChecked={true}
                    onCheckMarkClick={() => handleVcSelection(uniqueId)}
                    initialCheckmarkState={isVcSelected(uniqueId)}
                    useWrapper={false}
                />
            </div>
        );
    };

    const renderSuggestedList = suggestedCredentials.map(credential => {
        if (!credential.record?.uri) return null;
        return renderCredentialCard(credential, `suggested-${credential.record.id}`);
    });

    const renderCredentialList = vcsToDisplay?.map(credential => {
        if (!credential.record?.uri) return null;
        return renderCredentialCard(credential, credential.record.id);
    });

    return (
        <div className="flex flex-col h-full w-full bg-grayscale-100">
            {/* Header */}
            <div className="bg-white border-b border-grayscale-200 p-6">
                <h2 className="text-2xl font-bold text-grayscale-900 text-center">
                    Select Credentials to Share
                </h2>
                {origin && (
                    <p className="text-sm text-grayscale-600 text-center mt-2">
                        <span className="font-semibold">{origin}</span> is requesting access to {reason}
                    </p>
                )}
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-auto">
                {credentialsLoading ? (
                    <div className="flex flex-col items-center justify-center h-full">
                        <IonSpinner name="crescent" className="w-12 h-12 text-blue-600" />
                        <p className="mt-4 text-grayscale-600">Loading credentials...</p>
                    </div>
                ) : allRecords.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-grayscale-600">No credentials found</p>
                    </div>
                ) : (
                    <>
                        {/* Suggested Credentials Section */}
                        {suggestedCredentials.length > 0 && (
                            <div className="bg-blue-50 border-b border-blue-200 px-4 py-4">
                                <div className="flex items-center gap-2 mb-3 px-2">
                                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                    <h3 className="text-lg font-semibold text-grayscale-900">
                                        Suggested Credentials
                                    </h3>
                                    <span className="text-sm text-grayscale-600">
                                        ({suggestedCredentials.length} {suggestedCredentials.length === 1 ? 'match' : 'matches'})
                                    </span>
                                </div>
                                <div className="flex flex-wrap">
                                    {renderSuggestedList}
                                </div>
                            </div>
                        )}

                        {/* Search Bar */}
                        <div className="bg-grayscale-100 px-6 py-3">
                            <input
                                type="text"
                                placeholder="Search all credentials..."
                                className="w-full px-4 py-2.5 bg-white border border-grayscale-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-grayscale-900 placeholder-grayscale-500"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value.toLowerCase())}
                            />
                        </div>

                        {/* All Credentials List */}
                        <div className="px-4 py-4">
                            {suggestedCredentials.length > 0 && (
                                <h3 className="text-base font-semibold text-grayscale-700 mb-3 px-2">
                                    All Credentials
                                </h3>
                            )}
                            <div className="flex flex-wrap">
                                {renderCredentialList}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Footer with Action Buttons */}
            <div className="bg-white border-t border-grayscale-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <p className="text-grayscale-700 font-semibold">
                        {selectedVcs.length} {selectedVcs.length === 1 ? 'Credential' : 'Credentials'} Selected
                    </p>
                    {credentialQuery.length > 0 && !hasSuggested && (
                        <p className="text-sm text-grayscale-500">Selecting matching credentials...</p>
                    )}
                </div>
                <div className="flex items-center justify-center gap-4">
                    <button
                        onClick={onCancel}
                        className="px-8 py-3 text-lg font-semibold text-grayscale-700 bg-grayscale-100 rounded-full hover:bg-grayscale-200 transition-colors disabled:opacity-50"
                        disabled={sharing}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleShare}
                        className="px-10 py-3 text-lg font-semibold text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-lg"
                        disabled={sharing || selectedVcs.length === 0}
                    >
                        {sharing ? 'Sharing...' : `Share ${selectedVcs.length > 0 ? `(${selectedVcs.length})` : ''}`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VprShareModal;
