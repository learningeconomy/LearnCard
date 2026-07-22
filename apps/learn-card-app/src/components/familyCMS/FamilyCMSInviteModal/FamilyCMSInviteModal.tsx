import React, { useState } from 'react';

import { IonPage } from '@ionic/react';
import FamilyCMSInviteModalButton, { FamilyInviteTypeEnum } from './FamilyCMSInviteModalButton';
import ModalLayout from 'learn-card-base/components/modals/ionic-modals/CancelModalLayout';

import { FamilyCMSState, FamilyMember } from '../familyCMSState';
import { m } from '../../../paraglide/messages.js';

type FamilyCMSInviteModalProps = {
    state: FamilyCMSState;
    setState: React.Dispatch<React.SetStateAction<FamilyCMSState>>;
    admins?: FamilyMember[];
    setAdmins?: React.Dispatch<React.SetStateAction<FamilyMember[]>>;

    members?: FamilyMember[];
    setMembers?: React.Dispatch<React.SetStateAction<FamilyMember[]>>;
    handleCloseModal: () => void;
    handleDeleteUser?: (key: string, profileId: string) => void;
};

const FamilyCMSInviteModal: React.FC<FamilyCMSInviteModalProps> = ({
    state,
    setState,
    members,
    setMembers,
    admins,
    setAdmins,
    handleCloseModal,
    handleDeleteUser,
}) => {
    const customChildrenName = state?.basicInfo?.memberTitles?.dependents;
    const customGuardianName = state?.basicInfo?.memberTitles?.guardians;

    return (
        <div className="w-full">
            <FamilyCMSInviteModalButton
                btnText={m['family.invite.addMember']({
                    title: customChildrenName?.singular || m['family.members.child'](),
                })}
                state={state}
                setState={setState}
                members={members}
                setMembers={setMembers}
                admins={admins}
                setAdmins={setAdmins}
                handleCloseModal={handleCloseModal}
                collectionKey="issueTo"
                inviteType={FamilyInviteTypeEnum.child}
                handleDeleteUser={handleDeleteUser}
            />
            <FamilyCMSInviteModalButton
                btnText={m['family.invite.inviteMember']({
                    title: customGuardianName?.singular || m['family.members.guardian'](),
                })}
                state={state}
                setState={setState}
                members={members}
                setMembers={setMembers}
                admins={admins}
                setAdmins={setAdmins}
                handleCloseModal={handleCloseModal}
                collectionKey="admins"
                showBorder={false}
                inviteType={FamilyInviteTypeEnum.guardian}
            />
        </div>
    );
};

export default FamilyCMSInviteModal;
