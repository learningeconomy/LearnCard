import React from 'react';

import type { CredentialFixture } from '@learncard/credential-library';

import { Badge } from './Badge';
import { SPEC_COLORS, SPEC_LABELS, PROFILE_LABELS, VALIDITY_COLORS } from '../lib/colors';

interface FixtureCardProps {
    fixture: CredentialFixture;
    isSelected: boolean;
    isChecked: boolean;
    onToggleCheck: () => void;
    onClick: () => void;
}

export const FixtureCard: React.FC<FixtureCardProps> = ({ fixture, isSelected, isChecked, onToggleCheck, onClick }) => {
    const specColor = SPEC_COLORS[fixture.spec];
    const validityColor = VALIDITY_COLORS[fixture.validity];

    const handleCheckClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleCheck();
    };

    const canCheck = fixture.validity === 'valid';

    return (
        <button
            onClick={onClick}
            className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer group ${
                isSelected
                    ? 'bg-gray-800/80 border-blue-500/60 ring-1 ring-blue-500/30'
                    : isChecked
                        ? 'bg-gray-800/80 border-emerald-500/40 ring-1 ring-emerald-500/20'
                        : 'bg-gray-900/60 border-gray-800 hover:border-gray-700 hover:bg-gray-800/40'
            }`}
        >
            {/* Header row */}
            <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-start gap-2">
                    {canCheck && (
                        <div
                            role="checkbox"
                            aria-checked={isChecked}
                            onClick={handleCheckClick}
                            className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border-2 transition-colors cursor-pointer flex items-center justify-center ${
                                isChecked
                                    ? 'bg-emerald-500 border-emerald-500'
                                    : 'border-gray-600 hover:border-gray-400'
                            }`}
                        >
                            {isChecked && (
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </div>
                    )}
                </div>
                <h3 className="text-sm font-semibold text-gray-100 group-hover:text-white leading-tight flex-1">
                    {fixture.name}
                </h3>

                <Badge bg={validityColor.bg} text={validityColor.text}>
                    {fixture.validity}
                </Badge>
            </div>

            {/* Description */}
            <p className="text-xs text-gray-400 leading-relaxed mb-3 line-clamp-2">
                {fixture.description}
            </p>

            {/* Tags row */}
            <div className="flex flex-wrap items-center gap-1.5">
                <Badge bg={specColor.bg} text={specColor.text} border={specColor.border}>
                    {SPEC_LABELS[fixture.spec]}
                </Badge>

                <Badge>{PROFILE_LABELS[fixture.profile]}</Badge>

                {fixture.signed && (
                    <Badge bg="bg-indigo-900/50" text="text-indigo-300">
                        signed
                    </Badge>
                )}

                {fixture.features.slice(0, 3).map(feat => (
                    <Badge key={feat} bg="bg-gray-800/80" text="text-gray-400">
                        {feat}
                    </Badge>
                ))}

                {fixture.features.length > 3 && (
                    <Badge bg="bg-gray-800/80" text="text-gray-500">
                        +{fixture.features.length - 3}
                    </Badge>
                )}
            </div>

            {/* ID */}
            <div className="mt-2.5 text-[10px] font-mono text-gray-600">{fixture.id}</div>
        </button>
    );
};
