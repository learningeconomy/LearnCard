import { cp, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const destination = join(root, 'dist/privacy');
const source = join(root, 'privacy');
// Rebuild this generated directory so a previous build cannot retain old assets.
await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });
for (const file of ['processor.py', 'requirements.txt']) {
    await cp(join(source, file), join(destination, file));
}
