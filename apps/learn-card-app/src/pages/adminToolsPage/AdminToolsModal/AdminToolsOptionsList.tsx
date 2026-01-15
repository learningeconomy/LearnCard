import React from 'react';
import { useHistory } from 'react-router-dom';
import { useModal, useGetProfile } from 'learn-card-base';

import AdminToolOptionsListItem from './AdminToolsOptionsListItem';
import SlimCaretRight from '../../../components/svgs/SlimCaretRight';

import {
    adminToolOptions,
    developerToolOptions,
    AdminToolOptionsEnum,
} from './admin-tools.helpers';
import { LearnCardRolesEnum } from '../../../components/onboarding/onboarding.helpers';

export const AdminToolOptionsList: React.FC<{ shortCircuitDevTool?: AdminToolOptionsEnum }> = ({
    shortCircuitDevTool,
}) => {
    const history = useHistory();
    const { closeAllModals } = useModal();
    const { data: lcNetworkProfile } = useGetProfile();

    const userRole = lcNetworkProfile?.role as LearnCardRolesEnum | undefined;
    const canAccessDevTools =
        userRole === LearnCardRolesEnum.developer || userRole === LearnCardRolesEnum.admin;

    return (
        <>
            <div className="w-full bg-white items-center justify-center flex flex-col shadow-2xl p-[15px] mt-4 rounded-[15px]">
                <div className="w-full flex items-center justify-start">
                    <h4 className="text-xl text-grayscale-900 font-notoSans font-[600]">
                        Admin Tools
                    </h4>
                </div>
                <div className="w-full flex items-center justify-start">
                    <ul className="w-full">
                        {adminToolOptions.map(option => (
                            <AdminToolOptionsListItem
                                shortCircuitDevTool={shortCircuitDevTool}
                                option={option}
                                key={option.id}
                            />
                        ))}

                        <li
                            onClick={() => {
                                closeAllModals();
                                history.push('/app-store/developer');
                            }}
                            role="button"
                            className="w-full flex items-center justify-between py-[15px] cursor-pointer border-b border-grayscale-200 last:border-b-0"
                        >
                            <div className="flex flex-col items-start">
                                <p className="text-grayscale-900 text-[17px] font-notoSans font-[600] leading-[24px] tracking-[0.25px] pr-2">
                                    Partner Portal
                                </p>

                                <p className="text-grayscale-600 text-[14px] font-notoSans font-[400] leading-[21px] tracking-[0.25px]">
                                    Publish and manage apps in the App Store.
                                </p>
                            </div>

                            <div className="flex items-center justify-end">
                                <SlimCaretRight className="w-[25px] h-[26px] text-grayscale-500" />
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
            <div className="w-full bg-white items-center justify-center flex flex-col shadow-2xl p-[15px] mt-4 rounded-[15px]">
                <div className="w-full flex items-center justify-start">
                    <h4 className="text-xl text-grayscale-900 font-notoSans font-[600]">
                        Developer Tools
                    </h4>
                </div>
                {canAccessDevTools ? (
                    <div className="w-full flex items-center justify-start">
                        <ul className="w-full">
                            {developerToolOptions.map(option => (
                                <AdminToolOptionsListItem
                                    shortCircuitDevTool={shortCircuitDevTool}
                                    option={option}
                                    key={option.id}
                                />
                            ))}
                        </ul>
                    </div>
                ) : (
                    <div className="w-full py-4 px-2">
                        <div className="flex items-start gap-3 p-4 bg-grayscale-50 rounded-lg border border-grayscale-200">
                            <span className="text-xl">🔒</span>

                            <div>
                                <p className="text-grayscale-700 text-[14px] font-notoSans font-[500] leading-[21px]">
                                    Developer tools are limited to users with a Developer or Admin role.
                                </p>

                                <p className="text-grayscale-500 text-[12px] font-notoSans font-[400] leading-[18px] mt-1">
                                    You can update your role in your account settings.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default AdminToolOptionsList;
