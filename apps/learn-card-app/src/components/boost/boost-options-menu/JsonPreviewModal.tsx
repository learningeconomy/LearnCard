import React, { useCallback } from 'react';
import { Clipboard } from '@capacitor/clipboard';

import X from '../../svgs/X';
import CopyStack from '../../svgs/CopyStack';

import { UnsignedVC, VC } from '@learncard/types';
import { ModalTypes, useModal, ToastTypeEnum, useToast } from 'learn-card-base';

export const JsonPreviewModal = ({ boost }: { boost: VC | UnsignedVC }) => {
    const { closeModal } = useModal({
        mobile: ModalTypes.FullScreen,
        desktop: ModalTypes.FullScreen,
    });

    const { presentToast } = useToast();

    const jsonPrettyPrint = JSON.stringify(boost, null, 2);
    const templateId = boost?.boostId;

    const copyToClipBoard = useCallback(async () => {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(jsonPrettyPrint);
            } else {
                await Clipboard.write({
                    string: jsonPrettyPrint,
                });
            }
            presentToast('JSON copied to clipboard', {
                hasDismissButton: true,
            });
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
            presentToast('Unable to copy JSON to clipboard', {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        }
    }, [jsonPrettyPrint, presentToast]);

    const copyTemplateID = async () => {
        try {
            await Clipboard.write({
                string: templateId,
            });
            presentToast('Template ID copied to clipboard', {
                hasDismissButton: true,
            });
        } catch (err) {
            presentToast('Unable to copy template ID to clipboard', {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-11/12 max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">JSON View</h2>
                    <button
                        onClick={() => {
                            closeModal();
                        }}
                        className="text-red-600 flex items-center"
                    >
                        <X className="w-[20px] h-[20px] mr-2" /> Close
                    </button>
                </div>
                <div className="flex mb-4">
                    <button
                        onClick={() => {
                            copyToClipBoard();
                        }}
                        className="bg-blue-500 text-white px-4 py-2 rounded flex items-start text-left"
                    >
                        <CopyStack className="w-[24px] h-[24px] mr-2" />
                        Copy JSON
                    </button>
                    {templateId && (
                        <button
                            onClick={() => {
                                copyTemplateID();
                            }}
                            className="bg-blue-500 text-white px-4 py-2 rounded flex items-start text-left ml-[10px]"
                        >
                            <CopyStack className="w-[24px] h-[24px] mr-2" />
                            Copy Template ID
                        </button>
                    )}
                </div>
                <pre className="bg-gray-100 p-4 rounded overflow-auto flex-grow text-grayscale-900">
                    {jsonPrettyPrint}
                </pre>
            </div>
        </div>
    );
};

export default JsonPreviewModal;
