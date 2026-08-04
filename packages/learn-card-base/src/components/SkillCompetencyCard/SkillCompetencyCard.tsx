import React, { useState } from 'react';

export type SkillCompetencyLevel = {
    value: string | number | boolean;
    label?: string;
    scale?: string[];
    resultType?: string;
};

export type SkillCompetencyAlignment = {
    targetType?: string | string[];
    targetUrl?: string;
};

export type SkillCompetencyCardProps = {
    name: string;
    frameworkName?: string;
    code?: string;
    description?: string;
    levels?: SkillCompetencyLevel[];
    sourceUrl?: string;
    onOpenSource?: () => void | Promise<void>;
    footer?: React.ReactNode;
};

const SKILL_COMPETENCY_TARGET_TYPES = new Set([
    'cfitem',
    'ceasn:competency',
    'ceterms:competency',
    'competency',
    'skill',
]);

const SKILL_TARGET_URL_PATTERN = /\/frameworks\/[^/]+\/skills\//i;

/**
 * Classifies only explicit skill/competency alignments so occupations, programs, and
 * other alignment types can keep their own display treatment.
 */
export const isSkillCompetencyAlignment = ({
    targetType,
    targetUrl,
}: SkillCompetencyAlignment): boolean => {
    const targetTypes = Array.isArray(targetType) ? targetType : targetType ? [targetType] : [];

    return (
        targetTypes.some(type => SKILL_COMPETENCY_TARGET_TYPES.has(type.trim().toLowerCase())) ||
        SKILL_TARGET_URL_PATTERN.test(targetUrl ?? '')
    );
};

const selectedScaleIndex = (scaleItems: string[], value: SkillCompetencyLevel['value']): number => {
    const normalizedValue = String(value).trim().toLowerCase();

    return scaleItems.findIndex(item => item.trim().toLowerCase() === normalizedValue);
};

const SCALE_LEVEL_COLORS = [
    {
        fillClass: 'bg-emerald-600',
        textClass: 'text-emerald-600',
    },
    {
        fillClass: 'bg-amber-600',
        textClass: 'text-amber-700',
    },
    {
        fillClass: 'bg-red-500',
        textClass: 'text-red-700',
    },
] as const;

const colorForScaleIndex = (scaleItems: string[], activeScaleIndex: number) => {
    const rankFromHighest =
        activeScaleIndex >= 0 ? Math.max(scaleItems.length - 1 - activeScaleIndex, 0) : 0;

    return SCALE_LEVEL_COLORS[Math.min(rankFromHighest, SCALE_LEVEL_COLORS.length - 1)];
};

const SkillIcon: React.FC = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
        aria-hidden="true"
    >
        <path d="M9.5 3.5h5v4h4v5h-4v4h-5v-4h-4v-5h4z" />
        <path d="M7 20h10" />
    </svg>
);

const ExternalLinkIcon: React.FC = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
        aria-hidden="true"
    >
        <path d="M15 3h6v6" />
        <path d="M10 14 21 3" />
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </svg>
);

const SkillCompetencyLevelDisplay: React.FC<{
    level: SkillCompetencyLevel;
}> = ({ level }) => {
    const [scaleOpen, setScaleOpen] = useState(false);

    const scaleItems = level.scale ?? [];
    const label = level.label ?? 'Competency Level';
    const activeScaleIndex = selectedScaleIndex(scaleItems, level.value);
    const filledScaleIndex = activeScaleIndex >= 0 ? activeScaleIndex : scaleItems.length - 1;
    const scaleColor = colorForScaleIndex(scaleItems, activeScaleIndex);

    return (
        <div className="space-y-3">
            <div className="flex items-baseline justify-between gap-3">
                <p className="min-w-0 text-base font-semibold text-grayscale-900">
                    Level: <span className={scaleColor.textClass}>{String(level.value)}</span>
                </p>
                {scaleItems.length > 0 && (
                    <button
                        type="button"
                        onClick={() => setScaleOpen(current => !current)}
                        aria-expanded={scaleOpen}
                        className="shrink-0 text-sm font-semibold text-grayscale-500 hover:text-grayscale-800 transition-colors"
                    >
                        {scaleOpen ? 'Hide Scale' : 'View Scale'}
                    </button>
                )}
            </div>

            {level.resultType && (
                <span className="text-xs text-grayscale-400">[{level.resultType}]</span>
            )}

            {scaleItems.length > 0 && (
                <div className="space-y-2">
                    <div
                        className="grid h-2 gap-1 overflow-hidden rounded-full"
                        style={{
                            gridTemplateColumns: `repeat(${scaleItems.length}, minmax(0, 1fr))`,
                        }}
                        aria-label={`${label} scale`}
                    >
                        {scaleItems.map((item, itemIndex) => (
                            <div
                                key={`${label}-${item}-${itemIndex}`}
                                className={
                                    itemIndex <= filledScaleIndex
                                        ? scaleColor.fillClass
                                        : 'bg-grayscale-100'
                                }
                                aria-label={item}
                            />
                        ))}
                    </div>

                    {scaleOpen && (
                        <div
                            className="grid gap-1 text-center"
                            style={{
                                gridTemplateColumns: `repeat(${scaleItems.length}, minmax(0, 1fr))`,
                            }}
                        >
                            {scaleItems.map((item, itemIndex) => (
                                <span
                                    key={`${label}-${item}-${itemIndex}`}
                                    className={`min-w-0 px-1 text-xs font-semibold leading-tight ${
                                        itemIndex === activeScaleIndex
                                            ? scaleColor.textClass
                                            : 'text-grayscale-500'
                                    }`}
                                >
                                    {item}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

/**
 * Canonical display for a skill or competency across CLR, course, and credential views.
 */
export const SkillCompetencyCard: React.FC<SkillCompetencyCardProps> = ({
    name,
    frameworkName,
    code,
    description,
    levels = [],
    sourceUrl,
    onOpenSource,
    footer,
}) => {
    const sourceAction = sourceUrl ? (
        onOpenSource ? (
            <button
                type="button"
                onClick={event => {
                    event.stopPropagation();
                    void onOpenSource();
                }}
                className="shrink-0 text-grayscale-400 hover:text-grayscale-700 transition-colors"
                aria-label="Open skill or competency source"
            >
                <ExternalLinkIcon />
            </button>
        ) : (
            <a
                href={sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 text-grayscale-400 hover:text-grayscale-700 transition-colors"
                aria-label="Open skill or competency source"
                onClick={event => event.stopPropagation()}
            >
                <ExternalLinkIcon />
            </a>
        )
    ) : null;

    return (
        <div
            className="w-full space-y-3 rounded-xl border border-grayscale-200 bg-grayscale-50 px-3.5 py-3 font-poppins"
            data-testid="skill-competency-card"
        >
            <div className="flex items-start justify-between gap-2">
                <div className="inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-full border border-grayscale-200 bg-white px-3 py-1">
                    <span className="shrink-0 text-grayscale-700">
                        <SkillIcon />
                    </span>
                    <span className="min-w-0 break-words text-xs font-semibold leading-snug text-grayscale-900">
                        {name}
                    </span>
                </div>
                {sourceAction}
            </div>

            {(frameworkName || code) && (
                <p className="text-xs font-medium text-grayscale-500">
                    {frameworkName}
                    {frameworkName && code && <span aria-hidden="true"> • </span>}
                    {code}
                </p>
            )}

            {description && (
                <p className="text-sm leading-relaxed text-grayscale-600">{description}</p>
            )}

            {levels.length > 0 && (
                <div className="space-y-4 border-t border-grayscale-100 pt-4">
                    {levels.map((level, index) => (
                        <div
                            key={`${level.label ?? 'level'}-${String(level.value)}-${index}`}
                            className="border-t border-grayscale-100 pt-4 first:border-t-0 first:pt-0"
                        >
                            <SkillCompetencyLevelDisplay level={level} />
                        </div>
                    ))}
                </div>
            )}

            {footer}
        </div>
    );
};

export default SkillCompetencyCard;
