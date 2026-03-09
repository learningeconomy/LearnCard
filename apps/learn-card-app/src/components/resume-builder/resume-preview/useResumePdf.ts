import { RefObject, useCallback } from 'react';

import { Capacitor } from '@capacitor/core';
import { FileViewer } from '@capacitor/file-viewer';
import { Directory, Filesystem } from '@capacitor/filesystem';
import type { jsPDF as JsPDFType } from 'jspdf';
import { resumeBuilderStore } from '../../../stores/resumeBuilderStore';

const RESUME_PDF_WIDTH_PX = 760;

export type ResumePdfPreviewData = {
    downloadUrl: string;
    fileName: string;
    pageCount: number;
    url: string;
};

const PDF_PREVIEW_FRAGMENT = '#view=FitH&zoom=page-fit&toolbar=0&navpanes=0&scrollbar=0';

const toPdfPreviewUrl = (url: string): string => `${url}${PDF_PREVIEW_FRAGMENT}`;

const toPdfFileName = (raw?: string): string => {
    const trimmed = (raw || '').trim();
    if (!trimmed) return 'resume.pdf';
    return /\.pdf$/i.test(trimmed) ? trimmed : `${trimmed}.pdf`;
};

const savePdfToNativeDocuments = async (
    pdf: JsPDFType,
    successMessage: string,
    fileName?: string
): Promise<void> => {
    const pdfData = pdf.output('datauristring').split(',')[1];
    const safeFileName = toPdfFileName(fileName);
    await Filesystem.writeFile({
        path: safeFileName,
        data: pdfData,
        directory: Directory.Documents,
    });
    alert(successMessage);
};

const savePdfToNativeFile = async (
    pdf: JsPDFType,
    fileName?: string
): Promise<{ fileName: string; uri: string }> => {
    const pdfData = pdf.output('datauristring').split(',')[1];
    const safeFileName = toPdfFileName(fileName);

    await Filesystem.writeFile({
        path: safeFileName,
        data: pdfData,
        directory: Directory.Documents,
    });

    const { uri } = await Filesystem.getUri({
        path: safeFileName,
        directory: Directory.Documents,
    });

    return { fileName: safeFileName, uri };
};

const previewPdfOnNativeDevice = async (pdf: JsPDFType, fileName?: string): Promise<void> => {
    const nativeFile = await savePdfToNativeFile(pdf, fileName);

    await FileViewer.openDocumentFromLocalPath({
        path: nativeFile.uri,
    });
};

export const useResumePdf = (
    previewCardRef: RefObject<HTMLDivElement>
): {
    createPDFPreviewUrl: () => Promise<ResumePdfPreviewData | null>;
    generatePDF: () => Promise<void>;
} => {
    const buildPDF = useCallback(async (): Promise<JsPDFType | null> => {
        const card = previewCardRef.current;
        if (!card) return null;

        const [html2canvas, { jsPDF }] = await Promise.all([
            import('html2canvas').then(m => m.default),
            import('jspdf'),
        ]);

        // Cleanup any legacy capture styles from previous implementations.
        document.querySelectorAll('#__pdf-capture-style__').forEach(el => el.remove());

        const offscreen = document.createElement('div');
        offscreen.style.cssText = `position:fixed;top:-9999px;left:0;width:${RESUME_PDF_WIDTH_PX}px;pointer-events:none;z-index:-1;background:#fff;`;
        document.body.appendChild(offscreen);

        try {
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });
            const clone = card.cloneNode(true) as HTMLElement;
            clone.className = clone.className
                .replace(/\bpx-4\b/, 'px-10')
                .replace(/\bpy-6\b/, 'py-10')
                .replace(/\brounded-xl\b/, 'rounded-lg');
            clone.style.cssText += `;width:${RESUME_PDF_WIDTH_PX}px;max-width:${RESUME_PDF_WIDTH_PX}px;margin:0;background:#fff;box-sizing:border-box;box-shadow:none;min-height:0;height:auto;`;

            // Apply export-only visibility transformations on the clone itself
            // so live preview styles are never affected.
            clone
                .querySelectorAll<HTMLElement>('[data-pdf-hide], [data-pdf-screen-only]')
                .forEach(el => el.remove());
            clone.querySelectorAll<HTMLElement>('[data-pdf-export-inline]').forEach(el => {
                el.style.display = 'inline';
            });
            clone.querySelectorAll<HTMLElement>('[data-pdf-export-block]').forEach(el => {
                el.style.display = 'block';
            });
            clone.querySelectorAll<HTMLElement>('[data-pdf-export-flex]').forEach(el => {
                el.style.display = 'flex';
            });

            offscreen.appendChild(clone);

            await document.fonts?.ready;

            const canvas = await html2canvas(clone, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                width: RESUME_PDF_WIDTH_PX,
                windowWidth: RESUME_PDF_WIDTH_PX,
                height: clone.scrollHeight,
            });

            const pdfW = pdf.internal.pageSize.getWidth();
            const pdfH = pdf.internal.pageSize.getHeight();
            const sourceW = canvas.width;
            const sourceH = canvas.height;
            const pageHeightPx = Math.floor((sourceW * pdfH) / pdfW);
            const minPageFillPx = Math.floor(pageHeightPx * 0.6);

            const cloneRect = clone.getBoundingClientRect();
            const domBreakAnchors = Array.from(
                clone.querySelectorAll<HTMLElement>('[data-pdf-break-anchor]')
            )
                .map(el => Math.round(el.getBoundingClientRect().top - cloneRect.top))
                .filter(y => y > 0 && y < clone.scrollHeight)
                .sort((a, b) => a - b);

            const domToCanvasRatio = sourceH / clone.scrollHeight;
            const breakAnchorsPx = domBreakAnchors.map(y => Math.round(y * domToCanvasRatio));

            let renderedY = 0;
            let pageIndex = 0;
            while (renderedY < sourceH) {
                const remaining = sourceH - renderedY;
                if (remaining <= pageHeightPx) {
                    const lastCanvas = document.createElement('canvas');
                    lastCanvas.width = sourceW;
                    lastCanvas.height = remaining;
                    const lastCtx = lastCanvas.getContext('2d');
                    if (!lastCtx) break;
                    lastCtx.fillStyle = '#ffffff';
                    lastCtx.fillRect(0, 0, sourceW, remaining);
                    lastCtx.drawImage(
                        canvas,
                        0,
                        renderedY,
                        sourceW,
                        remaining,
                        0,
                        0,
                        sourceW,
                        remaining
                    );
                    if (pageIndex > 0) pdf.addPage();
                    const lastImg = lastCanvas.toDataURL('image/png');
                    const lastRenderH = (remaining * pdfW) / sourceW;
                    pdf.addImage(lastImg, 'PNG', 0, 0, pdfW, lastRenderH, undefined, 'FAST');
                    break;
                }

                const defaultEnd = renderedY + pageHeightPx;
                const candidateAnchors = breakAnchorsPx.filter(
                    y => y > renderedY + minPageFillPx && y <= defaultEnd
                );
                const snappedEnd =
                    candidateAnchors.length > 0
                        ? candidateAnchors[candidateAnchors.length - 1]
                        : defaultEnd;
                const sliceH = Math.max(1, snappedEnd - renderedY);
                const pageCanvas = document.createElement('canvas');
                pageCanvas.width = sourceW;
                pageCanvas.height = sliceH;

                const ctx = pageCanvas.getContext('2d');
                if (!ctx) break;

                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, sourceW, sliceH);
                ctx.drawImage(canvas, 0, renderedY, sourceW, sliceH, 0, 0, sourceW, sliceH);

                if (pageIndex > 0) pdf.addPage();
                const imgData = pageCanvas.toDataURL('image/png');
                const renderH = (sliceH * pdfW) / sourceW;
                pdf.addImage(imgData, 'PNG', 0, 0, pdfW, renderH, undefined, 'FAST');

                renderedY += sliceH;
                pageIndex += 1;
            }

            return pdf;
        } finally {
            document.body.removeChild(offscreen);
        }
    }, [previewCardRef]);

    const createPDFPreviewUrl = useCallback(async (): Promise<ResumePdfPreviewData | null> => {
        const pdf = await buildPDF();
        if (!pdf) return null;
        const fileName = toPdfFileName(resumeBuilderStore.get.documentSetup()?.fileName);
        const pageCount = pdf.getNumberOfPages();

        if (Capacitor.isNativePlatform()) {
            await previewPdfOnNativeDevice(pdf, fileName);
            return null;
        }

        const blob = pdf.output('blob');
        const downloadUrl = URL.createObjectURL(blob);
        return {
            downloadUrl,
            fileName,
            pageCount,
            url: toPdfPreviewUrl(downloadUrl),
        };
    }, [buildPDF]);

    const generatePDF = useCallback(async (): Promise<void> => {
        const pdf = await buildPDF();
        if (!pdf) return;
        const fileName = toPdfFileName(resumeBuilderStore.get.documentSetup()?.fileName);

        if (Capacitor.isNativePlatform()) {
            await savePdfToNativeDocuments(pdf, 'Resume saved to Documents!', fileName);
            return;
        }

        const a = document.createElement('a');
        a.download = fileName;
        a.href = pdf.output('datauristring');
        a.click();
    }, [buildPDF]);

    return {
        createPDFPreviewUrl,
        generatePDF,
    };
};

export default useResumePdf;
