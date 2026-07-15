import React, { useCallback } from 'react';
import { Clipboard } from '@capacitor/clipboard';
import { useModal, useToast, ToastTypeEnum } from 'learn-card-base';

import CopyStack from '../../svgs/CopyStack';
import X from 'learn-card-base/svgs/X';

import { VC } from '@learncard/types';
import { getLogger } from 'learn-card-base';
import * as m from '../../../paraglide/messages.js';
const log = getLogger('view-json-modal');

type ViewJsonModalProps = {
    boost: VC;
};

const ViewJsonModal: React.FC<ViewJsonModalProps> = ({ boost }) => {
    const { closeModal } = useModal();
    const { presentToast } = useToast();

    const jsonPrettyPrint = JSON.stringify(boost, null, 2);

    const copyToClipBoard = useCallback(async () => {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(jsonPrettyPrint);
                log.debug('Copied using navigator.clipboard');
            } else {
                await Clipboard.write({
                    string: jsonPrettyPrint,
                });
                log.debug('Copied using Capacitor Clipboard');
            }
            presentToast(m['boost.toasts.jsonCopied'](), {
                type: ToastTypeEnum.Success,
                hasDismissButton: true,
            });
        } catch (err) {
            log.error('Failed to copy to clipboard:', err);
            presentToast(m['boost.toasts.unableToCopyJson'](), {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        }
    }, [jsonPrettyPrint, presentToast]);

    return (
        <div className="bg-white p-6 rounded-lg max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold font-notoSans text-grayscale-900">{m['boost.jsonView']()}</h2>
                <button onClick={closeModal} className="text-red-600 flex items-center">
                    <X className="w-[20px] h-[20px] mr-2" /> {m['common.close']()}
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
                    {m['boost.copyJson']()}
                </button>
            </div>
            <pre className="bg-gray-100 p-4 rounded overflow-auto flex-grow text-grayscale-900">
                {jsonPrettyPrint}
            </pre>
        </div>
    );
};

export default ViewJsonModal;
