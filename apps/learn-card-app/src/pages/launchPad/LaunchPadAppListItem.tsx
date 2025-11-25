import React from 'react';

import {
    useModal,
    ModalTypes,
    LaunchPadAppListItem as LaunchPadAppListItemType,
} from 'learn-card-base';
import { useConsentFlowByUri } from '../consentFlow/useConsentFlow';

import { IonItem } from '@ionic/react';
import AiPassportAppProfileContainer from '../../components/ai-passport-apps/AiPassportAppProfileContainer';

import { LaunchPadFilterOptionsEnum } from './LaunchPadSearch/launchpad-search.helpers';

import useTheme from '../../theme/hooks/useTheme';
import { ColorSetEnum } from '../../theme/colors';
import { EmbedIframeModal } from './EmbedIframeModal';

type LaunchPadAppListItemProps = {
    app: LaunchPadAppListItemType;
    filterBy: LaunchPadFilterOptionsEnum;
};

const LaunchPadAppListItem: React.FC<LaunchPadAppListItemProps> = ({ app, filterBy }) => {
    const { getColorSet } = useTheme();
    const colors = getColorSet(ColorSetEnum.launchPad);

    const { newModal } = useModal({ desktop: ModalTypes.Right, mobile: ModalTypes.Right });
    const { openConsentFlowModal, hasConsented, consentedContractLoading } = useConsentFlowByUri(
        app.contractUri,
        app
    );

    const buttonClass = `flex items-center justify-center rounded-full font-[600] rounded-full px-[20px] py-[5px] normal text-base font-poppins ${colors?.buttons?.unconnected}`;
    const connectedButtonClass = `flex items-center justify-center rounded-full font-[600] rounded-full px-[20px] py-[5px] normal text-base font-poppins ${colors?.buttons?.connected}`;

    if (filterBy === LaunchPadFilterOptionsEnum.unConnectedApps && app.isConnected) return <></>;
    if (filterBy === LaunchPadFilterOptionsEnum.myApps && !app.isConnected) return <></>;

    const isAiApp = !!app.type;
    const isConnected = app.contractUri ? hasConsented : app.isConnected;
    const isLoading = app.contractUri ? consentedContractLoading : app.isConnected === null;


    const handleConnect = (appItem: LaunchPadAppListItemType) => {
        if (appItem.contractUri && !isConnected) {
            openConsentFlowModal();
        } else if (isAiApp) {
            newModal(<AiPassportAppProfileContainer app={{ ...appItem, isConnected }} />);
        } else {
            appItem.handleConnect();
        }
    };

    return (
        <IonItem
            lines="none"
            className="w-full max-w-[600px] ion-no-border px-[12px] py-[12px] max-h-[76px] border-gray-200 border-b-2 last:border-b-0 flex  bg-white items-center justify-between notificaion-list-item overflow-visible rounded-[12px] mt-2 first:mt-4 shadow-sm"
        >
            <div className="flex items-center justify-start w-full bg-white-100">
                <div className="rounded-lg w-[50px] h-[50px] mr-3 min-w-[50px] min-h-[50px]">
                    <img
                        className="w-full h-full object-cover bg-white rounded-lg"
                        src={app?.img}
                        alt={`${app.name} icon`}
                    />
                </div>
                <div className="right-side flex justify-between w-full">
                    <div className="flex flex-col items-start justify-center text-left">
                        <p className="text-grayscale-900 font-medium line-clamp-1">{app?.name}</p>
                        <p className="text-grayscale-600 font-medium text-[12px] line-clamp-2 pr-1">
                            {app?.description}
                        </p>
                    </div>

                    {app?.embedUrl && (
                        <div className="flex app-connect-btn-container items-center">
                            <button
                                onClick={() =>
                                    newModal(
                                        <EmbedIframeModal
                                            embedUrl={app.embedUrl}
                                            appId={app.id}
                                            appName={app.name}
                                        />
                                    )
                                }
                                className={buttonClass}
                            >
                                Launch
                            </button>
                        </div>
                    )}

                    {!app?.embedUrl && app?.comingSoon && (
                        <div className="flex app-connect-btn-container items-center">
                            <button disabled className={connectedButtonClass}>
                                Soon
                            </button>
                        </div>
                    )}

                    {!app?.embedUrl && !app?.comingSoon && (
                        <div className="flex app-connect-btn-container items-center">
                            {isLoading && <button className={buttonClass}>Loading...</button>}
                            {!isLoading && (
                                <button
                                    onClick={
                                        isConnected && !isAiApp
                                            ? app.handleView
                                            : () => handleConnect(app)
                                    }
                                    className={isConnected ? connectedButtonClass : buttonClass}
                                >
                                    {isConnected ? 'Open' : 'Connect'}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </IonItem>
    );
};

export default LaunchPadAppListItem;
