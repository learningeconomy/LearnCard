import React, { useState } from 'react';
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onCancel}
            />

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
                            Preview App
                        </h2>
                    </div>

                    {hasUnsavedChanges ? (
                        <>
                            <p className="text-sm text-gray-500 mb-6">
                                You have unsaved changes. Would you like to save your progress as a draft before previewing?
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
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            Save Draft & Preview
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={handlePreviewWithoutSaving}
                                    disabled={isSaving}
                                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-indigo-100 text-indigo-700 rounded-xl font-medium hover:bg-indigo-200 transition-colors disabled:opacity-50"
                                >
                                    <Play className="w-4 h-4" />
                                    Preview Without Saving
                                </button>

                                <button
                                    onClick={onCancel}
                                    disabled={isSaving}
                                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-gray-600 bg-gray-100 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <p className="text-sm text-gray-500 mb-6">
                                Preview your app to test how it works within LearnCard. The diagnostics panel will show all partner-connect API calls.
                            </p>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handlePreviewWithoutSaving}
                                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors"
                                >
                                    <Play className="w-4 h-4" />
                                    Open Preview
                                </button>

                                <button
                                    onClick={onCancel}
                                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-gray-600 bg-gray-100 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
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
