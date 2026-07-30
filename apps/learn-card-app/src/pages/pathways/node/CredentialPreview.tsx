/**
 * CredentialPreview — compact inline projection of a completed
 * `PathwayNode` into its Open Badges 3.0 `AchievementCredential`.
 *
 * Design intent:
 *
 *   - Architecture §3.6: "A node does NOT store a VC; it stores a
 *     projection used at issuance." We honor that by *projecting on
 *     the fly* rather than persisting a claim — the preview is a view
 *     onto the stable projection primitive, not a second source of
 *     truth.
 *   - Phase 1 §17: "Evidence upload → termination completion → VC
 *     issuance (projection path)." This component is the visible end
 *     of that path inside the overlay's completion hero. It gives the
 *     learner a tangible artifact the moment they finish a node, even
 *     though the actual signing is deferred to Phase 3's brain-service
 *     proxy.
 *   - Copy is honest: the credential is *drafted* locally. No silent
 *     implication that signing has happened. When issuance lands, the
 *     "drafted" framing becomes "issued" and everything else stays put.
 */

import React, { useMemo, useState } from 'react';

import { IonIcon } from '@ionic/react';
import {
    chevronDownOutline,
    chevronUpOutline,
    ribbonOutline,
} from 'ionicons/icons';
import { AnimatePresence, motion } from 'motion/react';

import {
    ProjectionError,
    toAchievementCredential,
} from '../projection/toAchievementCredential';
import type { PathwayNode } from '../types';

interface CredentialPreviewProps {
    node: PathwayNode;
    ownerDid: string;
}

const CredentialPreview: React.FC<CredentialPreviewProps> = ({ node, ownerDid }) => {
    const [expanded, setExpanded] = useState(false);

    // Compute the claim once per render-set of node + did. Cheap: all
    // projection is pure in-memory work with no network.
    const claim = useMemo(() => {
        try {
            return toAchievementCredential({
                node,
                ownerDid,
                now: new Date().toISOString(),
            });
        } catch (err) {
            // `canProject` should gate this; surfacing it anyway so we
            // catch authoring bugs instead of silently rendering
            // nothing.
            if (err instanceof ProjectionError) return null;
            throw err;
        }
    }, [node, ownerDid]);

    if (!claim) return null;

    const achievement = claim.credentialSubject.achievement;
    const evidenceCount = claim.credentialSubject.evidence?.length ?? 0;
    const endorsementCount = claim.credentialSubject.endorsement?.length ?? 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut', delay: 0.4 }}
            className="rounded-2xl border border-emerald-200/80 bg-white/90
                       backdrop-blur-md overflow-hidden"
        >
            <button
                type="button"
                onClick={() => setExpanded(v => !v)}
                aria-expanded={expanded}
                className="w-full flex items-center gap-3 p-3 text-left
                           hover:bg-emerald-50/40 transition-colors"
            >
                <span
                    aria-hidden
                    className="shrink-0 w-8 h-8 rounded-full bg-emerald-100
                               flex items-center justify-center"
                >
                    <IonIcon
                        icon={ribbonOutline}
                        className="text-emerald-700 text-base"
                    />
                </span>

                <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-700">
                        Credential drafted
                    </p>

                    <p className="text-sm font-semibold text-grayscale-900 truncate">
                        {achievement.name}
                    </p>
                </div>

                <IonIcon
                    icon={expanded ? chevronUpOutline : chevronDownOutline}
                    className="shrink-0 text-grayscale-500 text-base"
                    aria-hidden
                />
            </button>

            <AnimatePresence initial={false}>
                {expanded && (
                    <motion.div
                        key="body"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="overflow-hidden"
                    >
                        <div className="px-3 pb-3 space-y-2 border-t border-emerald-100/80 pt-3">
                            {achievement.description && (
                                <p className="text-sm text-grayscale-700 leading-relaxed">
                                    {achievement.description}
                                </p>
                            )}

                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-grayscale-500 mb-0.5">
                                    Criteria
                                </p>

                                <p className="text-xs text-grayscale-700 leading-relaxed italic">
                                    {achievement.criteria.narrative}
                                </p>
                            </div>

                            <div className="flex items-center gap-3 pt-1 text-[11px] text-grayscale-500">
                                <span>
                                    {evidenceCount === 0
                                        ? 'No evidence attached'
                                        : evidenceCount === 1
                                            ? '1 piece of evidence'
                                            : `${evidenceCount} pieces of evidence`}
                                </span>

                                {endorsementCount > 0 && (
                                    <>
                                        <span aria-hidden>·</span>
                                        <span>
                                            {endorsementCount === 1
                                                ? '1 endorsement'
                                                : `${endorsementCount} endorsements`}
                                        </span>
                                    </>
                                )}
                            </div>

                            <p className="text-[11px] text-grayscale-400 pt-1">
                                Signed and saved to your wallet when issuance lands.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default CredentialPreview;
