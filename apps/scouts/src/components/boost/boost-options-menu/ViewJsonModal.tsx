import React, { useCallback } from 'react';
import { Clipboard } from '@capacitor/clipboard';
import { useIonToast } from '@ionic/react';
import { useModal } from 'learn-card-base';

import CopyStack from '../../svgs/CopyStack';
import X from 'learn-card-base/svgs/X';

import { VC } from '@learncard/types';

type ViewJsonModalProps = {
    boost: VC;
};

const ViewJsonModal: React.FC<ViewJsonModalProps> = ({ boost }) => {
    const { closeModal } = useModal();
    const [presentToast] = useIonToast();

    const jsonPrettyPrint = JSON.stringify(boost, null, 2);

    const copyToClipBoard = useCallback(async () => {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(jsonPrettyPrint);
                console.log('Copied using navigator.clipboard');
            } else {
                await Clipboard.write({
                    string: jsonPrettyPrint,
                });
                console.log('Copied using Capacitor Clipboard');
            }
            presentToast({
                message: 'JSON copied to clipboard',
                duration: 3000,
                buttons: [
                    {
                        text: 'Dismiss',
                        role: 'cancel',
                    },
                ],
                position: 'top',
                cssClass: 'user-did-success-copy-toast',
            });
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
            presentToast({
                message: 'Unable to copy JSON to clipboard',
                duration: 3000,
                buttons: [
                    {
                        text: 'Dismiss',
                        role: 'cancel',
                    },
                ],
                position: 'top',
                cssClass: 'user-did-copy-success-toast',
            });
        }
    }, [jsonPrettyPrint, presentToast]);

    return (
        <div className="bg-white p-6 rounded-lg max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold font-notoSans text-grayscale-900">JSON View</h2>
                <button onClick={closeModal} className="text-red-600 flex items-center">
                    <X className="w-[20px] h-[20px] mr-2" /> Close
                </button>
            </div>
            <div className="mb-4">
                <button
                    onClick={() => {
                        copyToClipBoard();
                    }}
                    className="bg-blue-500 text-white px-4 py-2 rounded flex items-center"
                >
                    <CopyStack className="w-[24px] h-[24px] mr-2" />
                    Copy JSON
                </button>
            </div>
            <pre className="bg-gray-100 p-4 rounded overflow-auto flex-grow text-grayscale-900">
                {jsonPrettyPrint}
            </pre>
        </div>
    );
};

export default ViewJsonModal;
