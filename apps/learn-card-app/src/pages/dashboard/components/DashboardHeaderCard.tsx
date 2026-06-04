import React from 'react';
import moment from 'moment';

import { getTimeOfDayGreeting, getFirstName } from '../helpers/greeting';

type Affiliation = {
    role: string;
    from?: string;
    issuedAt?: string;
} | null;

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
    affiliation: Affiliation;
    stats?: HeaderStats;
    professionalTitle?: string;
    experience?: ExperienceDuration;
    skills?: SkillPill[];
    onSkillPillClick?: () => void;
    onAvatarClick?: () => void;
    topRightAction?: React.ReactNode;
};

const getInitials = (name: string): string => {
    const trimmed = name.trim();
    if (!trimmed) return '?';
    const parts = trimmed.split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const formatIssuedAt = (iso?: string): string | null => {
    if (!iso) return null;
    const m = moment(iso);
    if (!m.isValid()) return null;
    return `Since ${m.format('MMM YYYY')}`;
};

const capitalize = (value: string): string => {
    const trimmed = value.trim();
    if (!trimmed) return '';
    return trimmed[0].toUpperCase() + trimmed.slice(1);
};

type SubtitleParts = {
    primary: string;
    secondary?: string;
    primaryStyle: 'text' | 'pill' | 'professionalTitle';
};

const resolveSubtitle = (
    brandName: string,
    affiliation: Affiliation,
    profileRole?: string,
    shortBio?: string,
    professionalTitle?: string
): SubtitleParts => {
    const title = professionalTitle?.trim();
    if (title) return { primary: title, primaryStyle: 'professionalTitle' };

    if (affiliation) {
        const primary = affiliation.from
            ? `${affiliation.role} · ${affiliation.from}`
            : affiliation.role;
        return { primary, primaryStyle: 'text' };
    }
    const role = profileRole?.trim();
    const bio = shortBio?.trim();
    if (role && bio) return { primary: capitalize(role), secondary: bio, primaryStyle: 'pill' };
    if (role) return { primary: capitalize(role), primaryStyle: 'pill' };
    if (bio) return { primary: bio, primaryStyle: 'text' };
    return { primary: `New to ${brandName}`, primaryStyle: 'text' };
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

const buildStatsLine = (stats?: HeaderStats): string | null => {
    if (!stats) return null;
    const parts: string[] = [];
    if (stats.credentials > 0)
        parts.push(
            `${stats.credentials} ${stats.credentials === 1 ? 'credential' : 'credentials'}`
        );
    if (stats.skills > 0) parts.push(`${stats.skills} ${stats.skills === 1 ? 'skill' : 'skills'}`);
    if (stats.contacts > 0)
        parts.push(`${stats.contacts} ${stats.contacts === 1 ? 'contact' : 'contacts'}`);
    if (parts.length === 0) return null;
    return parts.join(' · ');
};

const MAX_SKILL_PILLS = 3;

const DashboardHeaderCard: React.FC<DashboardHeaderCardProps> = ({
    brandName,
    displayName,
    profileImage,
    heroImage,
    profileRole,
    shortBio,
    affiliation,
    stats,
    professionalTitle,
    experience,
    skills,
    onSkillPillClick,
    onAvatarClick,
    topRightAction,
}) => {
    const initials = getInitials(displayName);
    const firstName = getFirstName(displayName);
    const greeting = getTimeOfDayGreeting();
    const issuedAtLabel = formatIssuedAt(affiliation?.issuedAt);
    const subtitle = resolveSubtitle(
        brandName,
        affiliation,
        profileRole,
        shortBio,
        professionalTitle
    );
    const experienceLine = formatExperience(experience);
    const isProfessionalSubtitle = subtitle.primaryStyle === 'professionalTitle';
    const statsLine =
        !affiliation && !experienceLine && !isProfessionalSubtitle ? buildStatsLine(stats) : null;
    const visibleSkills = (skills ?? []).slice(0, MAX_SKILL_PILLS);
    const overflowSkillCount = (skills?.length ?? 0) - visibleSkills.length;

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
                {topRightAction && (
                    <div className="absolute top-3 right-3 z-10">{topRightAction}</div>
                )}

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
                                        className="w-[72px] h-[72px] rounded-full object-cover border-2 border-white shadow-soft-bottom"
                                    />
                                ) : (
                                    <div className="w-[72px] h-[72px] rounded-full bg-grayscale-100 border-2 border-white shadow-soft-bottom flex items-center justify-center text-grayscale-700 font-semibold text-[22px]">
                                        {initials}
                                    </div>
                                )}
                            </button>
                        ) : profileImage ? (
                            <img
                                src={profileImage}
                                alt={displayName || 'Profile'}
                                className="w-[72px] h-[72px] rounded-full object-cover border-2 border-white shadow-soft-bottom"
                            />
                        ) : (
                            <div className="w-[72px] h-[72px] rounded-full bg-grayscale-100 border-2 border-white shadow-soft-bottom flex items-center justify-center text-grayscale-700 font-semibold text-[22px]">
                                {initials}
                            </div>
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-semibold text-grayscale-900 leading-tight">
                            {greeting}, {firstName}.
                        </h1>
                        {subtitle.primaryStyle === 'pill' ? (
                            <span className="inline-flex mt-1.5 px-2.5 py-1 rounded-full bg-grayscale-100 text-grayscale-700 text-xs font-medium">
                                {subtitle.primary}
                            </span>
                        ) : subtitle.primaryStyle === 'professionalTitle' ? (
                            <p className="mt-1 text-sm font-semibold text-grayscale-800 leading-relaxed truncate">
                                {subtitle.primary}
                            </p>
                        ) : (
                            <p className="mt-1 text-sm text-grayscale-600 leading-relaxed truncate">
                                {subtitle.primary}
                            </p>
                        )}
                        {subtitle.secondary && (
                            <p className="mt-1 text-xs text-grayscale-500 leading-relaxed truncate">
                                {subtitle.secondary}
                            </p>
                        )}
                        {experienceLine && (
                            <p className="mt-0.5 text-xs text-grayscale-500 truncate">
                                {experienceLine}
                            </p>
                        )}
                        {statsLine && (
                            <p className="mt-1.5 text-xs text-grayscale-500 truncate">
                                {statsLine}
                            </p>
                        )}
                        {issuedAtLabel && (
                            <span className="inline-flex mt-2 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                                {issuedAtLabel}
                            </span>
                        )}
                    </div>
                </div>

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
