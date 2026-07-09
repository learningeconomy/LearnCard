import React, { useLayoutEffect, useRef } from 'react';
import { IonIcon } from '@ionic/react';
import { ribbonOutline, peopleOutline } from 'ionicons/icons';

import { getTimeOfDayGreeting, getFirstName } from '../helpers/greeting';

type HeaderStats = {
    credentials: number;
    skills: number;
    contacts: number;
};

type ExperienceDuration = {
    years?: number | null;
    months?: number | null;
} | null;

type SkillPill = {
    id: string;
    label: string;
};

type DashboardHeaderCardProps = {
    brandName: string;
    displayName: string;
    profileImage: string;
    heroImage?: string;
    profileRole?: string;
    shortBio?: string;
    stats?: HeaderStats;
    professionalTitle?: string;
    experience?: ExperienceDuration;
    skills?: SkillPill[];
    onSkillPillClick?: () => void;
    onAvatarClick?: () => void;
    onCredentialsClick?: () => void;
    onContactsClick?: () => void;
    topRightAction?: React.ReactNode;
    roleSwitcher?: React.ReactNode;
};

const getInitials = (name: string): string => {
    const trimmed = name.trim();
    if (!trimmed) return '?';
    const parts = trimmed.split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const capitalize = (value: string): string => {
    const trimmed = value.trim();
    if (!trimmed) return '';
    return trimmed[0].toUpperCase() + trimmed.slice(1);
};

type Descriptor = { text: string; emphasis: boolean } | null;

const resolveDescriptor = (professionalTitle?: string, shortBio?: string): Descriptor => {
    const title = professionalTitle?.trim();
    if (title) return { text: title, emphasis: true };
    const bio = shortBio?.trim();
    if (bio) return { text: bio, emphasis: false };
    return null;
};

const formatExperience = (experience?: ExperienceDuration): string | null => {
    if (!experience) return null;
    const years = experience.years ?? 0;
    const months = experience.months ?? 0;
    if (years > 0) {
        return `${years} ${years === 1 ? 'yr' : 'yrs'} experience`;
    }
    if (months > 0) {
        return `${months} ${months === 1 ? 'month' : 'months'} experience`;
    }
    return null;
};

type StatMetric = {
    key: string;
    icon: string;
    value: number;
    label: string;
    onClick?: () => void;
};

const buildMetrics = (
    stats: HeaderStats | undefined,
    onCredentialsClick?: () => void,
    onContactsClick?: () => void
): StatMetric[] => {
    if (!stats) return [];
    const metrics: StatMetric[] = [];
    if (stats.credentials > 0)
        metrics.push({
            key: 'credentials',
            icon: ribbonOutline,
            value: stats.credentials,
            label: stats.credentials === 1 ? 'Credential' : 'Credentials',
            onClick: onCredentialsClick,
        });
    if (stats.contacts > 0)
        metrics.push({
            key: 'contacts',
            icon: peopleOutline,
            value: stats.contacts,
            label: stats.contacts === 1 ? 'Contact' : 'Contacts',
            onClick: onContactsClick,
        });
    return metrics;
};

const MAX_SKILL_PILLS = 3;

const DashboardHeaderCard: React.FC<DashboardHeaderCardProps> = ({
    brandName,
    displayName,
    profileImage,
    heroImage,
    profileRole,
    shortBio,
    stats,
    professionalTitle,
    experience,
    skills,
    onSkillPillClick,
    onAvatarClick,
    onCredentialsClick,
    onContactsClick,
    topRightAction,
    roleSwitcher,
}) => {
    const initials = getInitials(displayName);
    const firstName = getFirstName(displayName);
    const greeting = getTimeOfDayGreeting();
    const descriptor = resolveDescriptor(professionalTitle, shortBio);
    const experienceLine = formatExperience(experience);
    const metrics = buildMetrics(stats, onCredentialsClick, onContactsClick);
    const roleFallback = profileRole?.trim() ? capitalize(profileRole) : null;
    const visibleSkills = (skills ?? []).slice(0, MAX_SKILL_PILLS);
    const overflowSkillCount = (skills?.length ?? 0) - visibleSkills.length;

    const metricsRef = useRef<HTMLDivElement>(null);
    useLayoutEffect(() => {
        const row = metricsRef.current;
        if (!row) return;
        const fitMetrics = () => {
            const items = Array.from(row.querySelectorAll<HTMLElement>('[data-metric]'));
            items.forEach(item => (item.style.display = ''));
            const available = row.clientWidth;
            let fit = items.length;
            for (let i = 0; i < items.length; i++) {
                if (items[i].offsetLeft + items[i].offsetWidth > available + 0.5) {
                    fit = i;
                    break;
                }
            }
            fit = Math.max(1, fit);
            items.forEach((item, i) => (item.style.display = i < fit ? '' : 'none'));
        };
        fitMetrics();
        const observer = new ResizeObserver(fitMetrics);
        observer.observe(row);
        return () => observer.disconnect();
    }, [metrics.length]);

    return (
        <section className="relative bg-white rounded-[20px] shadow-soft-bottom border border-grayscale-200 animate-fade-in-up overflow-hidden">
            {heroImage && (
                <div
                    className="absolute inset-x-0 top-0 h-[100px] pointer-events-none"
                    style={{
                        backgroundImage: `url(${heroImage})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/70 to-white" />
                </div>
            )}

            <div className="relative p-5">
                <div className="flex items-start gap-4">
                    <div className="shrink-0">
                        {onAvatarClick ? (
                            <button
                                type="button"
                                onClick={onAvatarClick}
                                aria-label={`Open your ${brandName}`}
                                className="rounded-full active:scale-[0.97] transition-transform"
                            >
                                {profileImage ? (
                                    <img
                                        src={profileImage}
                                        alt={displayName || 'Profile'}
                                        className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-soft-bottom"
                                    />
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-grayscale-100 border-2 border-white shadow-soft-bottom flex items-center justify-center text-grayscale-700 font-semibold text-lg">
                                        {initials}
                                    </div>
                                )}
                            </button>
                        ) : profileImage ? (
                            <img
                                src={profileImage}
                                alt={displayName || 'Profile'}
                                className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-soft-bottom"
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-grayscale-100 border-2 border-white shadow-soft-bottom flex items-center justify-center text-grayscale-700 font-semibold text-lg">
                                {initials}
                            </div>
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-semibold text-grayscale-900 leading-tight break-words">
                            {greeting}, {firstName}.
                        </h1>
                        {(descriptor || roleSwitcher || roleFallback) && (
                            <div className="mt-1.5 flex items-center gap-2 min-w-0">
                                {descriptor && (
                                    <p
                                        className={`min-w-0 truncate text-sm leading-snug ${
                                            descriptor.emphasis
                                                ? 'font-medium text-grayscale-700'
                                                : 'text-grayscale-600'
                                        }`}
                                    >
                                        {descriptor.text}
                                    </p>
                                )}
                                {(roleSwitcher || roleFallback) && (
                                    <div className="shrink-0">
                                        {roleSwitcher ??
                                            (roleFallback && (
                                                <span className="inline-flex px-2 py-0.5 rounded-full bg-grayscale-100 text-grayscale-700 text-xs font-medium">
                                                    {roleFallback}
                                                </span>
                                            ))}
                                    </div>
                                )}
                            </div>
                        )}
                        {experienceLine && (
                            <p className="mt-1 text-xs text-grayscale-500 truncate">
                                {experienceLine}
                            </p>
                        )}
                    </div>

                    {topRightAction && <div className="shrink-0">{topRightAction}</div>}
                </div>

                {metrics.length > 0 && (
                    <div ref={metricsRef} className="mt-3 flex items-center gap-2 overflow-hidden">
                        {metrics.map((metric, i) => (
                            <span
                                key={metric.key}
                                data-metric
                                className="flex items-center gap-2 shrink-0 whitespace-nowrap"
                            >
                                {i > 0 && <span className="text-grayscale-300 select-none">·</span>}
                                <button
                                    type="button"
                                    onClick={metric.onClick}
                                    disabled={!metric.onClick}
                                    className="group flex items-center gap-1.5 disabled:cursor-default"
                                >
                                    <IonIcon
                                        icon={metric.icon}
                                        className="text-grayscale-400 text-sm shrink-0"
                                    />
                                    <span className="text-sm font-semibold text-grayscale-900">
                                        {metric.value}
                                    </span>
                                    <span className="text-sm text-grayscale-500 group-hover:text-grayscale-700 transition-colors">
                                        {metric.label}
                                    </span>
                                </button>
                            </span>
                        ))}
                    </div>
                )}

                {visibleSkills.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                        {visibleSkills.map(skill => (
                            <button
                                key={skill.id}
                                type="button"
                                onClick={onSkillPillClick}
                                className="px-2.5 py-1 rounded-full bg-grayscale-100 hover:bg-grayscale-200 transition-colors text-xs font-medium text-grayscale-700 max-w-[140px] truncate"
                            >
                                {skill.label}
                            </button>
                        ))}
                        {overflowSkillCount > 0 && (
                            <button
                                type="button"
                                onClick={onSkillPillClick}
                                className="px-2.5 py-1 rounded-full bg-grayscale-100 hover:bg-grayscale-200 transition-colors text-xs font-medium text-grayscale-500"
                            >
                                +{overflowSkillCount} more
                            </button>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
};

export default DashboardHeaderCard;
