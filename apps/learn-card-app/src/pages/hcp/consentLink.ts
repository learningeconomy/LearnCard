import type { HcpGrantRequest } from 'learn-card-base/hcp/useHcp';
import { isCustomCategory, isRegisteredCategory } from './hcpModel';

export const DEFAULT_PURPOSE_CODE = 'https://learncard.com/hcp/purposes/app-access';
export const DURATIONS = ['1h', '4h', '24h', 'ongoing'] as const;
export type Duration = (typeof DURATIONS)[number];
const isDuration = (value: string): value is Duration => DURATIONS.some(item => item === value);

/**
 * What an app asks for. LC-2421 can produce this from a consent-flow request; the
 * screen only consumes this shape.
 */
export type AccessRequest = {
    client: { id: string; name: string };
    categories: [string, ...string[]];
    purpose: { code: string; description: string };
    duration: Duration;
};

export type LinkProblem = 'app' | 'name' | 'categories' | 'purpose' | 'duration';
export type ParsedLink =
    { kind: 'ok'; request: AccessRequest } | { kind: 'bad'; problem: LinkProblem };

const DID = /^did:[a-z0-9]+:\S+$/;
const HOUR = 60 * 60 * 1000;

const isAbsoluteUrl = (value: string): boolean => {
    try {
        return Boolean(new URL(value).protocol);
    } catch {
        return false;
    }
};

/** Parses `/hcp/connect?client=&name=&categories=&purpose=&purposeCode=&duration=`. */
const FIELD_PROBLEM = {
    client: 'app',
    name: 'name',
    categories: 'categories',
    purpose: 'purpose',
    purposeCode: 'purpose',
    duration: 'duration',
} as const satisfies Record<string, LinkProblem>;

export const parseConsentLink = (search: string): ParsedLink => {
    const params = new URLSearchParams(search);
    // A repeated field is ambiguous: refuse it rather than pick one copy.
    const repeated = (Object.keys(FIELD_PROBLEM) as (keyof typeof FIELD_PROBLEM)[]).find(
        field => params.getAll(field).length > 1
    );
    if (repeated) return { kind: 'bad', problem: FIELD_PROBLEM[repeated] };
    const client = params.get('client')?.trim() ?? '';
    const name = params.get('name')?.trim() ?? '';
    const categories = (params.get('categories') ?? '')
        .split(',')
        .map(value => value.trim())
        .filter(Boolean);
    const description = params.get('purpose')?.trim() ?? '';
    const code = params.get('purposeCode')?.trim() || DEFAULT_PURPOSE_CODE;
    const duration = params.get('duration')?.trim() || '1h';
    const [first, ...rest] = categories;

    if (!DID.test(client) || client.length > 2048) return { kind: 'bad', problem: 'app' };
    if (!name || name.length > 200) return { kind: 'bad', problem: 'name' };
    if (
        first === undefined ||
        categories.length > 20 ||
        new Set(categories).size !== categories.length ||
        !categories.every(id => isRegisteredCategory(id) || isCustomCategory(id))
    )
        return { kind: 'bad', problem: 'categories' };
    if (!description || description.length > 1000 || !isAbsoluteUrl(code))
        return { kind: 'bad', problem: 'purpose' };
    if (!isDuration(duration)) return { kind: 'bad', problem: 'duration' };

    return {
        kind: 'ok',
        request: {
            client: { id: client, name },
            categories: [first, ...rest],
            purpose: { code, description },
            duration,
        },
    };
};

/** Read-only, exactly the requested categories, temporary unless the app asked for ongoing. */
export const grantRequestFor = (request: AccessRequest, now: Date): HcpGrantRequest => ({
    client: request.client,
    access: [{ actions: ['read'], categories: request.categories, purposes: [request.purpose] }],
    ...(request.duration === 'ongoing'
        ? { grantType: 'persistent' }
        : {
              grantType: 'temporary',
              expiresAt: new Date(
                  now.getTime() + Number.parseInt(request.duration, 10) * HOUR
              ).toISOString(),
          }),
});
