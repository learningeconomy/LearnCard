import React, { useEffect, useState } from 'react';
import { Clipboard } from '@capacitor/clipboard';

import X from 'learn-card-base/svgs/X';
import { ThreeDotVertical } from '@learncard/react';
import EditAPITokenModal from './EditAPITokenModal';
import TrashBin from 'learn-card-base/svgs/TrashBin';
import Pencil from 'apps/learn-card-app/src/components/svgs/Pencil';
import CopyStack from 'apps/learn-card-app/src/components/svgs/CopyStack';

import { AuthGrant } from '../api-tokens/AdminToolsApiTokensOption';
import { useWallet, useToast, ToastTypeEnum, ModalTypes, useModal } from 'learn-card-base';

import useTheme from '../../../theme/hooks/useTheme';

export const AdminToolApiTokenItem: React.FC<{
    grant: AuthGrant;
    handleTokenRemoval: (id: string, status: string, name: string) => void;
    fetchAuthGrants: () => void;
}> = ({ grant, handleTokenRemoval, fetchAuthGrants }) => {
    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.Cancel,
        mobile: ModalTypes.Cancel,
    });
    const { initWallet } = useWallet();
    const { presentToast } = useToast();

    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const [token, setToken] = useState<string>('');
    const [tokenStatus, setTokenStatus] = useState<'revoked' | 'active' | 'expired'>('active');
    const [showMoreDetails, setShowMoreDetails] = useState(false);

    const getApiToken = async (id: string) => {
        try {
            const wallet = await initWallet();
            const token = await wallet.invoke.getAPITokenForAuthGrant(id);
            setToken(token);
            setTokenStatus('active');
        } catch (err) {
            console.error('Failed to get API token:', err);

            if (err?.message.includes('expired')) {
                setTokenStatus('expired');
                return;
            } else if (err?.message.includes('not active')) {
                setTokenStatus('revoked');
                return;
            }
        }
    };

    const copyAPIToken = async (id: string) => {
        try {
            if (tokenStatus === 'expired' || tokenStatus === 'revoked') {
                presentToast('Unable to copy API Token to clipboard', {
                    hasDismissButton: true,
                });
                return;
            }

            await Clipboard.write({ string: token });
            closeModal();
            presentToast('API Token copied to clipboard', {
                hasDismissButton: true,
            });
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
            closeModal();
            presentToast('Unable to copy API Token to clipboard', {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        }
    };

    useEffect(() => {
        getApiToken(grant?.id);
    }, [grant]);

    let tokenStatusText = '';
    if (tokenStatus === 'active') tokenStatusText = 'Active';
    else if (tokenStatus === 'revoked') tokenStatusText = 'Revoked';
    else if (tokenStatus === 'expired') tokenStatusText = 'Expired';

    const tokenString = (
        <p className="text-grayscale-900 font-semibold text-[17px]">
            {token?.slice(0, 5)}
            <span className="text-grayscale-600">**********</span>
        </p>
    );

    const handleMoreOptions = () => {
        newModal(
            <ul className="w-full flex flex-col items-center justify-center ion-padding text-grayscale-900">
                <li className="w-full border-b-grayscale-100 border-b-solid border-b-[2px] last:border-0">
                    <button
                        onClick={() => {
                            closeModal();
                            newModal(
                                <EditAPITokenModal
                                    grantId={grant.id}
                                    grantName={grant.name}
                                    grantDescription={grant.description}
                                    onUpdate={fetchAuthGrants}
                                />,
                                {
                                    sectionClassName: '!max-w-[500px]',
                                    usePortal: true,
                                    hideButton: true,
                                    portalClassName: '!max-w-[500px]',
                                }
                            );
                        }}
                        className="text-[17px] font-poppins w-full flex items-center justify-start py-3 px-2"
                    >
                        <Pencil version={2} className="text-grayscale-600 w-[25px] h-[25px] mr-2" />
                        Edit
                    </button>
                </li>
                <li className="w-full border-b-grayscale-100 border-b-solid border-b-[2px] last:border-0">
                    <button
                        onClick={() => copyAPIToken(grant.id)}
                        className="text-[17px] font-poppins w-full flex items-center justify-start py-3 px-2"
                    >
                        <CopyStack className="text-grayscale-600 w-[25px] h-[25px] mr-2" /> Copy API
                        Token
                    </button>
                </li>
                <li className="w-full border-b-grayscale-100 border-b-solid border-b-[2px] last:border-0">
                    <button
                        onClick={() => handleTokenRemoval(grant.id, grant.status, grant.name)}
                        className="text-[17px] font-poppins w-full flex items-center justify-start py-3 px-2"
                    >
                        {tokenStatus === 'active' ? (
                            <X className="text-grayscale-600 h-[25px] w-[25px] mr-2" />
                        ) : (
                            <TrashBin className="text-grayscale-600 h-[25px] w-[25px] mr-2" />
                        )}
                        {tokenStatus === 'active' ? 'Revoke' : 'Delete'}
                    </button>
                </li>
            </ul>,
            { sectionClassName: '!max-w-[400px]' }
        );
    };

    return (
        <div className="w-full p-4 border-b-grayscale-100 border-b-solid border-b-[2px]">
            <div className="w-full flex items-center justify-between ">
                <div className="w-full flex flex-col justify-start flex-grow items-stretch">
                    <p className="text-grayscale-900 font-semibold text-[17px]">{grant?.name}</p>
                    {grant?.description && (
                        <p className="text-grayscale-600 font-semibold text-base">
                            {grant?.description}
                        </p>
                    )}
                    {tokenString}
                </div>

                <div className="flex flex-col items-end justify-center gap-2">
                    <div
                        className={`rounded-full px-2 py-1 capitalize text-white text-sm font-semibold ${
                            tokenStatus === 'active' ? 'bg-emerald-700' : 'bg-rose-600'
                        }`}
                    >
                        {tokenStatusText}
                    </div>

                    <div className="flex items-center justify-center gap-2">
                        <button
                            onClick={() => handleTokenRemoval(grant.id, grant.status, grant.name)}
                            className="bg-white overflow-hidden rounded-full shadow-bottom p-2 min-h-[35px] min-w-[35px]"
                        >
                            {tokenStatus === 'active' ? (
                                <X className="text-grayscale-600 h-[25px] w-[25px]" />
                            ) : (
                                <TrashBin className="text-grayscale-600 h-[25px] w-[25px]" />
                            )}
                        </button>

                        <button
                            onClick={handleMoreOptions}
                            className="bg-white overflow-hidden rounded-full shadow-bottom p-2 min-h-[35px] min-w-[35px]"
                        >
                            <ThreeDotVertical className="text-grayscale-600 h-[25px] w-[25px]" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="w-full mt-2">
                <button
                    onClick={() => setShowMoreDetails(!showMoreDetails)}
                    className={`text-${primaryColor} font-semibold text-[17px] border-solid border-b-[1px] border-${primaryColor}`}
                >
                    {showMoreDetails ? 'Less Details' : 'More Details'}
                </button>
            </div>

            {showMoreDetails && (
                <div className="w-full flex flex-col items-start justify-start mt-2 bg-grayscale-100 ion-padding rounded-[8px]">
                    <p className="text-grayscale-600 text-base">Scope: {grant?.scope}</p>
                    <p className="text-grayscale-600 text-base">
                        Created:{' '}
                        {grant?.createdAt ? new Date(grant.createdAt).toLocaleDateString() : '-'}
                    </p>
                    <p className="text-grayscale-600 text-base">
                        Expires:{' '}
                        {grant?.expiresAt ? new Date(grant.expiresAt).toLocaleDateString() : '-'}
                    </p>
                </div>
            )}
        </div>
    );
};

export default AdminToolApiTokenItem;
