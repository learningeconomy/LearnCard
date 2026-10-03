/* Synthetic-only PDF size probe. Run from repo root: node planning/lc-2222/probe-pdf-sizes.cjs */
const { chromium } = require('@playwright/test');
const { writeFileSync } = require('node:fs');

const sections = [
    [
        'Professional summary',
        'Product designer and learning systems specialist with experience delivering accessible digital tools for community programs. Collaborates with educators, engineers and researchers to turn learner needs into practical services.',
    ],
    [
        'Experience',
        'Community Learning Lab | Senior Product Designer | 2022–Present',
        'Led discovery and design for a credentials experience used across regional learning programs. Planned research, synthesized interviews and developed reusable components with clear accessibility criteria.',
        'Supported three cross-functional teams through launch, measured usability outcomes, and improved onboarding completion with plain-language content and simpler navigation.',
    ],
    [
        'Experience',
        'Example Civic Studio | Designer | 2019–2022',
        'Designed service blueprints, prototypes and visual systems for adult learning. Created collaborative workshops and maintained project documentation to keep stakeholders aligned on scope and delivery.',
    ],
    [
        'Education',
        'Example University | Bachelor of Design | 2015–2019',
        'Coursework in interaction design, information architecture, visual communication and human-centered research.',
    ],
    [
        'Skills',
        'User research • Information architecture • Accessibility • Prototyping • Facilitation • Communication',
    ],
    [
        'Certifications',
        'Accessibility fundamentals | Community Design Institute | 2023',
        'Completed applied coursework in inclusive digital services and evidence-based evaluation.',
    ],
];

const main = async () => {
    const browser = await chromium.launch({ headless: true });
    try {
        const page = await browser.newPage({ viewport: { width: 1000, height: 1100 } });
        await page.setContent('<html><body></body></html>');
        await page.addScriptTag({ path: require.resolve('html2canvas/dist/html2canvas.min.js') });
        await page.addScriptTag({ path: require.resolve('jspdf/dist/jspdf.umd.min.js') });
        const results = [];
        for (const variant of [
            { compression: 'FAST', image: 'PNG' },
            { compression: 'SLOW', image: 'PNG' },
            { compression: 'FAST', image: 'JPEG', quality: 0.95 },
            { compression: 'FAST', image: 'JPEG', quality: 0.92 },
        ]) {
            for (const requestedPages of [1, 2, 3]) {
                const result = await page.evaluate(
                    async ({ requestedPages, sections, compression, image, quality, samples }) => {
                        // Same 760px export width and 2x raster settings as useResumePdf.
                        // A fixed 980px page gives realistic content within US Letter's 983px capture height.
                        const card = document.createElement('div');
                        card.style.cssText =
                            'width:760px;background:#fff;color:#18224e;font-family:Arial,sans-serif;font-size:14px;line-height:1.45;';
                        for (let index = 0; index < requestedPages; index++) {
                            const sheet = document.createElement('section');
                            sheet.style.cssText =
                                'height:980px;padding:40px;box-sizing:border-box;';
                            const header = document.createElement('header');
                            header.innerHTML = `<h1 style="font-size:30px;margin:0 0 6px">Alex Example</h1><p style="margin:0 0 20px;color:#6f7590">Product Designer | Example City<br>alex@example.invalid | (555) 010-0100 | Experience ${index + 1}</p>`;
                            sheet.appendChild(header);
                            for (const [title, ...paragraphs] of sections) {
                                const section = document.createElement('div');
                                section.dataset.pdfBreakAnchor = '';
                                section.innerHTML = `<h2 style="font-size:16px;margin:18px 0 6px;border-bottom:1px solid #c5c8d3;padding-bottom:5px">${title}</h2>${paragraphs.map(text => `<p style="margin:6px 0;color:#52597a">${text}</p>`).join('')}`;
                                sheet.appendChild(section);
                            }
                            card.appendChild(sheet);
                        }
                        document.body.appendChild(card);
                        const source = await html2canvas(card, {
                            scale: 2,
                            useCORS: true,
                            allowTaint: true,
                            backgroundColor: '#ffffff',
                            width: 760,
                            windowWidth: 760,
                            height: card.scrollHeight,
                            logging: false,
                        });
                        const pdf = new jspdf.jsPDF({
                            orientation: 'portrait',
                            unit: 'pt',
                            format: 'letter',
                            compress: compression === 'SLOW',
                        });
                        const pdfW = pdf.internal.pageSize.getWidth();
                        const pdfH = pdf.internal.pageSize.getHeight();
                        const pageHeightPx = Math.floor((source.width * pdfH) / pdfW);
                        const minFill = Math.floor(pageHeightPx * 0.6);
                        const rect = card.getBoundingClientRect();
                        const anchors = Array.from(card.querySelectorAll('[data-pdf-break-anchor]'))
                            .map(element =>
                                Math.round(
                                    ((element.getBoundingClientRect().top - rect.top) *
                                        source.height) /
                                        card.scrollHeight
                                )
                            )
                            .filter(y => y > 0 && y < source.height)
                            .sort((a, b) => a - b);
                        let renderedY = 0;
                        let index = 0;
                        let sample;
                        while (renderedY < source.height) {
                            const remaining = source.height - renderedY;
                            const defaultEnd = renderedY + pageHeightPx;
                            const candidates = anchors.filter(
                                y => y > renderedY + minFill && y <= defaultEnd
                            );
                            const end =
                                remaining <= pageHeightPx
                                    ? source.height
                                    : candidates.at(-1) || defaultEnd;
                            const sliceH = Math.max(1, end - renderedY);
                            const canvas = document.createElement('canvas');
                            canvas.width = source.width;
                            canvas.height = sliceH;
                            const ctx = canvas.getContext('2d');
                            ctx.fillStyle = '#ffffff';
                            ctx.fillRect(0, 0, canvas.width, canvas.height);
                            ctx.drawImage(
                                source,
                                0,
                                renderedY,
                                source.width,
                                sliceH,
                                0,
                                0,
                                source.width,
                                sliceH
                            );
                            if (index > 0) pdf.addPage();
                            const encodedImage = canvas.toDataURL(
                                image === 'JPEG' ? 'image/jpeg' : 'image/png',
                                quality
                            );
                            if (samples && index === 0 && requestedPages === 1)
                                sample = encodedImage;
                            pdf.addImage(
                                encodedImage,
                                image,
                                0,
                                0,
                                pdfW,
                                (sliceH * pdfW) / source.width,
                                undefined,
                                compression
                            );
                            renderedY += sliceH;
                            index++;
                        }
                        const bytes = pdf.output('arraybuffer').byteLength;
                        card.remove();
                        return {
                            compression,
                            image,
                            quality,
                            sample,
                            compress: compression === 'SLOW',
                            requestedPages,
                            actualPages: pdf.getNumberOfPages(),
                            bytes,
                            kib: +(bytes / 1024).toFixed(2),
                            base64Bytes: Math.ceil(bytes / 3) * 4,
                            fits256KiB: bytes <= 256 * 1024,
                            fits320KiB: bytes <= 320 * 1024,
                        };
                    },
                    {
                        requestedPages,
                        sections,
                        ...variant,
                        samples: process.argv.includes('--samples'),
                    }
                );
                if (result.sample) {
                    const suffix =
                        variant.image === 'JPEG'
                            ? `jpeg-${variant.quality}.jpg`
                            : `png-${variant.compression}.png`;
                    writeFileSync(
                        `/tmp/lc-2222-${suffix}`,
                        Buffer.from(result.sample.split(',')[1], 'base64')
                    );
                    delete result.sample;
                }
                results.push(result);
            }
        }
        console.log(
            JSON.stringify(
                {
                    settings: {
                        width: 760,
                        scale: 2,
                        format: 'letter',
                        font: 'Arial',
                    },
                    results,
                },
                null,
                2
            )
        );
    } finally {
        await browser.close();
    }
};

main().catch(() => {
    console.error('Synthetic PDF size probe failed');
    process.exitCode = 1;
});
