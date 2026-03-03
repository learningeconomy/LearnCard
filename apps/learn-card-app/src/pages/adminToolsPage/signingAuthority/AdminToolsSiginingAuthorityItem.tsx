import React from 'react';
import { Clipboard } from '@capacitor/clipboard';

import CopyStack from 'learn-card-base/svgs/CopyStack';

import { useToast, ToastTypeEnum } from 'learn-card-base';

import { SigningAuthority } from './AdminToolsSigningAuthorityOption';

import { useTheme } from '../../../theme/hooks/useTheme';

const AdminToolsSigningAuthorityItem: React.FC<{
    signingAuthority: SigningAuthority;
    defaultSigningAuthority: SigningAuthority | null;
    handleSetDefaultSigningAuthority: (endpoint: string, name: string) => void;
}> = ({ signingAuthority, defaultSigningAuthority, handleSetDefaultSigningAuthority }) => {
    const { presentToast } = useToast();
    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const copyItem = async (item: string, itemValue: string) => {
        await Clipboard.write({ string: itemValue });

        presentToast(`${item} copied to clipboard`, {
            type: ToastTypeEnum.Success,
            hasDismissButton: true,
        });
    };

    let isDefault =
        defaultSigningAuthority?.signingAuthority?.endpoint ===
            signingAuthority?.signingAuthority?.endpoint &&
        defaultSigningAuthority?.relationship?.name === signingAuthority?.relationship?.name;
    if (!defaultSigningAuthority) isDefault = false;

    return (
        <div className="w-full p-4 border-b-grayscale-100 border-b-solid border-b-[2px]">
            <div className="w-full flex flex-col items-start justify-between px-4">
                <div className="w-full flex items-center justify-between pb-4">
                    <p className="text-grayscale-900 truncate pr-4">
                        <span className="font-semibold">Name:</span>{' '}
                        {signingAuthority?.relationship?.name}
                    </p>
                    <button onClick={() => copyItem('Name', signingAuthority?.relationship?.name)}>
                        <CopyStack className="text-grayscale-600 w-[25px] h-[25px]" />
                    </button>
                </div>
                <div className="w-full flex items-center justify-between pb-4">
                    <p className="text-grayscale-900 truncate pr-4">
                        <span className="font-semibold">Endpoint:</span>{' '}
                        {signingAuthority?.signingAuthority?.endpoint}
                    </p>
                    <button
                        onClick={() =>
                            copyItem('Endpoint', signingAuthority?.signingAuthority?.endpoint)
                        }
                    >
                        <CopyStack className="text-grayscale-600 w-[25px] h-[25px]" />
                    </button>
                </div>
                <div className="w-full flex items-center justify-between">
                    <p className="text-grayscale-900 truncate pr-4">
                        <span className="font-semibold">DID:</span>{' '}
                        {signingAuthority?.relationship?.did}
                    </p>
                    <button onClick={() => copyItem('DID', signingAuthority?.relationship?.did)}>
                        <CopyStack className="text-grayscale-600 w-[25px] h-[25px]" />
                    </button>
                </div>
            </div>
            <div className="w-full flex items-center justify-end mt-4">
                <button
                    className={`${
                        isDefault
                            ? `bg-${primaryColor} text-${primaryColor}`
                            : `bg-${primaryColor} text-white`
                    } font-semibold rounded-full px-4 py-2 text-sm`}
                    onClick={() =>
                        handleSetDefaultSigningAuthority(
                            signingAuthority?.signingAuthority?.endpoint,
                            signingAuthority?.relationship?.name
                        )
                    }
                >
                    {isDefault ? 'Default' : 'Set Default'}
                </button>
            </div>
        </div>
    );
};

export default AdminToolsSigningAuthorityItem;
