/**
 * TemplatePicker — card chooser that sets policy + termination in
 * one atomic action.
 *
 * Replaces the old "pick a policy kind, then pick a termination
 * kind" flow that made simple steps feel like a DSL editor. The
 * author now sees seven human shapes ("Submit something", "Get
 * endorsed", …), taps one, and the variant fields below populate
 * themselves.
 *
 * The highlighted card reflects the *current* template as inferred
 * by `matchTemplate`. We don't store a "current template id" on the
 * node — an author can diverge the policy + termination arbitrarily
 * via the Advanced editors afterwards, and the picker stays honest
 * about that by falling back to a "no match" state when nothing
 * fits.
 */

import React from 'react';

import { IonIcon } from '@ionic/react';

import type { Policy, Termination } from '../../types';
import {
    matchTemplate,
    NODE_TEMPLATES,
    type NodeTemplate,
} from './registry';

interface TemplatePickerProps {
    policy: Policy;
    termination: Termination;

    /**
     * Apply a template. The parent owns atomicity (one call to
     * `pathwayStore.upsertPathway` with both policy + termination
     * set) so history/offline-queue get a single clean transaction.
     */
    onPick: (template: NodeTemplate) => void;
}

const TemplatePicker: React.FC<TemplatePickerProps> = ({
    policy,
    termination,
    onPick,
}) => {
    const current = matchTemplate(policy, termination);

    return (
        <div className="space-y-2">
            <p className="text-xs font-medium text-grayscale-700">Pick a shape</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {NODE_TEMPLATES.map(template => {
                    const isActive = current?.id === template.id;

                    return (
                        <button
                            key={template.id}
                            type="button"
                            onClick={() => onPick(template)}
                            aria-pressed={isActive}
                            className={`
                                group text-left rounded-xl p-3 transition-all
                                border
                                ${
                                    isActive
                                        ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                                        : 'border-grayscale-200 bg-white hover:border-grayscale-300 hover:bg-grayscale-10'
                                }
                                active:scale-[0.98]
                            `}
                        >
                            <div className="flex items-start gap-2.5">
                                <span
                                    className={`
                                        shrink-0 inline-flex items-center justify-center
                                        w-8 h-8 rounded-lg text-base
                                        ${
                                            isActive
                                                ? 'bg-emerald-600 text-white'
                                                : 'bg-grayscale-100 text-grayscale-700 group-hover:bg-grayscale-200'
                                        }
                                    `}
                                >
                                    <IonIcon icon={template.icon} aria-hidden />
                                </span>

                                <span className="min-w-0 flex-1">
                                    <span className="block text-sm font-semibold text-grayscale-900">
                                        {template.label}
                                    </span>

                                    <span className="block text-[11px] text-grayscale-600 leading-snug mt-0.5">
                                        {template.blurb}
                                    </span>
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default TemplatePicker;
