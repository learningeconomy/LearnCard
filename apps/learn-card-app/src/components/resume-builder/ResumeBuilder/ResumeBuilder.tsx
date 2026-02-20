import React, { useState } from 'react';

import ResumePreview from './ResumePreview';
import ResumeConfigPanel from './ResumeConfigPanel';

import { useDeviceTypeByWidth } from 'learn-card-base';

const PanelIcon: React.FC<{ open: boolean }> = ({ open }) => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        {open ? (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
            />
        ) : (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
            />
        )}
    </svg>
);

export const ResumeBuilder: React.FC = () => {
    const { isMobile } = useDeviceTypeByWidth();
    const [panelOpen, setPanelOpen] = useState(true);
    const [drawerOpen, setDrawerOpen] = useState(false);

    return (
        <div className="flex h-full w-full bg-grayscale-50 overflow-hidden relative">
            {/* ── Desktop Layout ── */}
            {!isMobile && (
                <>
                    {/* Preview canvas */}
                    <div className="flex-1 overflow-y-auto py-10 px-6 flex justify-center">
                        <ResumePreview />
                    </div>

                    {/* Side config panel */}
                    <div
                        className={`shrink-0 h-full border-l border-grayscale-100 bg-white flex flex-col transition-all duration-300 overflow-hidden ${
                            panelOpen ? 'w-[400px]' : 'w-0'
                        }`}
                    >
                        {panelOpen && (
                            <>
                                {/* Panel header */}
                                <div className="sticky top-0 z-10 bg-white border-b border-grayscale-100 px-4 py-3 flex items-center justify-between shrink-0">
                                    <h2 className="text-sm font-bold text-grayscale-900">
                                        Resume Builder
                                    </h2>
                                    <button
                                        onClick={() => setPanelOpen(false)}
                                        className="text-grayscale-400 hover:text-grayscale-700"
                                    >
                                        <PanelIcon open={true} />
                                    </button>
                                </div>

                                {/* Scrollable sections */}
                                <div className="flex-1 overflow-y-auto">
                                    <ResumeConfigPanel />
                                </div>

                                {/* Panel footer */}
                                <div className="sticky bottom-0 bg-white border-t border-grayscale-100 px-4 py-3 shrink-0">
                                    <button className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-sm rounded-full py-3 transition-colors">
                                        Download Resume
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Toggle panel button when closed */}
                    {!panelOpen && (
                        <button
                            onClick={() => setPanelOpen(true)}
                            className="absolute top-4 right-4 z-20 bg-white border border-grayscale-200 shadow-sm rounded-full p-2 text-grayscale-600 hover:text-grayscale-900"
                        >
                            <PanelIcon open={false} />
                        </button>
                    )}
                </>
            )}

            {/* ── Mobile Layout ── */}
            {isMobile && (
                <>
                    {/* Full-screen preview */}
                    <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col">
                        <ResumePreview />
                    </div>

                    {/* FAB to open drawer */}
                    {!drawerOpen && (
                        <button
                            onClick={() => setDrawerOpen(true)}
                            className="fixed bottom-6 right-6 z-30 bg-indigo-500 text-white rounded-full shadow-lg px-5 py-3 text-sm font-semibold flex items-center gap-2"
                        >
                            <PanelIcon open={false} />
                            Edit
                        </button>
                    )}

                    {/* Drawer overlay */}
                    {drawerOpen && (
                        <div className="fixed inset-0 z-40 flex">
                            {/* Backdrop */}
                            <div
                                className="flex-1 bg-black/40"
                                onClick={() => setDrawerOpen(false)}
                            />

                            {/* Drawer panel */}
                            <div className="w-[88vw] max-w-[420px] h-full bg-white flex flex-col shadow-2xl">
                                {/* Drawer header */}
                                <div className="flex items-center justify-between px-4 py-3 border-b border-grayscale-100 shrink-0">
                                    <h2 className="text-sm font-bold text-grayscale-900">
                                        Resume Builder
                                    </h2>
                                    <button
                                        onClick={() => setDrawerOpen(false)}
                                        className="text-grayscale-400 hover:text-grayscale-700"
                                    >
                                        <PanelIcon open={true} />
                                    </button>
                                </div>

                                {/* Scrollable sections */}
                                <div className="flex-1 overflow-y-auto">
                                    <ResumeConfigPanel />
                                </div>

                                {/* Drawer footer */}
                                <div className="px-4 py-3 border-t border-grayscale-100 shrink-0">
                                    <button
                                        onClick={() => setDrawerOpen(false)}
                                        className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-sm rounded-full py-3 transition-colors"
                                    >
                                        Download Resume
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ResumeBuilder;
