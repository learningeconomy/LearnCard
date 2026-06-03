import React from 'react';
import { useTranslation } from 'react-i18next';

export const UserContactHeader: React.FC = () => {
    const { t } = useTranslation();
    return (
        <header className="w-full">
            <div className="w-full flex items-center justify-center bg-white pt-6 pb-2">
                <h4 className="text-grayscale-900 text-[22px] font-semibold font-notoSans">
                    {t('profile.email.header', 'Email Addresses')}
                </h4>
            </div>
        </header>
    );
};

export default UserContactHeader;
