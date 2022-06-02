import React from 'react';
import { VCDisplayCardProps } from '../../types';
import FatArrow from '../../assets/images/icon.green.fat-arrow.png';
import FlipArrowRight from '../../assets/images/ArrowArcRight.svg';
import { VCVerificationCheckWithText } from '../VCVerificationCheck/VCVerificationCheck';

const VCDisplayFrontFace: React.FC<VCDisplayCardProps> = ({
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

    return (
        <div
            className={`flex overflow-hidden flex-col items-center justify-between relative max-w-[400px] h-[100%] max-h-[600px] min-h-[600px] p-7 rounded-3xl shadow-3xl bg-emerald-700 vc-display-card-full-container ${className}`}
        >
            <section className="bg-white rounded-bl-[50%] rounded-br-[50%] absolute top-0 w-[110%] h-[77%]"></section>
            <section className="flex flex-col items-center justify-center z-10 text-center">
                <section className="max-w-[100px] max-h-[100px]">
                    <img
                        className="h-full w-full object-cover"
                        src={credentialAchievementImage ?? ''}
                        alt="Credential Achievement Image"
                    />
                </section>

                <section className="flex flex-row items-start justify-between w-full line-clamp-2">
                    <div className="flex flex-row items-start justify-start line-clamp-2 py-4 ">
                        <h3
                            className="text-2xl line-clamp-2 tracking-wide leading-snug text-center"
                            data-testid="vc-thumbnail-title"
                        >
                            {title ?? ''}
                        </h3>
                    </div>
                </section>

                <section className="flex flex-row items-center justify-center mt-2 w-full my-2">
                    <div className="flex items-center justify-center h-16 w-16 shadow-3xl rounded-full overflow-hidden bg-white">
                        <div className="flex flex-row items-center justify-center rounded-full overflow-hidden bg-white w-10/12 h-5/6">
                            <img
                                className="w-4/6 h-4/6 object-cover"
                                src={issuerImage}
                                alt="Issuer image"
                            />
                        </div>
                    </div>
                    <img className="h-8 w-8 my-0 mx-4" src={FatArrow ?? ''} alt="fat arrow icon" />
                    <div className="flex items-center justify-center h-16 w-16 shadow-3xl rounded-full overflow-hidden bg-white">
                        <div className="flex flex-row items-center justify-center h-full w-full rounded-full border-solid border-4 border-white overflow-hidden bg-white">
                            <img
                                className="h-full w-full object-cover"
                                src={issueeImage}
                                alt="Issuee image"
                            />
                        </div>
                    </div>
                </section>

                <div className="w-full mt-2">
                    <p
                        className="text-sm font-light text-center line-clamp-2"
                        data-testid="vc-thumbnail-createdAt"
                    >
                        Issued to <span className="font-bold">{issuee?.name}</span> on{' '}
                        {createdAt ?? ''} by <span className="font-bold"> {issuer?.name}</span>
                    </p>
                </div>

                <button className="cursor-alias bg-white my-3 border-2 text-indigo-500 font-semibold py-2 px-4 border border-indigo-300 rounded-full">
                    <span className="flex justify-center">
                        <p className="flex items-center">Details</p>
                        <img
                            className="h-8 w-8 my-0 mx-4"
                            src={FlipArrowRight ?? ''}
                            alt="Flip Card"
                        />
                    </span>
                </button>
            </section>

            <div className="flex items-center justify-center w-full">
                <VCVerificationCheckWithText />
            </div>
        </div>
    );
};

export default VCDisplayFrontFace;
