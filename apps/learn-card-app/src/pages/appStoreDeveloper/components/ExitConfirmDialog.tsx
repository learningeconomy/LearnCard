import React, { useState } from 'react';
import { X, Save, Trash2, Loader2 } from 'lucide-react';

interface ExitConfirmDialogProps {
    isOpen: boolean;
    onSave: () => Promise<boolean>;
    onDiscard: () => void;
    onCancel: () => void;
}

export const ExitConfirmDialog: React.FC<ExitConfirmDialogProps> = ({
    isOpen,
    onSave,
    onDiscard,
    onCancel,
}) => {
    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen) return null;

    const handleSave = async () => {
        setIsSaving(true);

        const success = await onSave();

        setIsSaving(false);

        if (success) {
            onCancel();
        }
    };

    const handleDiscard = () => {
        onDiscard();
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
            <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 animate-fade-in">
                <div className="p-6">
                    {/* Close button */}
                    <button
                        onClick={onCancel}
                        className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <h2 className="text-lg font-semibold text-gray-700 mb-2">
                        Save your progress?
                    </h2>

                    <p className="text-sm text-gray-500 mb-6">
                        You have unsaved changes. Would you like to save your listing as a draft
                        before leaving?
                    </p>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleSave}
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
                                    Save as Draft
                                </>
                            )}
                        </button>

                        <button
                            onClick={handleDiscard}
                            disabled={isSaving}
                            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-red-500 bg-white border border-gray-200 rounded-xl font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                            <Trash2 className="w-4 h-4" />
                            Discard Changes
                        </button>

                        <button
                            onClick={onCancel}
                            disabled={isSaving}
                            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-gray-600 bg-gray-100 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                            Continue Editing
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExitConfirmDialog;
