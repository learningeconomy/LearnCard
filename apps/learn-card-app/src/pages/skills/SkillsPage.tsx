import React, { useEffect, useState } from 'react';
import { useFlags } from 'launchdarkly-react-client-sdk';
import { useLocation } from 'react-router-dom';

import useTheme from '../../theme/hooks/useTheme';
import useAlignments from '../../hooks/useAlignments';
import { useLoadingLine } from '../../stores/loadingStore';

import { IonContent, IonPage } from '@ionic/react';
import Plus from 'learn-card-base/svgs/Plus';
import MainHeader from '../../components/main-header/MainHeader';
import SkillsMyHub from './SkillsMyHub';
import PuzzlePiece from 'learn-card-base/svgs/PuzzlePiece';
import SkillsAdminPanel from './SkillsAdminPanel';
import GenericErrorBoundary from '../../components/generic/GenericErrorBoundary';
import SelfAssignSkillsModal from './SelfAssignSkillsModal';
import SkillsHubPlusOptionsModal from './SkillsHubPlusOptionsModal';

import {
    ModalTypes,
    CredentialCategoryEnum,
    conditionalPluralize,
    useModal,
    useGetProfile,
    useListMySkillFrameworks,
    useGetCredentialsForSkills,
} from 'learn-card-base';

import { mapBoostsToSkills } from './skills.helpers';
import { SubheaderTypeEnum } from '../../components/main-subheader/MainSubHeader.types';

import { LearnCardRolesEnum } from '../../components/onboarding/onboarding.helpers';

enum TabEnum {
    MY_HUB = 'My Hub',
    ADMIN_PANEL = 'Admin Panel',
}

const SkillsPage: React.FC = () => {
    const location = useLocation();
    const { newModal } = useModal();
    const { getThemedCategoryColors } = useTheme();
    const { data: lcNetworkProfile } = useGetProfile();
    const { data: frameworks = [] } = useListMySkillFrameworks();

    const { alignments } = useAlignments();

    const managedFrameworksExist = frameworks?.length > 0;

    const [selectedTab, setSelectedTab] = useState<TabEnum>(TabEnum.MY_HUB);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');

        if (tab === 'admin-panel') setSelectedTab(TabEnum.ADMIN_PANEL);
        if (tab === 'my-hub') setSelectedTab(TabEnum.MY_HUB);
    }, [location.search]);

    const colors = getThemedCategoryColors(CredentialCategoryEnum.skill);
    const { backgroundSecondaryColor } = colors;

    const flags = useFlags();
    const showAiInsights = flags?.showAiInsights;
    const showAdminPanel =
        flags?.enableAdminTools ||
        lcNetworkProfile?.role === LearnCardRolesEnum.admin ||
        lcNetworkProfile?.role === LearnCardRolesEnum.teacher ||
        lcNetworkProfile?.role === LearnCardRolesEnum.developer ||
        managedFrameworksExist;

    const handlePlusButton = () => {
        if (showAdminPanel) {
            newModal(<SkillsHubPlusOptionsModal />, undefined, {
                desktop: ModalTypes.Cancel,
                mobile: ModalTypes.Cancel,
            });
        } else {
            newModal(<SelfAssignSkillsModal />, undefined, {
                desktop: ModalTypes.Right,
                mobile: ModalTypes.Right,
            });
        }
    };

    const {
        data: allResolvedCreds,
        isFetching: credentialsFetching,
        isLoading: allResolvedBoostsLoading,
    } = useGetCredentialsForSkills();

    const credentialsBackgroundFetching = credentialsFetching && !allResolvedBoostsLoading;

    useLoadingLine(credentialsBackgroundFetching);

    let isBoostsEmpty = false;
    if ((!allResolvedBoostsLoading && allResolvedCreds?.length === 0) || allResolvedBoostsLoading) {
        isBoostsEmpty = true;
    } else {
        isBoostsEmpty = false;
    }

    const skillsMap = mapBoostsToSkills(allResolvedCreds);

    // Calculate total count of skills and subskills
    const totalSkills = Object.values(skillsMap).reduce(
        (total, category) => total + (category?.length || 0),
        0
    );
    const totalSubskills = Object.values(skillsMap).reduce(
        (total, category) => total + (category?.totalSubskills || 0),
        0
    );

    const total = (totalSkills || 0) + (totalSubskills || 0) + (alignments?.length || 0);

    const isHub = selectedTab === TabEnum.MY_HUB;

    return (
        <IonPage className={`bg-${backgroundSecondaryColor}`}>
            <GenericErrorBoundary category={CredentialCategoryEnum.skill}>
                <MainHeader
                    category={CredentialCategoryEnum.skill}
                    showBackButton
                    subheaderType={SubheaderTypeEnum.Skill}
                    isBoostsEmpty={isBoostsEmpty}
                    plusButtonOverride={
                        <button
                            type="button"
                            aria-label="plus-button"
                            onClick={handlePlusButton}
                            className="flex items-center justify-center h-fit w-fit p-[8px] rounded-full"
                        >
                            <Plus className="h-[20px] w-[20px]" />
                        </button>
                    }
                />
                <IonContent fullscreen className="skills-page" color={backgroundSecondaryColor}>
                    <div className="flex relative justify-center items-center w-full pb-[30px]">
                        <div className="w-full max-w-[600px] flex items-center justify-center flex-wrap text-center ion-padding mt-[30px] px-[20px]">
                            {/* {showAiInsights && <SkillsInsightCard />} */}
                            {showAdminPanel && (
                                <div
                                    className={`flex items-center justify-start w-full ${
                                        isHub ? 'mb-[10px]' : 'mb-[15px]'
                                    }`}
                                >
                                    {Object.values(TabEnum).map(tab => (
                                        <button
                                            key={tab}
                                            onClick={() => setSelectedTab(tab)}
                                            className={`px-[14px] py-[7px] rounded-[5px] font-[600] font-poppins text-[14px] ${
                                                tab === selectedTab
                                                    ? 'bg-grayscale-200 text-grayscale-900'
                                                    : 'text-grayscale-600'
                                            }`}
                                        >
                                            {tab === TabEnum.MY_HUB ? (
                                                <div className="flex items-center gap-[5px]">
                                                    <PuzzlePiece
                                                        className="w-[15px] h-[15px]"
                                                        version="filled"
                                                    />
                                                    {conditionalPluralize(total, 'Skill')}
                                                </div>
                                            ) : (
                                                tab
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {selectedTab === TabEnum.MY_HUB && <SkillsMyHub />}
                            {selectedTab === TabEnum.ADMIN_PANEL && <SkillsAdminPanel />}
                        </div>
                    </div>
                </IonContent>
            </GenericErrorBoundary>
        </IonPage>
    );
};

export default SkillsPage;
