import React from 'react';
import { VCDisplayCardProps } from '../../types';
import { VCVerificationCheckWithText } from '../VCVerificationCheck/VCVerificationCheck';
import VCVerificationPill from '../VCVerificationPill/VCVerificationPill';
import FlipArrowRight from '../../assets/images/ArrowArcRight.svg';

const VCDisplayBackFace: React.FC<VCDisplayCardProps> = ({
    issuer,
    credentialSubject,
    className = '',
    loading,
    verification = [],
}) => {
    const descriptionText = credentialSubject?.achievement?.description;
    const criteriaText = credentialSubject?.achievement?.criteria?.narrative;
    const issuerUrl = issuer?.url;

    return (
        <div
            className={`flex overflow-hidden flex-col items-center justify-between relative max-w-[400px] h-[100%] max-h-[1100px] min-h-[600px] p-7 rounded-3xl shadow-3xl bg-emerald-700 vc-display-card-full-container ${className}`}
        >
            <section className="flex max-h-[150px] items-end bg-white rounded-bl-[50%] rounded-br-[50%] absolute top-0 w-[110%] h-[55%] min-h-[400px]"></section>
            <section className="flex flex-col items-center justify-center z-10 text-left">
                <section className="flex flex-row items-start justify-start w-full line-clamp-2">
                    <h3
                        className="text-2xl line-clamp-2 tracking-wide leading-snug text-left text-emerald-700"
                        data-testid="vc-credential-details-title tracking-wide subpixel-antialiased"
                    >
                        Credential Details
                    </h3>
                </section>

                <section className="flex flex-col mt-2 w-full my-2">
                    <div className="width-full">
                        <h6 className="line-clamp-4 text-grayscale-900 font-bold uppercase text-xs tracking-wider subpixel-antialiased">
                            Description
                        </h6>
                        <p className="line-clamp-4 subpixel-antialiased text-grayscale-600 ">
                            {descriptionText}
                        </p>
                    </div>

                    <div className="width-full mt-7">
                        <h6 className="line-clamp-4 text-grayscale-900 font-bold uppercase text-xs tracking-wider  subpixel-antialiased">
                            Criteria
                        </h6>
                        <p className="line-clamp-4 subpixel-antialiased text-grayscale-600 ">
                            {criteriaText}
                        </p>
                    </div>

                    {issuerUrl && (
                        <p className="text-indigo-500 font-bold text-xs width-full text-center mt-8">
                            {issuerUrl}
                        </p>
                    )}
                </section>

                <div className="w-full mt-2"></div>

                <button className="bg-white my-3 border-2 text-indigo-500 font-semibold py-2 px-4 border border-indigo-300 rounded-full">
                    <span className="flex justify-center">
                        <img
                            className="h-8 w-8 my-0 mx-4 scale-x-[-1]"
                            src={FlipArrowRight ?? ''}
                            alt="Flip Card"
                        />
                    </span>
                </button>

                <section className="flex-col items-center justify-center checklist-container justify-center w-[100%] width-full mt-[20px]">
                    <VCVerificationCheckWithText loading={loading} />
                    <section>
                        {verification.map(item => (
                            <VCVerificationPill
                                key={item.check}
                                status={item.status}
                                message={item.message}
                                details={item.details}
                            />
                        ))}
                    </section>
                </section>
            </section>
        </div>
    );
};

export default VCDisplayBackFace;
