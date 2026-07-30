/**
 * StreakRibbon — a single strip showing the current streak and whether
 * today's grace window is active.
 *
 * Docs § 5: "A streak is a promise to yourself, not a quota." The
 * ribbon is deliberately calm — no fireworks, no shaming.
 *
 * Visual language matches the rest of Today: frosted-glass pill,
 * rounded-full, subtle tint keyed off state (emerald on track, amber
 * mid-grace). Only renders when the streak is actually meaningful —
 * `TodayMode` gates this component to `current ≥ 3` so day-one learners
 * don't get a "1-day streak" chip that reads as pressure.
 */

import React from 'react';

import { IonIcon } from '@ionic/react';
import { flame } from 'ionicons/icons';
import { motion } from 'motion/react';

interface StreakRibbonProps {
    current: number;
    longest: number;
    inGraceWindow: boolean;
}

const StreakRibbon: React.FC<StreakRibbonProps> = ({ current, longest, inGraceWindow }) => (
    <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut', delay: 0.15 }}
        className={`py-2 px-3.5 rounded-full border backdrop-blur-md flex items-center gap-2 ${
            inGraceWindow
                ? 'bg-amber-50/80 border-amber-100'
                : 'bg-emerald-50/80 border-emerald-100'
        }`}
    >
        <IonIcon
            icon={flame}
            className={`text-sm ${
                inGraceWindow ? 'text-amber-500' : 'text-emerald-600'
            }`}
            aria-hidden
        />

        <span
            className={`text-xs font-semibold ${
                inGraceWindow ? 'text-amber-700' : 'text-emerald-700'
            }`}
        >
            {current}-day streak
        </span>

        {longest > current && (
            <span className="text-xs text-grayscale-500">
                · best {longest}
            </span>
        )}

        {inGraceWindow && (
            <span className="text-[11px] text-amber-700/90 ml-auto">
                Grace window
            </span>
        )}
    </motion.div>
);

export default StreakRibbon;
