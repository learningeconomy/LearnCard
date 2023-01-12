import React, { useLayoutEffect, useState, useEffect, useRef } from 'react';
import fitty, { FittyInstance, FittyOptions } from 'fitty';

import { VCVerificationCheckWithSpinner } from '../VCVerificationCheck/VCVerificationCheck';
import AwardRibbon from '../svgs/AwardRibbon';

import { VC, VerificationItem, Profile } from '@learncard/types';
import { getInfoFromCredential } from '../../helpers/credential.helpers';
// import { initLearnCard } from '@learncard/core';

type VerifiableCredentialInfo = {
    title: string;
    description: string;
    image?: string;
    skills: { name: string; subskills?: string[] };
    // skills: SkillType[];
    // subskills: SubskillType[];
    issuedToUserThumb: React.ReactNode;
    issuedToUserName: string;
    issuedByName: string;
};

export type VCDisplayCard2Props = {
    // credentialInfo?: VerifiableCredentialInfo;
    credential: VC;
    verification: VerificationItem[];
    issueeOverride?: Profile;
    issuerOverride?: Profile;
};

export const VCDisplayCard2: React.FC<VCDisplayCard2Props> = ({
    // credentialInfo,
    credential,
    verification,
    issueeOverride,
    issuerOverride,
}) => {
    const {
        title,
        createdAt,
        issuer: _issuer,
        issuee: _issuee,
        credentialSubject,
    } = getInfoFromCredential(credential);

    const [isFront, setIsFront] = useState(true);
    const [headerHeight, setHeaderHeight] = useState(44); // 44 is the height if the header is one line
    const [headerWidth, setHeaderWidth] = useState(0);

    const headerRef = useRef<HTMLHeadingElement>(null);

    useLayoutEffect(() => {
        // Needs a small setTimeout otherwise it'll be wrong sometimes with multiline header.
        //   Probably because of the interaction with FitText
        setTimeout(() => {
            setHeaderHeight(headerRef.current?.clientHeight ?? 44);
            setHeaderWidth(headerRef.current?.clientWidth ?? 0);
        }, 10);
    });

    let verificationStatusText = verification.length === 0 ? '...' : 'Success';
    verification.forEach(v => {
        if (
            (v.status === 'Error' && verificationStatusText === 'Success') ||
            v.status === 'Failed'
        ) {
            verificationStatusText = v.status;
        }
    });

    let statusColor = '';
    switch (verificationStatusText) {
        case '...':
        case 'Sample Preview':
            statusColor = '#828282';
            break;
        case 'Success':
            statusColor = '#39B54A';
            break;
        case 'Failed':
            statusColor = '#D01012';
            break;
        case 'Error':
            statusColor = '#FFBD06';
            break;
        default:
            statusColor = '#000000';
    }

    return (
        <section className="font-mouse flex flex-col items-center border-solid border-[5px] border-white h-[690px] rounded-[30px] overflow-visible z-10 max-w-[400px] relative bg-white">
            <RibbonEnd
                side="left"
                className="absolute left-[-30px] top-[50px] z-0"
                height={(headerHeight + 10).toString()}
            />
            <RibbonEnd
                side="right"
                className="absolute right-[-30px] top-[50px] z-0"
                height={(headerHeight + 10).toString()}
            />

            <h1
                ref={headerRef}
                className="leading-[100%] px-[20px] py-[10px] overflow-visible mt-[40px] absolute text-center text-[#18224E] bg-white border-y-[5px] border-[#EEF2FF] shadow-bottom text-shadow w-[calc(100%_+_16px)] rounded-t-[8px] text-[32px]"
                style={{ wordBreak: 'break-word' }}
            >
                {!isFront && (
                    <button
                        className="absolute left-[-22px]"
                        style={{ top: `${headerHeight / 2 - 18}px` }}
                        type="button"
                        onClick={() => setIsFront(true)}
                    >
                        {/*
                        <img
                            src={LeftArrow}
                            alt="Back"
                            className="h-[36px] w-[36px] bg-[#2F80ED] rounded-[40px] px-[4px] border-white border-[3px] border-solid"
                        />
                        */}
                    </button>
                )}
                <FitText
                    text={title ?? ''}
                    width={((headerWidth ?? 290) - 40).toString()}
                    options={{ maxSize: 32, minSize: 20, multiLine: true }}
                />
            </h1>
            <div
                className="flex flex-col items-center gap-[20px] bg-[#353E64] grow w-full rounded-t-[30px] rounded-b-[20px] pb-[30px] overflow-scroll scrollbar-hide"
                style={{ paddingTop: headerHeight + 70 }}
            >
                vc info content
                {/*  
                {isFront && <VerifiableCredentialFrontDetails credential={credentialInfo} />}
                {!isFront && (
                    <VerifiableCredentialBackDetails
                        credentialInfo={credentialInfo}
                        verificationResults={verificationResults}
                    />
                )}*/}
            </div>
            <footer className="w-full flex justify-between p-[5px] mt-[5px]">
                <VCVerificationCheckWithSpinner spinnerSize="40px" size={'32px'} loading={false} />
                <div className="font-montserrat flex flex-col items-center justify-center text-[12px] font-[700] leading-[15px]">
                    <span className="text-[#4F4F4F]">Verified Credential</span>
                    <span className="vc-status-text" style={{ color: statusColor }}>
                        {verificationStatusText}
                    </span>
                </div>
                <button
                    type="button"
                    className={`bg-[#6366F1] rounded-[20px] h-[40px] w-[40px] flex items-center justify-center`}
                    onClick={() => setIsFront(!isFront)}
                >
                    <AwardRibbon />
                </button>
            </footer>
        </section>
    );
};

const RibbonEnd: React.FC<{ side: 'left' | 'right'; className?: string; height?: string }> = ({
    side,
    className = '',
    height = '64',
}) => {
    const halfHeight = parseInt(height) / 2;
    return (
        <svg
            className={className}
            width="30"
            height={height}
            viewBox={`0 0 30 ${height}`}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ transform: `scaleX(${side === 'left' ? '1' : '-1'})` }}
        >
            <g filter="url(#filter0_d_4620_22659)">
                <path d={`M0 0H30V${height}H0L6.36364 ${halfHeight}L0 0Z`} fill="white" />
                <path
                    d={`M3.08593 2.5H27.5V${height}H3.08593L8.80922 ${halfHeight}L8.91926 30L8.80922 29.4812L3.08593 2.5Z`}
                    stroke="#EEF2FF"
                    strokeWidth="5"
                />
            </g>
            <defs>
                <filter
                    id="filter0_d_4620_22659"
                    x="0"
                    y="0"
                    width="30"
                    height={height}
                    filterUnits="userSpaceOnUse"
                    colorInterpolationFilters="sRGB"
                >
                    <feFlood floodOpacity="0" result="BackgroundImageFix" />
                    <feColorMatrix
                        in="SourceAlpha"
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                        result="hardAlpha"
                    />
                    <feOffset dy="4" />
                    <feComposite in2="hardAlpha" operator="out" />
                    <feColorMatrix
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
                    />
                    <feBlend
                        mode="normal"
                        in2="BackgroundImageFix"
                        result="effect1_dropShadow_4620_22659"
                    />
                    <feBlend
                        mode="normal"
                        in="SourceGraphic"
                        in2="effect1_dropShadow_4620_22659"
                        result="shape"
                    />
                </filter>
            </defs>
        </svg>
    );
};

type FitTextProps = {
    text: string;
    width: string; // Must be set for this to work
    options?: FittyOptions;
    textClassName?: string;
};

const FitText: React.FC<FitTextProps> = ({ text, width, options, textClassName = '' }) => {
    const textRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        let fit: FittyInstance;
        if (textRef.current) fit = fitty(textRef.current, options);

        return () => fit?.unsubscribe();
    }, [textRef.current]);

    return (
        <div style={{ width }} className="text-center">
            <span ref={textRef} className={textClassName}>
                {text}
            </span>
        </div>
    );
};

export default VCDisplayCard2;
