import React from 'react';
import { IonIcon } from '@ionic/react';
import { chevronForward, hourglassOutline, lockClosed } from 'ionicons/icons';
import type { ShareLink } from '@learncard/types';

import * as m from '../../../../paraglide/messages.js';
import CopyIconButton from './CopyIconButton';
import CredentialStackGlyph from './CredentialStackGlyph';
import { getSharedLinkViewStatus, shareRowMeta } from './sharedLinkFormat';
import './sharedLinks.css';

type ShareLinkRowProps = {
    share: ShareLink;
    pending: boolean;
    busy: boolean;
    showViewStats: boolean;
    index?: number;
    animate?: boolean;
    onOpen: (share: ShareLink) => void;
    onCopy: (share: ShareLink) => Promise<boolean>;
};

const ShareLinkRow: React.FC<ShareLinkRowProps> = ({
    share,
    pending,
    busy,
    showViewStats,
    index = 0,
    animate = false,
    onOpen,
    onCopy,
}) => {
    const status = getSharedLinkViewStatus(share);
    const meta = shareRowMeta(share, { pending, showViewStats });
    const canCopy = status === 'active' && share.contentState === 'finalized';

    return (
        <li
            className={`group relative flex items-center gap-1 pe-2 transition-colors hover:bg-grayscale-10 ${animate ? 'sl-row-in' : ''}`}
            style={animate ? { animationDelay: `${index * 30}ms` } : undefined}
        >
            <button
                type="button"
                onClick={() => onOpen(share)}
                className="min-w-0 flex-1 py-3 ps-4 text-start after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-emerald-500 group-first:after:rounded-t-[20px] group-last:after:rounded-b-[20px]"
            >
                <span
                    className={`block truncate text-sm font-medium ${status === 'stopped' ? 'text-grayscale-600' : 'text-grayscale-900'}`}
                >
                    {share.title}
                </span>
                <span className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-grayscale-600">
                    {meta.pending ? (
                        <span className="inline-flex items-center gap-1.5 text-amber-800">
                            <span className="sl-dot" aria-hidden="true" />
                            {m['dataShareCenter.shared.updateInProgress']()}
                        </span>
                    ) : (
                        <>
                            {meta.locked && (
                                <IonIcon
                                    icon={lockClosed}
                                    role="img"
                                    aria-label={m['dataShareCenter.shared.passcodeOnIcon']()}
                                    className="shrink-0 text-grayscale-500"
                                />
                            )}
                            <CredentialStackGlyph count={share.selectedCount} />
                            <span className="shrink-0">{meta.credentials}</span>
                            {meta.hint && (
                                <>
                                    <span aria-hidden="true">·</span>
                                    <span
                                        className={`min-w-0 truncate inline-flex items-center gap-1 ${meta.hint.tone === 'soon' ? 'text-amber-800' : ''}`}
                                    >
                                        {meta.hint.tone === 'soon' && (
                                            <IonIcon icon={hourglassOutline} aria-hidden="true" />
                                        )}
                                        {meta.hint.tone === 'fresh' && (
                                            <span
                                                className="sl-dot text-emerald-500"
                                                role="img"
                                                aria-label={m[
                                                    'dataShareCenter.shared.justOpened'
                                                ]()}
                                            />
                                        )}
                                        {meta.hint.label}
                                    </span>
                                </>
                            )}
                        </>
                    )}
                </span>
            </button>
            {canCopy && (
                <CopyIconButton
                    label={m['dataShareCenter.shared.copyLinkFor']({ title: share.title })}
                    disabled={busy}
                    onCopy={() => onCopy(share)}
                />
            )}
            <IonIcon
                icon={chevronForward}
                aria-hidden="true"
                className="shrink-0 text-grayscale-400 transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5"
            />
        </li>
    );
};

export default ShareLinkRow;
