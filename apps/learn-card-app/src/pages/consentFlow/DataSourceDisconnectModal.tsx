import React from 'react';
import { IonLoading } from '@ionic/react';

import BrokenLink from '../../components/svgs/BrokenLink';
import Refresh from 'learn-card-base/svgs/Refresh';
import { useDisconnectDataSource } from '../../hooks/useDisconnectDataSource';
import { useSyncDataSource } from '../../hooks/useSyncDataSource';
import { useModal } from 'learn-card-base';

type DataSourceDisconnectModalProps = {
    id: string;
};

const DataSourceDisconnectModal: React.FC<DataSourceDisconnectModalProps> = ({ id }) => {
    const { closeModal } = useModal();
    const { mutateAsync: disconnect, isPending } = useDisconnectDataSource(id);
    const { mutateAsync: syncDataSource } = useSyncDataSource(id);

    return (
        <section className="h-full w-full flex flex-col items-center justify-end gap-[10px]">
            <IonLoading mode="ios" message="Disconnecting..." isOpen={isPending} />
            <button
                className="text-black w-full bg-white flex items-center justify-between px-[20px] py-[35px] rounded-[24px] shadow-bottom font-montserrat text-center text-xl font-normal max-w-[350px]"
                type="button"
                onClick={() => {
                    syncDataSource(undefined);
                    closeModal();
                }}
            >
                <span>Sync</span>
                <Refresh />
            </button>

            <button
                className="text-black w-full bg-white flex items-center justify-between px-[20px] py-[35px] rounded-[24px] shadow-bottom font-montserrat text-center text-xl font-normal max-w-[350px]"
                type="button"
                onClick={() => disconnect().then(closeModal)}
            >
                <span>Disconnect</span>
                <BrokenLink />
            </button>
        </section>
    );
};

export default DataSourceDisconnectModal;
