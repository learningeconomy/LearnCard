import React, { useState } from 'react';
import { IonInput, IonTextarea } from '@ionic/react';
import { useWallet, useModal } from 'learn-card-base';
import { createPortal } from 'react-dom';

import useTheme from '../../../theme/hooks/useTheme';

const EditAPITokenModal: React.FC<{
    grantId: string | undefined;
    grantName: string | undefined;
    grantDescription: string | undefined;
    onUpdate: () => void;
}> = ({ grantId, grantName, grantDescription, onUpdate }) => {
    const [updatedName, setUpdatedName] = useState<string>(grantName || '');
    const [updatedDescription, setUpdatedDescription] = useState<string>(grantDescription || '');
    const sectionPortal = document.getElementById('section-cancel-portal');
    const { closeModal } = useModal();
    const { initWallet } = useWallet();

    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const canUpdate =
        (updatedName !== '' && updatedName !== grantName) ||
        (updatedDescription !== '' && updatedDescription !== grantDescription);

    const updateAuthGrant = async () => {
        let updates = {};
        if (updatedName !== grantName && updatedName !== '') {
            updates.name = updatedName;
        }
        if (updatedDescription !== grantDescription && updatedDescription !== '') {
            updates.description = updatedDescription;
        }

        const wallet = await initWallet();
        await wallet?.invoke.updateAuthGrant(grantId, updates);
        onUpdate();
        closeModal();
    };

    return (
        <div className="p-[20px]">
            <h1 className="font-semibold mb-[10px] font-notoSans text-[20px] text-grayscale-900">
                Update API Token
            </h1>
            <IonInput
                className="ion-padding bg-grayscale-100 text-grayscale-800 rounded-[15px] font-medium tracking-widest text-base mb-[10px]"
                type="text"
                onIonInput={e => setUpdatedName(e.detail.value)}
                value={updatedName}
                placeholder="Name*"
            />
            <IonTextarea
                className="bg-grayscale-100 text-grayscale-800 rounded-[15px] font-medium tracking-widest text-base pl-4 pt-2"
                style={{ '--min-width': '385px', '--max-width': '385px' }}
                rows={3}
                onIonInput={e => setUpdatedDescription(e.detail.value)}
                value={updatedDescription}
                placeholder="Description"
            />
            {sectionPortal &&
                createPortal(
                    <div className="flex flex-col justify-center gap-2 items-center relative !border-none max-w-[500px]">
                        <button
                            disabled={!canUpdate}
                            onClick={updateAuthGrant}
                            className={`bg-${primaryColor} text-white text-lg w-full font-notoSans py-2 rounded-[20px] font-semibold disabled:opacity-50`}
                        >
                            Update
                        </button>
                        <button
                            onClick={closeModal}
                            className="bg-white text-grayscale-900 text-lg font-notoSans py-2 rounded-[20px] w-full shadow-bottom mt-[10px]"
                        >
                            Close
                        </button>
                    </div>,
                    sectionPortal
                )}
        </div>
    );
};

export default EditAPITokenModal;
