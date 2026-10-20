import { readFile, writeFile } from 'node:fs/promises';
import JSZip from 'jszip';

// Real-backend recordings use :3000; replay also supports other PW_MOCK_PORTs.
// These fixtures contain public test data and use bearer auth, not browser cookies.
const archivePath = new URL('./har/issue.har.zip', import.meta.url);
const archive = await JSZip.loadAsync(await readFile(archivePath));
const manifest = Object.values(archive.files).find(file => file.name.endsWith('.har'));
if (!manifest) throw new Error('Missing HAR manifest');
const har = JSON.parse(await manifest.async('string')) as {
    log: { entries: { response: { headers: { name: string; value: string }[] } }[] };
};
let changed = 0;
for (const entry of har.log.entries) {
    for (const header of entry.response.headers) {
        if (header.name.toLowerCase() === 'access-control-allow-origin' && header.value !== '*') {
            header.value = '*';
            changed++;
        }
    }
}
if (changed) {
    archive.file(manifest.name, JSON.stringify(har));
    await writeFile(
        archivePath,
        await archive.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
    );
}
console.log(`Normalized ${changed} recorded response origins.`);
