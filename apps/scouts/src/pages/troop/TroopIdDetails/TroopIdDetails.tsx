import React from 'react';
import { format } from 'date-fns';

import { useGetBoostParents } from 'learn-card-base';

import TruncateTextBox from './TruncateTextBox';
import HistoryBox, { HistoryTypeEnum } from './HistoryBox';
import PermissionsBox from './PermissionsBox';
import IssueHistoryBox from './IssueHistoryBox';
import VerificationsBox from './VerificationsBox';

import { getScoutsNoun, getScoutsNounForRole, getScoutsRole } from '../../../helpers/troop.helpers';
import { ScoutsRoleEnum } from '../../../stores/troopPageStore';
import { AchievementTypes } from 'learn-card-base/components/IssueVC/constants';
import { VC, VerificationItem } from '@learncard/types';

type TroopIdDetailsProps = {
    credential: VC;
    verificationItems: VerificationItem[];
    boostUri?: string;
    isGeneralView?: boolean; // viewing the general Troop/Network ID, as opposed to one for a particular person
    profileId?: string;
};

export const TroopIdDetails: React.FC<TroopIdDetailsProps> = ({
    credential,
    verificationItems,
    boostUri,
    isGeneralView,
    profileId,
}) => {
    boostUri = boostUri ?? credential.boostId;

    const role = getScoutsRole(credential);
    const description = credential?.boostID?.idDescription;
    const expiration = credential.expirationDate
        ? format(new Date(credential.expirationDate), 'MMM dd, yyyy')
        : undefined;

    const { data: parentData } = useGetBoostParents(boostUri, 3);

    const troopName =
        role === ScoutsRoleEnum.leader
            ? credential?.name
            : parentData?.records.find(p => p.type === AchievementTypes.Troop)?.name;
    const networkName = parentData?.records.find(p => p.type === AchievementTypes.Network)?.name;
    const globalNetworkName = parentData?.records.find(
        p => p.type === AchievementTypes.Global
    )?.name;

    const history = [
        { type: HistoryTypeEnum.issued, dateIsoString: credential.issuanceDate, idUri: '' },
    ];

    const scoutNoun = getScoutsNounForRole(role);

    return (
        <section className="flex flex-col gap-[10px] w-full">
            {(description || expiration) && (
                <TruncateTextBox headerText="Details" subHeaderText="About" text={description}>
                    {/* {expiration && (
                        <p className="text-grayscale-800 font-poppins font-[600] text-[12px] leading-[18px] mb-0">
                            Expire{isExpired ? 'd' : 's'} on {expiration}
                        </p>
                    )} */}
                    {(troopName || networkName || globalNetworkName) && (
                        <div className="flex flex-col gap-[5px] font-notoSans text-[14px] pt-[10px] border-t-[1px] border-solid border-grayscale-200 w-full">
                            {troopName && (
                                <div className="flex gap-[4px]">
                                    {/* isGeneralView => *Created by [Troop 222]* on [date]  */}
                                    {/* !isGeneralView => *Issued by:* [Troop 222]  */}
                                    <span className="font-[600] text-grayscale-900 font-notoSans">
                                        {isGeneralView ? `Created by ${troopName}` : 'Issued by:'}
                                    </span>
                                    <span className="text-grayscale-700 font-notoSans">
                                        {isGeneralView
                                            ? `on ${format(
                                                  new Date(credential.issuanceDate),
                                                  'MMMM dd, yyyy'
                                              )}`
                                            : troopName}
                                    </span>
                                </div>
                            )}
                            {networkName && (
                                <div className="flex gap-[4px]">
                                    <span className="font-[600] text-grayscale-900 font-notoSans">
                                        National Network:
                                    </span>
                                    <span className="text-grayscale-700 font-notoSans">
                                        {networkName}
                                    </span>
                                </div>
                            )}
                            {globalNetworkName && (
                                <div className="flex gap-[4px]">
                                    <span className="font-[600] text-grayscale-900 font-notoSans">
                                        Global Network:
                                    </span>
                                    <span className="text-grayscale-700 font-notoSans">
                                        {globalNetworkName}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </TruncateTextBox>
            )}

            <HistoryBox history={history} />

            {false && isGeneralView && (
                <PermissionsBox
                    credential={credential}
                    boostUri={boostUri}
                    scoutTypeNoun={scoutNoun}
                    profileId={profileId}
                />
            )}

            {isGeneralView && <IssueHistoryBox boostUri={boostUri} />}

            {verificationItems && verificationItems.length > 0 && (
                <VerificationsBox verificationItems={verificationItems} />
            )}
        </section>
    );
};

export default TroopIdDetails;
