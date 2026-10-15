import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';

// Derive the moving pieces from the existing editable mark; no screenshot crops.
const assets = resolve(import.meta.dir, '../ios/Sources/Assets.xcassets');
const source = await readFile(
    resolve(assets, 'LearnCardPaintedMark.imageset/LearnCardPaintedMark.svg'),
    'utf8'
);
// Keep the painted geometry, with vivid Colorful hues rather than pastel washes.
const colors: Record<string, [string, string]> = {
    mint: ['#42F0CF', '#12CFB2'],
    green: ['#35DDA9', '#12BC83'],
    cyan: ['#34DAF4', '#00BBDD'],
    lime: ['#BFFB55', '#97E62F'],
    blue: ['#69A8FF', '#367FF1'],
    yellow: ['#FFE14B', '#FFC51C'],
    pink: ['#FF82C5', '#F647A5'],
    violet: ['#B072FF', '#8C43EA'],
};
const defs = Object.entries(colors)
    .map(
        ([name, stops]) =>
            `<linearGradient id="${name}" x2="1" y2="1"><stop stop-color="${stops[0]}"/><stop offset="1" stop-color="${stops[1]}"/></linearGradient>`
    )
    .join('');
const paths = [...source.matchAll(/<path d="([^"]+)" fill="([^"]+)"\/>/g)];
const tiles: string[] = [];
for (let index = 0; index < 9; index++) {
    const [, path, fill] = paths[index];
    const x = (index % 3) * 21,
        y = Math.floor(index / 3) * 21;
    const drawing = `<path d="${path}" fill="${fill}"/>${index === 4 ? paths[9][0] : ''}`;
    const tile = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} 23 23" width="92" height="92"><defs>${defs}<clipPath id="pigment"><path d="${path}"/></clipPath></defs>${drawing}</svg>`;
    tiles.push(`<g>${drawing.replaceAll('url(#pigment)', `url(#pigment${index})`)}</g>`);
    const directory = resolve(assets, `PaintBlock${index}.imageset`);
    await mkdir(directory, { recursive: true });
    await writeFile(resolve(directory, 'block.svg'), tile);
    await writeFile(
        resolve(directory, 'Contents.json'),
        JSON.stringify(
            {
                images: [{ filename: 'block.svg', idiom: 'universal' }],
                info: { author: 'xcode', version: 1 },
                properties: {
                    'preserves-vector-representation': true,
                    'template-rendering-intent': 'original',
                },
            },
            null,
            4
        ) + '\n'
    );
}
const clips = paths
    .slice(0, 9)
    .map(([, path], index) => `<clipPath id="pigment${index}"><path d="${path}"/></clipPath>`)
    .join('');
const assembled = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="160" height="160"><defs>${defs}${clips}</defs>${tiles.join('')}</svg>`;
const launch = resolve(assets, 'LearnCardLaunchMark.imageset');
await mkdir(launch, { recursive: true });
const images = [];
for (const scale of [1, 2, 3]) {
    const filename = `mark@${scale}x.png`;
    await sharp(Buffer.from(assembled))
        .resize(160 * scale)
        .png()
        .toFile(resolve(launch, filename));
    images.push({ filename, idiom: 'universal', scale: `${scale}x` });
}
await writeFile(
    resolve(launch, 'Contents.json'),
    JSON.stringify({ images, info: { author: 'xcode', version: 1 } }, null, 4) + '\n'
);
const canvas = resolve(assets, 'LaunchCanvas.colorset');
await mkdir(canvas, { recursive: true });
const color = (r: number, g: number, b: number) => ({
    'color-space': 'srgb',
    components: { red: String(r / 255), green: String(g / 255), blue: String(b / 255), alpha: '1' },
});
await writeFile(
    resolve(canvas, 'Contents.json'),
    JSON.stringify(
        {
            colors: [
                { idiom: 'universal', color: color(239, 240, 245) },
                {
                    idiom: 'universal',
                    appearances: [{ appearance: 'luminosity', value: 'dark' }],
                    color: color(17, 21, 28),
                },
            ],
            info: { author: 'xcode', version: 1 },
        },
        null,
        4
    ) + '\n'
);
console.log('Prepared nine editable pigment blocks and appearance-aware static launch assets.');

// One generated grayscale material, packed smaller for reusable native texture masks.
const texture = resolve(assets, 'PaintPigment.imageset');
await mkdir(texture, { recursive: true });
await sharp(resolve(import.meta.dir, '../design/watercolor-pigment-source.png'))
    .resize(512, 512)
    .png()
    .toFile(resolve(texture, 'pigment.png'));
await writeFile(
    resolve(texture, 'Contents.json'),
    JSON.stringify(
        {
            images: [{ filename: 'pigment.png', idiom: 'universal' }],
            info: { author: 'xcode', version: 1 },
        },
        null,
        4
    ) + '\n'
);
