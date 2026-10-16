import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

// Inspect the compiled catalog: source JSON alpha "1" compiled as 1/255, which
// passed SwiftUI checks but made the real system launch background look black.
const app = resolve(
    process.argv[2] ??
        resolve(
            import.meta.dir,
            '../ios/.derivedData/Build/Products/Debug-iphonesimulator/LearnCardNative.app'
        )
);
const info = JSON.parse(
    execFileSync('plutil', ['-convert', 'json', '-o', '-', resolve(app, 'Info.plist')], {
        encoding: 'utf8',
    })
);
assert.equal(info.UILaunchStoryboardName, 'LearnCardLaunch');
assert(
    existsSync(resolve(app, 'LearnCardLaunch.storyboardc')),
    'Compiled launch storyboard is missing'
);
const catalog = JSON.parse(
    execFileSync('xcrun', ['assetutil', '--info', resolve(app, 'Assets.car')], { encoding: 'utf8' })
) as {
    Name?: string;
    Appearance?: string;
    AssetType?: string;
    'Color components'?: number[];
}[];
const canvases = catalog.filter(
    asset => asset.AssetType === 'Color' && asset.Name === 'LaunchCanvas'
);
for (const name of [
    'LearnCardLaunchPose',
    ...Array.from({ length: 8 }, (_, index) => `LaunchPaint${index}`),
]) {
    assert(
        catalog.some(asset => asset.Name === name),
        `Missing compiled launch artwork: ${name}`
    );
}
const inks = catalog.filter(asset => asset.AssetType === 'Color' && asset.Name === 'LaunchInk');
assert.equal(inks.length, 2, 'Both wordmark appearances must be compiled');
for (const [appearance, expected] of [
    [undefined, [24 / 255, 34 / 255, 78 / 255, 1]],
    ['UIAppearanceDark', [239 / 255, 240 / 255, 245 / 255, 1]],
] as const) {
    const components = inks.find(asset => asset.Appearance === appearance)?.['Color components'];
    assert.equal(components?.length, 4, `Missing wordmark ink: ${appearance ?? 'light'}`);
    expected.forEach((component, index) =>
        assert(
            Math.abs(components![index] - component) < 0.000001,
            `Launch ${appearance ?? 'light'} wordmark RGBA component ${index} differs from the running wordmark`
        )
    );
}
assert.equal(canvases.length, 2, 'Both launch appearances must be compiled');
for (const [appearance, expected] of [
    [undefined, [239 / 255, 240 / 255, 245 / 255, 1]],
    ['UIAppearanceDark', [17 / 255, 21 / 255, 28 / 255, 1]],
] as const) {
    const components = canvases.find(asset => asset.Appearance === appearance)?.[
        'Color components'
    ];
    assert.equal(components?.length, 4, `Missing launch canvas: ${appearance ?? 'light'}`);
    expected.forEach((component, index) =>
        assert(
            Math.abs(components![index] - component) < 0.000001,
            `Launch ${appearance ?? 'light'} RGBA component ${index} differs from the running canvas`
        )
    );
}
console.log(
    'Compiled launch assets verified: matching opaque canvases, adaptive wordmark ink, painted logo, eight edge pieces and launch storyboard.'
);
