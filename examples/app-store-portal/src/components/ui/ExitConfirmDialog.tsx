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
            onCancel(); // Close dialog - onSave handles navigation
        }
    };

    const handleDiscard = () => {
        onDiscard();
        onCancel();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onCancel}
            />

            {/* Dialog */}
            <div className="relative bg-white rounded-apple-xl shadow-apple-lg max-w-md w-full mx-4 animate-fade-in">
                <div className="p-6">
                    {/* Close button */}
                    <button
                        onClick={onCancel}
                        className="absolute top-4 right-4 p-1 text-apple-gray-400 hover:text-apple-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <h2 className="text-lg font-semibold text-apple-gray-600 mb-2">
                        Save your progress?
                    </h2>

                    <p className="text-sm text-apple-gray-500 mb-6">
                        You have unsaved changes. Would you like to save your listing as a draft
                        before leaving?
                    </p>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="btn-primary w-full justify-center"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save as Draft
                                </>
                            )}
                        </button>

                        <button
                            onClick={handleDiscard}
                            disabled={isSaving}
                            className="btn-ghost text-red-500 hover:bg-red-50 w-full justify-center"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Discard Changes
                        </button>

                        <button
                            onClick={onCancel}
                            disabled={isSaving}
                            className="btn-ghost w-full justify-center"
                        >
                            Continue Editing
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
