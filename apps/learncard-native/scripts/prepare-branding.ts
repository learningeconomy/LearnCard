import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import sharp from 'sharp';
import { mkdir, writeFile, copyFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { NavBarPassportIcon } from '../../../packages/learn-card-base/src/svgs/navbar/NavBarPassportIcon';
import { NavBarLaunchPadIcon } from '../../../packages/learn-card-base/src/svgs/navbar/NavBarLaunchPadIcon';

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

const timeline = (active: boolean): string => {
    const stroke = active ? '#54CFEA' : '#8B91A7';
    return `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" fill="none">
        <path d="M6 30L20 20L34 10" stroke="${stroke}" stroke-width="3" stroke-linecap="round"/>
        <circle cx="6" cy="30" r="4" fill="${active ? '#F56DB5' : 'white'}" stroke="#F56DB5" stroke-width="2"/>
        <circle cx="20" cy="20" r="4" fill="${active ? '#54CFEA' : 'white'}" stroke="#54CFEA" stroke-width="2"/>
        <circle cx="34" cy="10" r="4" fill="${active ? '#8C52FF' : 'white'}" stroke="#8C52FF" stroke-width="2"/>
        </svg>`;
};
const inbox = (
    active: boolean
): string => `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" fill="none">
    <path d="M5 21L11 10h18l6 11v12H5V21Z" fill="${active ? '#BCE6FF' : 'white'}" stroke="${active ? '#0969FF' : '#8B91A7'}" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M5 21h10l2 5h6l2-5h10" stroke="${active ? '#0969FF' : '#8B91A7'}" stroke-width="2.2" stroke-linejoin="round"/>
    </svg>`;
for (const active of [false, true]) {
    for (const [name, svg] of [
        [
            'CollectionTab',
            renderToStaticMarkup(
                React.createElement(NavBarPassportIcon, { version: active ? '2' : '1' })
            ),
        ],
        ['InboxTab', inbox(active)],
        [
            'AppsTab',
            renderToStaticMarkup(
                React.createElement(NavBarLaunchPadIcon, { version: active ? '2' : '1' })
            ),
        ],
        ['HomeTab', timeline(active)],
    ]) {
        const label = name + (active ? 'Active' : '');
        const directory = resolve(assets, `${label}.imageset`);
        await mkdir(directory, { recursive: true });
        const images = [];
        for (const scale of [1, 2, 3]) {
            const filename = `${label}@${scale}x.png`;
            await sharp(Buffer.from(svg))
                .resize(32 * scale, 32 * scale)
                .png()
                .toFile(resolve(directory, filename));
            images.push({ filename, idiom: 'universal', scale: `${scale}x` });
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
    'Prepared current LearnCard mark/app icon and native navigation artwork from existing vector sources.'
);
