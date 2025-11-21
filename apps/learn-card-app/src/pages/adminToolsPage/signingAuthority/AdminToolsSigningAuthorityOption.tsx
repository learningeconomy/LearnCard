import React, { useState, useCallback, useEffect } from 'react';

import AdminToolsSigningAuthorityItemSkeleton from './AdminToolsSigningAuthorityItemSkeleton';
import AdminToolsOptionItemHeader from '../AdminToolsModal/helpers/AdminToolsOptionItemHeader';
import AdminToolsSigningAuthorityItem from './AdminToolsSiginingAuthorityItem';
import CreateSigningAuthorityModal from './CreateSigningAuthorityModal';
import AdminToolsModalFooter from '../AdminToolsModal/AdminToolsModalFooter';

import { useWallet, useModal, ModalTypes } from 'learn-card-base';

import { AdminToolOption } from '../AdminToolsModal/admin-tools.helpers';

export type SigningAuthority = {
    relationship: {
        did: string;
        name: string;
    };
    signingAuthority: {
        endpoint: string;
    };
};

const AdminToolsSigningAuthorityOption: React.FC<{
    option: AdminToolOption;
    showFooter?: boolean;
}> = ({ option, showFooter }) => {
    const { initWallet } = useWallet();

    const [loading, setLoading] = useState<boolean>(false);
    const [signingAuthorities, setSigningAuthorities] = useState<SigningAuthority[]>([]);
    const [defaultSigningAuthority, setDefaultSigningAuthority] = useState<SigningAuthority | null>(
        null
    );

    const { newModal } = useModal({
        desktop: ModalTypes.Cancel,
        mobile: ModalTypes.Cancel,
    });

    const fetchSigningAuthorities = useCallback(async () => {
        const wallet = await initWallet();
        setLoading(true);
        const fetchedSigningAuthorities = await wallet.invoke.getRegisteredSigningAuthorities();
        setSigningAuthorities(fetchedSigningAuthorities);
        setLoading(false);
    }, [initWallet]);

    const fetchPrimarySigningAuthority = useCallback(async () => {
        const wallet = await initWallet();
        setLoading(true);
        const fetchedPrimarySigningAuthority =
            await wallet.invoke.getPrimaryRegisteredSigningAuthority();
        setDefaultSigningAuthority(fetchedPrimarySigningAuthority);
        setLoading(false);
    }, [initWallet]);

    const handleSetDefaultSigningAuthority = async (endpoint: string, name: string) => {
        try {
            const wallet = await initWallet();
            setLoading(true);
            await wallet.invoke.setPrimaryRegisteredSigningAuthority(endpoint, name);
            await fetchPrimarySigningAuthority();
            await fetchSigningAuthorities();
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    useEffect(() => {
        const runFetch = async () => {
            await fetchSigningAuthorities();
            await fetchPrimarySigningAuthority();
        };
        runFetch();
    }, []);

    return (
        <>
            <section className="h-full w-full flex items-start justify-center overflow-y-scroll pt-4">
                <section className="bg-white max-w-[800px] w-full rounded-[20px]">
                    <AdminToolsOptionItemHeader
                        option={option}
                        onClick={() =>
                            newModal(
                                <CreateSigningAuthorityModal
                                    fetchSigningAuthorities={fetchSigningAuthorities}
                                />,
                                {
                                    sectionClassName: '!max-w-[500px]',
                                    usePortal: true,
                                    hideButton: true,
                                    portalClassName: '!max-w-[500px]',
                                }
                            )
                        }
                    />

                    {loading && <AdminToolsSigningAuthorityItemSkeleton />}

                    {!loading &&
                        signingAuthorities?.length > 0 &&
                        signingAuthorities?.map((authority, index) => (
                            <AdminToolsSigningAuthorityItem
                                key={index}
                                signingAuthority={authority}
                                defaultSigningAuthority={defaultSigningAuthority}
                                handleSetDefaultSigningAuthority={handleSetDefaultSigningAuthority}
                            />
                        ))}

                    {!loading && signingAuthorities?.length === 0 && (
                        <div className="w-full text-center py-[40px] text-[20px] text-grayscale-600">
                            No Signing Authorities
                        </div>
                    )}
                </section>

                {showFooter && <AdminToolsModalFooter />}
            </section>
        </>
    );
};

export default AdminToolsSigningAuthorityOption;
