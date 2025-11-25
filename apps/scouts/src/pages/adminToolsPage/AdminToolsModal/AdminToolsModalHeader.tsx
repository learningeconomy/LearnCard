import React from 'react';

// import AdminToolsAccountSwitcherButton from '../AdminToolsAccountSwitcher/AdminToolsAccountSwitcherButton';
import WrenchIcon from 'learn-card-base/svgs/WrenchIcon';

export const AdminToolsModalHeader: React.FC = () => {
    return (
        <div className="w-full bg-white items-center justify-center flex flex-col shadow-2xl px-6 py-4 mt-4 rounded-[15px]">
            <div className="flex flex-col items-center justify-center py-4">
                <div className="bg-indigo-500 rounded-[15px] p-2 w-[60px] h-[60px] flex items-center justify-center mb-4">
                    <WrenchIcon className="w-[40px] h-[40px] text-white" />
                </div>
                <h2 className="text-[22px] text-grayscale-800 font-semibold font-notoSans text-center">
                    Advanced Tools
                </h2>
            </div>
            {/* <AdminToolsAccountSwitcherButton /> */}
        </div>
    );
};

export default AdminToolsModalHeader;
