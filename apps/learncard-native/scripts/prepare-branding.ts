import sharp from 'sharp';
import { mkdir, writeFile, copyFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dir, '../../..');
const assets = resolve(root, 'apps/learncard-native/ios/Sources/Assets.xcassets');
await copyFile(
    resolve(root, 'apps/learn-card-app/environments/learncard/assets/branding/brand-mark.png'),
    resolve(assets, 'LearnCardMark.imageset/mark.png')
);
await copyFile(
    resolve(root, 'apps/learn-card-app/environments/learncard/assets/ios/AppIcon.png'),
    resolve(assets, 'AppIcon.appiconset/AppIcon.png')
);

/** Deterministic vector artwork matching the approved mockup; no runtime raster generation. */
const icon = (name: string, active: boolean, dark: boolean): string => {
    const ink = active ? '#18224E' : dark ? '#BBC5D6' : '#6F7590';
    const paper = dark ? '#202732' : '#FFFFFF';
    const fills: Record<string, string> = {
        CollectionTab: '#93C5FD',
        InboxTab: '#F9A8D4',
        AppsTab: '#22D3EE',
        HomeTab: '#BEF264',
    };
    const fill = active ? fills[name] : paper;
    const line = ink;
    let drawing = '';
    if (name === 'CollectionTab')
        drawing = `
        <rect x="13" y="5" width="23" height="32" rx="4" fill="${active ? '#34D399' : paper}" stroke="${ink}" stroke-width="1.7"/>
        <path d="M8 4L28 2c2-.2 3 1 3 3v29c0 2-1 3-3 3L8 38c-2 .1-3-1-3-3V7c0-2 1-3 3-3Z" fill="${fill}" stroke="${ink}" stroke-width="2"/>
        <path d="M11 10l13-1M11 31l13-1" stroke="${line}" stroke-width="1.8" stroke-linecap="round"/>
        <circle cx="18" cy="20" r="5.4" stroke="${line}" stroke-width="1.8"/>`;
    if (name === 'InboxTab')
        drawing = `
        <path d="M4 21L11 10h18l7 11v14H4V21Z" fill="${active ? fill : paper}" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/>
        <path d="M4 22h10l3 5h6l3-5h10" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/>`;
    if (name === 'AppsTab')
        drawing = `
        <path d="M12 21l-6 5 2 8 7-5M28 21l6 5-2 8-7-5" fill="${active ? '#C4B5FD' : paper}" stroke="${ink}" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M20 3C9 11 10 22 15 31h10c5-9 6-20-5-28Z" fill="${fill}" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/>
        <circle cx="20" cy="17" r="4" fill="${active ? '#FDE047' : paper}" stroke="${line}" stroke-width="1.8"/>
        <path d="M17 35h6M19 38h2" stroke="${active ? '#34D399' : ink}" stroke-width="2" stroke-linecap="round"/>`;
    if (name === 'HomeTab')
        drawing = `
        <path d="M5 31L20 20L35 9" stroke="${active ? '#22D3EE' : ink}" stroke-width="2.2" stroke-linecap="round"/>
        <circle cx="5" cy="31" r="4" fill="${active ? '#F9A8D4' : paper}" stroke="#EC4899" stroke-width="2"/>
        <circle cx="20" cy="20" r="4" fill="${active ? '#67E8F9' : paper}" stroke="#06B6D4" stroke-width="2"/>
        <circle cx="35" cy="9" r="4" fill="${active ? '#C4B5FD' : paper}" stroke="#8B5CF6" stroke-width="2"/>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" fill="none">${drawing}</svg>`;
};
for (const active of [false, true]) {
    for (const name of ['CollectionTab', 'InboxTab', 'AppsTab', 'HomeTab']) {
        const label = name + (active ? 'Active' : '');
        const directory = resolve(assets, `${label}.imageset`);
        await mkdir(directory, { recursive: true });
        const images = [];
        for (const dark of [false, true])
            for (const scale of [1, 2, 3]) {
                const filename = `${label}${dark ? '-dark' : ''}@${scale}x.png`;
                await sharp(Buffer.from(icon(name, active, dark)))
                    .resize(32 * scale, 32 * scale)
                    .png()
                    .toFile(resolve(directory, filename));
                images.push({
                    filename,
                    idiom: 'universal',
                    scale: `${scale}x`,
                    ...(dark ? { appearances: [{ appearance: 'luminosity', value: 'dark' }] } : {}),
                });
            }
        await writeFile(
            resolve(directory, 'Contents.json'),
            JSON.stringify(
                {
                    images,
                    info: { author: 'xcode', version: 1 },
                    properties: { 'template-rendering-intent': 'original' },
                },
                null,
                4
            ) + '\n'
        );
    }
}
console.log(
    'Prepared current tiled L branding and outlined tray icons, including matching rocket, in light/dark variants.'
);
