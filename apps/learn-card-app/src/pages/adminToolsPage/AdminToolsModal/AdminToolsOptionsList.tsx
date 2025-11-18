import React from 'react';

import AdminToolOptionsListItem from './AdminToolsOptionsListItem';

import {
    adminToolOptions,
    developerToolOptions,
    AdminToolOptionsEnum,
} from './admin-tools.helpers';

export const AdminToolOptionsList: React.FC<{ shortCircuitDevTool?: AdminToolOptionsEnum }> = ({
    shortCircuitDevTool,
}) => {
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
                    </ul>
                </div>
            </div>
            <div className="w-full bg-white items-center justify-center flex flex-col shadow-2xl p-[15px] mt-4 rounded-[15px]">
                <div className="w-full flex items-center justify-start">
                    <h4 className="text-xl text-grayscale-900 font-notoSans font-[600]">
                        Developer Tools
                    </h4>
                </div>
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
            </div>
        </>
    );
};

export default AdminToolOptionsList;
