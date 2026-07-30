import React from 'react';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { ExternalLink, ShieldCheck } from 'lucide-react';
import { useGetSkillFrameworkById } from 'learn-card-base';

type AlignmentsRowProps = {
    url?: string;
    name?: string;
    framework?: string;
    code?: string;
    description?: string;
    verified?: boolean;
};

const ensureAbsoluteUrl = (raw?: string): string | undefined => {
    if (!raw) return undefined;

    if (/^https?:\/\//i.test(raw)) return raw;

    return `https://${raw}`;
};

const AlignmentRow: React.FC<AlignmentsRowProps> = ({
    url,
    name,
    framework,
    code,
    description,
    verified,
}) => {
    const { data: frameworkData } = useGetSkillFrameworkById(framework);

    const absoluteUrl = ensureAbsoluteUrl(url);
    const frameworkName = frameworkData?.framework?.name ?? framework;
    const title = name || code || 'Framework alignment';

    const handleOpen = async () => {
        if (!absoluteUrl) return;

        if (Capacitor?.isNativePlatform()) {
            await Browser.open({ url: absoluteUrl });
        } else {
            window.open(absoluteUrl, '_blank');
        }
    };

    return (
        <div
            className={`flex flex-col gap-[6px] font-poppins w-full rounded-[15px] border px-[14px] py-[12px] ${
                verified
                    ? 'bg-emerald-50 border-emerald-100'
                    : 'bg-grayscale-50 border-grayscale-200'
            }`}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                    <span className="text-[14px] font-semibold text-grayscale-900 leading-snug text-left">
                        {title}
                    </span>
                    {verified && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-100 px-[6px] py-[2px] text-[10px] font-medium text-emerald-700 shrink-0">
                            <ShieldCheck className="w-3 h-3" />
                            Verified
                        </span>
                    )}
                </div>
                {absoluteUrl && (
                    <button
                        type="button"
                        onClick={handleOpen}
                        className="text-grayscale-400 hover:text-grayscale-700 transition-colors shrink-0"
                        aria-label="Open alignment source"
                    >
                        <ExternalLink className="w-4 h-4" />
                    </button>
                )}
            </div>

            {(code || frameworkName) && (
                <div className="flex flex-wrap items-center gap-[6px]">
                    {code && (
                        <span className="inline-flex items-center rounded-full bg-grayscale-100 border border-grayscale-200 px-[8px] py-[2px] text-[11px] font-medium text-grayscale-700">
                            {code}
                        </span>
                    )}
                    {frameworkName && (
                        <span className="text-[11px] text-grayscale-500">{frameworkName}</span>
                    )}
                </div>
            )}

            {description && (
                <p className="text-[12px] text-grayscale-600 leading-relaxed line-clamp-3 text-left">
                    {description}
                </p>
            )}
        </div>
    );
};

export default AlignmentRow;
