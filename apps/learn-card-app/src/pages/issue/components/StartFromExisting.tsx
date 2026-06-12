import React from 'react';
import { Wand2, RotateCcw } from 'lucide-react';

import { useModal, ModalTypes } from 'learn-card-base';

import { ImportSheet } from '../import/ImportSheet';
import { ReuseExisting } from '../import/ReuseExisting';
import type { NormalizedImport } from '../import/normalizeToObv3';

interface StartFromExistingProps {
    onImport: (result: NormalizedImport) => void;
}

export const StartFromExisting: React.FC<StartFromExistingProps> = ({ onImport }) => {
    const { newModal, closeModal } = useModal();

    const open = (node: React.ReactNode) =>
        newModal(node, {}, { mobile: ModalTypes.Freeform, desktop: ModalTypes.FullScreen });

    const handleUse = (result: NormalizedImport) => {
        onImport(result);
        closeModal();
    };

    return (
        <div className="mt-3 pt-3 border-t border-grayscale-100 flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <span className="text-xs text-grayscale-400">Already have something?</span>
            <button
                type="button"
                onClick={() =>
                    open(<ImportSheet onUse={handleUse} handleCloseModal={closeModal} />)
                }
                className="flex items-center gap-1.5 text-sm font-medium text-grayscale-600 hover:text-grayscale-900 transition-colors"
            >
                <Wand2 className="w-4 h-4" />
                Start from a link, file, or ID
            </button>
            <button
                type="button"
                onClick={() =>
                    open(<ReuseExisting onUse={handleUse} handleCloseModal={closeModal} />)
                }
                className="flex items-center gap-1.5 text-sm font-medium text-grayscale-600 hover:text-grayscale-900 transition-colors"
            >
                <RotateCcw className="w-4 h-4" />
                Reuse one you've made
            </button>
        </div>
    );
};
