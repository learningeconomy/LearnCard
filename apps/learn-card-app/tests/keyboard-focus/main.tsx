// Standalone, backend-free native/browser fixture for the shared form behavior.
import React from 'react';
import { createRoot } from 'react-dom/client';
import { KeyboardFocusManager } from '../../../../packages/learn-card-base/src/components/keyboard/KeyboardFocusManager';
import '../../src/tailwind.css';
import '../../src/index.scss';

createRoot(document.getElementById('root')!).render(
    <>
        <KeyboardFocusManager />
        <div id="modal-mid-root">
            <aside id="full-screen-modal" data-lc-surface="fullscreen" className="open">
                <section className="lc-surface bg-white">
                    <div className="h-full flex flex-col bg-white">
                        <header className="p-6 shrink-0 text-grayscale-900">
                            <h1>Keyboard form review</h1>
                        </header>
                        <div
                            data-testid="scroller"
                            className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6"
                        >
                            <label className="block">
                                Name
                                <input
                                    aria-label="Name"
                                    className="block w-full rounded-xl border border-grayscale-300 p-3"
                                />
                            </label>
                            <div className="h-[350px]">Scroll down to the last fields.</div>
                            <label className="block">
                                Location
                                <div
                                    data-testid="composite"
                                    className="flex items-center rounded-xl border border-grayscale-300 p-3 focus-within:ring-1 focus-within:ring-amber-500"
                                >
                                    <input
                                        aria-label="Location"
                                        className="w-full bg-transparent focus:outline-none"
                                    />
                                    <span>Location</span>
                                </div>
                            </label>
                            <div className="h-[200px]" />
                            <label className="block">
                                Summary
                                <textarea
                                    aria-label="Summary"
                                    rows={3}
                                    className="block w-full rounded-xl border border-grayscale-300 p-3"
                                />
                            </label>
                        </div>
                        <footer
                            data-keyboard-footer
                            className="shrink-0 border-t border-grayscale-200 p-4 bg-white"
                        >
                            Form actions
                        </footer>
                    </div>
                </section>
            </aside>
        </div>
    </>
);
