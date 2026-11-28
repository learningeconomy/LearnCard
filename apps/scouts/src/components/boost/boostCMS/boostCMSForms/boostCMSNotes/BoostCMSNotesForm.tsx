import React from 'react';

import { BoostCMSState } from '../../../boost';
import * as m from '../../../../../paraglide/messages.js';
import { AppTextarea } from 'learn-card-base/ui/controls/AppTextarea';
import { AppCol, AppRow } from 'learn-card-base/ui/layout';

const BoostCMSNotesForm: React.FC<{
    state: BoostCMSState;
    setState: React.Dispatch<React.SetStateAction<BoostCMSState>>;
}> = ({ state, setState }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- existing loose type; tightening it is a typing change, out of scope for the Ionic removal
    const handleStateChange = (notes: any) => {
        setState({
            ...state,
            notes,
        });
    };

    return (
        <AppRow className="w-full bg-white flex flex-col items-center justify-center max-w-[600px] ion-padding mt-4 rounded-[20px]">
            <AppCol size="12" className="w-full bg-white">
                <h1 className="text-black text-3xl p-0 m-0">{m['boostCMS.notes']()}</h1>

                <div className="flex flex-col items-center justify-center w-full mb-2 mt-2">
                    <AppTextarea
                        autocapitalize="on"
                        className="bg-grayscale-100 text-grayscale-800 rounded-[15px] px-[16px] py-[8px] font-medium tracking-widest text-base"
                        placeholder={m['boostCMS.addMessage']()}
                        onValueInput={value => handleStateChange(value)}
                    />
                </div>
            </AppCol>
        </AppRow>
    );
};

export default BoostCMSNotesForm;
