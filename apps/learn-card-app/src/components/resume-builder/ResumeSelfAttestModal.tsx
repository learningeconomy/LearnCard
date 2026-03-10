import React, { useMemo, useState } from 'react';

import { IonSpinner } from '@ionic/react';
import {
    BoostCategoryOptionsEnum,
    boostCategoryMetadata,
    constructCustomBoostType,
    useCreateBoost,
    useGetProfile,
    useModal,
    useToast,
    ToastTypeEnum,
} from 'learn-card-base';

import useWallet from 'learn-card-base/hooks/useWallet';

import { initialBoostCMSState, LCNBoostStatusEnum } from '../boost/boost';
import { getDefaultDisplayType, sendBoostCredential } from '../boost/boostHelpers';
import { useAddCredentialToWallet } from '../boost/mutations';
import { resumeBuilderStore } from '../../stores/resumeBuilderStore';
import type { ResumeSectionKey } from './resume-builder.helpers';

type ResumeSelfAttestModalProps = {
    category: ResumeSectionKey;
};

export const ResumeSelfAttestModal: React.FC<ResumeSelfAttestModalProps> = ({ category }) => {
    const { closeModal } = useModal();
    const { initWallet } = useWallet();
    const { presentToast } = useToast();
    const { data: profile } = useGetProfile();
    const { mutateAsync: createBoost } = useCreateBoost();
    const { mutateAsync: addCredentialToWallet } = useAddCredentialToWallet();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const boostCategory = category as unknown as BoostCategoryOptionsEnum;
    const metadata = boostCategoryMetadata[boostCategory];

    const continueDisabled = !name.trim() || !description.trim() || isLoading;

    const handleSelfIssue = async () => {
        if (!profile?.profileId) {
            presentToast('Unable to self issue without a profile.', {
                duration: 3000,
                type: ToastTypeEnum.Error,
            });
            return;
        }

        try {
            setIsLoading(true);

            const wallet = await initWallet();
            if (!wallet) throw new Error('Wallet is not initialized');

            const customBoostType = constructCustomBoostType(boostCategory, name.trim());
            const state = {
                ...initialBoostCMSState,
                basicInfo: {
                    ...initialBoostCMSState.basicInfo,
                    name: name.trim(),
                    description: description.trim(),
                    type: boostCategory,
                    achievementType: customBoostType,
                },
                appearance: {
                    ...initialBoostCMSState.appearance,
                    badgeThumbnail: metadata?.CategoryImage ?? '',
                    displayType: getDefaultDisplayType(boostCategory),
                },
            };

            const { boostUri } = await createBoost({
                state,
                status: LCNBoostStatusEnum.live,
                defaultPermissions: {
                    canView: false,
                    canEdit: true,
                    canIssue: true,
                },
            });

            if (!boostUri) throw new Error('Boost was created without a URI');

            const { sentBoost } = await sendBoostCredential(wallet, profile.profileId, boostUri);
            const issuedVcUri = await wallet.store.LearnCloud.uploadEncrypted?.(sentBoost);

            if (!issuedVcUri) throw new Error('Unable to save issued credential');

            await addCredentialToWallet({ uri: issuedVcUri });

            const existingEntries = resumeBuilderStore.get.credentialEntries()[category] ?? [];
            const alreadySelected = existingEntries.some(entry => entry.uri === issuedVcUri);
            if (!alreadySelected) {
                resumeBuilderStore.set.toggleCredential(category, issuedVcUri);
            }

            presentToast('Credential self issued successfully', {
                duration: 3000,
                type: ToastTypeEnum.Success,
            });
            closeModal();
        } catch (error) {
            console.error('resume self issue error', error);
            presentToast('Unable to self issue credential', {
                duration: 3000,
                type: ToastTypeEnum.Error,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const heading = useMemo(() => metadata?.titleSingular ?? 'Credential', [metadata]);

    return (
        <div className="flex flex-col gap-[10px] items-center w-full max-w-[340px] mx-auto">
            <div className="flex flex-col gap-[20px] items-center bg-white py-[40px] px-[20px] rounded-[15px] text-grayscale-900 w-full">
                <div
                    className={`bg-${metadata?.lightColor} rounded-full h-[120px] w-[120px] p-[17px]`}
                >
                    {metadata?.AltIconWithShapeForColorBg ? (
                        <metadata.AltIconWithShapeForColorBg className="h-full w-full" />
                    ) : (
                        metadata?.IconWithShape && (
                            <metadata.IconWithShape className="h-full w-full" />
                        )
                    )}
                </div>
                <h2 className="font-poppins text-[22px] leading-[100%] text-grayscale-900">
                    Add {heading}
                </h2>

                <div className="flex flex-col gap-[12px] w-full">
                    <input
                        autoCapitalize="on"
                        value={name}
                        onChange={event => setName(event.target.value)}
                        placeholder="Name..."
                        className="w-full bg-grayscale-100 text-grayscale-900 placeholder:text-grayscale-500 rounded-[15px] px-[15px] py-[12px] border-none outline-none"
                        maxLength={60}
                    />
                    <textarea
                        autoCapitalize="on"
                        value={description}
                        onChange={event => setDescription(event.target.value)}
                        placeholder="Description..."
                        className="w-full min-h-[108px] max-h-[180px] overflow-y-auto resize-none bg-grayscale-100 text-grayscale-900 placeholder:text-grayscale-500 rounded-[15px] px-[15px] py-[12px] border-none outline-none"
                        rows={4}
                    />
                </div>
            </div>
            <div className="flex items-center justify-center gap-[10px] w-full">
                <button
                    className="bg-grayscale-50 py-[10px] px-[20px] rounded-[30px] text-grayscale-800 font-poppins text-[17px] leading-[130%] tracking-[-0.25px] shadow-bottom-4-4 flex-1"
                    onClick={closeModal}
                    disabled={isLoading}
                >
                    Back
                </button>
                <button
                    className={`flex items-center justify-center gap-2 flex-1 py-[10px] px-[20px] rounded-[30px] font-poppins text-[17px] leading-[130%] tracking-[-0.25px] shadow-bottom-4-4 text-white disabled:bg-grayscale-300 bg-${metadata?.color}`}
                    onClick={handleSelfIssue}
                    disabled={continueDisabled}
                >
                    {isLoading ? <IonSpinner name="crescent" className="w-4 h-4" /> : 'Self Issue'}
                </button>
            </div>
        </div>
    );
};

export default ResumeSelfAttestModal;
