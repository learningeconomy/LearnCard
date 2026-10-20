import { expect, test } from 'bun:test';
import {
    createCareerCommands,
    occupationForDisplay,
    programsForDisplay,
    careerErrorCode,
} from './careers';
import type { ConsumerWallet } from './consumer-apps';

const occupation = (id = '27-4021.00') => ({
    OnetCode: id,
    OnetTitle: 'Photographers',
    OnetDescription: 'Create images.',
    SkillsDataList: [
        {
            ElementId: 'a',
            ElementName: 'Writing',
            ElementDescription: 'Explain ideas',
            Importance: '47',
        },
        { ElementId: 'b', ElementName: 'Listening', Importance: '90' },
        { ElementId: 'a', ElementName: 'Duplicate' },
    ],
    EducationTraining: { EducationTitle: 'High school' },
    Tasks: [
        { TaskDescription: 'Compose a photograph.' },
        { TaskDescription: 'Compose a photograph.' },
    ],
});
const fixture = () => {
    const calls: { url: string; body: unknown; headers: HeadersInit | undefined }[] = [];
    let profile: Record<string, unknown> = {
        dob: '1990-01-01',
        country: 'US',
        displayName: 'Private name',
    };
    let preferences: unknown = {};
    let reply: unknown = [occupation()];
    let status = 200;
    const wallet = { invoke: { getProfile: async () => profile } } as unknown as ConsumerWallet;
    let current: ConsumerWallet | undefined = wallet;
    const commands = createCareerCommands(
        () => current,
        async () => {
            if (preferences instanceof Error) throw preferences;
            return preferences;
        },
        async (url, init) => {
            calls.push({ url, body: JSON.parse(String(init.body)), headers: init.headers });
            return new Response(JSON.stringify(reply), { status });
        }
    );
    return {
        commands,
        calls,
        wallet,
        set profile(value: Record<string, unknown>) {
            profile = value;
        },
        set preferences(value: unknown) {
            preferences = value;
        },
        set reply(value: unknown) {
            reply = value;
        },
        set status(value: number) {
            status = value;
        },
        set current(value: ConsumerWallet | undefined) {
            current = value;
        },
    };
};
test('career search sends only explicit bounded keywords to the fixed provider endpoint', async () => {
    const f = fixture();
    const result = await f.commands.careerSearch({ query: '  photography  ' });
    expect(f.calls).toEqual([
        {
            url: 'https://api.learncloud.ai/insights/occupations',
            body: { keyword: 'photography', limit: 12, topNDetails: 12 },
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        },
    ]);
    expect(result.occupations[0].skills.map(x => x.id)).toEqual(['b', 'a']);
    expect(result.occupations[0].tasks).toEqual(['Compose a photograph.']);
    expect(JSON.stringify(result)).not.toContain('Private name');
    expect(result.limited).toBe(false);
});
test('existing adult preferences default as web does, while opt-out is enforced on every request', async () => {
    const f = fixture();
    expect(await f.commands.careerAccess()).toEqual({ reason: 'enabled' });
    await f.commands.careerSearch({ query: 'photography' });
    f.preferences = { aiEnabled: false };
    await expect(f.commands.careerPrograms({ id: '27-4021.00' })).rejects.toThrow(
        'career:disabledUser'
    );
    expect(f.calls).toHaveLength(1);
    f.preferences = { aiEnabled: true };
    await expect(f.commands.careerPrograms({ id: '27-4021.00' })).rejects.toThrow(
        'career:unavailable'
    );
});
test('shared web age policy blocks minors and requires an explicit child preference', async () => {
    const f = fixture();
    f.profile = { dob: '2018-01-01', country: 'US' };
    f.preferences = { aiEnabled: true };
    expect(await f.commands.careerAccess()).toEqual({ reason: 'disabledMinor' });
    await expect(f.commands.careerSearch({ query: 'photography' })).rejects.toThrow(
        'career:disabledMinor'
    );
    f.profile = { profileType: 'child', country: 'US' };
    expect(await f.commands.careerAccess()).toEqual({ reason: 'disabledMinor' });
    f.profile = { profileType: 'child', dob: '1990-01-01', country: 'US' };
    f.preferences = {};
    expect(await f.commands.careerAccess()).toEqual({ reason: 'disabledUser' });
    expect(f.calls).toHaveLength(0);
});
test('missing profile or failed/malformed preferences cannot enable career requests', async () => {
    const f = fixture();
    f.profile = {};
    await expect(f.commands.careerSearch({ query: 'hello' })).rejects.toThrow('career:unavailable');
    f.profile = { approved: false };
    await expect(f.commands.careerSearch({ query: 'hello' })).rejects.toThrow('career:unavailable');
    f.profile = { dob: '1990-01-01' };
    for (const value of [null, false, [], { aiEnabled: 'true' }, new Error('private failure')]) {
        f.preferences = value;
        await expect(f.commands.careerSearch({ query: 'hello' })).rejects.toThrow();
    }
    expect(f.calls).toHaveLength(0);
    expect(careerErrorCode(new Error('private failure'))).toBe('career:connection');
});
test('search validation and resource identity prevent unbounded or arbitrary proxy requests', async () => {
    const f = fixture();
    for (const input of [
        { query: 'a' },
        { query: 'x'.repeat(101) },
        { query: 'hello', limit: 1000 },
    ])
        await expect(f.commands.careerSearch(input)).rejects.toThrow('career:invalid');
    await expect(f.commands.careerPrograms({ id: '27-4021.00' })).rejects.toThrow(
        'career:unavailable'
    );
    await expect(f.commands.careerPrograms({ id: 'https://example.org' })).rejects.toThrow(
        'career:invalid'
    );
    expect(f.calls).toHaveLength(0);
});
test('program lookup uses only a previously returned occupation and safely projects schools', async () => {
    const f = fixture();
    await f.commands.careerSearch({ query: 'photo' });
    f.reply = {
        RecordCount: 32,
        SchoolPrograms: [
            {
                ID: 'one',
                SchoolName: 'School',
                ProgramName: 'Photography',
                SchoolUrl: 'https://school.example/',
                ProgramLength: [{ Name: 'Bachelor&apos;s degree' }],
            },
            {
                ID: 'two',
                SchoolName: 'Other',
                ProgramName: 'Images',
                SchoolUrl: 'javascript:alert(1)',
            },
            { ID: 'bad' },
        ],
    };
    const result = await f.commands.careerPrograms({ id: '27-4021.00' });
    expect(f.calls[1].body).toEqual({ keyword: 'Photographers' });
    expect(result.limited).toBe(true);
    expect(result.unavailable).toBe(1);
    expect(result.programs[0].lengths).toEqual(["Bachelor's degree"]);
    expect(result.programs[0].website).toBe('https://school.example/');
    expect(result.programs[1].website).toBeNull();
});
test('provider absence, malformed replies and no matches stay distinct', async () => {
    const f = fixture();
    f.status = 503;
    await expect(f.commands.careerSearch({ query: 'photo' })).rejects.toThrow('career:unavailable');
    f.status = 200;
    f.reply = { error: 'private upstream error' };
    await expect(f.commands.careerSearch({ query: 'photo' })).rejects.toThrow('career:unavailable');
    f.reply = [{ OnetTitle: 'No code' }];
    await expect(f.commands.careerSearch({ query: 'photo' })).rejects.toThrow('career:unavailable');
    f.reply = [];
    expect(await f.commands.careerSearch({ query: 'empty' })).toEqual({
        occupations: [],
        limited: false,
    });
    expect(() => programsForDisplay({})).toThrow('career:unavailable');
});
test('bounded results preserve stable codes and explicitly report the provider limit', async () => {
    const f = fixture();
    f.reply = Array.from({ length: 12 }, (_, n) =>
        occupation(`27-${String(n).padStart(4, '0')}.00`)
    );
    const result = await f.commands.careerSearch({ query: 'photo' });
    expect(result.occupations).toHaveLength(12);
    expect(result.limited).toBe(true);
    expect(() => occupationForDisplay({ OnetCode: 'bad', OnetTitle: 'Bad' })).toThrow(
        'career:unavailable'
    );
});
test('account interruption during policy checks never reaches the provider', async () => {
    const f = fixture();
    f.wallet.invoke.getProfile = async () => {
        f.current = undefined;
        return undefined;
    };
    await expect(f.commands.careerSearch({ query: 'photo' })).rejects.toThrow('career:signIn');
    expect(f.calls).toHaveLength(0);
});
test('account interruption during provider response cannot publish stale results', async () => {
    const f = fixture();
    let current: ConsumerWallet | undefined = f.wallet;
    const subject = createCareerCommands(
        () => current,
        async () => ({}),
        async () => {
            current = undefined;
            return Response.json([occupation()]);
        }
    );
    await expect(subject.careerSearch({ query: 'photo' })).rejects.toThrow('career:signIn');
});
