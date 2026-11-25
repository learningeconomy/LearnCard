import React from 'react';
import { useCanManageCompetencies } from '../../../hooks/useCanManageCompetencies';
import * as m from '../../../paraglide/messages.js';

import AdminToolOptionsListItem from './AdminToolsOptionsListItem';

import {
    getAdminToolOptions,
    getDeveloperToolOptions,
    AdminToolOptionsEnum,
} from './admin-tools.helpers';

export const AdminToolOptionsList: React.FC<{ shortCircuitDevTool?: AdminToolOptionsEnum }> = ({
    shortCircuitDevTool,
}) => {
    const canManageCompetencies = useCanManageCompetencies();
    const options = getAdminToolOptions().filter(
        option =>
            canManageCompetencies ||
            (option.type !== AdminToolOptionsEnum.SKILL_FRAMEWORKS &&
                option.type !== AdminToolOptionsEnum.IMPORT_SKILL_FRAMEWORKS)
    );

    return (
        <>
            <div className="w-full bg-white items-center justify-center flex flex-col shadow-2xl p-[15px] mt-4 rounded-[15px]">
                <div className="w-full flex items-center justify-start">
                    <h4 className="text-xl text-grayscale-900 font-notoSans font-[600]">
                        {m['adminTools.adminToolsHeading']()}
                    </h4>
                </div>
                <div className="w-full flex items-center justify-start">
                    <ul className="w-full">
                        {options.map(option => (
                            <AdminToolOptionsListItem
                                shortCircuitDevTool={shortCircuitDevTool}
                                option={option}
                                key={option.id}
                            />
                        ))}
                    </ul>
                </div>
            </div>
            {/* <div className="w-full bg-white items-center justify-center flex flex-col shadow-2xl p-[15px] mt-4 rounded-[15px]">
                <div className="w-full flex items-center justify-start">
                    <h4 className="text-xl text-grayscale-900 font-notoSans font-[600]">
                        Developer Tools
                    </h4>
                </div>
                <div className="w-full flex items-center justify-start">
                    <ul className="w-full">
                        {getDeveloperToolOptions().map(option => (
                            <AdminToolOptionsListItem
                                shortCircuitDevTool={shortCircuitDevTool}
                                option={option}
                                key={option.id}
                            />
                        ))}
                    </ul>
                </div>
            </div> */}
        </>
    );
};

export default AdminToolOptionsList;
