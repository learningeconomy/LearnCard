import React, { useMemo, useRef, useState, useLayoutEffect, useCallback } from 'react';

import ResumePreviewUserInfo from './ResumePreviewUserInfo';
import ResumePreviewEmptyPlaceholder from './ResumePreviewEmptyPlaceholder';
import ResumePreviewCredentialToTextBlock from './ResumePreviewCredentialToTextBlock';
import ResumePreviewGroupedCredentialsBlock from './ResumePreviewGroupedCredentialsBlock';

import { RESUME_SECTIONS, ResumeSectionKey } from '../resume-builder.helpers';
import { resumeBuilderStore } from '../../../stores/resumeBuilderStore';

const PAGE_PADDING_PX = 80; // p-10 = 40px top + 40px bottom
const PAGE_HEIGHT_PX = 1056; // ~US Letter height at 96dpi
const PAGE_CONTENT_HEIGHT = PAGE_HEIGHT_PX - PAGE_PADDING_PX;
const HEADER_BOTTOM_MARGIN = 24; // mb-6 on header block
const SECTION_BOTTOM_MARGIN = 24; // mb-6 on each section

type PageSlice =
    | { type: 'header' }
    | { type: 'section'; sectionKey: ResumeSectionKey; uris: string[] };

const PAGE_CLASSES =
    'w-full max-w-[760px] mx-auto bg-white shadow-[0_4px_24px_rgba(0,0,0,0.10)] rounded-lg p-10 font-sans';

const ResumePreview: React.FC = () => {
    const sectionOrder = resumeBuilderStore.useTracked.sectionOrder();
    const personalDetails = resumeBuilderStore.useTracked.personalDetails();
    const credentialEntries = resumeBuilderStore.useTracked.credentialEntries();

    const measureRef = useRef<HTMLDivElement>(null);
    const [pages, setPages] = useState<PageSlice[][]>([]);
    const [measured, setMeasured] = useState(false);

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
            // heading height + mb-3 (12px) + border-b pb-1 (already in offsetHeight)
            const headingH = sectionHeadingEl ? sectionHeadingEl.offsetHeight + 12 : 20;

            // Measure each credential row (py-1 = 8px accounted for in wrapper)
            const credHeights: number[] = entries.map(entry => {
                const el = container.querySelector<HTMLElement>(
                    `[data-measure="cred-${sectionKey}-${entry.uri}"]`
                );
                return el ? el.offsetHeight + 8 : 40;
            });

            // Try to fit the whole section on the current page first
            const totalSectionH =
                headingH + credHeights.reduce((s, h) => s + h, 0) + SECTION_BOTTOM_MARGIN;

            if (usedHeight + totalSectionH <= PAGE_CONTENT_HEIGHT) {
                // Whole section fits on this page
                currentPage.push({ type: 'section', sectionKey, uris: entries.map(e => e.uri) });
                usedHeight += totalSectionH;
                continue;
            }

            // Section needs to be split across pages — walk credential by credential
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

                if (wouldUse > PAGE_CONTENT_HEIGHT) {
                    if (pendingUris.length > 0) {
                        // Flush pending items onto current page, then break
                        breakPage();
                    } else if (currentPage.length > 0) {
                        // Nothing pending for this section yet but current page has other content;
                        // move to fresh page so this item starts with a heading
                        result.push(currentPage);
                        currentPage = [];
                        usedHeight = 0;
                    }
                    // Now on a fresh page — add this item (even if it alone exceeds a page, unavoidable)
                }

                pendingUris.push(entries[i].uri);
                pendingSectionH += credH;
            }

            // Flush any remaining items
            flushSection();
        }

        if (currentPage.length > 0) result.push(currentPage);
        if (result.length === 0) result.push([{ type: 'header' }]);

        setPages(result);
        setMeasured(true);
    }, [orderedSections, credentialEntries, personalDetails]);

    // Re-measure whenever content changes
    useLayoutEffect(() => {
        setMeasured(false);
        // Give React one frame to paint the hidden measure container
        const id = requestAnimationFrame(() => {
            buildPages();
        });
        return () => cancelAnimationFrame(id);
    }, [buildPages]);

    if (!hasAnyContent) {
        return <ResumePreviewEmptyPlaceholder />;
    }

    const sectionByKey = useMemo(() => {
        return Object.fromEntries(RESUME_SECTIONS.map(s => [s.key, s])) as Record<
            ResumeSectionKey,
            (typeof RESUME_SECTIONS)[number]
        >;
    }, []);

    return (
        <>
            {/* ── Hidden measurement container ── */}
            <div
                ref={measureRef}
                aria-hidden="true"
                className="absolute pointer-events-none opacity-0 w-full max-w-[760px] p-10 font-sans"
                style={{ top: 0, left: 0, zIndex: -1 }}
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
                className={`flex flex-col gap-6 w-full items-center ${measured ? '' : 'invisible'}`}
            >
                {pages.map((pageSlices, pageIdx) => (
                    <div
                        key={pageIdx}
                        className="w-full max-w-[760px] flex flex-col items-center gap-2"
                    >
                        {/* Page number label (shown between pages) */}
                        {pages.length > 1 && (
                            <p className="text-xs text-grayscale-400 self-end pr-1">
                                Page {pageIdx + 1} of {pages.length}
                            </p>
                        )}
                        <div
                            className={PAGE_CLASSES}
                            style={{ height: `${PAGE_HEIGHT_PX}px`, overflow: 'hidden' }}
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
                                    />
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
};

export default ResumePreview;
