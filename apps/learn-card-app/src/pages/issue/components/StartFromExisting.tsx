import type { IssueImportResult } from '../import/issueImport';
import React from 'react';
import { Wand2, Send } from 'lucide-react';

import { useModal, ModalTypes } from 'learn-card-base';

import {
    SPREADSHEET_MODAL_OPTIONS,
    SPREADSHEET_MODAL_TYPES,
} from '../spreadsheet/SpreadsheetDialog';
import { ImportSheet } from '../import/ImportSheet';
import { ReuseExisting } from '../import/ReuseExisting';
import * as m from '../../../paraglide/messages.js';

interface StartFromExistingProps {
    onImport: (result: IssueImportResult) => void | Promise<void>;
}

export const StartFromExisting: React.FC<StartFromExistingProps> = ({ onImport }) => {
    const { newModal, closeModal } = useModal();

    const open = (node: React.ReactNode, workspace = false) =>
        newModal(
            node,
            workspace ? SPREADSHEET_MODAL_OPTIONS : {},
            workspace
                ? SPREADSHEET_MODAL_TYPES
                : { mobile: ModalTypes.Freeform, desktop: ModalTypes.FullScreen }
        );

    const handleUse = async (result: IssueImportResult): Promise<void> => {
        await onImport(result);
    };

    return (
        <div className="mt-4 pt-4 border-t border-grayscale-100 space-y-v3-2">
            <span className="block text-xs font-medium text-grayscale-400">
                {m['issueFlow.alreadyHave']()}
            </span>
            <button
                type="button"
                onClick={() =>
                    open(<ImportSheet onUse={handleUse} handleCloseModal={closeModal} />, true)
                }
                className="flex items-center gap-2 text-sm font-medium text-grayscale-600 hover:text-grayscale-900 transition-colors"
            >
                <Wand2 className="w-4 h-4 shrink-0 text-grayscale-400" />
                {m['issueFlow.startFromLink']()}
            </button>
            <button
                type="button"
                onClick={() =>
                    open(
                        <ReuseExisting
                            onUse={result => {
                                void handleUse({ kind: 'credential', value: result }).then(
                                    closeModal
                                );
                            }}
                            handleCloseModal={closeModal}
                        />
                    )
                }
                className="flex items-center gap-2 text-sm font-medium text-grayscale-600 hover:text-grayscale-900 transition-colors"
            >
                <Send className="w-4 h-4 shrink-0 text-grayscale-400" />
                {m['issueFlow.sendExisting']()}
            </button>
        </div>
    );
};
