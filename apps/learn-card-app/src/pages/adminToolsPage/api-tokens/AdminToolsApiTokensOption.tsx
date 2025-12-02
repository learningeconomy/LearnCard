import React, { useState, useEffect, useCallback } from 'react';

import CreateAPITokenModal from './CreateAPITokenModal';
import AdminToolApiTokenItem from './AdminToolApiTokenItem';
import AdminToolsModalFooter from '../AdminToolsModal/AdminToolsModalFooter';
import AdminToolApiTokenItemSkeleton from './AdminToolsApiTokenItemSkeleton';
import AdminToolsOptionItemHeader from '../AdminToolsModal/helpers/AdminToolsOptionItemHeader';

import {
    ModalTypes,
    useModal,
    useWallet,
    useToast,
    ToastTypeEnum,
    useConfirmation,
} from 'learn-card-base';
import { AdminToolOption } from '../AdminToolsModal/admin-tools.helpers';
import { SigningAuthority } from '../signingAuthority/AdminToolsSigningAuthorityOption';

export type AuthGrant = {
    id: string;
    name: string;
    challenge: string;
    createdAt: string;
    status: 'revoked' | 'active';
    scope: string;
    description?: string;
    expiresAt?: string | null;
};

const AdminToolsApiTokensOption: React.FC<{ option: AdminToolOption; showFooter?: boolean }> = ({
    option,
    showFooter,
}) => {
    const [authGrants, setAuthGrants] = useState<Partial<AuthGrant>[] | undefined>([]);
    const [signingAuthorities, setSigningAuthorities] = useState<SigningAuthority[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const { presentToast } = useToast();
    const confirm = useConfirmation();

    const { newModal } = useModal({
        desktop: ModalTypes.Cancel,
        mobile: ModalTypes.Cancel,
    });
    const { initWallet } = useWallet();

    const fetchSigningAuthorities = useCallback(async () => {
        const wallet = await initWallet();
        setLoading(true);
        const fetchedSigningAuthorities = await wallet.invoke.getRegisteredSigningAuthorities();
        setSigningAuthorities(fetchedSigningAuthorities);
        setLoading(false);
    }, [initWallet]);

    const fetchAuthGrants = useCallback(async () => {
        const wallet = await initWallet();
        setLoading(true);
        const fetchedAuthGrants = await wallet.invoke.getAuthGrants();
        await fetchSigningAuthorities();
        setAuthGrants(fetchedAuthGrants);
        setLoading(false);
    }, [initWallet]);

    const openCreateAPITokenModal = () => {
        newModal(
            <CreateAPITokenModal
                onUpdate={fetchAuthGrants}
                authGrants={authGrants}
                signingAuthorities={signingAuthorities}
            />,
            {
                sectionClassName: '!max-w-[500px]',
                usePortal: true,
                hideButton: true,
                portalClassName: '!max-w-[500px]',
            }
        );
    };

    useEffect(() => {
        const runFetch = async () => {
            await fetchAuthGrants();
        };
        runFetch();
    }, []);

    const handleAPITokenRemoval = async (id: string, status: string, name: string) => {
        const wallet = await initWallet();
        try {
            if (status === 'active') {
                const confirmed = await confirm({
                    text: `Are you sure you want to revoke "${name}" API Token?`,
                    onConfirm: async () => {},
                    cancelButtonClassName:
                        'cancel-btn text-grayscale-900 bg-grayscale-200 py-2 rounded-[40px] font-bold px-2 w-[100px]',
                    confirmButtonClassName:
                        'confirm-btn bg-grayscale-900 text-white py-2 rounded-[40px] font-bold px-2 w-[100px]',
                });

                if (confirmed) {
                    const revoked = await wallet.invoke.revokeAuthGrant(id);

                    if (revoked) {
                        setAuthGrants(authGrants?.filter(grant => grant.id !== id));

                        presentToast(`${name} API Token revoked successfully`, {
                            hasDismissButton: true,
                        });

                        fetchAuthGrants();
                    }
                }
            } else if (status === 'revoked') {
                const confirmed = await confirm({
                    text: `Are you sure you want to delete "${name}" API Token?`,
                    onConfirm: async () => {},
                    cancelButtonClassName:
                        'cancel-btn text-grayscale-900 bg-grayscale-200 py-2 rounded-[40px] font-bold px-2 w-[100px]',
                    confirmButtonClassName:
                        'confirm-btn bg-grayscale-900 text-white py-2 rounded-[40px] font-bold px-2 w-[100px]',
                });

                if (confirmed) {
                    await wallet.invoke.deleteAuthGrant(id);

                    setAuthGrants(authGrants?.filter(grant => grant.id !== id));

                    presentToast(`${name} API Token deleted successfully`, {
                        hasDismissButton: true,
                    });

                    fetchAuthGrants();
                }
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
        <section className="h-full w-full flex items-start justify-center overflow-y-scroll pt-4">
            <section className="bg-white max-w-[800px] w-full rounded-[20px]">
                <AdminToolsOptionItemHeader option={option} onClick={openCreateAPITokenModal} />

                {loading && <AdminToolApiTokenItemSkeleton />}

                {!loading &&
                    authGrants?.length > 0 &&
                    authGrants?.map((grant, index) => {
                        return (
                            <AdminToolApiTokenItem
                                grant={grant}
                                key={index}
                                handleTokenRemoval={handleAPITokenRemoval}
                                fetchAuthGrants={fetchAuthGrants}
                            />
                        );
                    })}

                {!loading && authGrants?.length === 0 && (
                    <div className="text-center py-[40px] text-[20px] text-grayscale-600">
                        No API Tokens
                    </div>
                )}
            </section>

            {showFooter && <AdminToolsModalFooter />}
        </section>
    );
};

export default AdminToolsApiTokensOption;
