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
    const ink = dark ? '#EFF0F5' : '#18224E';
    const paper = dark ? '#202732' : '#FFFFFF';
    const fills: Record<string, string> = {
        CollectionTab: '#93C5FD',
        InboxTab: '#F9A8D4',
        AppsTab: '#22D3EE',
        HomeTab: '#BEF264',
    };
    const fill = fills[name];
    const line = ink;
    let drawing = '';
    if (name === 'CollectionTab')
        drawing = `
        <path d="M12 4h16c3 0 4 2 4 5v24c0 3-1 4-4 4H12c-3 0-4-1-4-4V9c0-3 1-5 4-5Z" fill="${fill}" stroke="${ink}" stroke-width="2.5"/>
        <rect x="14" y="10" width="12" height="7" rx="2" fill="${paper}" stroke="${line}" stroke-width="2"/>
        <path d="M14 23h12M14 29h8" stroke="${line}" stroke-width="2.3" stroke-linecap="round"/>`;
    if (name === 'InboxTab')
        drawing = `
        <rect x="5" y="9" width="30" height="25" rx="5" fill="${fill}" stroke="${ink}" stroke-width="2.5"/>
        <path d="M6 11l14 11 14-11" stroke="${ink}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`;
    if (name === 'AppsTab')
        drawing = `
        <g transform="rotate(38 20 20)">
        <path d="M12 22l-5 5 2 7 6-5M28 22l5 5-2 7-6-5" fill="#93C5FD" stroke="${ink}" stroke-width="2.3" stroke-linejoin="round"/>
        <path d="M20 3C10 10 10 22 15 31h10c5-9 5-21-5-28Z" fill="#34D399" stroke="${ink}" stroke-width="2.5" stroke-linejoin="round"/>
        <circle cx="20" cy="16" r="3.5" fill="#22D3EE" stroke="${line}" stroke-width="2"/>
        <path d="M17 35l3 3 3-3" stroke="#FBBF24" stroke-width="2.5" stroke-linecap="round"/>
        </g>`;
    if (name === 'HomeTab')
        drawing = `
        <path d="M27 12V5h5v12" fill="#34D399" stroke="${ink}" stroke-width="2.3" stroke-linejoin="round"/>
        <path d="M8 18v16q0 3 3 3h18q3 0 3-3V18" fill="#FDE047" stroke="${ink}" stroke-width="2.5" stroke-linejoin="round"/>
        <path d="M3 19L18 4q2-2 4 0l15 15Z" fill="#F9A8D4" stroke="${ink}" stroke-width="2.5" stroke-linejoin="round"/>
        <path d="M17 37V28a4 4 0 0 1 8 0v9" fill="#93C5FD" stroke="${ink}" stroke-width="2.3" stroke-linecap="round"/>
        <rect x="11" y="22" width="4" height="5" rx="1" fill="${paper}"/>
        <path d="M9 15l9-9" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" fill="none"><g opacity="${active ? 1 : 0.78}">${drawing}</g></svg>`;
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
