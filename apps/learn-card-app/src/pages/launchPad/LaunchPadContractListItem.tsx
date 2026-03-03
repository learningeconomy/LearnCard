import React from 'react';
import { ConsentFlowContractDetails } from '@learncard/types';
import { IonItem, IonSkeletonText } from '@ionic/react';
import { useConsentedContracts } from 'learn-card-base/hooks/useConsentedContracts';
import { ModalTypes, useModal } from 'learn-card-base';

import EmptyImage from 'learn-card-base/assets/images/empty-image.png';

import PostConsentFlowSyncCard from './PostConsentFlowSyncCard';
import ConsentFlowSyncCard from '../consentFlow/ConsentFlowSyncCard';
import FullScreenGameFlow from '../consentFlow/GameFlow/FullScreenGameFlow';

import { LaunchPadFilterOptionsEnum } from './LaunchPadSearch/launchpad-search.helpers';
import useConsentFlow from '../consentFlow/useConsentFlow';

import useTheme from '../../theme/hooks/useTheme';
import { ColorSetEnum } from '../../theme/colors';

type LaunchPadContractListItemProps = {
    contract?: ConsentFlowContractDetails;
    isPending?: boolean;
    filterBy?: LaunchPadFilterOptionsEnum;
};

const LaunchPadContractListItem: React.FC<LaunchPadContractListItemProps> = ({
    contract,
    isPending = false,
    filterBy,
}) => {
    const { getColorSet } = useTheme();
    const colors = getColorSet(ColorSetEnum.launchPad);

    const { openConsentFlowModal, hasConsented } = useConsentFlow(contract);

    if (filterBy === LaunchPadFilterOptionsEnum.unConnectedApps && hasConsented) return <></>;
    if (filterBy === LaunchPadFilterOptionsEnum.myApps && !hasConsented) return <></>;

    const buttonClass = `flex items-center justify-center rounded-full font-[600] rounded-full px-[20px] py-[5px] normal text-base font-poppins ${colors?.buttons?.unconnected}`;
    const connectedButtonClass = `flex items-center justify-center rounded-full font-[600] rounded-full px-[20px] py-[5px] normal text-base font-poppins ${colors?.buttons?.connected}`;

    const image = contract?.image ?? contract?.owner?.image;

    const hasImage = !!image;

    return (
        <IonItem
            lines="none"
            className="w-full max-w-[600px] ion-no-border px-[12px] py-[12px] max-h-[76px] border-gray-200 border-b-2 last:border-b-0 flex  bg-white items-center justify-between notificaion-list-item overflow-visible rounded-[12px] mt-2 first:mt-4 shadow-sm"
        >
            <div className="flex items-center justify-start w-full bg-white">
                <div className="rounded-lg shadow-3xl w-[50px] h-[50px] mr-3 min-w-[50px] min-h-[50px]">
                    {isPending ? (
                        <IonSkeletonText animated className="w-full h-full" />
                    ) : (
                        <img
                            className={
                                hasImage
                                    ? 'w-full h-full object-cover bg-white rounded-lg'
                                    : 'w-full h-full object-contain overflow-hidden border-[1px] p-1'
                            }
                            src={hasImage ? image : EmptyImage}
                            alt={contract?.name ?? contract?.owner?.displayName}
                        />
                    )}
                </div>
                <div className="right-side flex justify-between w-full">
                    <div className="flex flex-col items-start justify-center text-left w-full">
                        {isPending ? (
                            <>
                                <IonSkeletonText animated className="w-36 h-[15px]" />
                                <IonSkeletonText animated className="w-5/6 h-[12px]" />
                            </>
                        ) : (
                            <>
                                <p className="text-grayscale-900 font-medium line-clamp-1">
                                    {contract?.name}
                                </p>
                                <p className="text-grayscale-600 font-medium text-[12px] line-clamp-1">
                                    {contract?.subtitle}
                                </p>
                            </>
                        )}
                    </div>

                    <div className="flex app-connect-btn-container items-center">
                        <button
                            onClick={() => openConsentFlowModal()}
                            // className="flex items-center justify-center text-indigo-500 font-[600] rounded-full bg-grayscale-100 w-[109px] py-[7px] normal text-[12px] h-fit leading-[130%]"
                            className={hasConsented ? connectedButtonClass : buttonClass}
                            disabled={isPending}
                        >
                            {hasConsented ? 'Open' : 'Connect'}
                        </button>
                    </div>
                </div>
            </div>
        </IonItem>
    );
};

export default LaunchPadContractListItem;
