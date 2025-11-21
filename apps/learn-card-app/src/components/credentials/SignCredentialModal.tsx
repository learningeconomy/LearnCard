import React from 'react';
import BoostEarnedCard from '../boost/boost-earned-card/BoostEarnedCard';
import { TYPE_TO_IMG_SRC } from '@learncard/react';
import { getDefaultCategoryForCredential } from 'learn-card-base/helpers/credentialHelpers';
import { CATEGORY_TO_WALLET_SUBTYPE } from 'learn-card-base/helpers/credentialHelpers';
import { VC } from '@learncard/types';

type SignCredentialModalProps = {
    credential: VC;
    onSign: () => void;
    onCancel: () => void;
    signing?: boolean;
};

export const SignCredentialModal: React.FC<SignCredentialModalProps> = ({
    credential,
    onSign,
    onCancel,
    signing = false,
}) => {
    const categoryFromVc = getDefaultCategoryForCredential(credential);
    const category = categoryFromVc || 'Achievement';
    const categoryImgUrl = TYPE_TO_IMG_SRC[CATEGORY_TO_WALLET_SUBTYPE[category]];

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
                    Sign Credential
                </h2>
                <p className="text-sm text-grayscale-600 text-center mt-2">
                    Review the credential you are about to sign
                </p>
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
                    onClick={onCancel}
                    className="px-8 py-3 text-lg font-semibold text-grayscale-700 bg-grayscale-100 rounded-full hover:bg-grayscale-200 transition-colors disabled:opacity-50"
                    disabled={signing}
                >
                    Cancel
                </button>
                <button
                    onClick={onSign}
                    className="px-8 py-3 text-lg font-semibold text-white bg-indigo-600 rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    disabled={signing}
                >
                    {signing ? 'Signing...' : 'Sign'}
                </button>
            </div>
        </div>
    );
};

export default SignCredentialModal;
