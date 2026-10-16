import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';

// Derive the moving pieces from the existing editable mark; no screenshot crops.
const assets = resolve(import.meta.dir, '../ios/Sources/Assets.xcassets');
const source = await readFile(
    resolve(assets, 'LearnCardPaintedMark.imageset/LearnCardPaintedMark.svg'),
    'utf8'
);
const motion = await readFile(
    resolve(import.meta.dir, '../ios/NativeCore/Sources/LearnCardNativeCore/BrandMotion.swift'),
    'utf8'
);
const metric = (name: string) => {
    const value = motion.match(new RegExp(`static let ${name} = ([0-9.]+)`))?.[1];
    if (!value) throw new Error(`Missing shared motion metric: ${name}`);
    return Number(value);
};
const markWidth = metric('markMaxWidth');
const backdrop = [
    ...motion.matchAll(
        /BackdropBlock\(color: (\d+), x: ([-\d.]+), y: ([-\d.]+), size: (\d+), rotation: (\d+)\)/g
    ),
].map(([, color, x, y, size, rotation]) => ({
    color: Number(color),
    x: Number(x),
    y: Number(y),
    size: Number(size),
    rotation: Number(rotation),
}));
if (backdrop.length !== 8) throw new Error('Missing shared launch backdrop poses');
const pigment = await sharp(resolve(import.meta.dir, '../design/watercolor-pigment-source.png'))
    .resize(512, 512)
    .png()
    .toBuffer();
const pigmentURL = `data:image/png;base64,${pigment.toString('base64')}`;
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
const paintedTiles: { viewport: string; content: string }[] = [];
for (let index = 0; index < 9; index++) {
    const [, path, fill] = paths[index];
    const x = (index % 3) * 21,
        y = Math.floor(index / 3) * 21;
    const drawing = `<path d="${path}" fill="${fill}"/>${index === 4 ? paths[9][0] : ''}`;
    const tile = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} 23 23" width="92" height="92"><defs>${defs}<clipPath id="pigment"><path d="${path}"/></clipPath></defs>${drawing}</svg>`;
    const material =
        index === 4
            ? ''
            : `<g clip-path="url(#pigment${index})"><image href="${pigmentURL}" x="${x}" y="${y}" width="23" height="23" transform="rotate(${(index % 4) * 90} ${x + 11.5} ${y + 11.5})" opacity="0.2" style="mix-blend-mode:multiply"/></g>`;
    tiles.push(`<g style="isolation:isolate">${drawing}${material}</g>`);
    paintedTiles.push({
        viewport: `${x} ${y} 23 23`,
        content: `<defs>${defs}<clipPath id="pigment${index}"><path d="${path}"/></clipPath></defs>${tiles[index]}`,
    });
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
const launchTiles = tiles.map((tile, index) => {
    const x = (index % 3) * 21 + 11.5;
    const y = Math.floor(index / 3) * 21 + 11.5;
    const launchX = 32.5 + (x - 32.5) * metric('assemblySpread');
    const launchY = 32.5 + (y - 32.5) * metric('assemblySpread');
    return `<g transform="translate(${launchX} ${launchY}) scale(${metric('assemblyScale')}) translate(${-x} ${-y})">${tile}</g>`;
});
const launchDrawing = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 65 65" width="${markWidth}" height="${markWidth}"><defs>${defs}${clips}</defs>${launchTiles.join('')}</svg>`;
const launch = resolve(assets, 'LearnCardLaunchPose.imageset');
await mkdir(launch, { recursive: true });
const images = [];
for (const scale of [1, 2, 3]) {
    const filename = `mark@${scale}x.png`;
    await sharp(Buffer.from(launchDrawing))
        .resize(markWidth * scale)
        .png()
        .toFile(resolve(launch, filename));
    images.push({ filename, idiom: 'universal', scale: `${scale}x` });
}
await writeFile(
    resolve(launch, 'Contents.json'),
    JSON.stringify({ images, info: { author: 'xcode', version: 1 } }, null, 4) + '\n'
);
// Launch storyboards cannot run SwiftUI transforms. Bake each rotated piece in a
// transparent square, then anchor its center with the same responsive geometry.
for (const [index, block] of backdrop.entries()) {
    const directory = resolve(assets, `LaunchPaint${index}.imageset`);
    await mkdir(directory, { recursive: true });
    const tile = paintedTiles[block.color];
    const composed = `<svg xmlns="http://www.w3.org/2000/svg" width="${block.size * 2}" height="${block.size * 2}"><g opacity="${metric('backdropOpacity')}" transform="translate(${block.size} ${block.size}) rotate(${block.rotation})"><svg viewBox="${tile.viewport}" x="${-block.size / 2}" y="${-block.size / 2}" width="${block.size}" height="${block.size}">${tile.content}</svg></g></svg>`;
    const blockImages = [];
    for (const scale of [1, 2, 3]) {
        const filename = `paint@${scale}x.png`;
        await sharp(Buffer.from(composed))
            .resize(block.size * 2 * scale)
            .png()
            .toFile(resolve(directory, filename));
        blockImages.push({ filename, idiom: 'universal', scale: `${scale}x` });
    }
    await writeFile(
        resolve(directory, 'Contents.json'),
        JSON.stringify({ images: blockImages, info: { author: 'xcode', version: 1 } }, null, 4) +
            '\n'
    );
}
const canvas = resolve(assets, 'LaunchCanvas.colorset');
await mkdir(canvas, { recursive: true });
const color = (r: number, g: number, b: number) => ({
    'color-space': 'srgb',
    // Integer-looking components use the 0–255 scale in the asset compiler.
    components: {
        red: String(r / 255),
        green: String(g / 255),
        blue: String(b / 255),
        alpha: '1.000',
    },
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
const ink = resolve(assets, 'LaunchInk.colorset');
await mkdir(ink, { recursive: true });
await writeFile(
    resolve(ink, 'Contents.json'),
    JSON.stringify(
        {
            colors: [
                { idiom: 'universal', color: color(24, 34, 78) },
                {
                    idiom: 'universal',
                    appearances: [{ appearance: 'luminosity', value: 'dark' }],
                    color: color(239, 240, 245),
                },
            ],
            info: { author: 'xcode', version: 1 },
        },
        null,
        4
    ) + '\n'
);
console.log(
    'Prepared nine editable pigment blocks, eight launch edge pieces and adaptive launch assets.'
);

// Use an explicit adaptive launch composition shared with SwiftUI.
// Static mark, canvas and layout match SwiftUI; animation starts only in the app.
await writeFile(
    resolve(assets, '../LearnCardLaunch.storyboard'),
    `<?xml version="1.0" encoding="UTF-8"?>
<document type="com.apple.InterfaceBuilder3.CocoaTouch.Storyboard.XIB" version="3.0" toolsVersion="26000" targetRuntime="iOS.CocoaTouch" propertyAccessControl="none" useAutolayout="YES" launchScreen="YES" useTraitCollections="YES" useSafeAreas="YES" colorMatched="YES" initialViewController="launch-controller">
    <device id="retina6_12" orientation="portrait" appearance="light"/>
    <dependencies><plugIn identifier="com.apple.InterfaceBuilder.IBCocoaTouchPlugin" version="26000"/><capability name="Named colors" minToolsVersion="9.0"/><capability name="documents saved in the Xcode 8 format" minToolsVersion="8.0"/></dependencies>
    <scenes><scene sceneID="launch-scene"><objects>
        <viewController id="launch-controller" sceneMemberID="viewController"><view key="view" clipsSubviews="YES" contentMode="scaleToFill" id="launch-view">
            <rect key="frame" x="0.0" y="0.0" width="393" height="852"/>
            <autoresizingMask key="autoresizingMask" widthSizable="YES" heightSizable="YES"/>
            <subviews>${backdrop
                .map(
                    (block, index) => `
            <imageView userInteractionEnabled="NO" contentMode="scaleAspectFit" image="LaunchPaint${index}" translatesAutoresizingMaskIntoConstraints="NO" id="launch-paint-${index}">
                <rect key="frame" x="${393 * block.x - block.size}" y="${852 * block.y - block.size}" width="${block.size * 2}" height="${block.size * 2}"/>
                <constraints><constraint firstAttribute="width" constant="${block.size * 2}" id="paint-width-${index}"/><constraint firstAttribute="height" constant="${block.size * 2}" id="paint-height-${index}"/></constraints>
            </imageView>`
                )
                .join('')}
            <imageView clipsSubviews="YES" userInteractionEnabled="NO" contentMode="scaleAspectFit" image="LearnCardLaunchPose" translatesAutoresizingMaskIntoConstraints="NO" id="launch-mark">
                <rect key="frame" x="84.5" y="198.98" width="224" height="224"/>
                <constraints><constraint firstAttribute="width" relation="lessThanOrEqual" constant="${markWidth}" id="mark-maximum"/><constraint firstAttribute="height" secondItem="launch-mark" secondAttribute="width" id="mark-square"/></constraints>
            </imageView>
            <label opaque="NO" userInteractionEnabled="NO" contentMode="left" text="LearnCard" textAlignment="center" translatesAutoresizingMaskIntoConstraints="NO" id="launch-wordmark">
                <rect key="frame" x="84.5" y="440.98" width="224" height="39"/>
                <fontDescription key="fontDescription" type="boldSystem" pointSize="${metric('wordmarkSize')}"/>
                <color key="textColor" name="LaunchInk"/>
            </label></subviews>
            <viewLayoutGuide key="safeArea" id="launch-safe"/>
            <color key="backgroundColor" name="LaunchCanvas"/>
            <constraints>
                ${backdrop
                    .map(
                        (
                            block,
                            index
                        ) => `<constraint firstItem="launch-paint-${index}" firstAttribute="centerX" secondItem="launch-view" secondAttribute="${block.x === 0 ? 'leading' : 'centerX'}"${block.x === 0 ? '' : ` multiplier="${block.x * 2}"`} id="paint-x-${index}"/>
                <constraint firstItem="launch-paint-${index}" firstAttribute="centerY" secondItem="launch-view" secondAttribute="centerY" multiplier="${block.y * 2}" id="paint-y-${index}"/>`
                    )
                    .join('\n                ')}
                <constraint firstItem="launch-mark" firstAttribute="centerX" secondItem="launch-view" secondAttribute="centerX" id="mark-center-x"/>
                <constraint firstItem="launch-mark" firstAttribute="centerY" secondItem="launch-view" secondAttribute="centerY" multiplier="${metric('markCenterFraction') * 2}" id="mark-center-y"/>
                <constraint firstItem="launch-mark" firstAttribute="width" secondItem="launch-view" secondAttribute="width" multiplier="${metric('markWidthFraction')}" priority="750" id="mark-responsive-width"/>
                <constraint firstItem="launch-wordmark" firstAttribute="centerX" secondItem="launch-view" secondAttribute="centerX" id="wordmark-center-x"/>
                <constraint firstItem="launch-wordmark" firstAttribute="top" secondItem="launch-mark" secondAttribute="bottom" constant="${metric('wordmarkGap')}" id="wordmark-top"/>
            </constraints>
        </view></viewController>
        <placeholder placeholderIdentifier="IBFirstResponder" id="launch-responder" userLabel="First Responder" sceneMemberID="firstResponder"/>
    </objects></scene></scenes>
    <resources><image name="LearnCardLaunchPose" width="${markWidth}" height="${markWidth}"/>${backdrop.map((block, index) => `<image name="LaunchPaint${index}" width="${block.size * 2}" height="${block.size * 2}"/>`).join('')}<namedColor name="LaunchCanvas"><color red="0.9372549019607843" green="0.9411764705882353" blue="0.9607843137254902" alpha="1" colorSpace="custom" customColorSpace="sRGB"/></namedColor><namedColor name="LaunchInk"><color red="0.09411764705882353" green="0.13333333333333333" blue="0.3058823529411765" alpha="1" colorSpace="custom" customColorSpace="sRGB"/></namedColor></resources>
</document>
`
);

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
