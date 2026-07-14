import React from 'react';
import { Wand2, Send } from 'lucide-react';

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
        <div className="mt-4 pt-4 border-t border-grayscale-100 space-y-2">
            <span className="block text-xs font-medium text-grayscale-400">
                Already have something?
            </span>
            <button
                type="button"
                onClick={() =>
                    open(<ImportSheet onUse={handleUse} handleCloseModal={closeModal} />)
                }
                className="flex items-center gap-2 text-sm font-medium text-grayscale-600 hover:text-grayscale-900 transition-colors"
            >
                <Wand2 className="w-4 h-4 shrink-0 text-grayscale-400" />
                Start from a link, file, or ID
            </button>
            <button
                type="button"
                onClick={() =>
                    open(<ReuseExisting onUse={handleUse} handleCloseModal={closeModal} />)
                }
                className="flex items-center gap-2 text-sm font-medium text-grayscale-600 hover:text-grayscale-900 transition-colors"
            >
                <Send className="w-4 h-4 shrink-0 text-grayscale-400" />
                Send one you've made
            </button>
        </div>
    );
};
