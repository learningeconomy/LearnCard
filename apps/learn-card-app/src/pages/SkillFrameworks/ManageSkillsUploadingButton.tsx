import React from 'react';
import { IonSpinner } from '@ionic/react';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- existing empty props type; replacing it changes the accepted props type
type ManageSkillsUploadingButtonProps = {};

// eslint-disable-next-line no-empty-pattern -- dropping the empty destructure removes the implicit non-null argument check
const ManageSkillsUploadingButton: React.FC<ManageSkillsUploadingButtonProps> = ({}) => {
    return (
        <div className="bg-grayscale-100 flex gap-[10px] items-center justify-center py-[7px] px-[15px] rounded-[30px] text-indigo-500 font-notoSans text-[17px] font-[600] leading-[24px] tracking-[0.25px]">
            <IonSpinner className="w-[25px] h-[25px]" name="crescent" />
            Uploading file...
        </div>
    );
};

export default ManageSkillsUploadingButton;
