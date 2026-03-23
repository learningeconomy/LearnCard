/**
 * generate-tenant-assets.ts
 *
 * Generates all image assets for a tenant from a single source logo.
 *
 * Usage:
 *   npx tsx scripts/generate-tenant-assets.ts <tenant> <logo-path> [options]
 *
 * Options:
 *   --bg <hex>              Background color for icons (default: #FFFFFF)
 *   --splash-bg <hex>       Splash screen background color (defaults to --bg)
 *   --no-splash             Skip splash screen generation
 *   --name <text>           Tenant display name for text logo (auto-read from
 *                           environments/<tenant>/config.json branding.name if not set)
 *   --text-logo <path>      Override: use this file instead of auto-generating
 *   --desktop-bg <path>     Override: use this file instead of auto-generating
 *   --desktop-bg-alt <path> Override: use this file instead of auto-generating
 *
 * Outputs to: environments/<tenant>/assets/
 *
 * Generated structure:
 *   environments/<tenant>/assets/
 *   ├── branding/
 *   │   ├── app-icon.png                    200×200  (auto-generated)
 *   │   ├── brand-mark.png                  200×200  (auto-generated)
 *   │   ├── text-logo.svg                   (auto-generated or --text-logo)
 *   │   ├── desktop-login-bg.png            (auto-generated or --desktop-bg)
 *   │   └── desktop-login-bg-alt.png        (auto-generated or --desktop-bg-alt)
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
 *   │   │   ├── ic_notification.png          96×96   (white silhouette)
 *   │   │   ├── ic_stat_name.png             96×96   (white silhouette)
 *   │   │   └── splash.9.png
 *   │   ├── drawable-{mdpi..xxxhdpi}/
 *   │   │   ├── ic_stat_name.png             24→96px (white silhouette)
 *   │   │   └── ic_action_name.png           24→96px (white silhouette)
 *   │   ├── drawable-{port|land}-{density}/
 *   │   │   └── splash.9.png
 *   │   └── values/
 *   │       └── ic_launcher_background.xml
 *   └── web/
 *       ├── favicon.png                     64×64
 *       ├── icon.png                        512×512
 *       ├── icon-192.png                    192×192
 *       └── apple-touch-icon.png            180×180
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

/** In-app branding icon size (used for app-icon and brand-mark) */
const BRANDING_ICON_SIZE = 200;

/**
 * Android notification icon base size in dp.
 * ic_stat_name / ic_action_name follow the same density scale as launcher icons.
 */
const ANDROID_NOTIFICATION_BASE_DP = 24;

/** Default (non-density-qualified) notification icon size */
const ANDROID_NOTIFICATION_DEFAULT_SIZE = 96;

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
 * Generate a white-silhouette notification icon on a transparent background.
 *
 * Android requires notification icons to be white (#FFFFFF) on transparent.
 * We convert the logo to greyscale, threshold to create an alpha mask, then
 * composite solid white through that mask.
 */
const generateSilhouetteIcon = async (
    logoBuffer: Buffer,
    size: number,
    outputPath: string,
): Promise<void> => {
    const padding = Math.round(size * ICON_PADDING_RATIO);
    const logoSize = size - padding * 2;

    // Extract alpha from the resized logo — non-transparent pixels become the silhouette.
    // For logos without alpha (opaque PNGs), we derive alpha from luminance.
    const resized = sharp(logoBuffer)
        .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } });

    const { hasAlpha } = await sharp(logoBuffer).metadata();

    let alphaMask: Buffer;

    if (hasAlpha) {
        // Use the existing alpha channel as-is
        alphaMask = await resized.extractChannel('alpha').toBuffer();
    } else {
        // Opaque image — derive alpha from inverted greyscale (dark pixels → opaque)
        alphaMask = await resized.greyscale().negate().toBuffer();
    }

    // Solid white at the logo size
    const whitePlane = await sharp({
        create: {
            width: logoSize,
            height: logoSize,
            channels: 3 as const,
            background: { r: 255, g: 255, b: 255 },
        },
    }).png().toBuffer();

    // Join white RGB + alpha mask → white silhouette
    const silhouette = await sharp(whitePlane)
        .joinChannel(alphaMask)
        .toBuffer();

    // Composite onto transparent canvas with padding
    await sharp({
        create: {
            width: size,
            height: size,
            channels: 4 as const,
            background: { r: 0, g: 0, b: 0, alpha: 0 },
        },
    })
        .composite([{ input: silhouette, gravity: 'centre' }])
        .png()
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
// In-app branding asset generators
// ---------------------------------------------------------------------------

/** Desktop login background dimensions */
const DESKTOP_BG_WIDTH = 1920;
const DESKTOP_BG_HEIGHT = 1080;

interface BrandingOptions {
    tenantDisplayName: string;
    textLogoPath?: string;
    desktopBgPath?: string;
    desktopBgAltPath?: string;
}

/**
 * Generate a text-logo SVG — the tenant name in uppercase, letter-spaced,
 * using `fill="currentColor"` so it inherits CSS text color (just like the
 * original LEARNCARD wordmark).
 *
 * Uses a system sans-serif font. The viewBox is sized to fit the text with
 * generous letter-spacing matching the original aesthetic.
 */
const generateTextLogoSvg = (name: string): string => {
    const text = name.toUpperCase();
    const fontSize = 18;
    const letterSpacing = 6;

    // Rough width estimate: ~11px per character at font-size 18 + letter-spacing
    const charWidth = fontSize * 0.62;
    const totalWidth = Math.ceil(text.length * (charWidth + letterSpacing));
    const height = 24;

    return [
        `<svg width="${totalWidth}" height="${height}" viewBox="0 0 ${totalWidth} ${height}"`,
        '     fill="none" xmlns="http://www.w3.org/2000/svg">',
        `  <text x="0" y="${fontSize}"`,
        '        font-family="Poppins, \'Noto Sans\', system-ui, -apple-system, sans-serif"',
        `        font-size="${fontSize}" font-weight="700"`,
        `        letter-spacing="${letterSpacing}" fill="currentColor">`,
        `    ${text}`,
        '  </text>',
        '</svg>',
        '',
    ].join('\n');
};

/**
 * Darken an RGB color by a factor (0 = same, 1 = black).
 */
const darkenColor = (color: RGB, factor: number): RGB => ({
    r: Math.round(color.r * (1 - factor)),
    g: Math.round(color.g * (1 - factor)),
    b: Math.round(color.b * (1 - factor)),
});

/**
 * Lighten an RGB color by a factor (0 = same, 1 = white).
 */
const lightenColor = (color: RGB, factor: number): RGB => ({
    r: Math.round(color.r + (255 - color.r) * factor),
    g: Math.round(color.g + (255 - color.g) * factor),
    b: Math.round(color.b + (255 - color.b) * factor),
});

const rgbToHex = (c: RGB): string =>
    `#${c.r.toString(16).padStart(2, '0')}${c.g.toString(16).padStart(2, '0')}${c.b.toString(16).padStart(2, '0')}`;

/**
 * Generate a gradient desktop login background.
 * Creates a modern radial gradient from the base color, similar to the
 * LearnCard default login backgrounds.
 */
const generateDesktopBg = async (
    baseColor: RGB,
    width: number,
    height: number,
    outputPath: string,
    variant: 'primary' | 'alt' = 'primary',
): Promise<void> => {
    const light = lightenColor(baseColor, variant === 'primary' ? 0.15 : 0.25);
    const dark = darkenColor(baseColor, variant === 'primary' ? 0.3 : 0.15);
    const mid = variant === 'primary' ? rgbToHex(baseColor) : rgbToHex(lightenColor(baseColor, 0.1));

    // Radial gradient from center (lighter) to edges (darker) with a subtle
    // offset for visual interest — different angle for the alt variant.
    const cx = variant === 'primary' ? '40%' : '60%';
    const cy = variant === 'primary' ? '35%' : '55%';

    const svg = [
        `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`,
        '  <defs>',
        `    <radialGradient id="bg" cx="${cx}" cy="${cy}" r="75%" fx="${cx}" fy="${cy}">`,
        `      <stop offset="0%" stop-color="${rgbToHex(light)}"/>`,
        `      <stop offset="50%" stop-color="${mid}"/>`,
        `      <stop offset="100%" stop-color="${rgbToHex(dark)}"/>`,
        '    </radialGradient>',
        '  </defs>',
        `  <rect width="${width}" height="${height}" fill="url(#bg)"/>`,
        '</svg>',
    ].join('\n');

    await sharp(Buffer.from(svg)).png().toFile(outputPath);
};

const generateBrandingAssets = async (
    logoBuffer: Buffer,
    bgColor: RGB,
    outDir: string,
    options: BrandingOptions,
): Promise<void> => {
    const brandingDir = path.join(outDir, 'branding');
    ensureDir(brandingDir);

    // 1. App icon + brand mark (always auto-generated from logo)
    console.log(`  🎨 In-app Branding: app-icon.png + brand-mark.png (${BRANDING_ICON_SIZE}×${BRANDING_ICON_SIZE})...`);

    await Promise.all([
        generateSquareIcon(logoBuffer, BRANDING_ICON_SIZE, bgColor, path.join(brandingDir, 'app-icon.png')),
        generateSquareIcon(logoBuffer, BRANDING_ICON_SIZE, bgColor, path.join(brandingDir, 'brand-mark.png')),
    ]);

    // 2. Text logo — override file or auto-generate SVG from tenant name
    if (options.textLogoPath) {
        if (!fs.existsSync(options.textLogoPath)) {
            console.warn(`  ⚠  --text-logo file not found: ${options.textLogoPath}`);
        } else {
            const ext = path.extname(options.textLogoPath);
            const dest = path.join(brandingDir, `text-logo${ext}`);
            fs.cpSync(options.textLogoPath, dest);
            console.log(`  🎨 Copied text-logo${ext} (override)`);
        }
    } else {
        const svg = generateTextLogoSvg(options.tenantDisplayName);
        fs.writeFileSync(path.join(brandingDir, 'text-logo.svg'), svg, 'utf-8');
        console.log(`  🎨 Auto-generated text-logo.svg ("${options.tenantDisplayName.toUpperCase()}")`);
    }

    // 3. Desktop login background — override file or auto-generate gradient
    if (options.desktopBgPath) {
        if (!fs.existsSync(options.desktopBgPath)) {
            console.warn(`  ⚠  --desktop-bg file not found: ${options.desktopBgPath}`);
        } else {
            const ext = path.extname(options.desktopBgPath);
            const dest = path.join(brandingDir, `desktop-login-bg${ext}`);
            fs.cpSync(options.desktopBgPath, dest);
            console.log(`  🎨 Copied desktop-login-bg${ext} (override)`);
        }
    } else {
        await generateDesktopBg(bgColor, DESKTOP_BG_WIDTH, DESKTOP_BG_HEIGHT, path.join(brandingDir, 'desktop-login-bg.png'), 'primary');
        console.log(`  🎨 Auto-generated desktop-login-bg.png (${DESKTOP_BG_WIDTH}×${DESKTOP_BG_HEIGHT} gradient)`);
    }

    // 4. Desktop login background alt — override file or auto-generate gradient variant
    if (options.desktopBgAltPath) {
        if (!fs.existsSync(options.desktopBgAltPath)) {
            console.warn(`  ⚠  --desktop-bg-alt file not found: ${options.desktopBgAltPath}`);
        } else {
            const ext = path.extname(options.desktopBgAltPath);
            const dest = path.join(brandingDir, `desktop-login-bg-alt${ext}`);
            fs.cpSync(options.desktopBgAltPath, dest);
            console.log(`  🎨 Copied desktop-login-bg-alt${ext} (override)`);
        }
    } else {
        await generateDesktopBg(bgColor, DESKTOP_BG_WIDTH, DESKTOP_BG_HEIGHT, path.join(brandingDir, 'desktop-login-bg-alt.png'), 'alt');
        console.log(`  🎨 Auto-generated desktop-login-bg-alt.png (${DESKTOP_BG_WIDTH}×${DESKTOP_BG_HEIGHT} gradient variant)`);
    }
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

const generateAndroidNotificationIcons = async (
    logoBuffer: Buffer,
    outDir: string,
): Promise<void> => {
    const androidDir = path.join(outDir, 'android');

    console.log('  🔔 Android Notification Icons (white silhouette)...');

    // Density-qualified ic_stat_name + ic_action_name
    for (const { name, scale } of ANDROID_DENSITIES) {
        const drawableDir = path.join(androidDir, `drawable-${name}`);
        ensureDir(drawableDir);

        const iconSize = Math.round(ANDROID_NOTIFICATION_BASE_DP * scale);

        await Promise.all([
            generateSilhouetteIcon(logoBuffer, iconSize, path.join(drawableDir, 'ic_stat_name.png')),
            generateSilhouetteIcon(logoBuffer, iconSize, path.join(drawableDir, 'ic_action_name.png')),
        ]);
    }

    // Default (non-density-qualified) drawable — ic_notification + ic_stat_name
    const defaultDrawable = path.join(androidDir, 'drawable');
    ensureDir(defaultDrawable);

    await Promise.all([
        generateSilhouetteIcon(logoBuffer, ANDROID_NOTIFICATION_DEFAULT_SIZE, path.join(defaultDrawable, 'ic_notification.png')),
        generateSilhouetteIcon(logoBuffer, ANDROID_NOTIFICATION_DEFAULT_SIZE, path.join(defaultDrawable, 'ic_stat_name.png')),
    ]);
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

    console.log('  🌐 Web Favicon (64×64) + PWA Icons (192, 512) + Apple Touch Icon (180)...');

    await Promise.all([
        generateSquareIcon(logoBuffer, 64, bgColor, path.join(webDir, 'favicon.png')),
        generateSquareIcon(logoBuffer, 180, bgColor, path.join(webDir, 'apple-touch-icon.png')),
        generateSquareIcon(logoBuffer, 192, bgColor, path.join(webDir, 'icon-192.png')),
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
  --bg <hex>              Icon background color      (default: #FFFFFF)
  --splash-bg <hex>       Splash background color    (defaults to --bg)
  --no-splash             Skip splash screen generation
  --name <text>           Tenant display name for text logo
                          (auto-read from environments/<tenant>/config.json if not set)
  --text-logo <path>      Override: use this file instead of auto-generating
  --desktop-bg <path>     Override: use this file instead of auto-generating
  --desktop-bg-alt <path> Override: use this file instead of auto-generating

Example:
  npx tsx scripts/generate-tenant-assets.ts vetpass ~/logo.png --bg "#1A3C5E" --name "VetPass"
`);
        process.exit(1);
    }

    const tenant = args[0]!;
    const logoPath = path.resolve(args[1]!);

    let bgHex = '#FFFFFF';
    let splashBgHex: string | undefined;
    let skipSplash = false;
    let nameOverride: string | undefined;
    let textLogoPath: string | undefined;
    let desktopBgPath: string | undefined;
    let desktopBgAltPath: string | undefined;

    for (let i = 2; i < args.length; i++) {
        if (args[i] === '--bg' && args[i + 1]) {
            bgHex = args[++i]!;
        } else if (args[i] === '--splash-bg' && args[i + 1]) {
            splashBgHex = args[++i]!;
        } else if (args[i] === '--no-splash') {
            skipSplash = true;
        } else if (args[i] === '--name' && args[i + 1]) {
            nameOverride = args[++i]!;
        } else if (args[i] === '--text-logo' && args[i + 1]) {
            textLogoPath = path.resolve(args[++i]!);
        } else if (args[i] === '--desktop-bg' && args[i + 1]) {
            desktopBgPath = path.resolve(args[++i]!);
        } else if (args[i] === '--desktop-bg-alt' && args[i + 1]) {
            desktopBgAltPath = path.resolve(args[++i]!);
        }
    }

    // Resolve tenant display name: --name flag > tenant JSON branding.name > tenant arg
    let tenantDisplayName = nameOverride;

    if (!tenantDisplayName) {
        const tenantJsonPath = path.join(ENVIRONMENTS_DIR, tenant, 'config.json');

        if (fs.existsSync(tenantJsonPath)) {
            try {
                const tenantJson = JSON.parse(fs.readFileSync(tenantJsonPath, 'utf-8'));
                tenantDisplayName = tenantJson?.branding?.name ?? tenantJson?.branding?.headerText;
            } catch { /* ignore parse errors */ }
        }
    }

    if (!tenantDisplayName) {
        tenantDisplayName = tenant.charAt(0).toUpperCase() + tenant.slice(1);
        console.log(`  ℹ️  No --name or branding.name found — using "${tenantDisplayName}" for text logo.`);
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
    console.log(`  Name:       ${tenantDisplayName}`);
    console.log(`  Icon BG:    ${bgHex}`);
    console.log(`  Splash BG:  ${splashBg}`);
    console.log(`  Output:     ${outDir}\n`);

    // Generate all asset categories
    await generateIosAssets(logoBuffer, bgColor, splashColor, outDir, skipSplash);
    await generateAndroidIcons(logoBuffer, bgColor, bgHex, outDir);
    await generateAndroidNotificationIcons(logoBuffer, outDir);

    if (!skipSplash) {
        await generateAndroidSplashScreens(logoBuffer, splashColor, outDir);
    }

    await generateWebAssets(logoBuffer, bgColor, outDir);

    await generateBrandingAssets(logoBuffer, bgColor, outDir, {
        tenantDisplayName,
        textLogoPath,
        desktopBgPath,
        desktopBgAltPath,
    });

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
