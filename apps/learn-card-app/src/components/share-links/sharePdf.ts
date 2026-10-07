import { shareExportFilename } from './shareDownload';

/** Explicit user export: capture only a sanitized copy of the visible shared cards. */
export const downloadSharePdf = async (source: HTMLElement, title: string): Promise<void> => {
    const [html2canvas, { jsPDF }] = await Promise.all([
        import('html2canvas').then(module => module.default),
        import('jspdf'),
    ]);
    const copy = source.cloneNode(true) as HTMLElement;
    copy.classList.add('sentry-block', 'ph-no-capture');
    copy.setAttribute('aria-hidden', 'true');
    copy.inert = true;
    copy.style.cssText =
        'position:absolute;left:-10000px;top:0;width:760px;background:white;color:#18224E;padding:16px;';
    copy.querySelectorAll('button, details, [data-share-export-exclude]').forEach(node =>
        node.remove()
    );
    copy.querySelectorAll('[data-html2canvas-ignore]').forEach(node =>
        node.removeAttribute('data-html2canvas-ignore')
    );
    copy.querySelectorAll<HTMLElement | SVGElement>('[class*="share-credentials-"]').forEach(
        node => {
            node.style.animation = 'none';
            node.style.opacity = '1';
            node.style.transform = 'none';
        }
    );
    document.body.appendChild(copy);
    try {
        await document.fonts.ready;
        const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
        const margin = 32;
        const width = pdf.internal.pageSize.getWidth() - margin * 2;
        const bottom = pdf.internal.pageSize.getHeight() - margin;
        let y = margin;
        const cards = copy.querySelectorAll<HTMLElement>('section, article, figure');
        for (const card of cards) {
            const canvas = await html2canvas(card, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false,
            });
            const scale = Math.min(width / canvas.width, (bottom - margin) / canvas.height);
            const height = canvas.height * scale;
            if (y + height > bottom && y > margin) {
                pdf.addPage();
                y = margin;
            }
            pdf.addImage(
                canvas.toDataURL('image/png'),
                'PNG',
                margin,
                y,
                canvas.width * scale,
                height
            );
            y += height + 16;
        }
        pdf.save(shareExportFilename(title).replace(/\.json$/, '.pdf'));
    } finally {
        copy.remove();
    }
};
