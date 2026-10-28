import React from 'react';
import { useStore } from '@nanostores/react';
import { confirmationModalState } from '../stores/ConfirmationModalStore';

export const ConfirmationModal: React.FC = () => {
    const { isOpen, message, onConfirm, onCancel } = useStore(confirmationModalState);

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-gray-300/50 backdrop-blur-xs flex items-center justify-center z-[50000] p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
                <p className="text-gray-800 text-lg mb-4 whitespace-pre-wrap">{message}</p>
                <div className="flex justify-end space-x-3">
                    <button
                        onClick={onCancel || undefined}
                        className="px-4 py-2 rounded text-gray-700 bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm || undefined}
                        className="px-4 py-2 rounded text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
