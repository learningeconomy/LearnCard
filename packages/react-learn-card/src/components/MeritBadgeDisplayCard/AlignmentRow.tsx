import React from 'react';

type AlignmentsRowProps = {
    url?: string;
    name?: string;
    framework?: string;
    code?: string;
    description?: string;
    verified?: boolean;
};

const ExternalLinkIcon: React.FC = () => (
    <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M15 3h6v6" />
        <path d="M10 14 21 3" />
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </svg>
);

const ShieldCheckIcon: React.FC = () => (
    <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
        <path d="m9 12 2 2 4-4" />
    </svg>
);

const AlignmentRow: React.FC<AlignmentsRowProps> = ({
    url,
    name,
    framework,
    code,
    description,
    verified,
}) => {
    const title = name || code || 'Framework alignment';

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
                    <span className="text-[14px] font-semibold text-grayscale-900 leading-snug">
                        {title}
                    </span>
                    {verified && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-100 px-[6px] py-[2px] text-[10px] font-medium text-emerald-700 shrink-0">
                            <ShieldCheckIcon />
                            Verified
                        </span>
                    )}
                </div>
                {url && (
                    <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="text-grayscale-400 hover:text-grayscale-700 transition-colors shrink-0"
                        aria-label="Open alignment source"
                    >
                        <ExternalLinkIcon />
                    </a>
                )}
            </div>

            {(code || framework) && (
                <div className="flex flex-wrap items-center gap-[6px]">
                    {code && (
                        <span className="inline-flex items-center rounded-full bg-grayscale-100 border border-grayscale-200 px-[8px] py-[2px] text-[11px] font-medium text-grayscale-700">
                            {code}
                        </span>
                    )}
                    {framework && (
                        <span className="text-[11px] text-grayscale-500">{framework}</span>
                    )}
                </div>
            )}

            {description && (
                <p className="text-[12px] text-grayscale-600 leading-relaxed">{description}</p>
            )}
        </div>
    );
};

export default AlignmentRow;
