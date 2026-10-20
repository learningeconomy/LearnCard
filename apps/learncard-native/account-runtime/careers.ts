import { z } from 'zod';
import type { ConsumerWallet } from './consumer-apps';
import { httpsURL } from './consumer-apps';
import { getAiFeatureAgeGateState } from '../../../packages/learn-card-base/src/helpers/aiFeatureGate';

const endpoint = 'https://api.learncloud.ai/insights/';
const searchInput = z.object({ query: z.string().trim().min(2).max(100) }).strict();
const code = z.string().regex(/^\d{2}-\d{4}\.\d{2}$/u);
const row = z.object({ OnetCode: code, OnetTitle: z.string().min(1).max(500) }).passthrough();
type Row = Record<string, unknown>;
const object = (value: unknown): Row =>
    value && typeof value === 'object' && !Array.isArray(value) ? (value as Row) : {};
const text = (value: unknown, max = 4000) =>
    typeof value === 'string' ? value.slice(0, max).trim() : '';
const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const plain = (value: unknown, max = 4000) =>
    text(value, max)
        .replace(/&(?:apos|#39);/g, "'")
        .replaceAll('&quot;', '"')
        .replaceAll('&amp;', '&')
        .replaceAll('&lt;', '<')
        .replaceAll('&gt;', '>');
export class CareerFailure extends Error {
    constructor(
        readonly kind:
            'signIn' | 'connection' | 'unavailable' | 'invalid' | 'disabledUser' | 'disabledMinor'
    ) {
        super(`career:${kind}`);
    }
}
export const careerErrorCode = (error: unknown) =>
    error instanceof CareerFailure ? error.message : 'career:connection';
type CareerRequest = (url: string, options: RequestInit) => Promise<Response>;

/** Provider data only: no personal skill matching, generated scores or salary claims. */
export const occupationForDisplay = (raw: unknown) => {
    const parsed = row.safeParse(raw);
    if (!parsed.success) throw new CareerFailure('unavailable');
    const value = parsed.data,
        education = object(value.EducationTraining);
    const seen = new Set<string>();
    const skills = list(value.SkillsDataList)
        .flatMap(rawSkill => {
            const skill = object(rawSkill),
                id = text(skill.ElementId, 200),
                name = text(skill.ElementName, 300);
            if (!id || !name || seen.has(id)) return [];
            seen.add(id);
            const rank = Number(skill.Importance);
            return [
                {
                    id,
                    name,
                    description: text(skill.ElementDescription),
                    rank: Number.isFinite(rank) ? rank : -1,
                },
            ];
        })
        .sort((a, b) => b.rank - a.rank)
        .slice(0, 5)
        .map(({ rank: _rank, ...skill }) => skill);
    return {
        id: value.OnetCode,
        title: value.OnetTitle,
        summary: text(value.OnetDescription),
        education: plain(education.EducationTitle),
        experience: plain(education.ExperienceTitle),
        training: plain(education.TrainingTitle),
        skills,
        tasks: [
            ...new Set(
                list(value.Tasks)
                    .map(task => text(object(task).TaskDescription))
                    .filter(Boolean)
            ),
        ].slice(0, 6),
    };
};
export const programsForDisplay = (raw: unknown) => {
    const value = object(raw);
    if (!Array.isArray(value.SchoolPrograms) || value.SchoolPrograms.length > 1000)
        throw new CareerFailure('unavailable');
    let unavailable = 0;
    const seen = new Set<string>();
    const programs = value.SchoolPrograms.slice(0, 10).flatMap(rawProgram => {
        const item = object(rawProgram),
            school = plain(item.SchoolName, 500),
            title = plain(item.ProgramName, 500);
        if (!school || !title || !text(item.ID)) {
            unavailable++;
            return [];
        }
        const id = `${text(item.ID, 200)}:${title}`;
        if (seen.has(id)) return [];
        seen.add(id);
        return [
            {
                id,
                title,
                school,
                location: [text(item.City, 200), text(item.StateName, 200)]
                    .filter(Boolean)
                    .join(', '),
                formats: list(item.Format)
                    .map(value => plain(value, 200))
                    .filter(Boolean)
                    .slice(0, 8),
                lengths: list(item.ProgramLength)
                    .map(value => plain(object(value).Name, 300))
                    .filter(Boolean)
                    .slice(0, 8),
                website: httpsURL(item.SchoolUrl)?.href ?? null,
            },
        ];
    });
    return {
        programs,
        unavailable,
        limited:
            Number(value.RecordCount) > value.SchoolPrograms.length ||
            value.SchoolPrograms.length > 10,
    };
};

/** Recheck the account's existing age/privacy choices before every provider call. */
export const createCareerCommands = (
    currentWallet: () => ConsumerWallet | undefined,
    preferences: (wallet: ConsumerWallet) => Promise<unknown>,
    request: CareerRequest = (...args) => fetch(...args)
) => {
    let owner: ConsumerWallet | undefined;
    const occupations = new Map<string, ReturnType<typeof occupationForDisplay>>();
    const check = (wallet: ConsumerWallet) => {
        if (wallet !== currentWallet()) throw new CareerFailure('signIn');
    };
    const account = () => {
        const wallet = currentWallet();
        if (owner !== wallet) {
            occupations.clear();
            owner = wallet;
        }
        if (!wallet) throw new CareerFailure('signIn');
        return wallet;
    };
    const access = async (wallet: ConsumerWallet) => {
        const profile = object(await wallet.invoke.getProfile());
        check(wallet);
        if (!Object.keys(profile).length || profile.approved === false)
            throw new CareerFailure('unavailable');
        const age = getAiFeatureAgeGateState({
            profileType: text(profile.profileType) || null,
            dob: text(profile.dob) || null,
            country: text(profile.country) || null,
        });
        if (age.isAiAgeRestricted) return { reason: 'disabledMinor' as const };
        const raw = await preferences(wallet);
        check(wallet);
        if (!raw || typeof raw !== 'object' || Array.isArray(raw))
            throw new CareerFailure('unavailable');
        const prefs = object(raw);
        if (prefs.aiEnabled !== undefined && typeof prefs.aiEnabled !== 'boolean')
            throw new CareerFailure('unavailable');
        return {
            reason: (age.isChildProfile ? prefs.aiEnabled === true : prefs.aiEnabled !== false)
                ? ('enabled' as const)
                : ('disabledUser' as const),
        };
    };
    const gate = async (wallet: ConsumerWallet) => {
        const result = await access(wallet);
        if (result.reason !== 'enabled') {
            occupations.clear();
            throw new CareerFailure(result.reason);
        }
    };
    const post = async (path: 'occupations' | 'training-programs', body: Row) => {
        const response = await request(`${endpoint}${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(body),
        });
        if (!response.ok)
            throw new CareerFailure(
                [401, 403, 404, 429, 503].includes(response.status) ? 'unavailable' : 'connection'
            );
        return (await response.json()) as unknown;
    };
    return {
        careerAccess: async () => access(account()),
        careerSearch: async (input: unknown) => {
            const wallet = account(),
                parsed = searchInput.safeParse(input);
            if (!parsed.success) throw new CareerFailure('invalid');
            await gate(wallet);
            const raw = await post('occupations', {
                keyword: parsed.data.query,
                limit: 12,
                topNDetails: 12,
            });
            check(wallet);
            if (!Array.isArray(raw) || raw.length > 1000) throw new CareerFailure('unavailable');
            const found = raw.slice(0, 12).map(occupationForDisplay);
            occupations.clear();
            for (const item of found) occupations.set(item.id, item);
            return { occupations: [...occupations.values()], limited: raw.length >= 12 };
        },
        careerPrograms: async (input: unknown) => {
            const wallet = account(),
                parsed = z.object({ id: code }).strict().safeParse(input);
            if (!parsed.success) throw new CareerFailure('invalid');
            await gate(wallet);
            const occupation = occupations.get(parsed.data.id);
            if (!occupation) throw new CareerFailure('unavailable');
            const raw = await post('training-programs', { keyword: occupation.title });
            check(wallet);
            return programsForDisplay(raw);
        },
    };
};
