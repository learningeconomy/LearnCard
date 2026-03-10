/**
 * generate-tenant-assets.ts
 *
 * Generates all image assets for a tenant from a single source logo.
 *
 * Usage:
 *   npx tsx scripts/generate-tenant-assets.ts <tenant> <logo-path> [options]
 *
 * Options:
 *   --bg <hex>        Background color for icons (default: #FFFFFF)
 *   --splash-bg <hex> Splash screen background color (defaults to --bg)
 *   --no-splash       Skip splash screen generation
 *
 * Outputs to: environments/<tenant>/assets/
 *
 * Generated structure:
 *   environments/<tenant>/assets/
 *   ├── ios/
 *   │   ├── AppIcon.png                     1024×1024
 *   │   ├── splash-2732x2732.png            2732×2732
 *   │   ├── splash-2732x2732-1.png          2732×2732
 *   │   └── splash-2732x2732-2.png          2732×2732
 *   ├── android/
 *   │   ├── mipmap-{density}/
 *   │   │   ├── ic_launcher.webp
 *   │   │   ├── ic_launcher_foreground.webp
 *   │   │   └── ic_launcher_round.webp
 *   │   ├── drawable/
 *   │   │   ├── ic_launcher_background.xml
 *   │   │   └── splash.9.png
 *   │   ├── drawable-{port|land}-{density}/
 *   │   │   └── splash.9.png
 *   │   └── values/
 *   │       └── ic_launcher_background.xml
 *   └── web/
 *       ├── favicon.png                     64×64
 *       └── icon.png                        512×512
 *
 * After generation, run:
 *   npx tsx scripts/prepare-native-config.ts <tenant>
 * to copy config + assets into the Capacitor project.
 */

import sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const APP_ROOT = path.resolve(__dirname, '..');
const ENVIRONMENTS_DIR = path.join(APP_ROOT, 'environments');

/** Android mipmap density buckets and their scale factors */
const ANDROID_DENSITIES = [
    { name: 'mdpi', scale: 1 },
    { name: 'hdpi', scale: 1.5 },
    { name: 'xhdpi', scale: 2 },
    { name: 'xxhdpi', scale: 3 },
    { name: 'xxxhdpi', scale: 4 },
] as const;

/** Base sizes in dp (mdpi = 1x) */
const ANDROID_ICON_BASE_DP = 48;
const ANDROID_FOREGROUND_BASE_DP = 108;

/**
 * Android splash screen sizes (portrait orientation).
 * Landscape variants swap width ↔ height.
 */
const ANDROID_SPLASH_SIZES: Record<string, { width: number; height: number }> = {
    ldpi: { width: 200, height: 320 },
    mdpi: { width: 320, height: 480 },
    hdpi: { width: 480, height: 800 },
    xhdpi: { width: 720, height: 1280 },
    xxhdpi: { width: 960, height: 1600 },
    xxxhdpi: { width: 1280, height: 1920 },
};

/**
 * The adaptive icon safe zone — logo should occupy roughly the inner 66/108
 * of the foreground canvas to stay inside the visible mask region.
 */
const ADAPTIVE_LOGO_RATIO = 0.61;

/** Logo occupies this fraction of the shorter splash dimension */
const SPLASH_LOGO_RATIO = 0.25;

/** Padding ratio for legacy/round icons (inset from edge) */
const ICON_PADDING_RATIO = 0.1;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface RGB {
    r: number;
    g: number;
    b: number;
}

const parseHexColor = (hex: string): RGB => {
    const h = hex.replace('#', '');

    return {
        r: parseInt(h.substring(0, 2), 16),
        g: parseInt(h.substring(2, 4), 16),
        b: parseInt(h.substring(4, 6), 16),
    };
};

const ensureDir = (dir: string): void => {
    fs.mkdirSync(dir, { recursive: true });
};

const countFiles = (dir: string): number => {
    let count = 0;

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
            count += countFiles(path.join(dir, entry.name));
        } else {
            count++;
        }
    }

    return count;
};

// ---------------------------------------------------------------------------
// Image generators
// ---------------------------------------------------------------------------

/**
 * Resize logo onto a solid-color square background with padding.
 * Used for legacy Android icons, iOS app icon, and web icons.
 */
const generateSquareIcon = async (
    logoBuffer: Buffer,
    size: number,
    bgColor: RGB,
    outputPath: string,
    format: 'png' | 'webp' = 'png',
): Promise<void> => {
    const padding = Math.round(size * ICON_PADDING_RATIO);
    const logoSize = size - padding * 2;

    const resizedLogo = await sharp(logoBuffer)
        .resize(logoSize, logoSize, { fit: 'contain', background: { ...bgColor, alpha: 0 } })
        .toBuffer();

    const pipeline = sharp({
        create: {
            width: size,
            height: size,
            channels: 4 as const,
            background: { ...bgColor, alpha: 255 },
        },
    }).composite([{ input: resizedLogo, gravity: 'centre' }]);

    if (format === 'webp') {
        await pipeline.webp({ quality: 90 }).toFile(outputPath);
    } else {
        await pipeline.png().toFile(outputPath);
    }
};

/**
 * Generate a circular icon for Android round launcher icon.
 * Logo on colored background, clipped to a circle.
 */
const generateRoundIcon = async (
    logoBuffer: Buffer,
    size: number,
    bgColor: RGB,
    outputPath: string,
): Promise<void> => {
    const padding = Math.round(size * ICON_PADDING_RATIO);
    const logoSize = size - padding * 2;

    const resizedLogo = await sharp(logoBuffer)
        .resize(logoSize, logoSize, { fit: 'contain', background: { ...bgColor, alpha: 0 } })
        .toBuffer();

    const circleMask = Buffer.from(
        `<svg width="${size}" height="${size}">
            <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="white"/>
        </svg>`
    );

    await sharp({
        create: {
            width: size,
            height: size,
            channels: 4 as const,
            background: { ...bgColor, alpha: 255 },
        },
    })
        .composite([
            { input: resizedLogo, gravity: 'centre' },
            { input: circleMask, blend: 'dest-in' },
        ])
        .webp({ quality: 90 })
        .toFile(outputPath);
};

/**
 * Generate an adaptive icon foreground layer.
 * Logo centered on transparent background, respecting the safe zone.
 */
const generateAdaptiveForeground = async (
    logoBuffer: Buffer,
    size: number,
    outputPath: string,
): Promise<void> => {
    const logoSize = Math.round(size * ADAPTIVE_LOGO_RATIO);

    const resizedLogo = await sharp(logoBuffer)
        .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .toBuffer();

    await sharp({
        create: {
            width: size,
            height: size,
            channels: 4 as const,
            background: { r: 0, g: 0, b: 0, alpha: 0 },
        },
    })
        .composite([{ input: resizedLogo, gravity: 'centre' }])
        .webp({ quality: 90 })
        .toFile(outputPath);
};

/**
 * Create a splash image — logo centered on a solid background.
 * Returns a raw PNG buffer.
 */
const generateSplashImage = async (
    logoBuffer: Buffer,
    width: number,
    height: number,
    bgColor: RGB,
): Promise<Buffer> => {
    const minDim = Math.min(width, height);
    const logoSize = Math.round(minDim * SPLASH_LOGO_RATIO);

    const resizedLogo = await sharp(logoBuffer)
        .resize(logoSize, logoSize, { fit: 'contain', background: { ...bgColor, alpha: 0 } })
        .toBuffer();

    return sharp({
        create: {
            width,
            height,
            channels: 4 as const,
            background: { ...bgColor, alpha: 255 },
        },
    })
        .composite([{ input: resizedLogo, gravity: 'centre' }])
        .png()
        .toBuffer();
};

/**
 * Generate an Android 9-patch splash screen.
 *
 * A 9-patch PNG is a standard PNG with a 1px transparent border.
 * Black pixels on the top/left edges mark stretchable regions;
 * black pixels on the bottom/right edges mark the content area.
 * For a solid-color splash we mark the entire edge as stretchable.
 */
const generateNinePatchSplash = async (
    logoBuffer: Buffer,
    width: number,
    height: number,
    bgColor: RGB,
    outputPath: string,
): Promise<void> => {
    const splashBuffer = await generateSplashImage(logoBuffer, width, height, bgColor);

    // Black pixel strips for the 9-patch markers
    const topMarker = await sharp({
        create: { width, height: 1, channels: 4 as const, background: { r: 0, g: 0, b: 0, alpha: 255 } },
    }).png().toBuffer();

    const leftMarker = await sharp({
        create: { width: 1, height, channels: 4 as const, background: { r: 0, g: 0, b: 0, alpha: 255 } },
    }).png().toBuffer();

    const bottomMarker = await sharp({
        create: { width, height: 1, channels: 4 as const, background: { r: 0, g: 0, b: 0, alpha: 255 } },
    }).png().toBuffer();

    const rightMarker = await sharp({
        create: { width: 1, height, channels: 4 as const, background: { r: 0, g: 0, b: 0, alpha: 255 } },
    }).png().toBuffer();

    await sharp({
        create: {
            width: width + 2,
            height: height + 2,
            channels: 4 as const,
            background: { r: 0, g: 0, b: 0, alpha: 0 },
        },
    })
        .composite([
            { input: splashBuffer, left: 1, top: 1 },
            { input: topMarker, left: 1, top: 0 },
            { input: leftMarker, left: 0, top: 1 },
            { input: bottomMarker, left: 1, top: height + 1 },
            { input: rightMarker, left: width + 1, top: 1 },
        ])
        .png()
        .toFile(outputPath);
};

// ---------------------------------------------------------------------------
// Android XML generators
// ---------------------------------------------------------------------------

/**
 * Generate the Android adaptive icon background color resources.
 * - values/ic_launcher_background.xml  (color resource)
 * - drawable/ic_launcher_background.xml (vector drawable)
 */
const generateAndroidBackgroundXml = (bgHex: string, androidDir: string): void => {
    const valuesDir = path.join(androidDir, 'values');
    ensureDir(valuesDir);

    fs.writeFileSync(
        path.join(valuesDir, 'ic_launcher_background.xml'),
        [
            '<?xml version="1.0" encoding="utf-8"?>',
            '<resources>',
            `    <color name="ic_launcher_background">${bgHex}</color>`,
            '</resources>',
            '',
        ].join('\n'),
    );

    const drawableDir = path.join(androidDir, 'drawable');
    ensureDir(drawableDir);

    fs.writeFileSync(
        path.join(drawableDir, 'ic_launcher_background.xml'),
        [
            '<?xml version="1.0" encoding="utf-8"?>',
            '<vector',
            '    android:height="108dp"',
            '    android:width="108dp"',
            '    android:viewportHeight="108"',
            '    android:viewportWidth="108"',
            '    xmlns:android="http://schemas.android.com/apk/res/android">',
            `    <path android:fillColor="${bgHex}"`,
            '          android:pathData="M0,0h108v108h-108z"/>',
            '</vector>',
            '',
        ].join('\n'),
    );
};

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

const generateIosAssets = async (
    logoBuffer: Buffer,
    bgColor: RGB,
    splashColor: RGB,
    outDir: string,
    skipSplash: boolean,
): Promise<void> => {
    const iosDir = path.join(outDir, 'ios');
    ensureDir(iosDir);

    console.log('  📱 iOS App Icon (1024×1024)...');
    await generateSquareIcon(logoBuffer, 1024, bgColor, path.join(iosDir, 'AppIcon.png'));

    if (!skipSplash) {
        console.log('  📱 iOS Splash Screens (2732×2732 × 3)...');

        const splashBuffer = await generateSplashImage(logoBuffer, 2732, 2732, splashColor);

        for (const name of ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png']) {
            fs.writeFileSync(path.join(iosDir, name), splashBuffer);
        }
    }
};

const generateAndroidIcons = async (
    logoBuffer: Buffer,
    bgColor: RGB,
    bgHex: string,
    outDir: string,
): Promise<void> => {
    const androidDir = path.join(outDir, 'android');

    console.log('  🤖 Android Adaptive + Legacy + Round Icons...');

    for (const { name, scale } of ANDROID_DENSITIES) {
        const mipmapDir = path.join(androidDir, `mipmap-${name}`);
        ensureDir(mipmapDir);

        const iconSize = Math.round(ANDROID_ICON_BASE_DP * scale);
        const fgSize = Math.round(ANDROID_FOREGROUND_BASE_DP * scale);

        await Promise.all([
            generateSquareIcon(logoBuffer, iconSize, bgColor, path.join(mipmapDir, 'ic_launcher.webp'), 'webp'),
            generateAdaptiveForeground(logoBuffer, fgSize, path.join(mipmapDir, 'ic_launcher_foreground.webp')),
            generateRoundIcon(logoBuffer, iconSize, bgColor, path.join(mipmapDir, 'ic_launcher_round.webp')),
        ]);
    }

    console.log('  🤖 Android Background XMLs...');
    generateAndroidBackgroundXml(bgHex, androidDir);
};

const generateAndroidSplashScreens = async (
    logoBuffer: Buffer,
    splashColor: RGB,
    outDir: string,
): Promise<void> => {
    const androidDir = path.join(outDir, 'android');

    console.log('  🤖 Android Splash Screens (9-patch)...');

    for (const [density, dims] of Object.entries(ANDROID_SPLASH_SIZES)) {
        // Default density-qualified drawable (no orientation)
        const defaultDir = path.join(androidDir, `drawable-${density}`);
        ensureDir(defaultDir);
        await generateNinePatchSplash(
            logoBuffer, dims.width, dims.height, splashColor,
            path.join(defaultDir, 'splash.9.png'),
        );

        // Portrait
        const portDir = path.join(androidDir, `drawable-port-${density}`);
        ensureDir(portDir);
        await generateNinePatchSplash(
            logoBuffer, dims.width, dims.height, splashColor,
            path.join(portDir, 'splash.9.png'),
        );

        // Landscape (swap dimensions)
        const landDir = path.join(androidDir, `drawable-land-${density}`);
        ensureDir(landDir);
        await generateNinePatchSplash(
            logoBuffer, dims.height, dims.width, splashColor,
            path.join(landDir, 'splash.9.png'),
        );
    }

    // Default drawable (no density qualifier) — uses mdpi-equivalent size
    const defaultDrawable = path.join(androidDir, 'drawable');
    ensureDir(defaultDrawable);
    await generateNinePatchSplash(
        logoBuffer, 480, 800, splashColor,
        path.join(defaultDrawable, 'splash.9.png'),
    );
};

const generateWebAssets = async (
    logoBuffer: Buffer,
    bgColor: RGB,
    outDir: string,
): Promise<void> => {
    const webDir = path.join(outDir, 'web');
    ensureDir(webDir);

    console.log('  🌐 Web Favicon (64×64) + PWA Icon (512×512)...');

    await Promise.all([
        generateSquareIcon(logoBuffer, 64, bgColor, path.join(webDir, 'favicon.png')),
        generateSquareIcon(logoBuffer, 512, bgColor, path.join(webDir, 'icon.png')),
    ]);
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const main = async (): Promise<void> => {
    const args = process.argv.slice(2);

    if (args.length < 2) {
        console.log(`
Usage:
  npx tsx scripts/generate-tenant-assets.ts <tenant> <logo-path> [options]

Options:
  --bg <hex>        Icon background color      (default: #FFFFFF)
  --splash-bg <hex> Splash background color    (defaults to --bg)
  --no-splash       Skip splash screen generation

Example:
  npx tsx scripts/generate-tenant-assets.ts vetpass ~/logo.png --bg "#1A3C5E" --splash-bg "#0D1F30"
`);
        process.exit(1);
    }

    const tenant = args[0]!;
    const logoPath = path.resolve(args[1]!);

    let bgHex = '#FFFFFF';
    let splashBgHex: string | undefined;
    let skipSplash = false;

    for (let i = 2; i < args.length; i++) {
        if (args[i] === '--bg' && args[i + 1]) {
            bgHex = args[++i]!;
        } else if (args[i] === '--splash-bg' && args[i + 1]) {
            splashBgHex = args[++i]!;
        } else if (args[i] === '--no-splash') {
            skipSplash = true;
        }
    }

    const splashBg = splashBgHex ?? bgHex;
    const bgColor = parseHexColor(bgHex);
    const splashColor = parseHexColor(splashBg);

    // Validate logo file
    if (!fs.existsSync(logoPath)) {
        console.error(`Logo file not found: ${logoPath}`);
        process.exit(1);
    }

    const logoBuffer = fs.readFileSync(logoPath);
    const logoMeta = await sharp(logoBuffer).metadata();

    if (!logoMeta.width || !logoMeta.height) {
        console.error('Could not read logo dimensions.');
        process.exit(1);
    }

    if (logoMeta.width < 1024 || logoMeta.height < 1024) {
        console.warn(
            `⚠  Logo is ${logoMeta.width}×${logoMeta.height}. ` +
            `Recommended minimum is 1024×1024 for best quality.`
        );
    }

    const outDir = path.join(ENVIRONMENTS_DIR, tenant, 'assets');

    // Clean previous output
    if (fs.existsSync(outDir)) {
        fs.rmSync(outDir, { recursive: true });
    }

    console.log(`\n🎨 Generating assets for tenant "${tenant}"\n`);
    console.log(`  Logo:       ${logoPath} (${logoMeta.width}×${logoMeta.height})`);
    console.log(`  Icon BG:    ${bgHex}`);
    console.log(`  Splash BG:  ${splashBg}`);
    console.log(`  Output:     ${outDir}\n`);

    // Generate all asset categories
    await generateIosAssets(logoBuffer, bgColor, splashColor, outDir, skipSplash);
    await generateAndroidIcons(logoBuffer, bgColor, bgHex, outDir);

    if (!skipSplash) {
        await generateAndroidSplashScreens(logoBuffer, splashColor, outDir);
    }

    await generateWebAssets(logoBuffer, bgColor, outDir);

    // Summary
    const fileCount = countFiles(outDir);

    console.log(`\n✅ Generated ${fileCount} asset files in:\n   ${outDir}\n`);
    console.log('Next steps:');
    console.log(`  1. Review the generated assets in environments/${tenant}/assets/`);
    console.log(`  2. Run:  npx tsx scripts/prepare-native-config.ts ${tenant}`);
    console.log('     This copies config + assets into the Capacitor project.\n');
};

main().catch((err) => {
    console.error('\n❌ Asset generation failed:', err);
    process.exit(1);
});
