import React, { useState } from 'react';
import * as m from '../../../paraglide/messages.js';
import { X, Save, Play, Loader2 } from 'lucide-react';

interface PreviewConfirmDialogProps {
    isOpen: boolean;
    hasUnsavedChanges: boolean;
    onSaveAndPreview: () => Promise<boolean>;
    onPreviewWithoutSaving: () => void;
    onCancel: () => void;
}

export const PreviewConfirmDialog: React.FC<PreviewConfirmDialogProps> = ({
    isOpen,
    hasUnsavedChanges,
    onSaveAndPreview,
    onPreviewWithoutSaving,
    onCancel,
}) => {
    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen) return null;

    const handleSaveAndPreview = async () => {
        setIsSaving(true);

        const success = await onSaveAndPreview();

        setIsSaving(false);

        if (success) {
            onCancel();
        }
    };

    const handlePreviewWithoutSaving = () => {
        onPreviewWithoutSaving();
        onCancel();
    };

    return (
        <div
            data-modal-root
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm"
        >
            {/* Backdrop */}
            <div className="absolute inset-0" onClick={onCancel} />

            {/* Dialog */}
            <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
                <div className="p-6">
                    {/* Close button */}
                    <button
                        onClick={onCancel}
                        className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                            <Play className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-700">
                            {m['developerPortal.components.previewConfirmDialog.previewApp']()}
                        </h2>
                    </div>

                    {hasUnsavedChanges ? (
                        <>
                            <p className="text-sm text-gray-500 mb-6">
                                {m[
                                    'developerPortal.components.previewConfirmDialog.unsavedChanges'
                                ]()}
                            </p>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleSaveAndPreview}
                                    disabled={isSaving}
                                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 transition-colors disabled:opacity-50"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            {m[
                                                'developerPortal.components.previewConfirmDialog.saving'
                                            ]()}
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            {m[
                                                'developerPortal.components.previewConfirmDialog.saveDraftAndPreview'
                                            ]()}
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={handlePreviewWithoutSaving}
                                    disabled={isSaving}
                                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-indigo-100 text-indigo-700 rounded-xl font-medium hover:bg-indigo-200 transition-colors disabled:opacity-50"
                                >
                                    <Play className="w-4 h-4" />
                                    {m[
                                        'developerPortal.components.previewConfirmDialog.previewWithoutSaving'
                                    ]()}
                                </button>

                                <button
                                    onClick={onCancel}
                                    disabled={isSaving}
                                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-gray-600 bg-gray-100 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                                >
                                    {m['developerPortal.components.previewConfirmDialog.cancel']()}
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <p className="text-sm text-gray-500 mb-6">
                                {m['developerPortal.components.previewConfirmDialog.previewDesc']()}
                            </p>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handlePreviewWithoutSaving}
                                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors"
                                >
                                    <Play className="w-4 h-4" />
                                    {m[
                                        'developerPortal.components.previewConfirmDialog.openPreview'
                                    ]()}
                                </button>

                                <button
                                    onClick={onCancel}
                                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-gray-600 bg-gray-100 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                                >
                                    {m['developerPortal.components.previewConfirmDialog.cancel']()}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PreviewConfirmDialog;
