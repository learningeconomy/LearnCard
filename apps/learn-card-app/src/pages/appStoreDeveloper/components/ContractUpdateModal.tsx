import React from 'react';
import { X } from 'lucide-react';
import { useModal } from 'learn-card-base';
import { mDynamic } from '../../../i18n/mDynamic';
import ContractUpdateEditor from './ContractUpdateEditor';

const ContractUpdateModal: React.FC<{ contractUri: string }> = ({ contractUri }) => {
    const { closeModal } = useModal();

    return (
        <div className="mx-auto flex min-h-0 w-full flex-col overflow-hidden bg-white font-poppins">
            <header className="flex shrink-0 items-center justify-between border-b border-grayscale-200 px-5 py-4 sm:px-6">
                <h2 className="text-lg font-semibold text-grayscale-900">
                    {mDynamic('consentUpdate.editor.title')}
                </h2>
                <button
                    type="button"
                    onClick={closeModal}
                    aria-label={mDynamic('consentUpdate.editor.close')}
                    className="rounded-full p-2 text-grayscale-500 hover:bg-grayscale-100 hover:text-grayscale-900"
                >
                    <X className="h-5 w-5" />
                </button>
            </header>
            <div className="min-h-0 overflow-y-auto p-4 sm:p-6">
                <ContractUpdateEditor contractUri={contractUri} />
            </div>
        </div>
    );
};

export default ContractUpdateModal;
