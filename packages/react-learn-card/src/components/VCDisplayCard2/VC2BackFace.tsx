import React from 'react';
import { format } from 'date-fns';

import VerificationRow from './VerificationRow';

import { VC, VerificationItem, Profile } from '@learncard/types';

type VC2BackFaceProps = {
    credential: VC;
    verificationItems: VerificationItem[];
};

const VC2BackFace: React.FC<VC2BackFaceProps> = ({ credential, verificationItems }) => {
    // TODO real expiration (if present)
    const expiration = format(new Date(), 'MMM dd, yyyy');
    const criteria = credential.credentialSubject.achievement?.criteria?.narrative;

    return (
        <section className="flex flex-col gap-[20px] w-full px-[15px]">
            <h2 className="text-white text-[30px] pl-[10px]">Details</h2>
            <div className="bg-white flex flex-col items-start gap-[10px] rounded-[20px] shadow-bottom px-[15px] py-[20px] w-full">
                <h3 className="text-[20px] leading-[20px]">Description</h3>

                {/* TODO truncate if too long */}
                <p className="text-[12px] text-grayscale-700 leading-[18px] font-poppins font-[400] mb-0">
                    {credential.credentialSubject.achievement?.description}
                </p>

                {expiration && (
                    <p className="text-grayscale-800 font-poppins font-[600] text-[12px] leading-[18px] mb-0">
                        Expires on {expiration}
                    </p>
                )}
            </div>
            {criteria && (
                <div className="bg-white flex flex-col items-start gap-[10px] rounded-[20px] shadow-bottom px-[15px] py-[20px] w-full">
                    <h3 className="text-[20px] leading-[20px]">Criteria</h3>

                    {/* TODO truncate if too long */}
                    <p className="text-[12px] text-grayscale-700 leading-[18px] font-poppins font-[400]">
                        {criteria}
                    </p>
                </div>
            )}
            <div className="bg-white flex flex-col items-start gap-[10px] rounded-[20px] shadow-bottom px-[15px] py-[20px] w-full">
                <h3 className="text-[20px] leading-[20px]">Credential Verifications</h3>

                {verificationItems.map((verification, index) => (
                    <VerificationRow key={index} verification={verification} />
                ))}
            </div>
        </section>
    );
};

export default VC2BackFace;
