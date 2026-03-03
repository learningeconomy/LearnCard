import React, { useMemo, useCallback } from 'react';
import { useFlags } from 'launchdarkly-react-client-sdk';

import boostSearchStore from '../../stores/boostSearchStore';

import {
    useModal,
    useCountBoostChildren,
    useCountFamilialBoosts,
    CredentialCategoryEnum,
    BoostCategoryOptionsEnum,
    ModalTypes,
} from 'learn-card-base';

import TroopsModal from './TroopsModal';
import CaretListItem from './CaretListItem';
import NetworkListDisplay from './NetworkListDisplay';
import TroopAnalyticsEmbed from './TroopAnalyticsEmbed';
import TroopCredentialsModal from './TroopCredentialsModal';

import AnalyticsIcon from 'learn-card-base/svgs/Analytics';
import { AchievementTypes } from 'learn-card-base/components/IssueVC/constants';
import { OrangeScoutsNetworkTent } from 'learn-card-base/svgs/ScoutsNetworkTent';
import { PurpleMeritBadgesIcon } from 'learn-card-base/svgs/MeritBadgesIcon';
import { GreenScoutsPledge2 } from 'learn-card-base/svgs/ScoutsPledge2';
import { BlueBoostOutline2 } from 'learn-card-base/svgs/BoostOutline2';

import { TroopParentLevel } from './troopConstants';

import { getScoutsRole } from '../../helpers/troop.helpers';
import { ScoutsRoleEnum } from '../../stores/troopPageStore';
import { DASHBOARD_TYPE } from 'packages/plugins/lca-api-plugin/src/types';

import type { VC } from '@learncard/types';

type Props = {
    networkName?: string;
    boostUri?: string;
    credential: VC;
    userRole?: ScoutsRoleEnum; // Optional: override role for elevated access
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const useCounts = (uri?: string | undefined) => {
    /* Boost children counts -------------------------------------------------- */
    const { data: globalNetworks } = useCountBoostChildren(uri, 1, {
        type: AchievementTypes.Network,
    });
    const { data: globalTroops } = useCountBoostChildren(uri, 2, { type: AchievementTypes.Troop });
    const { data: nationalTroops } = useCountBoostChildren(uri, 2, {
        type: AchievementTypes.Troop,
    });

    const { data: nationalBadges } = useCountBoostChildren(uri, 1, {
        category: BoostCategoryOptionsEnum.meritBadge,
    });
    const { data: nationalBoosts } = useCountBoostChildren(uri, 1, {
        category: BoostCategoryOptionsEnum.socialBadge,
    });

    /* Familial boosts counts ------------------------------------------------- */
    const { data: troopBadges } = useCountFamilialBoosts(uri, 2, 1, {
        category: BoostCategoryOptionsEnum.meritBadge,
        status: 'LIVE', // LIVE to match the behavior in TroopCredentialsModal. Troop Leaders should only see live badges/boosts (LC-915 + LC-917)
    });
    const { data: troopBoosts } = useCountFamilialBoosts(uri, 2, 1, {
        category: BoostCategoryOptionsEnum.socialBadge,
        status: 'LIVE',
    });

    const { data: scoutBadges } = useCountFamilialBoosts(
        uri,
        1,
        2,
        { category: BoostCategoryOptionsEnum.meritBadge },
        true,
        true
    );
    const { data: scoutBoosts } = useCountFamilialBoosts(
        uri,
        1,
        2,
        { category: BoostCategoryOptionsEnum.socialBadge },
        true,
        true
    );

    return {
        globalNetworks,
        globalTroops,
        nationalTroops,
        nationalBadges,
        nationalBoosts,
        troopBadges,
        troopBoosts,
        scoutBadges,
        scoutBoosts,
    };
};

const TroopChildrenBox: React.FC<Props> = ({ networkName, boostUri, credential, userRole }) => {
    const uri = boostUri ?? undefined;
    const credentialRole = getScoutsRole(credential);
    // Use userRole if provided (for parent admin elevated access), otherwise use credential role
    const role = userRole ?? credentialRole;
    const flags = useFlags();
    const showAnalyticsOption = flags.enableViewScoutAnalytics;

    const isNetworkAdmin = role === ScoutsRoleEnum.national;

    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.FullScreen,
        mobile: ModalTypes.FullScreen,
    });

    const counts = useCounts(uri);

    /* --------- convenience helpers to open child modals / analytics --------- */
    const openAnalytics = useCallback(
        (level: DASHBOARD_TYPE) =>
            newModal(
                <TroopAnalyticsEmbed
                    credential={credential}
                    boostUri={boostUri}
                    analyticsLevel={level}
                    handleClose={closeModal}
                />
            ),
        [newModal, closeModal, credential, boostUri]
    );

    const openNetworkList = useCallback(
        () =>
            newModal(
                <NetworkListDisplay
                    count={counts.globalNetworks}
                    networkName={networkName}
                    uri={uri}
                    parentLevel={TroopParentLevel.global}
                />
            ),
        [counts.globalNetworks, newModal, networkName, uri]
    );

    const openTroopsModal = useCallback(
        (parentLevel: TroopParentLevel, count?: number) =>
            newModal(
                <TroopsModal
                    count={count}
                    networkName={networkName}
                    credentialType={CredentialCategoryEnum.troops}
                    uri={uri}
                    parentLevel={parentLevel}
                />
            ),
        [newModal, networkName, uri]
    );

    const openCredentialModal = useCallback(
        (category: CredentialCategoryEnum) => {
            boostSearchStore.set.contextCredential(credential);
            boostSearchStore.set.boostUri(boostUri);

            newModal(
                <TroopCredentialsModal
                    parentUri={uri}
                    troopName={networkName}
                    credentialType={category}
                    childGenerations={isNetworkAdmin ? 1 : undefined}
                />
            );
        },
        [newModal, uri, networkName]
    );

    /* ------------------------------------------------------------------------ */
    /* Row definitions, memoised so re-renders only when deps change            */
    /* ------------------------------------------------------------------------ */
    const rows = useMemo(() => {
        /** Small helper to show “…” while loading. */
        const fmt = (value?: number) => value ?? '…';

        switch (role) {
            case ScoutsRoleEnum.global:
                return [
                    {
                        Icon: OrangeScoutsNetworkTent,
                        mainText: 'National Networks',
                        caretText: fmt(counts.globalNetworks),
                        onClick: openNetworkList,
                    },
                    {
                        Icon: GreenScoutsPledge2,
                        mainText: 'Troops',
                        caretText: fmt(counts.globalTroops),
                        onClick: () =>
                            openTroopsModal(TroopParentLevel.global, counts.globalTroops),
                    },
                    showAnalyticsOption
                        ? {
                              Icon: AnalyticsIcon,
                              mainText: 'Analytics',
                              caretText: '',
                              onClick: () => openAnalytics(DASHBOARD_TYPE.GLOBAL),
                          }
                        : undefined,
                ];

            case ScoutsRoleEnum.national:
                return [
                    {
                        Icon: GreenScoutsPledge2,
                        mainText: 'Troops',
                        caretText: fmt(counts.nationalTroops),
                        onClick: () =>
                            openTroopsModal(TroopParentLevel.national, counts.nationalTroops),
                    },
                    {
                        Icon: PurpleMeritBadgesIcon,
                        mainText: 'Merit Badges',
                        caretText: fmt(counts.nationalBadges),
                        onClick: () => openCredentialModal(CredentialCategoryEnum.meritBadge),
                    },
                    {
                        Icon: BlueBoostOutline2,
                        mainText: 'Social Boosts',
                        caretText: fmt(counts.nationalBoosts),
                        onClick: () => openCredentialModal(CredentialCategoryEnum.socialBadge),
                    },
                    showAnalyticsOption
                        ? {
                              Icon: AnalyticsIcon,
                              mainText: 'Analytics',
                              caretText: '',
                              onClick: () => openAnalytics(DASHBOARD_TYPE.NSO),
                          }
                        : undefined,
                ];

            case ScoutsRoleEnum.scout:
                return [
                    {
                        Icon: PurpleMeritBadgesIcon,
                        mainText: 'Merit Badges',
                        caretText: fmt(counts.scoutBadges),
                        onClick: () => openCredentialModal(CredentialCategoryEnum.meritBadge),
                    },
                    {
                        Icon: BlueBoostOutline2,
                        mainText: 'Social Boosts',
                        caretText: fmt(counts.scoutBoosts),
                        onClick: () => openCredentialModal(CredentialCategoryEnum.socialBadge),
                    },
                ];

            case ScoutsRoleEnum.leader:
                return [
                    {
                        Icon: PurpleMeritBadgesIcon,
                        mainText: 'Merit Badges',
                        caretText: fmt(counts.troopBadges),
                        onClick: () => openCredentialModal(CredentialCategoryEnum.meritBadge),
                    },
                    {
                        Icon: BlueBoostOutline2,
                        mainText: 'Social Boosts',
                        caretText: fmt(counts.troopBoosts),
                        onClick: () => openCredentialModal(CredentialCategoryEnum.socialBadge),
                    },
                    showAnalyticsOption
                        ? {
                              Icon: AnalyticsIcon,
                              mainText: 'Analytics',
                              caretText: '',
                              onClick: () => openAnalytics(DASHBOARD_TYPE.TROOP),
                          }
                        : undefined,
                ];

            default:
                return [];
        }
    }, [role, counts, openNetworkList, openTroopsModal, openCredentialModal, openAnalytics]);

    /* ------------------------------------------------------------------------ */

    return (
        <div className="bg-white rounded-2xl shadow-box-bottom overflow-hidden flex flex-col px-5 py-2.5">
            {rows
                .filter((r): r is NonNullable<typeof r> => Boolean(r)) // <-- removes the undefined
                .map(({ Icon, mainText, caretText, onClick }) => (
                    <CaretListItem
                        key={mainText}
                        icon={<Icon className="h-10 w-10" />}
                        mainText={mainText}
                        caretText={caretText}
                        onClick={onClick}
                    />
                ))}
        </div>
    );
};

export default TroopChildrenBox;
