import React from 'react';

import IDSleeve from 'learn-card-base/svgs/IDSleeve';
import BlueMagicWand from 'learn-card-base/svgs/BlueMagicWand';

import { LaunchPadAppListItem } from 'learn-card-base';

export const AiPassportAppProfileConnectedViewHeader: React.FC<{ app: LaunchPadAppListItem }> = ({
    app,
}) => {
    const img = app.img;

    return (
        <div className="rounded-t-[24px] flex flex-col border-solid border-white border-[3px]">
            <div className="w-full flex items-center justify-center flex-col bg-opacity-70 rounded-t-[20px] backdrop-blur-[5px] bg-white">
                <div className="w-full relative flex items-center justify-center flex-col pt-[25px]">
                    <div className="h-[100px] w-[100px] mr-2 rounded-[20px] overflow-hidden">
                        <img
                            className="w-full h-full object-cover bg-white rounded-[20px] overflow-hidden border-[1px] border-solid"
                            alt={`${app?.name} logo`}
                            src={img}
                        />
                    </div>
                    <div className="w-full flex items-center justify-center mb-[25px]">
                        <p className="text-center text-[22px] font-poppins mt-4 text-grayscale-900 font-semibold">
                            {app.name}
                        </p>
                    </div>
                </div>

                <div className="w-full flex items-center justify-center relative">
                    <div className="w-full flex items-center justify-center relative mb-[-3.4px]">
                        <IDSleeve className="h-auto w-full" />
                    </div>

                    <button className="absolute bg-white max-w-[50px] max-h-[50px] rounded-full mb-6 shadow-soft-bottom">
                        <div className="h-full w-full relative text-center">
                            <BlueMagicWand className="w-[60px] h-[60px] text-grayscale-900" />
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AiPassportAppProfileConnectedViewHeader;
