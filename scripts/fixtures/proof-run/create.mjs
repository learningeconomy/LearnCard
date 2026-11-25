import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

export const createFixture = async () => {
    const root = await mkdtemp(join(tmpdir(), 'learncard-proof-fixture-'));
    const png = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZ1cAAAAASUVORK5CYII=',
        'base64'
    );
    const files = {
        'report.json': await readFile(new URL('./report.json', import.meta.url)),
        'account/001-sign-in-before.png': png,
        'account/002-sign-in-after.png': png,
        'account/003-wallet-after.png': png,
        'account/0-learner-video/recording.webm':
            'Synthetic video placeholder; never upload this fixture.',
        'account/0-learner-session.json': '{"private":"synthetic seed placeholder"}',
        'account/0-learner-trace.zip': 'Synthetic trace placeholder',
        'account/actions.json': '[]',
        'account/003-wallet-after.aria.txt': 'Synthetic accessibility snapshot',
        'sharing/001-share-before.png': png,
        'sharing/002-share-failure.png': png,
        'sharing/003-failure-state-0-learner.png': png,
        'sessions/private.png': png,
        'sessions/learner.json': '{"private":"synthetic seed placeholder"}',
        '.env': 'SYNTHETIC_ONLY=true',
        'service.log': 'Synthetic log',
    };
    for (const [name, contents] of Object.entries(files)) {
        const path = join(root, name);
        await mkdir(dirname(path), { recursive: true });
        await writeFile(path, contents);
    }
    return root;
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    console.log(await createFixture());
}
