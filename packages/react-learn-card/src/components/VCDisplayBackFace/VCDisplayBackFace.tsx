import React from 'react';
import { VCDisplayCardProps } from '../../types';
import FatArrow from '../../assets/images/icon.green.fat-arrow.png';
import FlipArrowRight from '../../assets/images/ArrowArcRight.svg';

const VCDisplayBackFace: React.FC<VCDisplayCardProps> = ({
    title,
    createdAt,
    issuer,
    issuee,
    credentialSubject,
    className = '',
}) => {
    const credentialAchievementImage = credentialSubject?.achievement?.image;
    const issuerImage = issuer?.image;
    const issueeImage = issuee?.image;

    console.log('////credentialSubject', credentialSubject);

    // credentialSubject: {
    //     "type": "AchievementSubject",
    //     "id": "did:key:123",
    //     "achievement": {
    //       "type": "Achievement",
    //       "name": "Our Wallet Passed JFF Plugfest #1 2022",
    //       "description": "This wallet can display this Open Badge 3.0",
    //       "criteria": {
    //         "type": "Criteria",
    //         "narrative": "The first cohort of the JFF Plugfest 1 in May/June of 2021 collaborated to push interoperability of VCs in education forward.",
    //       },
    //       "image": "https://w3c-ccg.github.io/vc-ed/plugfest-1-2022/images/plugfest-1-badge-image.png",
    //     },

    const descriptionText = credentialSubject?.achievement?.description;
    const criteriaText = credentialSubject?.achievement?.criteria?.narrative;
    const issuerUrl = issuer?.url;

    return (
        <div
            className={`flex overflow-hidden flex-col items-center justify-between relative max-w-[400px] h-[100%] max-h-[600px] min-h-[600px] p-7 rounded-3xl shadow-3xl bg-emerald-700 vc-display-card-full-container ${className}`}
        >
            <section className="bg-white rounded-bl-[50%] rounded-br-[50%] absolute top-0 w-[110%] h-[55%] min-h-[400px]"></section>
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
                        <h6 className="text-grayscale-900 font-bold uppercase text-xs tracking-wider subpixel-antialiased">
                            Description
                        </h6>
                        <p className="subpixel-antialiased text-grayscale-600 ">
                            {descriptionText}
                        </p>
                    </div>

                    <div className="width-full mt-7">
                        <h6 className="text-grayscale-900 font-bold uppercase text-xs tracking-wider  subpixel-antialiased">
                            Criteria
                        </h6>
                        <p className="subpixel-antialiased text-grayscale-600 ">{criteriaText}</p>
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
            </section>
        </div>
    );
};

export default VCDisplayBackFace;
