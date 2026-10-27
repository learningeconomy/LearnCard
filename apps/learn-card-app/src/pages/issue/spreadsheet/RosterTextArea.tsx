import React, { useId, useMemo, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { expandOutline, contractOutline } from 'ionicons/icons';
import * as m from '../../../paraglide/messages.js';
import { useLocale } from '../../../i18n';
import { ROSTER_LONG_TEXT_LIMIT } from './longText';

export const RosterTextArea: React.FC<
    Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'value'> & { value: string }
> = ({ value, disabled, className, 'aria-describedby': describedBy, ...props }) => {
    const [expanded, setExpanded] = useState(false);
    const counterId = useId();
    const locale = useLocale();
    const format = useMemo(() => new Intl.NumberFormat(locale), [locale]);
    return (
        <div className="space-y-v3-1.5">
            <textarea
                {...props}
                value={value}
                disabled={disabled}
                rows={expanded ? 7 : 3}
                // Preserve pasted text too; validation blocks sends above the limit.
                aria-describedby={[describedBy, counterId].filter(Boolean).join(' ')}
                className={`${className} block min-h-[80px] max-h-[240px] resize-y leading-relaxed`}
            />
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span
                    id={counterId}
                    className={
                        !disabled && value.length > ROSTER_LONG_TEXT_LIMIT
                            ? 'text-red-700'
                            : 'text-grayscale-500'
                    }
                >
                    {m['issueFlow.sheet.reviewWorkspace.characterCount']({
                        count: format.format(value.length),
                        limit: format.format(ROSTER_LONG_TEXT_LIMIT),
                    })}
                </span>
                <button
                    type="button"
                    aria-expanded={expanded}
                    aria-label={
                        expanded
                            ? m['issueFlow.sheet.reviewWorkspace.collapseField']({
                                  field: String(props['aria-label'] ?? ''),
                              })
                            : m['issueFlow.sheet.reviewWorkspace.expandField']({
                                  field: String(props['aria-label'] ?? ''),
                              })
                    }
                    onClick={() => setExpanded(!expanded)}
                    className="inline-flex items-center gap-1 rounded-[20px] px-2 py-1 font-medium text-grayscale-600 hover:bg-grayscale-100 hover:text-grayscale-900"
                >
                    <IonIcon icon={expanded ? contractOutline : expandOutline} aria-hidden="true" />
                    {expanded
                        ? m['issueFlow.sheet.reviewWorkspace.collapse']()
                        : m['issueFlow.sheet.reviewWorkspace.expand']()}
                </button>
            </div>
        </div>
    );
};
