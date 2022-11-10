import React from 'react';
import { VCDisplayCardProps } from '../../types';
import { VCVerificationCheckWithText } from '../VCVerificationCheck/VCVerificationCheck';
import VCVerificationPill from '../VCVerificationPill/VCVerificationPill';
import FlipArrowRight from '../../assets/images/ArrowArcRight.svg';
import { getNameFromProfile } from '../../helpers/credential.helpers';

export const VCDisplayBackFace: React.FC<VCDisplayCardProps> = ({
    issuer,
    credentialSubject,
    className = '',
    loading,
    verification = [],
    handleClick,
    overrideDetailsComponent,
}) => {
    const descriptionText = credentialSubject?.achievement?.description;
    const criteriaText = credentialSubject?.achievement?.criteria?.narrative;
    const issuerUrl = typeof issuer === 'object' ? issuer.url : '';
    const issuerName = getNameFromProfile(issuer ?? '');

    console.log('//overrideDetailsComponent', overrideDetailsComponent)

    const defaultDetails = (
        <>
            <div className="width-full">
                <h6 className="line-clamp-1 text-grayscale-900 font-bold uppercase text-xs tracking-wider subpixel-antialiased">
                    Description
                </h6>
                <p className="line-clamp-3 subpixel-antialiased text-grayscale-600 text-[14px] lc-line-clamp">
                    {descriptionText}
                </p>
            </div>

            <div className="width-full mt-[10px]">
                <h6 className="line-clamp-1 text-grayscale-900 font-bold uppercase text-xs tracking-wider  subpixel-antialiased">
                    Criteria
                </h6>
                <p className="line-clamp-3 subpixel-antialiased text-grayscale-600 text-[14px] lc-line-clamp">
                    {criteriaText}
                </p>
            </div>

            <div className="width-full mt-[10px] line-clamp-1 overflow-hidden vc-issuer-name-info">
                <h6 className="line-clamp-1 text-grayscale-900 font-bold uppercase text-xs tracking-wider subpixel-antialiased">
                    Issuer
                </h6>
                <p className="max-w-[344px] line-clamp-1 subpixel-antialiased text-grayscale-600 text-[14px] block overflow-ellipsis break-all">
                    {issuerName}
                </p>
            </div>

            {issuerUrl && (
                <p className="text-indigo-500 font-bold text-xs width-full text-center mt-8">
                    {issuerUrl}
                </p>
            )}
        </>
    );

    const renderDetails = overrideDetailsComponent ? overrideDetailsComponent : defaultDetails;

    return (
        <div
            className={`z-[9] vc-display-main-card-back flex overflow-hidden flex-col items-center justify-between relative max-w-[400px] h-[100%] max-h-[1100px] min-h-[600px] p-7 rounded-3xl shadow-3xl bg-emerald-700 vc-display-card-full-container ${className}`}
        >
            <section className="flex max-h-[150px] items-end bg-white rounded-bl-[50%] rounded-br-[50%] absolute top-0 w-[110%] h-[55%] min-h-[400px]"></section>
            <section className="flex flex-col items-center justify-center w-full z-10 text-left credential-details-container max-w-[100%] relative">
                <section className="flex flex-row items-start justify-start w-full line-clamp-2">
                    <h3
                        className="text-2xl line-clamp-2 tracking-wide leading-snug text-left text-emerald-700"
                        data-testid="vc-credential-details-title tracking-wide subpixel-antialiased"
                    >
                        Credential Details
                    </h3>
                </section>

                <section className="flex flex-col mt-2 w-full my-2 min-h-[200px] credential-details-info">
                    {renderDetails}
                </section>

                <div className="w-full mt-2"></div>

                <button
                    onClick={handleClick}
                    className="vc-flip-btn bg-white my-3 border-2 text-indigo-500 font-semibold py-2 px-4 shadow-3xl rounded-full"
                >
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
