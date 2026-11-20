import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LoadRefusal } from './errors';
import { syntheticEmail } from './identity';
import {
    createManifest,
    openManifestProgress,
    parseManifest,
    type ManifestHeader,
} from './manifest';

const header: ManifestHeader = {
    runId: 'a1b2c3d4',
    prefix: 'escrow-load',
    domain: 'load.notify.learncard.com',
    firebaseProject: 'learncard',
    createdAt: '2026-11-05T00:00:00.000Z',
};

const refusal = (fn: () => unknown): string | undefined => {
    try {
        fn();
    } catch (error) {
        if (error instanceof LoadRefusal) return error.reason;
        throw error;
    }
    return undefined;
};

describe('run manifest', () => {
    let dir: string;
    beforeEach(() => {
        dir = mkdtempSync(join(tmpdir(), 'escrow-load-manifest-'));
    });
    afterEach(() => rmSync(dir, { recursive: true, force: true }));

    it('is created exclusively, mode 0600, with the header and an empty user list', () => {
        const path = join(dir, 'run.jsonl');
        const writer = createManifest(path, header);
        writer.close();
        expect(statSync(path).mode & 0o777).toBe(0o600);
        const manifest = parseManifest(readFileSync(path, 'utf8'));
        expect(manifest.header).toEqual(header);
        expect(manifest.users).toEqual([]);
        expect(refusal(() => createManifest(path, header))).toBe('manifest_exists');
        expect(refusal(() => createManifest(join(dir, 'missing', 'x.jsonl'), header))).toBe(
            'manifest_unwritable'
        );
    });

    it('appends users and cleanup progress; stores only uids and synthetic addresses', () => {
        const path = join(dir, 'run.jsonl');
        const writer = createManifest(path, header);
        writer.user({ uid: 'u1', email: syntheticEmail(header, 1) });
        writer.user({ uid: 'u2', email: syntheticEmail(header, 2) });
        writer.user({ uid: 'u1', email: syntheticEmail(header, 1) });
        writer.close();
        const progress = openManifestProgress(path);
        progress.record('deleted', ['u1']);
        progress.close();
        const text = readFileSync(path, 'utf8');
        expect(Object.keys(JSON.parse(text.split('\n')[1])).sort()).toEqual([
            'email',
            'kind',
            'uid',
        ]);
        const manifest = parseManifest(text);
        expect(manifest.users).toEqual([
            { uid: 'u1', email: syntheticEmail(header, 1) },
            { uid: 'u2', email: syntheticEmail(header, 2) },
        ]);
        expect([...manifest.done]).toEqual(['u1']);
        expect(manifest.tornTail).toBe(false);
    });

    it('survives a torn last line and refuses other corruption', () => {
        const path = join(dir, 'run.jsonl');
        createManifest(path, header).close();
        const good = `${readFileSync(path, 'utf8')}${JSON.stringify({
            kind: 'user',
            uid: 'u1',
            email: syntheticEmail(header, 1),
        })}\n`;
        const torn = parseManifest(`${good}{"kind":"user","uid":"u2","em`);
        expect(torn.users.map(user => user.uid)).toEqual(['u1']);
        expect(torn.tornTail).toBe(true);
        // A complete record missing only its newline is kept.
        expect(parseManifest(good.slice(0, -1)).users).toHaveLength(1);
        writeFileSync(path, good);
        expect(parseManifest(readFileSync(path, 'utf8')).users).toHaveLength(1);

        const user = (email: string, uid = 'u9') =>
            `${good}${JSON.stringify({ kind: 'user', uid, email })}\n`;
        expect(refusal(() => parseManifest(`${good}not json\n`))).toBe('manifest_corrupt');
        expect(refusal(() => parseManifest(user('person@example.org')))).toBe('manifest_corrupt');
        expect(refusal(() => parseManifest(user(syntheticEmail(header, 3), 'a/b')))).toBe(
            'manifest_corrupt'
        );
        expect(refusal(() => parseManifest(`${good}{"kind":"key","value":"x"}\n`))).toBe(
            'manifest_corrupt'
        );
        expect(refusal(() => parseManifest(''))).toBe('manifest_header');
        expect(
            refusal(() => parseManifest(`${JSON.stringify({ ...header, kind: 'run' })}\n`))
        ).toBe('manifest_header');
        expect(
            refusal(() =>
                parseManifest(
                    `${JSON.stringify({ kind: 'run', version: 1, ...header, domain: 'gmail.com' })}\n`
                )
            )
        ).toBe('domain_not_allowlisted');
    });
});
