import React from 'react';
import moment from 'moment';

import { VC } from '@learncard/types';
import InfoIcon from '../../svgs/InfoIcon';
import Checkmark from '../../svgs/Checkmark';

import { getInfoFromCredential } from 'learn-card-base/components/CredentialBadge/CredentialVerificationDisplay';

export const FamilyBoostPreviewBackFace: React.FC<{
    credential: VC;
}> = ({ credential }) => {
    const { createdAt } = getInfoFromCredential(credential, 'MMMM DD, YYYY', {
        uppercaseDate: false,
    });
    const issueDate = moment(createdAt).format('MMMM DD, YYYY');

    return (
        <div className="w-full max-w-[400px] pb-[100px] vc-preview-modal-safe-area">
            <section className="bg-white ion-padding rounded-[20px] shadow-soft-bottom mt-[20px]">
                <div className="w-full flex flex-col items-start justify-start text-left">
                    <h3 className="text-[22px] font-normal text-grayscale-900 font-poppins">
                        Details
                    </h3>
                    <p className="text-grayscale-600 font-semibold mt-1 text-sm font-poppins">
                        Created on {issueDate}
                    </p>
                </div>
            </section>

            {/* hide for mvp */}
            {/* <section className="bg-white ion-padding rounded-[20px] shadow-soft-bottom mt-[20px]">
                <h3 className="font-poppins text-[22px] font-normal text-grayscale-900">History</h3>

                <div className="w-full flex flex-col items-start justify-start text-left border-b-[2px] pb-4">
                    <p className="text-grayscale-600 font-normal mt-1 text-sm font-poppins">
                        Updated on {issueDate} at 00:00 AM PST
                    </p>
                    <button className="text-[#0094B4] font-semibold font-poppins text-sm mt-1">
                        View LearnCard
                    </button>
                </div>

                <div className="w-full flex flex-col items-start justify-start text-left pb-4">
                    <p className="text-grayscale-600 font-normal mt-1 text-sm font-poppins">
                        Updated on {issueDate} at 00:00 AM PST
                    </p>
                    <button className="text-[#0094B4] font-semibold font-poppins text-sm mt-1">
                        View LearnCard
                    </button>
                </div>
            </section> */}

            <section className="bg-white ion-padding rounded-[20px] shadow-soft-bottom mt-[20px]">
                <button className="w-full flex items-center justify-between mb-2">
                    <h3 className="text-[22px] font-normal text-grayscale-900 font-poppins">
                        Credential Verifications
                    </h3>

                    <button type="button">
                        <InfoIcon fill="#A8ACBD" className="text-white w-[25px] h-[25px]" />
                    </button>
                </button>

                <div className="w-full flex flex-col items-start justify-center mb-4 border-b-[2px] pb-4">
                    <div className="flex items-center justify-start text-emerald-700 mb-2">
                        <span className="bg-emerald-700 rounded-full">
                            <Checkmark className="text-white w-[20px] h-[20px]" />
                        </span>
                        <p className="ml-2 text-sm font-bold font-poppins">Success</p>
                    </div>
                    <p className="text-grayscale-900 text-sm font-poppins">
                        <strong>Proof: </strong>Valid
                    </p>
                </div>

                <div className="w-full flex flex-col items-start justify-center mb-2">
                    <div className="flex items-center justify-start text-emerald-700 mb-2">
                        <span className="bg-emerald-700 rounded-full">
                            <Checkmark className="text-white w-[20px] h-[20px]" />
                        </span>
                        <p className="ml-2 text-sm font-bold font-poppins">Success</p>
                    </div>
                    <p className="text-grayscale-900 text-sm font-poppins">
                        <strong>Status: </strong>Active
                    </p>
                </div>
            </section>
        </div>
    );
};

export default FamilyBoostPreviewBackFace;
