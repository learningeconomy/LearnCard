import React, { useState, useCallback } from 'react';

import {
    useCountFamilialBoosts,
    useGetBoostPermissions,
    useModal,
    pluralize,
    ModalTypes,
    BoostPageViewMode,
    CredentialCategoryEnum,
    BoostCategoryOptionsEnum,
} from 'learn-card-base';

import X from '../../components/svgs/X';
import Plus from 'learn-card-base/svgs/Plus';
import BoostManagedChildrenList from '../../components/boost/boost-managed-card/BoostManagedChildrenList';
import NewBoostSelectMenu from '../../components/boost/boost-select-menu/NewBoostSelectMenuOld';
import { BlueBoostOutline2 } from 'learn-card-base/svgs/BoostOutline2';
import { PurpleMeritBadgesIcon } from 'learn-card-base/svgs/MeritBadgesIcon';
import { IonRow, IonCol, IonInput, IonContent } from '@ionic/react';

type TroopCredentialsModalProps = {
    credentialType: CredentialCategoryEnum.meritBadge | CredentialCategoryEnum.socialBadge;
    parentUri: string;
    troopName: string;
    childGenerations?: number;
    parentGenerations?: number;
};

const TroopCredentialsModal: React.FC<TroopCredentialsModalProps> = ({
    credentialType,
    parentUri,
    troopName,
    childGenerations = 6,
    parentGenerations = 6,
}) => {
    const { newModal, closeModal } = useModal({
        mobile: ModalTypes.FullScreen,
        desktop: ModalTypes.FullScreen,
    });

    const { data: boostPermissionData } = useGetBoostPermissions(parentUri);

    const canCreateSocialBadges =
        boostPermissionData?.canIssueChildren && boostPermissionData?.canCreateChildren !== '';
    const canCreateMeritBadges =
        boostPermissionData?.canIssueChildren && boostPermissionData?.canCreateChildren !== '';
    // Note: Troop Leaders shouldn't be able to create badges/boosts (LC-948)
    //   The above logic *should* handle this

    let showCreateBoostButton;
    if (credentialType === CredentialCategoryEnum.meritBadge && canCreateMeritBadges) {
        showCreateBoostButton = true;
    }

    if (credentialType == CredentialCategoryEnum.socialBadge && canCreateSocialBadges) {
        showCreateBoostButton = true;
    }

    const getStatusFilter = useCallback(() => {
        // Troop leaders should only be able to see live badges/boosts (LC-915 + LC-917)
        //   Some older networks don't have these permissions set corrcectly, but all networks created
        //   after the aforementioned tickets have the permissions set correctly, and that's enough for us to rely on
        return boostPermissionData?.canEditChildren && boostPermissionData?.canEditChildren !== ''
            ? undefined // LIVE and DRAFT
            : 'LIVE';
    }, [boostPermissionData]);

    const handlePresentBoostCMSModal = () => {
        newModal(
            <NewBoostSelectMenu
                handleCloseModal={() => closeModal()}
                category={credentialType}
                parentUri={parentUri}
                useCMSModal
            />,
            {
                className: '!p-0',
                sectionClassName: '!p-0',
            }
        );
    };

    const [search, setSearch] = useState<string>('');

    const { data: troopBoostCount } = useCountFamilialBoosts(
        parentUri,
        childGenerations,
        parentGenerations,
        {
            category: BoostCategoryOptionsEnum.socialBadge,
            status: getStatusFilter(),
        }
    );

    const { data: troopBadgeCount } = useCountFamilialBoosts(
        parentUri,
        childGenerations,
        parentGenerations,
        {
            category: BoostCategoryOptionsEnum.meritBadge,
            status: getStatusFilter(),
        }
    );

    const getCredentialMeta = () => {
        switch (credentialType) {
            case CredentialCategoryEnum.meritBadge:
                return {
                    title: pluralize('Merit Badge', troopBadgeCount),
                    count: troopBadgeCount,
                    icon: <PurpleMeritBadgesIcon className="h-[50px] w-[50px]" />,
                    color: 'sp-purple-base',
                };
            case CredentialCategoryEnum.socialBadge:
                return {
                    title: pluralize('Social Boost', troopBoostCount),
                    count: troopBoostCount,
                    icon: <BlueBoostOutline2 className="h-[50px] w-[50px]" />,
                    color: 'sp-blue-ocean',
                };
        }
    };

    const { title, icon, color, count } = getCredentialMeta();

    const handleNewCredential = () => {
        // console.log('///create credential');
        // closeAllModals();
        handlePresentBoostCMSModal();
    };

    return (
        <section className="flex flex-col h-full w-full bg-white items-center">
            <h1 className="px-[20px] py-[15px] bg-white flex gap-[10px] w-full max-w-[600px] sticky top-0 z-[1001]">
                {icon}
                <div className="flex flex-col">
                    <span className="text-grayscale-900 text-[22px] font-notoSans leading-[130%] tracking-[-0.25px]">
                        {count}
                        <span className={`ml-[5px] font-[600] font-notoSans text-${color}`}>
                            {title}
                        </span>
                    </span>
                    <span className="text-grayscale-800 font-notoSans text-[14px] font-[600]">
                        {troopName}
                    </span>
                </div>

                <button type="button" className="ml-auto" onClick={closeModal}>
                    <X className="text-grayscale-900 h-auto w-[30px] absolute top-[10px] right-[20px]" />
                </button>
            </h1>
            <section className="bg-grayscale-100 grow w-full flex flex-col items-center">
                <div className="flex items-center justify-between w-full max-w-[600px] px-[15px]">
                    <IonRow class="w-full max-w-[600px] mt-6 ion-no-padding">
                        <IonCol className="flex w-full items-center justify-start ion-no-padding gap-[10px]">
                            <IonInput
                                autocapitalize="on"
                                placeholder="Search..."
                                value={search}
                                className="bg-white text-grayscale-800 !px-4 !py-1 rounded-[15px] text-[17px] font-notoSans"
                                onIonInput={e => setSearch(e?.detail?.value)}
                                type="text"
                                clearInput
                            />
                            {showCreateBoostButton && (
                                <button
                                    onClick={handleNewCredential}
                                    className={`p-[10px] rounded-full bg-${color}`}
                                >
                                    <Plus className="h-[25px] w-[25px] text-white" />
                                </button>
                            )}
                        </IonCol>
                    </IonRow>
                </div>
                <IonContent className="test" color="grayscale-100">
                    <BoostManagedChildrenList
                        parentUri={parentUri}
                        childGenerations={childGenerations}
                        parentGenerations={parentGenerations}
                        query={{
                            category: credentialType,
                            status: getStatusFilter(),
                            name: { $regex: `/${search}/i` },
                        }}
                        search={search}
                        category={credentialType}
                        viewMode={BoostPageViewMode.Card}
                        enableCreateButton={!!showCreateBoostButton}
                    />
                </IonContent>
            </section>
        </section>
    );
};

export default TroopCredentialsModal;
