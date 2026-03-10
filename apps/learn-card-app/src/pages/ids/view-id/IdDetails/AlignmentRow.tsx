import React from 'react';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import CaretRightFilled from 'apps/learn-card-app/src/components/svgs/CaretRightFilled';
import { useGetSkillFrameworkById } from 'learn-card-base';

type AlignmentsRowProps = {
    url?: string;
    name?: string;
    framework?: string;
};
const ensureAbsoluteUrl = (raw?: string): string | undefined => {
    if (!raw) return undefined;

    if (/^https?:\/\//i.test(raw)) return raw;

    return `https://${raw}`;
};

const AlignmentRow: React.FC<AlignmentsRowProps> = ({ url, name, framework }) => {
    const { data: frameworkData } = useGetSkillFrameworkById(framework);

    const absoluteUrl = ensureAbsoluteUrl(url);

    const handleOpen = async () => {
        if (!absoluteUrl) return;

        if (Capacitor?.isNativePlatform()) {
            await Browser.open({ url: absoluteUrl });
        } else {
            window.open(absoluteUrl, '_blank');
        }
    };

    return (
        <div className="flex flex-col gap-[5px] font-poppins text-[12px] bg-[rgb(219,234,254)] rounded-[15px] border-b-[1px] border-grayscale-200 border-solid w-full p-[10px] last:border-0">
            <h1 className="text-grayscale-900 font-semibold uppercase">
                {frameworkData?.framework?.name ?? framework}
            </h1>
            {/* this might need to change to a link depends on how it comes back after the api call */}
            <button className="flex items-center justify-between" onClick={handleOpen}>
                <span className="text-left text-grayscale-900">{name}</span>
                <CaretRightFilled />
            </button>
        </div>
    );
};

export default AlignmentRow;
