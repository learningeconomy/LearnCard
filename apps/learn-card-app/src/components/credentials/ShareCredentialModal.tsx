import React, { useState } from 'react';
import BoostEarnedCard from '../../components/boost/boost-earned-card/BoostEarnedCard';
import { TYPE_TO_IMG_SRC } from '@learncard/react';
import { getDefaultCategoryForCredential } from 'learn-card-base/helpers/credentialHelpers';
import { CATEGORY_TO_WALLET_SUBTYPE } from 'learn-card-base/helpers/credentialHelpers';
import { VC } from '@learncard/types';

type ShareCredentialModalProps = {
    credential: VC;
    onShare: () => void;
    onCancel: () => void;
    sharing?: boolean;
    origin?: string;
};

export const ShareCredentialModal: React.FC<ShareCredentialModalProps> = ({
    credential,
    onShare,
    onCancel,
    sharing = false,
    origin,
}) => {
    const category = getDefaultCategoryForCredential(credential) || 'Achievement';
    const categoryImgUrl = TYPE_TO_IMG_SRC[CATEGORY_TO_WALLET_SUBTYPE[category]];
    const credentialName = credential?.name || credential?.credentialSubject?.name || 'Credential';

    return (
        <div className="flex flex-col h-full w-full bg-grayscale-100">
            {/* Header */}
            <div className="bg-white border-b border-grayscale-200 p-6">
                <h2 className="text-2xl font-bold text-grayscale-900 text-center">
                    Share Credential
                </h2>
                {origin && (
                    <p className="text-sm text-grayscale-600 text-center mt-2">
                        <span className="font-semibold">{origin}</span> is requesting access to this credential
                    </p>
                )}
            </div>

            {/* Credential Display */}
            <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
                <BoostEarnedCard
                    credential={credential}
                    defaultImg={categoryImgUrl}
                    categoryType={category}
                    verifierState={false}
                    showChecked={false}
                    useWrapper={false}
                />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-4 p-6 border-t border-grayscale-200 bg-white">
                <button
                    onClick={onCancel}
                    className="px-8 py-3 text-lg font-semibold text-grayscale-700 bg-grayscale-100 rounded-full hover:bg-grayscale-200 transition-colors disabled:opacity-50"
                    disabled={sharing}
                >
                    Cancel
                </button>
                <button
                    onClick={onShare}
                    className="px-10 py-3 text-lg font-semibold text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-lg"
                    disabled={sharing}
                >
                    {sharing ? 'Sharing...' : 'Share'}
                </button>
            </div>
        </div>
    );
};

export default ShareCredentialModal;
