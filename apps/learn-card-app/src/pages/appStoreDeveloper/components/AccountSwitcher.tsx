import React from 'react';
import { ChevronDown, X } from 'lucide-react';

import {
    useGetCurrentLCNUser,
    useModal,
} from 'learn-card-base';

import { AccountSelector, AccountProfile } from './AccountSelector';

export interface AccountSwitcherProps {
    onAccountSwitch?: (account: AccountProfile) => void;
}

export const AccountSwitcher: React.FC<AccountSwitcherProps> = ({
    onAccountSwitch,
}) => {
    const { currentLCNUser } = useGetCurrentLCNUser();
    const { newModal, closeModal } = useModal();

    const handleAccountSwitch = (account: AccountProfile) => {
        onAccountSwitch?.(account);
        closeModal();
    };

    const openAccountModal = () => {
        newModal(
            <div className="bg-white rounded-2xl w-full max-w-md mx-auto overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800">Switch Account</h2>

                    <button
                        onClick={closeModal}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 max-h-[60vh] overflow-y-auto">
                    <AccountSelector
                        compact={true}
                        showInfoBanner={false}
                        onAccountSwitch={handleAccountSwitch}
                    />
                </div>
            </div>
        );
    };

    return (
        <button
            onClick={openAccountModal}
            className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
            {currentLCNUser?.image ? (
                <img
                    src={currentLCNUser.image}
                    alt={currentLCNUser.displayName || 'Profile'}
                    className="w-8 h-8 rounded-full object-cover"
                />
            ) : (
                <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-white text-sm font-medium">
                    {currentLCNUser?.displayName?.charAt(0)?.toUpperCase() || '?'}
                </div>
            )}

            <div className="hidden sm:flex items-center gap-1">
                <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate">
                    {currentLCNUser?.displayName}
                </span>

                <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
        </button>
    );
};

export default AccountSwitcher;
