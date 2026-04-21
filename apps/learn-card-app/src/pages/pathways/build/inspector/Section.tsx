/**
 * Section — collapsible card primitive for the Builder inspector.
 *
 * Visual contract:
 *
 *   ┌──────────────────────────────────────────────┐
 *   │ [icon]  Title                 summary  ⌄     │  ← glass header (sticky)
 *   ├──────────────────────────────────────────────┤
 *   │                                              │
 *   │  children (expanded body)                    │
 *   │                                              │
 *   └──────────────────────────────────────────────┘
 *
 * Behaviour:
 *   - Uncontrolled by default (`defaultOpen`); accepts an optional
 *     controlled `open` prop if the parent wants to orchestrate
 *     accordion-style behaviour across sections later (e.g. open only
 *     one at a time). For M1 we keep each section independent.
 *
 *   - Body height animates via framer-motion's
 *     `height: 'auto'` transition so adding a new field doesn't snap.
 *
 *   - Header becomes sticky when expanded (so long sections like the
 *     rubric criteria list don't orphan the title off-screen as you
 *     scroll the inspector). Collapsed sections have no sticky —
 *     there's nothing to pin.
 *
 *   - Accessible: header is a real <button type="button"> with
 *     `aria-expanded`; ⏎/Space toggle. The icon and chevron are
 *     decorative (`aria-hidden`).
 *
 * The "liquid glass" feel lives here — `backdrop-blur-md bg-white/80`
 * on the sticky header, a hairline 200/60 border, and a small
 * `shadow-sm` on the outer card. No gradients, no tints: restrained.
 */

import React, { useState } from 'react';

import { IonIcon } from '@ionic/react';
import { AnimatePresence, motion } from 'framer-motion';
import { chevronDownOutline } from 'ionicons/icons';

interface SectionProps {
    /**
     * Icon shown at the left of the header. Provided as an
     * Ionicon name (string) rather than an element so we can
     * swap in a registry later without breaking the API.
     */
    icon: string;

    /** Short header title, e.g. "What happens here". */
    title: string;

    /**
     * One-line jargon-free summary of the current state.
     * Shown next to the chevron when the section is collapsed.
     * Required — an empty summary is worse than a generic one.
     */
    summary: string;

    /**
     * Optional header accent colour for the icon. Defaults to
     * `grayscale-700` (restrained). Use `emerald-600` for
     * "what happens" sections, `red-600` for danger sections, etc.
     */
    iconTone?: 'neutral' | 'emerald' | 'red';

    /** Uncontrolled initial state. Ignored if `open` is supplied. */
    defaultOpen?: boolean;

    /** Controlled open state (parent-managed accordion). */
    open?: boolean;

    /** Called when the user toggles the section. Parent may ignore. */
    onOpenChange?: (open: boolean) => void;

    /**
     * Sticky-header opt-out. Most sections benefit from it; the
     * identity section (title/description) is short enough that
     * sticky is overkill and slightly jarring. Default true.
     */
    sticky?: boolean;

    /**
     * Destructive emphasis. Wraps the card with a red-tinted border
     * so dangerous sections (Delete node) read differently from
     * neutral content. Used sparingly.
     */
    danger?: boolean;

    children: React.ReactNode;
}

const ICON_TONE: Record<NonNullable<SectionProps['iconTone']>, string> = {
    neutral: 'text-grayscale-700',
    emerald: 'text-emerald-600',
    red: 'text-red-600',
};

const Section: React.FC<SectionProps> = ({
    icon,
    title,
    summary,
    iconTone = 'neutral',
    defaultOpen = false,
    open: controlledOpen,
    onOpenChange,
    sticky = true,
    danger = false,
    children,
}) => {
    const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);

    // Controlled iff `open` was supplied. Matches the React idiom
    // (Radix, react-aria) so parents can migrate to an accordion
    // later by just wiring onOpenChange + open.
    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : uncontrolledOpen;

    const toggle = () => {
        const next = !open;

        if (!isControlled) setUncontrolledOpen(next);
        onOpenChange?.(next);
    };

    return (
        <div
            className={`rounded-[20px] border ${
                danger ? 'border-red-100 bg-white' : 'border-grayscale-200 bg-white'
            } shadow-sm overflow-hidden`}
        >
            {/*
                Header is both the toggle and the sticky anchor. We make
                the entire row a <button> so the hit area is generous and
                screen-readers get a single target. The sticky class is
                conditional on `open` — no need to pin a collapsed
                header (nothing to be hidden behind).
            */}
            <button
                type="button"
                onClick={toggle}
                aria-expanded={open}
                className={`
                    w-full flex items-center gap-3 px-4 py-3 text-left
                    transition-colors
                    ${open && sticky ? 'sticky top-0 z-10 backdrop-blur-md bg-white/80' : 'bg-white'}
                    ${open ? 'border-b border-grayscale-200/60' : 'hover:bg-grayscale-10'}
                `}
            >
                <IonIcon
                    icon={icon}
                    aria-hidden
                    className={`text-lg shrink-0 ${ICON_TONE[iconTone]}`}
                />

                <span className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-baseline sm:gap-3">
                    <span className="text-sm font-semibold text-grayscale-900 shrink-0">
                        {title}
                    </span>

                    {/*
                        Summary is shown *always* (not only when
                        collapsed) so the author can see what the
                        current value is without expanding. When
                        expanded, summary is visually de-emphasised so
                        the eye travels to the body fields.
                    */}
                    <span
                        className={`text-xs truncate transition-colors ${
                            open ? 'text-grayscale-400' : 'text-grayscale-600'
                        }`}
                    >
                        {summary}
                    </span>
                </span>

                <motion.span
                    aria-hidden
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className="shrink-0 text-grayscale-400"
                >
                    <IonIcon icon={chevronDownOutline} className="text-sm" />
                </motion.span>
            </button>

            {/*
                Body — height/opacity animates via AnimatePresence so
                expand/collapse feels like a physical motion rather
                than a snap. `overflow: hidden` on the wrapper is the
                standard framer pattern for `height: 'auto'` animation.
            */}
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        key="body"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{
                            height: { type: 'spring', stiffness: 400, damping: 40 },
                            opacity: { duration: 0.15 },
                        }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div className="px-4 py-4">{children}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Section;
