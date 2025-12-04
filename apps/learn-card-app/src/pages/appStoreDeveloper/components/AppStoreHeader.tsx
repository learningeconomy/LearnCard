import React from 'react';
import { useHistory } from 'react-router-dom';
import { IonHeader, IonToolbar } from '@ionic/react';

import QRCodeScannerButton from '../../../components/qrcode-scanner-button/QRCodeScannerButton';
import { BrandingEnum } from 'learn-card-base/components/headerBranding/headerBrandingHelpers';

interface AppStoreHeaderProps {
    title?: string;
    rightContent?: React.ReactNode;
}

export const AppStoreHeader: React.FC<AppStoreHeaderProps> = ({ title = 'App Store Portal', rightContent }) => {
    const history = useHistory();

    return (
        <IonHeader className="ion-no-border !overflow-visible">
            <IonToolbar className="!shadow-none border-b border-gray-200 !overflow-visible [&>.toolbar-container]:!overflow-visible">
                <div className="flex items-center justify-between px-4 py-2 overflow-visible">
                    <button
                        onClick={() => history.push('/launchpad')}
                        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                    >
                        <img
                            src="https://cdn.filestackcontent.com/Ja9TRvGVRsuncjqpxedb"
                            alt="LearnCard"
                            className="w-10 h-10 rounded-lg"
                        />

                        <span className="text-lg font-semibold text-gray-700">{title}</span>
                    </button>

                    <div className="flex items-center gap-3 overflow-visible">
                        {rightContent}

                        <QRCodeScannerButton branding={BrandingEnum.learncard} />
                    </div>
                </div>
            </IonToolbar>
        </IonHeader>
    );
};

export default AppStoreHeader;
