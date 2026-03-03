import React from 'react';
import BoostEarnedCard from '../boost/boost-earned-card/BoostEarnedCard';
import { getDefaultCategoryForCredential } from 'learn-card-base/helpers/credentialHelpers';
import { categoryMetadata } from 'learn-card-base';
import { VC } from '@learncard/types';

type CredentialAcceptanceModalProps = {
    credential: VC;
    onAccept: () => void;
    onDismiss: () => void;
    accepting?: boolean;
};

export const CredentialAcceptanceModal: React.FC<CredentialAcceptanceModalProps> = ({
    credential,
    onAccept,
    onDismiss,
    accepting = false,
}) => {
    const categoryFromVc = getDefaultCategoryForCredential(credential);
    const category = categoryFromVc || 'Achievement';
    const categoryImgUrl = categoryMetadata[category].defaultImageSrc;

    return (
        <div className="flex flex-col h-full w-full bg-grayscale-100">
            {/* Header */}
            <div 
                className="bg-white border-b border-grayscale-200 p-6"
                style={{
                    paddingTop: 'max(1.5rem, env(safe-area-inset-top))',
                }}
            >
                <h2 className="text-2xl font-bold text-grayscale-900 text-center">
                    Accept Credential
                </h2>
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
            <div 
                className="flex items-center justify-center gap-4 p-6 border-t border-grayscale-200 bg-white"
                style={{
                    paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
                    paddingLeft: 'max(1.5rem, env(safe-area-inset-left))',
                    paddingRight: 'max(1.5rem, env(safe-area-inset-right))',
                }}
            >
                <button
                    onClick={onDismiss}
                    className="px-8 py-3 text-lg font-semibold text-grayscale-700 bg-grayscale-100 rounded-full hover:bg-grayscale-200 transition-colors disabled:opacity-50"
                    disabled={accepting}
                >
                    Cancel
                </button>
                <button
                    onClick={onAccept}
                    className="px-10 py-3 text-lg font-semibold text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-lg"
                    disabled={accepting}
                >
                    {accepting ? 'Accepting...' : 'Accept'}
                </button>
            </div>
        </div>
    );
};

export default CredentialAcceptanceModal;
