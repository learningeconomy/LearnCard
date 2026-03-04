import React, { useMemo, useRef, useImperativeHandle, forwardRef } from 'react';

import ResumePreviewUserInfo from './ResumePreviewUserInfo';
import ResumePreviewEmptyPlaceholder from './ResumePreviewEmptyPlaceholder';
import ResumePreviewGroupedCredentialsBlock from './ResumePreviewGroupedCredentialsBlock';

import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';

import { RESUME_SECTIONS, ResumeSectionKey } from '../resume-builder.helpers';
import { resumeBuilderStore } from '../../../stores/resumeBuilderStore';

const LETTER_HEIGHT_PX = 1056; // US Letter at 96 DPI

export type ResumePreviewHandle = {
    generatePDF: () => Promise<void>;
};

const ResumePreview = forwardRef<
    ResumePreviewHandle,
    { isMobile?: boolean; isPreviewing?: boolean }
>(function ResumePreview({ isMobile = false, isPreviewing = false }, ref) {
    const sectionOrder = resumeBuilderStore.useTracked.sectionOrder();
    const personalDetails = resumeBuilderStore.useTracked.personalDetails();
    const credentialEntries = resumeBuilderStore.useTracked.credentialEntries();

    const previewCardRef = useRef<HTMLDivElement>(null);

    const orderedSections = useMemo(() => {
        return sectionOrder
            .map(key => RESUME_SECTIONS.find(s => s.key === key))
            .filter(Boolean) as (typeof RESUME_SECTIONS)[number][];
    }, [sectionOrder]);

    const hasAnyContent = useMemo(() => {
        const hasPersonal = Object.values(personalDetails).some(v => v.trim());
        const hasCredentials = Object.values(credentialEntries).some(arr => arr && arr.length > 0);
        return hasPersonal || hasCredentials;
    }, [personalDetails, credentialEntries]);

    useImperativeHandle(ref, () => ({
        generatePDF: async () => {
            const card = previewCardRef.current;
            if (!card) return;

            const [html2canvas, { jsPDF }] = await Promise.all([
                import('html2canvas').then(m => m.default),
                import('jspdf'),
            ]);

            // Inject a temporary stylesheet that hides all interactive UI during capture
            const style = document.createElement('style');
            style.id = '__pdf-capture-style__';
            style.textContent = `
                [data-pdf-card] [data-pdf-hide] { display: none !important; }
            `;
            document.head.appendChild(style);

            // Off-screen container for fixed-width clones (ensures correct PDF dimensions on mobile)
            const offscreen = document.createElement('div');
            offscreen.style.cssText =
                'position:fixed;top:-9999px;left:0;width:760px;pointer-events:none;z-index:-1;background:#fff;';
            document.body.appendChild(offscreen);

            try {
                const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });
                const clone = card.cloneNode(true) as HTMLElement;
                clone.className = clone.className
                    .replace(/\bpx-4\b/, 'px-10')
                    .replace(/\bpy-6\b/, 'py-10')
                    .replace(/\brounded-xl\b/, 'rounded-lg');
                clone.style.cssText +=
                    ';width:760px;max-width:760px;margin:0;background:#fff;box-sizing:border-box;box-shadow:none;min-height:0;height:auto;';
                offscreen.appendChild(clone);

                await document.fonts?.ready;

                const canvas = await html2canvas(clone, {
                    scale: 2,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    width: 760,
                    windowWidth: 760,
                    height: clone.scrollHeight,
                });

                const pdfW = pdf.internal.pageSize.getWidth();
                const pdfH = pdf.internal.pageSize.getHeight();

                // Convert the long canvas into letter-sized page slices at a fixed scale.
                const sourceW = canvas.width;
                const sourceH = canvas.height;
                const pageHeightPx = Math.floor((sourceW * pdfH) / pdfW);

                let renderedY = 0;
                let pageIndex = 0;
                while (renderedY < sourceH) {
                    const sliceH = Math.min(pageHeightPx, sourceH - renderedY);
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

                if (Capacitor.isNativePlatform()) {
                    const pdfData = pdf.output('datauristring').split(',')[1];
                    const fileName = `resume_${Date.now()}.pdf`;
                    await Filesystem.writeFile({
                        path: fileName,
                        data: pdfData,
                        directory: Directory.Documents,
                    });
                    alert('Resume saved to Documents!');
                } else {
                    const a = document.createElement('a');
                    a.download = 'resume.pdf';
                    a.href = pdf.output('datauristring');
                    a.click();
                }
            } finally {
                document.getElementById('__pdf-capture-style__')?.remove();
                document.body.removeChild(offscreen);
            }
        },
    }));

    if (!hasAnyContent) {
        return <ResumePreviewEmptyPlaceholder />;
    }

    const cardClasses = isMobile
        ? 'w-full bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] rounded-xl px-4 py-6 font-sans'
        : 'w-full max-w-[760px] mx-auto bg-white shadow-[0_4px_24px_rgba(0,0,0,0.10)] rounded-lg p-10 font-sans';

    return (
        <div className="relative w-full h-full">
            <div className="w-full h-full overflow-y-auto">
                <div
                    ref={previewCardRef}
                    data-pdf-card
                    className={cardClasses}
                    style={
                        {
                            WebkitTextSizeAdjust: '100%',
                            textSizeAdjust: '100%',
                            minHeight: `${LETTER_HEIGHT_PX}px`,
                        } as React.CSSProperties
                    }
                >
                    <ResumePreviewUserInfo />
                    {orderedSections.map(section => {
                        const sectionKey = section.key as ResumeSectionKey;
                        const entries = [...(credentialEntries[sectionKey] ?? [])].sort(
                            (a, b) => a.index - b.index
                        );
                        if (!entries.length) return null;
                        return (
                            <ResumePreviewGroupedCredentialsBlock
                                key={sectionKey}
                                section={section}
                                filteredUris={entries.map(entry => entry.uri)}
                                isPreviewing={isPreviewing}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
});

export default ResumePreview;
