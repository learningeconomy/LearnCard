import React, {
    useMemo,
    useRef,
    useState,
    useLayoutEffect,
    useCallback,
    useImperativeHandle,
    forwardRef,
} from 'react';

import ResumePreviewUserInfo from './ResumePreviewUserInfo';
import ResumePreviewEmptyPlaceholder from './ResumePreviewEmptyPlaceholder';
import ResumePreviewCredentialToTextBlock from './ResumePreviewCredentialToTextBlock';
import ResumePreviewGroupedCredentialsBlock from './ResumePreviewGroupedCredentialsBlock';

import { RESUME_SECTIONS, ResumeSectionKey } from '../resume-builder.helpers';
import { resumeBuilderStore } from '../../../stores/resumeBuilderStore';

// US Letter at 96 dpi — both mobile and desktop use the same page height
const DESKTOP_PAGE_HEIGHT_PX = 1056;
const DESKTOP_PAGE_CONTENT_HEIGHT = DESKTOP_PAGE_HEIGHT_PX - 80; // p-10 = 40px top + 40px bottom
const MOBILE_PAGE_CONTENT_HEIGHT = DESKTOP_PAGE_HEIGHT_PX - 48; // py-6 = 24+24

const HEADER_BOTTOM_MARGIN = 24; // mb-6
const SECTION_BOTTOM_MARGIN = 24; // mb-6

type PageSlice =
    | { type: 'header' }
    | { type: 'section'; sectionKey: ResumeSectionKey; uris: string[] };

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

    const measureRef = useRef<HTMLDivElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const pageCardRefs = useRef<HTMLDivElement[]>([]);
    const [pages, setPages] = useState<PageSlice[][]>([]);
    const [measured, setMeasured] = useState(false);

    const pageContentHeight = isMobile ? MOBILE_PAGE_CONTENT_HEIGHT : DESKTOP_PAGE_CONTENT_HEIGHT;

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

    const buildPages = useCallback(() => {
        const container = measureRef.current;
        if (!container) return;

        // Sync measurement container width to match actual card width
        const wrapper = wrapperRef.current;
        if (wrapper) {
            container.style.width = `${wrapper.offsetWidth}px`;
        }

        const headerEl = container.querySelector<HTMLElement>('[data-measure="header"]');
        const headerH = headerEl ? headerEl.offsetHeight + HEADER_BOTTOM_MARGIN : 0;

        const result: PageSlice[][] = [];
        let currentPage: PageSlice[] = [];
        let usedHeight = 0;

        // Place header on page 1
        if (headerH > 0) {
            currentPage.push({ type: 'header' });
            usedHeight += headerH;
        }

        for (const section of orderedSections) {
            const sectionKey = section.key as ResumeSectionKey;
            const entries = [...(credentialEntries[sectionKey] ?? [])].sort(
                (a, b) => a.index - b.index
            );
            if (!entries.length) continue;

            const sectionHeadingEl = container.querySelector<HTMLElement>(
                `[data-measure="section-heading-${sectionKey}"]`
            );
            // heading offsetHeight + mb-3 (12px)
            const headingH = sectionHeadingEl ? sectionHeadingEl.offsetHeight + 12 : 20;

            // Measure each credential row; py-1 wrapper adds ~8px vertical space
            const credHeights: number[] = entries.map(entry => {
                const el = container.querySelector<HTMLElement>(
                    `[data-measure="cred-${sectionKey}-${entry.uri}"]`
                );
                return el ? el.offsetHeight + 8 : 40;
            });

            const totalSectionH =
                headingH + credHeights.reduce((s, h) => s + h, 0) + SECTION_BOTTOM_MARGIN;

            if (usedHeight + totalSectionH <= pageContentHeight) {
                // Whole section fits
                currentPage.push({ type: 'section', sectionKey, uris: entries.map(e => e.uri) });
                usedHeight += totalSectionH;
                continue;
            }

            // Split section across pages credential by credential
            let pendingUris: string[] = [];
            let pendingSectionH = headingH;

            const flushSection = () => {
                if (pendingUris.length === 0) return;
                currentPage.push({ type: 'section', sectionKey, uris: pendingUris });
                usedHeight += pendingSectionH + SECTION_BOTTOM_MARGIN;
                pendingUris = [];
                pendingSectionH = headingH;
            };

            const breakPage = () => {
                flushSection();
                if (currentPage.length > 0) {
                    result.push(currentPage);
                    currentPage = [];
                    usedHeight = 0;
                }
            };

            for (let i = 0; i < entries.length; i++) {
                const credH = credHeights[i];
                const wouldUse = usedHeight + pendingSectionH + credH + SECTION_BOTTOM_MARGIN;

                if (wouldUse > pageContentHeight) {
                    if (pendingUris.length > 0) {
                        breakPage();
                    } else if (currentPage.length > 0) {
                        result.push(currentPage);
                        currentPage = [];
                        usedHeight = 0;
                    }
                    // Place item on fresh page (even if alone it exceeds budget — unavoidable)
                }

                pendingUris.push(entries[i].uri);
                pendingSectionH += credH;
            }

            flushSection();
        }

        if (currentPage.length > 0) result.push(currentPage);
        if (result.length === 0) result.push([{ type: 'header' }]);

        setPages(result);
        setMeasured(true);
    }, [orderedSections, credentialEntries, personalDetails, pageContentHeight]);

    // Re-measure whenever content/device changes
    useLayoutEffect(() => {
        setMeasured(false);
        // Double rAF: first frame lets React commit new layout, second lets browser reflow
        let id1: number;
        const id0 = requestAnimationFrame(() => {
            id1 = requestAnimationFrame(() => {
                buildPages();
            });
        });
        return () => {
            cancelAnimationFrame(id0);
            cancelAnimationFrame(id1);
        };
    }, [buildPages]);

    // Also re-measure whenever the wrapper is resized (handles mobile↔desktop width changes)
    useLayoutEffect(() => {
        const wrapper = wrapperRef.current;
        if (!wrapper) return;
        let lastWidth = wrapper.offsetWidth;
        const ro = new ResizeObserver(() => {
            const newWidth = wrapper.offsetWidth;
            if (newWidth !== lastWidth) {
                lastWidth = newWidth;
                setMeasured(false);
                buildPages();
            }
        });
        ro.observe(wrapper);
        return () => ro.disconnect();
    }, [buildPages]);

    useImperativeHandle(ref, () => ({
        generatePDF: async () => {
            const cards = pageCardRefs.current.filter(Boolean);
            if (!cards.length) return;

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
                'position:fixed;top:-9999px;left:0;width:760px;pointer-events:none;z-index:-1;';
            document.body.appendChild(offscreen);

            try {
                const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });
                const pdfW = pdf.internal.pageSize.getWidth();
                const pdfH = pdf.internal.pageSize.getHeight();

                for (let i = 0; i < cards.length; i++) {
                    // Clone at 760px so mobile narrow cards capture at desktop width
                    const clone = cards[i].cloneNode(true) as HTMLElement;
                    // Strip mobile padding classes and apply desktop equivalents inline
                    clone.className = clone.className
                        .replace(/\bpx-4\b/, 'px-10')
                        .replace(/\bpy-6\b/, 'py-10')
                        .replace(/\brounded-xl\b/, 'rounded-lg');
                    clone.style.cssText =
                        'width:760px;height:1056px;overflow:hidden;background:#fff;padding:40px;box-sizing:border-box;';
                    offscreen.appendChild(clone);

                    const canvas = await html2canvas(clone, {
                        scale: 2,
                        useCORS: true,
                        allowTaint: true,
                        backgroundColor: '#ffffff',
                        width: 760,
                        height: 1056,
                    });

                    offscreen.removeChild(clone);

                    const imgData = canvas.toDataURL('image/png');
                    if (i > 0) pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
                }

                const a = document.createElement('a');
                a.download = 'resume.pdf';
                a.href = pdf.output('datauristring');
                a.click();
            } finally {
                document.getElementById('__pdf-capture-style__')?.remove();
                document.body.removeChild(offscreen);
            }
        },
    }));

    if (!hasAnyContent) {
        return <ResumePreviewEmptyPlaceholder />;
    }

    const sectionByKey = useMemo(() => {
        return Object.fromEntries(RESUME_SECTIONS.map(s => [s.key, s])) as Record<
            ResumeSectionKey,
            (typeof RESUME_SECTIONS)[number]
        >;
    }, []);

    // Card styles differ between mobile and desktop
    const measureClasses = isMobile
        ? 'pointer-events-none opacity-0 w-full px-4 py-6 font-sans'
        : 'pointer-events-none opacity-0 w-full max-w-[760px] p-10 font-sans';

    const cardClasses = isMobile
        ? 'w-full bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] rounded-xl px-4 py-6 font-sans'
        : 'w-full max-w-[760px] mx-auto bg-white shadow-[0_4px_24px_rgba(0,0,0,0.10)] rounded-lg p-10 font-sans';

    return (
        <>
            {/* ── Hidden measurement container — position:fixed so parent overflow:hidden doesn't clip it ── */}
            <div
                ref={measureRef}
                aria-hidden="true"
                className={measureClasses}
                style={
                    {
                        position: 'fixed',
                        top: '-9999px',
                        left: 0,
                        zIndex: -1,
                        WebkitTextSizeAdjust: '100%',
                        textSizeAdjust: '100%',
                    } as React.CSSProperties
                }
            >
                <div data-measure="header">
                    <ResumePreviewUserInfo />
                </div>
                {orderedSections.map(section => {
                    const sectionKey = section.key as ResumeSectionKey;
                    const entries = [...(credentialEntries[sectionKey] ?? [])].sort(
                        (a, b) => a.index - b.index
                    );
                    if (!entries.length) return null;
                    return (
                        <div key={sectionKey}>
                            <div data-measure={`section-heading-${sectionKey}`}>
                                <h2 className="text-xs font-bold uppercase tracking-widest text-grayscale-500 mb-3 border-b border-grayscale-100 pb-1">
                                    {section.label}
                                </h2>
                            </div>
                            {entries.map(entry => (
                                <div
                                    key={entry.uri}
                                    data-measure={`cred-${sectionKey}-${entry.uri}`}
                                    className="py-1"
                                >
                                    <ResumePreviewCredentialToTextBlock
                                        uri={entry.uri}
                                        section={sectionKey}
                                        isEditing={false}
                                        setIsEditing={() => {}}
                                    />
                                </div>
                            ))}
                        </div>
                    );
                })}
            </div>

            {/* ── Paginated output ── */}
            <div
                ref={wrapperRef}
                className={`flex flex-col w-full items-center ${isMobile ? 'gap-4' : 'gap-6'} ${
                    measured ? '' : 'invisible'
                }`}
            >
                {pages.map((pageSlices, pageIdx) => (
                    <div
                        key={pageIdx}
                        className={`w-full ${
                            isMobile ? '' : 'max-w-[760px]'
                        } flex flex-col items-center gap-2`}
                    >
                        {/* Page indicator — only shown when multiple pages */}
                        {pages.length > 1 && (
                            <p
                                className={`text-xs text-grayscale-400 self-end ${
                                    isMobile ? 'pr-0' : 'pr-1'
                                }`}
                            >
                                Page {pageIdx + 1} of {pages.length}
                            </p>
                        )}
                        <div
                            ref={el => {
                                if (el) pageCardRefs.current[pageIdx] = el;
                            }}
                            data-pdf-card
                            className={cardClasses}
                            style={
                                {
                                    WebkitTextSizeAdjust: '100%',
                                    textSizeAdjust: '100%',
                                    height: `${DESKTOP_PAGE_HEIGHT_PX}px`,
                                    overflow: 'hidden',
                                } as React.CSSProperties
                            }
                        >
                            {pageSlices.map((slice, sliceIdx) => {
                                if (slice.type === 'header') {
                                    return <ResumePreviewUserInfo key="header" />;
                                }
                                const section = sectionByKey[slice.sectionKey];
                                return (
                                    <ResumePreviewGroupedCredentialsBlock
                                        key={`${slice.sectionKey}-${sliceIdx}`}
                                        section={section}
                                        filteredUris={slice.uris}
                                        isPreviewing={isPreviewing}
                                    />
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
});

export default ResumePreview;
