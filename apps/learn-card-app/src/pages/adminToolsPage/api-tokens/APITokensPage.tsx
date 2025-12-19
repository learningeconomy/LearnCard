import React, { useState, useEffect, useCallback } from 'react';
import { Clipboard } from '@capacitor/clipboard';

import { IonGrid, IonRow, IonCol, IonSpinner } from '@ionic/react';
import AdminPageStructure from '../AdminPageStructure';
import CreateAPITokenModal from './CreateAPITokenModal';
import ThreeDots from 'learn-card-base/svgs/ThreeDots';
import EditAPITokenModal from './EditAPITokenModal';

import {
    ModalTypes,
    useModal,
    useWallet,
    useToast,
    ToastTypeEnum,
    useConfirmation,
} from 'learn-card-base';

type AuthGrant = {
    id: string;
    name: string;
    challenge: string;
    createdAt: string;
    status: 'revoked' | 'active';
    scope: string;
    description?: string;
    expiresAt?: string | null;
};

const APITokensPage: React.FC = () => {
    const [authGrants, setAuthGrants] = useState<Partial<AuthGrant>[] | undefined>();
    const [loading, setLoading] = useState<boolean>(false);
    const { presentToast } = useToast();
    const confirm = useConfirmation();

    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.Cancel,
        mobile: ModalTypes.Cancel,
    });
    const { initWallet } = useWallet();

    const fetchAuthGrants = useCallback(async () => {
        const wallet = await initWallet();
        setLoading(true);
        const fetchedAuthGrants = await wallet.invoke.getAuthGrants();
        setAuthGrants(fetchedAuthGrants);
        setLoading(false);
    }, [initWallet]);

    const openCreateAPITokenModal = () => {
        newModal(<CreateAPITokenModal onUpdate={fetchAuthGrants} />, {
            sectionClassName: '!max-w-[500px]',
            usePortal: true,
            hideButton: true,
            portalClassName: '!max-w-[500px]',
        });
    };

    useEffect(() => {
        const runFetch = async () => {
            await fetchAuthGrants();
        };
        runFetch();
    }, []);

    const copyAPIToken = async (id: string) => {
        try {
            const wallet = await initWallet();
            const token = await wallet.invoke.getAPITokenForAuthGrant(id);
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

    const handleAPITokenRemoval = async (id: string, status: string, name: string) => {
        const wallet = await initWallet();
        closeModal();
        try {
            if (status === 'active') {
                await confirm({
                    text: `Are you sure you want to revoke "${name}" API Token?`,
                    onConfirm: async () => {
                        await wallet.invoke.revokeAuthGrant(id);
                        presentToast(`${name} API Token revoked successfully`, {
                            hasDismissButton: true,
                        });
                        fetchAuthGrants();
                    },
                    cancelButtonClassName:
                        'cancel-btn text-grayscale-900 bg-grayscale-200 py-2 rounded-[40px] font-bold px-2 w-[100px]',
                    confirmButtonClassName:
                        'confirm-btn bg-grayscale-900 text-white py-2 rounded-[40px] font-bold px-2 w-[100px]',
                });
            } else if (status === 'revoked') {
                await confirm({
                    text: `Are you sure you want to delete "${name}" API Token?`,
                    onConfirm: async () => {
                        await wallet.invoke.deleteAuthGrant(id);
                        presentToast(`${name} API Token deleted successfully`, {
                            hasDismissButton: true,
                        });
                        fetchAuthGrants();
                    },
                    cancelButtonClassName:
                        'cancel-btn text-grayscale-900 bg-grayscale-200 py-2 rounded-[40px] font-bold px-2 w-[100px]',
                    confirmButtonClassName:
                        'confirm-btn bg-grayscale-900 text-white py-2 rounded-[40px] font-bold px-2 w-[100px]',
                });
            }
        } catch (err) {
            if (status === 'active') {
                console.error(`Failed to revoke API Token`, err);
                presentToast(`Unable to revoke API Token`, {
                    type: ToastTypeEnum.Error,
                    hasDismissButton: true,
                });
            } else if (status === 'revoked') {
                console.error(`Failed to delete API Token`, err);
                presentToast(`Unable to delete API Token`, {
                    type: ToastTypeEnum.Error,
                    hasDismissButton: true,
                });
            }
        }
    };

    return (
        <AdminPageStructure title="API Tokens">
            {loading && (
                <div className="w-[500px] h-[200px] flex flex-col gap-[5px] items-center justify-center">
                    <IonSpinner color="dark" />
                    <span>Loading...</span>
                </div>
            )}
            {!loading && (
                <section className="bg-white max-w-[800px] w-full h-full overflow-y-auto rounded-[5px]">
                    <div className="px-4 pt-4 border-b-grayscale-100 border-b-solid border-b-[1px] last:border-0">
                        <h1>Admin Tools</h1>
                        <div className="flex justify-between items-center mb-[15px]">
                            <h2 className="font-notoSans text-[30px] font-semibold">API Tokens</h2>
                            <button
                                onClick={openCreateAPITokenModal}
                                className="bg-blue-700 text-white font-notoSans font-semibold p-[10px] rounded-[10px]"
                            >
                                Create API Token
                            </button>
                        </div>
                    </div>
                    {authGrants?.length > 0 ? (
                        <IonGrid className="flex flex-col w-full px-0 min-w-[700px] overflow-x-auto">
                            <IonRow className="flex font-semibold border-b-grayscale-100 border-b-solid border-b-[1px]">
                                <IonCol className="px-4">Name</IonCol>
                                <IonCol className="px-4">Description</IonCol>
                                <IonCol className="px-4">Scope</IonCol>
                                <IonCol className="px-4">Status</IonCol>
                                <IonCol className="px-4">Expires</IonCol>
                                <IonCol className="px-4">Actions</IonCol>
                            </IonRow>
                            {authGrants?.map(grant => (
                                <IonRow
                                    className="flex w-full border-b-grayscale-100 border-b-solid border-b-[1px] last:border-0"
                                    key={grant.id}
                                >
                                    <IonCol className="px-4">{grant.name}</IonCol>
                                    <IonCol className="px-4">{grant.description || '—'}</IonCol>
                                    <IonCol className="px-4">{grant.scope}</IonCol>
                                    <IonCol
                                        className={`px-4 ${
                                            grant.status === 'active'
                                                ? 'text-[#00ba88]'
                                                : grant.status === 'revoked'
                                                ? 'text-[#e11d48]'
                                                : ''
                                        }`}
                                    >
                                        {grant.status}
                                    </IonCol>
                                    <IonCol className="px-4">
                                        {grant.expiresAt
                                            ? new Date(grant.expiresAt).toLocaleDateString()
                                            : '-'}
                                    </IonCol>
                                    <IonCol className="px-4">
                                        <button
                                            onClick={() => {
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
                                                                            grantDescription={
                                                                                grant.description
                                                                            }
                                                                            onUpdate={
                                                                                fetchAuthGrants
                                                                            }
                                                                        />,
                                                                        {
                                                                            sectionClassName:
                                                                                '!max-w-[500px]',
                                                                            usePortal: true,
                                                                            hideButton: true,
                                                                            portalClassName:
                                                                                '!max-w-[500px]',
                                                                        }
                                                                    );
                                                                }}
                                                                className="text-[17px] font-poppins w-full flex items-center justify-between py-3 px-2"
                                                            >
                                                                Edit
                                                            </button>
                                                        </li>
                                                        <li className="w-full border-b-grayscale-100 border-b-solid border-b-[2px] last:border-0">
                                                            <button
                                                                onClick={() =>
                                                                    copyAPIToken(grant.id)
                                                                }
                                                                className="text-[17px] font-poppins w-full flex items-center justify-between py-3 px-2"
                                                            >
                                                                Copy API Token
                                                            </button>
                                                        </li>
                                                        <li className="w-full border-b-grayscale-100 border-b-solid border-b-[2px] last:border-0">
                                                            <button
                                                                onClick={() =>
                                                                    handleAPITokenRemoval(
                                                                        grant.id,
                                                                        grant.status,
                                                                        grant.name
                                                                    )
                                                                }
                                                                className="text-[17px] font-poppins w-full flex items-center justify-between py-3 px-2"
                                                            >
                                                                {grant.status === 'active'
                                                                    ? 'Revoke'
                                                                    : grant.status === 'revoked'
                                                                    ? 'Delete'
                                                                    : ''}
                                                            </button>
                                                        </li>
                                                    </ul>,
                                                    { sectionClassName: '!max-w-[400px]' }
                                                );
                                            }}
                                        >
                                            <ThreeDots />
                                        </button>
                                    </IonCol>
                                </IonRow>
                            ))}
                        </IonGrid>
                    ) : (
                        <div className="text-center py-[40px] text-[20px] text-grayscale-600">
                            No AuthGrants
                        </div>
                    )}
                </section>
            )}
        </AdminPageStructure>
    );
};

export default APITokensPage;
