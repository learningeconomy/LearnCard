import React, { useEffect, useContext } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import queryString from 'query-string';
import { AuthContext, IAuthContext } from 'react-oauth2-code-pkce';
import { IonSkeletonText } from '@ionic/react';

import SkinnyCaretRight from 'learn-card-base/svgs/SkinnyCaretRight';
import LoadingIcon from 'learn-card-base/svgs/LoadingIcon';
import BrokenLink from 'learn-card-base/svgs/BrokenLink';
import Refresh from 'learn-card-base/svgs/Refresh';
import Checkmark from 'learn-card-base/svgs/Checkmark';
import { useSyncDataSource } from '../../hooks/useSyncDataSource';
import DataSourceDisconnectModal from './DataSourceDisconnectModal';
import { RegistryEntry, useModal, ModalTypes } from 'learn-card-base';
import { useRegistryEntryState, SYNC_STATE } from '../../hooks/useRegistryEntryState';

type ConsentFlowSyncButtonProps = {
    preLogin?: () => void;
    entry: RegistryEntry;
};

const ConsentFlowSyncButton: React.FC<ConsentFlowSyncButtonProps> = ({ preLogin, entry }) => {
    const { id, image, membershipId } = entry;
    const { data: state } = useRegistryEntryState(entry);

    const { newModal } = useModal({ desktop: ModalTypes.Cancel });

    const { mutateAsync: syncDataSource } = useSyncDataSource(id);

    const location = useLocation();
    const history = useHistory();
    const { dataSource, ...otherParams } = queryString.parse(location.search);
    const { token, login }: IAuthContext = useContext(AuthContext as any);

    useEffect(() => {
        if (dataSource === id) {
            history.replace({ search: queryString.stringify(otherParams) });

            syncDataSource(membershipId ? undefined : token);
        }
    }, [dataSource]);

    if (state === SYNC_STATE.hidden) {
        // Show a loader if there is ONE specific one being loaded. Otherwise, show nothing.
        if (dataSource) {
            return <IonSkeletonText animated className="h-[45px] w-[100%] rounded-[25px]" />;
        } else {
            return <></>;
        }
    }

    const isNotSynced = state === SYNC_STATE.notSynced;
    const isSynced = state === SYNC_STATE.synced;

    let syncIcon: React.ReactNode;
    switch (state) {
        case SYNC_STATE.synced:
            syncIcon = <Checkmark className="text-emerald-700 h-[35px] w-[35px] mt-[4px]" />;
            break;
        case SYNC_STATE.syncing:
            syncIcon = <LoadingIcon className="animate-spin" />;
            break;
        case SYNC_STATE.reconnect:
            syncIcon = <BrokenLink />;
            break;
        case SYNC_STATE.tryAgain:
            syncIcon = <Refresh />;
            break;
        case SYNC_STATE.notSynced:
        default:
            syncIcon = <SkinnyCaretRight />;
    }

    const handleSync = async () => {
        if (state === SYNC_STATE.synced) {
            return newModal(<DataSourceDisconnectModal id={id} />, {
                className: '!gap-[5px]',
                sectionClassName:
                    '!bg-transparent !border-none !max-w-[350px] !shadow-none !px-[20px] !pb-[5px]',
            });
        }

        if (membershipId) {
            history.replace({ search: queryString.stringify(otherParams) });

            return syncDataSource(undefined);
        }

        preLogin?.();
        login();
    };

    return (
        <button
            type="button"
            className={`flex gap-[10px] rounded-[30px] p-[2px] items-center ${isSynced ? 'bg-emerald-700' : 'bg-grayscale-700'
                }`}
            onClick={handleSync}
            disabled={state === SYNC_STATE.syncing}
        >
            <div className="bg-white h-[45px] w-[45px] rounded-full shrink-0 flex items-center justify-center">
                <img src={image} alt={`${id} icon`} className="h-full w-full rounded-full" />
            </div>
            <div className="flex flex-col text-white font-poppins grow">
                <span className="line-clamp-1 text-[14px]">{id}</span>
                <span className="text-[17px] font-[600]">{state}</span>
            </div>
            <div
                className={`h-[45px] w-[45px] rounded-full flex items-center justify-center shrink-0 ${isNotSynced ? 'bg-grayscale-900' : 'bg-white'
                    }`}
            >
                {syncIcon}
            </div>
        </button>
    );
};

export default ConsentFlowSyncButton;
