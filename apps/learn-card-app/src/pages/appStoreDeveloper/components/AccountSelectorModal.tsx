import React from 'react';
import { IonModal } from '@ionic/react';
import { X } from 'lucide-react';

import { AccountSelector, AccountProfile, AccountSelectorProps } from './AccountSelector';

export interface AccountSelectorModalProps extends Omit<AccountSelectorProps, 'compact'> {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
}

export const AccountSelectorModal: React.FC<AccountSelectorModalProps> = ({
    isOpen,
    onClose,
    title = 'Switch Account',
    ...selectorProps
}) => {
    return (
        <IonModal
            isOpen={isOpen}
            onDidDismiss={onClose}
            className="account-selector-modal"
            initialBreakpoint={0.85}
            breakpoints={[0, 0.5, 0.85, 1]}
        >
            <div className="flex flex-col h-full bg-white rounded-t-3xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800">{title}</h2>

                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    <AccountSelector
                        {...selectorProps}
                        compact={true}
                        showInfoBanner={false}
                    />
                </div>
            </div>
        </IonModal>
    );
};

export default AccountSelectorModal;
