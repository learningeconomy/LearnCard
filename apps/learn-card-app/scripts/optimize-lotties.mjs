#!/usr/bin/env node
/**
 * Lottie JSON Optimizer
 * 
 * Extracts embedded base64 PNG images from Lottie JSON files,
 * re-encodes them as WebP using sharp, and re-embeds them.
 * This typically achieves 70-80% file size reduction.
 */

import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

const LOTTIE_DIR = path.resolve(import.meta.dirname, '../public/lotties');
const WEBP_QUALITY = 80;

async function optimizeLottieFile(filePath) {
    const fileName = path.basename(filePath);
    const raw = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(raw);
    const originalSize = Buffer.byteLength(raw, 'utf-8');

    let imagesOptimized = 0;
    let totalSavedBytes = 0;

    // Recursively walk the JSON and find base64 image references
    async function walkAndOptimize(obj) {
        if (!obj || typeof obj !== 'object') return obj;

        // Lottie assets have a "p" field with the base64 data URI
        if (typeof obj.p === 'string' && obj.p.startsWith('data:image/png;base64,')) {
            const b64Data = obj.p.replace('data:image/png;base64,', '');
            const pngBuffer = Buffer.from(b64Data, 'base64');
            const originalImgSize = b64Data.length;

            try {
                const webpBuffer = await sharp(pngBuffer)
                    .webp({ quality: WEBP_QUALITY, effort: 6 })
                    .toBuffer();

                const newB64 = webpBuffer.toString('base64');
                const newDataUri = `data:image/webp;base64,${newB64}`;

                const saved = originalImgSize - newB64.length;
                totalSavedBytes += saved;
                imagesOptimized++;

                obj.p = newDataUri;
            } catch (err) {
                console.warn(`  ⚠ Failed to convert image in ${fileName}: ${err.message}`);
            }
            return obj;
        }

        // Recurse into arrays and objects
        if (Array.isArray(obj)) {
            for (let i = 0; i < obj.length; i++) {
                obj[i] = await walkAndOptimize(obj[i]);
            }
        } else {
            for (const key of Object.keys(obj)) {
                obj[key] = await walkAndOptimize(obj[key]);
            }
        }
        return obj;
    }

    await walkAndOptimize(data);

    // Write optimized JSON (minified)
    const optimized = JSON.stringify(data);
    await fs.writeFile(filePath, optimized);

    const newSize = Buffer.byteLength(optimized, 'utf-8');
    const savings = originalSize - newSize;
    const pct = ((savings / originalSize) * 100).toFixed(1);

    console.log(`✔ ${fileName}`);
    console.log(`    ${imagesOptimized} images → WebP (quality ${WEBP_QUALITY})`);
    console.log(`    ${(originalSize / 1024).toFixed(0)} KB → ${(newSize / 1024).toFixed(0)} KB (saved ${(savings / 1024).toFixed(0)} KB, ${pct}%)`);

    return { fileName, originalSize, newSize, savings, imagesOptimized };
}

async function main() {
    const files = (await fs.readdir(LOTTIE_DIR))
        .filter(f => f.endsWith('.json'))
        .map(f => path.join(LOTTIE_DIR, f));

    console.log(`\nOptimizing ${files.length} Lottie files in ${LOTTIE_DIR}...\n`);

    const results = [];
    for (const file of files) {
        results.push(await optimizeLottieFile(file));
    }

    const totalOriginal = results.reduce((s, r) => s + r.originalSize, 0);
    const totalNew = results.reduce((s, r) => s + r.newSize, 0);
    const totalSaved = totalOriginal - totalNew;
    const totalPct = ((totalSaved / totalOriginal) * 100).toFixed(1);

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Total: ${(totalOriginal / 1024).toFixed(0)} KB → ${(totalNew / 1024).toFixed(0)} KB`);
    console.log(`Saved: ${(totalSaved / 1024).toFixed(0)} KB (${totalPct}%)`);
    console.log(`Images optimized: ${results.reduce((s, r) => s + r.imagesOptimized, 0)}`);
}

main().catch(err => {
    console.error('❌ Optimization failed:', err);
    process.exit(1);
});
