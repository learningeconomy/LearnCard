import React from 'react';
import { useQueryClient } from '@tanstack/react-query';

import Pencil from '../../svgs/Pencil';
import AddUser from '../../svgs/AddUser';
import ReplyIcon from 'learn-card-base/svgs/ReplyIcon';
import TrashBin from '../../svgs/TrashBin';
import PeaceSign from '../../svgs/PeaceSign';
import FamilyCMS from '../FamilyCMS';
import DeleteFamily from './DeleteFamily';
import ChildInviteModal from '../FamilyCMSInviteModal/ChildInviteModal/ChildInviteModal';
import LeaveFamily from './LeaveFamily';

import {
    ModalTypes,
    switchedProfileStore,
    useGetBoostChildrenProfileManagers,
    useGetBoostPermissions,
    useModal,
} from 'learn-card-base';
import { useIonModal } from '@ionic/react';

import { FamilyChildAccount, FamilyCMSEditorModeEnum } from '../familyCMSState';
import { LCNProfile, VC } from '@learncard/types';
import FamilyInviteGuardian from '../FamilyBoostPreview/FamilyBoostInviteModal/FamilyInviteGuardian';
import { useCreateChildAccount } from 'apps/learn-card-app/src/hooks/useCreateChildAccount';

export const FamilyActionMenu: React.FC<{
    credential: VC;
    boostUri?: string;
    handleShareBoostLink: () => void;
}> = ({ credential, boostUri, handleShareBoostLink }) => {
    const queryClient = useQueryClient();
    const { closeModal, newModal } = useModal({
        desktop: ModalTypes.Cancel,
        mobile: ModalTypes.Cancel,
    });

    const { data: permissions } = useGetBoostPermissions(credential?.boostId);

    const hasParentSwitchedProfiles = switchedProfileStore?.get?.isSwitchedProfile();

    const { mutate: createChildAccount } = useCreateChildAccount();
    const { refetch: refetchChildrenProfiles } = useGetBoostChildrenProfileManagers(
        boostUri || credential?.boostId
    );

    const [showFamilyCMS, dismissFamilyCMS] = useIonModal(FamilyCMS, {
        credential: credential,
        handleCloseModal: () => dismissFamilyCMS(),
        editorMode: FamilyCMSEditorModeEnum.edit,
        editBoostUri: credential?.boostId,
    });

    const handleCreateChildAccount = async (childAccount: FamilyChildAccount) => {
        createChildAccount({
            childAccount: childAccount,
            boostUri: boostUri || credential?.boostId,
        });
    };

    const [openGuardianInviteModal, dismissGuardianInviteModal] = useIonModal(
        FamilyInviteGuardian,
        {
            boostUri: credential?.boostId,
            credential: credential,
            handleCloseModal: () => dismissGuardianInviteModal(),
        }
    );

    const familyTitles = credential?.familyTitles;
    const guardianTitle = familyTitles?.guardians;
    const dependentTitle = familyTitles?.dependents;

    const actionMenu: {
        id?: number;
        title?: string;
        icon?: React.ReactNode;
        onClick?: () => void;
    }[] = [
        ...(!hasParentSwitchedProfiles
            ? [
                  {
                      id: 1,
                      title: 'Edit Family',
                      icon: <Pencil className="text-grayscale-900" />,
                      onClick: () => {
                          closeModal();
                          showFamilyCMS?.();
                      },
                  },
                  {
                      id: 2,
                      title: `Add a ${dependentTitle?.singular}`,
                      icon: <AddUser version="2" className="text-grayscale-900" />,
                      onClick: () => {
                          closeModal();

                          newModal(
                              <ChildInviteModal
                                  handleCloseModal={closeModal}
                                  familyName={credential?.name}
                                  handleSaveChildAccount={handleCreateChildAccount}
                              />,
                              {},
                              { mobile: ModalTypes.Freeform, desktop: ModalTypes.FullScreen }
                          );
                      },
                  },
                  {
                      id: 3,
                      title: `Invite a ${guardianTitle?.singular}`,
                      icon: <AddUser version="2" className="text-grayscale-900" />,
                      onClick: () => {
                          closeModal();
                          openGuardianInviteModal();
                      },
                  },
              ]
            : []),
        // ...(permissions?.canManageChildrenProfiles
        //     ? [
        //           {
        //               id: 2,
        //               title: `Add a ${dependentTitle?.singular}`,
        //               icon: <AddUser version="2" className="text-grayscale-900" />,
        //               onClick: () => {
        //                   closeModal();
        //                   presentInviteChild();
        //               },
        //           },
        //       ]
        //     : []),

        // ...(permissions?.canIssue
        //     ? [
        //           {
        //               id: 3,
        //               title: `Invite a ${guardianTitle?.singular}`,
        //               icon: <AddUser version="2" className="text-grayscale-900" />,
        //               onClick: () => {
        //                   closeModal();
        //                   openGuardianInviteModal();
        //               },
        //           },
        //       ]
        //     : []),
        {
            id: 4,
            title: 'Share Family',
            icon: <ReplyIcon version="2" className="text-grayscale-900" />,
            onClick: () => {
                closeModal();
                handleShareBoostLink?.();
            },
        },
        // hide for mvp
        // {
        //     id: 5,
        //     title: 'Leave Family',
        //     icon: <PeaceSign className="text-grayscale-900 mr-1" />,
        //     onClick: () => {
        //         closeModal();
        //         newModal(<LeaveFamily credential={credential} boostUri={boostUri} />, {
        //             sectionClassName: '!bg-transparent !border-none !shadow-none !rounded-none',
        //         });
        //     },
        // },
        // {
        //     id: 6,
        //     title: 'Delete Family',
        //     icon: <TrashBin version="2" className="text-grayscale-900" />,
        //     onClick: () => {
        //         closeModal();
        //         newModal(<DeleteFamily credential={credential} boostUri={boostUri} />, {
        //             sectionClassName: '!bg-transparent !border-none !shadow-none !rounded-none',
        //         });
        //     },
        // },
    ];

    return (
        <ul className="w-full flex flex-col items-center justify-center ion-padding">
            {actionMenu?.map(action => {
                const { id, title, icon, onClick } = action;
                return (
                    <li
                        key={id}
                        onClick={() => onClick?.()}
                        className="text-[17px] font-poppins w-full flex items-center justify-between py-3 px-2 border-b-grayscale-100 border-b-solid border-b-[2px] last:border-0 cursor-pointer"
                    >
                        <p className="text-grayscale-900">{title}</p>
                        {icon}
                    </li>
                );
            })}
        </ul>
    );
};
export default FamilyActionMenu;
