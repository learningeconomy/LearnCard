import React from 'react';

import useEditTroopId from '../../hooks/useEditTroopId';

import CaretListItem from './CaretListItem';
import ViewGeneralTroopIdModal from './ViewGeneralTroopIdModal';
import TroopUserIcon from '../../components/svgs/TroopUserIcon';
import Pencil from '../../components/svgs/Pencil';

import {
    ModalTypes,
    useCountBoostRecipients,
    useGetBoostPermissions,
    useGetCredentialWithEdits,
    useModal,
    useResolveBoost,
} from 'learn-card-base';

import { getRoleFromCred, getTroopIdThumbOrDefault } from '../../helpers/troop.helpers';
import { ScoutsRoleEnum } from '../../stores/troopPageStore';
import * as m from '../../paraglide/messages.js';
import { formatLocaleCount } from '../../i18n/formatters';

type MembersBoxIdRowProps = {
    boostUri: string;
};

const MembersBoxIdRow: React.FC<MembersBoxIdRowProps> = ({ boostUri }) => {
    const { newModal } = useModal({
        desktop: ModalTypes.FullScreen,
        mobile: ModalTypes.FullScreen,
    });

    const { data: boost } = useResolveBoost(boostUri);

    const { credentialWithEdits } = useGetCredentialWithEdits(boost, boostUri);

    const role = getRoleFromCred(boost);
    const roleCopy = (() => {
        switch (role) {
            case ScoutsRoleEnum.leader:
                return {
                    id: m['troops.leaderId'](),
                    one: m['troops.leaderOne'](),
                    other: m['troops.leaderOther'](),
                };
            case ScoutsRoleEnum.national:
                return {
                    id: m['troops.nationalAdminId'](),
                    one: m['troops.adminOne'](),
                    other: m['troops.adminOther'](),
                };
            case ScoutsRoleEnum.global:
                return {
                    id: m['troops.globalAdminId'](),
                    one: m['troops.adminOne'](),
                    other: m['troops.adminOther'](),
                };
            case ScoutsRoleEnum.scout:
            default:
                return {
                    id: m['troops.scoutId'](),
                    one: m['troops.scoutOne'](),
                    other: m['troops.scoutOther'](),
                };
        }
    })();

    const { data: recipientCount } = useCountBoostRecipients(boostUri);

    const { data: permissionsData } = useGetBoostPermissions(boostUri);
    const { canEdit } = permissionsData ?? {};

    const { openEditIdModal } = useEditTroopId(credentialWithEdits ?? boost);

    return (
        <CaretListItem
            icon={getTroopIdThumbOrDefault(
                credentialWithEdits,
                'h-[40px] w-[40px] rounded-full object-cover'
            )}
            mainText={roleCopy.id}
            subText={formatLocaleCount(recipientCount ?? 0, roleCopy)}
            onClick={() => {
                newModal(
                    <ViewGeneralTroopIdModal credential={credentialWithEdits} boostUri={boostUri} />
                );
            }}
            caretOverride={
                <div className="flex items-center justify-center gap-[10px]">
                    {canEdit && (
                        <button
                            onClick={e => {
                                e.stopPropagation();
                                openEditIdModal();
                            }}
                            className="overflow-hidden flex items-center justify-center p-[7px] rounded-full bg-grayscale-100"
                        >
                            <Pencil className="text-grayscale-900 h-[26px] w-[26px]" version={2} />
                        </button>
                    )}
                    {/* <button
                        // onClick={() => presentAddressBook()}
                        className="overflow-hidden flex items-center justify-center p-[7px] rounded-full bg-sp-green-forest"
                    >
                        <TroopUserIcon className="h-[26px] w-[26px]" />
                    </button> */}
                </div>
            }
        />
    );
};

export default MembersBoxIdRow;
