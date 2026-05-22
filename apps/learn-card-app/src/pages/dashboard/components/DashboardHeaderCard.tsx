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

type DashboardHeaderCardProps = {
    displayName: string;
    profileImage: string;
    heroImage?: string;
    profileRole?: string;
    shortBio?: string;
    affiliation: Affiliation;
    stats?: HeaderStats;
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
    primaryStyle: 'text' | 'pill';
};

const resolveSubtitle = (
    affiliation: Affiliation,
    profileRole?: string,
    shortBio?: string,
): SubtitleParts => {
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
    return { primary: 'New to LearnCard', primaryStyle: 'text' };
};

const buildStatsLine = (stats?: HeaderStats): string | null => {
    if (!stats) return null;
    const parts: string[] = [];
    if (stats.credentials > 0)
        parts.push(`${stats.credentials} ${stats.credentials === 1 ? 'credential' : 'credentials'}`);
    if (stats.skills > 0)
        parts.push(`${stats.skills} ${stats.skills === 1 ? 'skill' : 'skills'}`);
    if (stats.contacts > 0)
        parts.push(`${stats.contacts} ${stats.contacts === 1 ? 'contact' : 'contacts'}`);
    if (parts.length === 0) return null;
    return parts.join(' · ');
};

const DashboardHeaderCard: React.FC<DashboardHeaderCardProps> = ({
    displayName,
    profileImage,
    heroImage,
    profileRole,
    shortBio,
    affiliation,
    stats,
}) => {
    const initials = getInitials(displayName);
    const firstName = getFirstName(displayName);
    const greeting = getTimeOfDayGreeting();
    const issuedAtLabel = formatIssuedAt(affiliation?.issuedAt);
    const subtitle = resolveSubtitle(affiliation, profileRole, shortBio);
    const statsLine = !affiliation ? buildStatsLine(stats) : null;

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
                    </div>

                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-semibold text-grayscale-900 leading-tight">
                            {greeting}, {firstName}.
                        </h1>
                        {subtitle.primaryStyle === 'pill' ? (
                            <span className="inline-flex mt-1.5 px-2.5 py-1 rounded-full bg-grayscale-100 text-grayscale-700 text-xs font-medium">
                                {subtitle.primary}
                            </span>
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
            </div>
        </section>
    );
};

export default DashboardHeaderCard;
