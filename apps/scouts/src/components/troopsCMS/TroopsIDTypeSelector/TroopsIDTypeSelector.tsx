import React, { useEffect, useState } from 'react';

import TroopIDUsersList from '../TroopsIDCMS/TroopIDUsersList/TroopIDUsersList';
import { TroopIDTypeButton } from './TroopIDTypeButton';

import { TroopsCMSState, TroopsCMSViewModeEnum } from '../troopCMSState';
import { BoostCMSIssueTo } from 'learn-card-base';

type TroopsIDTypeSelectorProps = {
    state: TroopsCMSState;
    setState: React.Dispatch<React.SetStateAction<TroopsCMSState>>;
    viewMode: TroopsCMSViewModeEnum;
};

export const TroopsIDTypeSelector: React.FC<TroopsIDTypeSelectorProps> = ({
    state,
    setState,
    viewMode,
}) => {
    const isInTroopViewMode = viewMode === TroopsCMSViewModeEnum.troop;

    const [admins, setAdmins] = useState<BoostCMSIssueTo[]>(state?.admins);
    const [members, setMembers] = useState<BoostCMSIssueTo[]>(state?.issueTo);

    useEffect(() => {
        // map admins/members into state (for edit)
        if ((!admins || admins.length === 0) && state.admins.length > 0) {
            setAdmins(state.admins);
        }
        if ((!members || members.length === 0) && state.issueTo.length > 0) {
            setMembers(state.issueTo);
        }
    }, [state.admins, state.issueTo]);

    return (
        <>
            <section className="bg-white ion-padding rounded-[20px] shadow-soft-bottom mt-[20px]">
                {!isInTroopViewMode && (
                    <TroopIDTypeButton
                        admins={admins}
                        setAdmins={setAdmins}
                        state={state}
                        setState={setState}
                        viewMode={viewMode}
                        viewModeSubtype={TroopsCMSViewModeEnum.leader}
                    />
                )}

                {isInTroopViewMode && (
                    <>
                        <TroopIDTypeButton
                            admins={admins}
                            setAdmins={setAdmins}
                            members={members}
                            setMembers={setMembers}
                            state={state}
                            setState={setState}
                            viewMode={viewMode}
                            viewModeSubtype={TroopsCMSViewModeEnum.member}
                        />
                        <TroopIDTypeButton
                            admins={admins}
                            setAdmins={setAdmins}
                            members={members}
                            setMembers={setMembers}
                            state={state}
                            setState={setState}
                            viewMode={viewMode}
                            viewModeSubtype={TroopsCMSViewModeEnum.leader}
                        />
                    </>
                )}
            </section>

            <TroopIDUsersList
                state={state}
                setState={setState}
                admins={admins}
                setAdmins={setAdmins}
                members={members}
                setMembers={setMembers}
                isInTroopViewMode={isInTroopViewMode}
            />
        </>
    );
};

export default TroopsIDTypeSelector;
