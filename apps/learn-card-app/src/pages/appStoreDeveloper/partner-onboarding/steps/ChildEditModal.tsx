/**
 * ChildEditModal - Modal for editing child template in master/child hierarchy
 * Extracted from TemplateBuilderStep for lazy loading
 */

import React from 'react';
import {
    X,
    Pencil,
    Save,
    AlertCircle,
    CheckCircle,
    XCircle,
} from 'lucide-react';

import { 
    CredentialBuilder, 
    OBv3CredentialTemplate,
} from '../components/CredentialBuilder';
import { ValidationStatus } from './templateBuilderUtils';

interface ChildEditModalProps {
    template: OBv3CredentialTemplate;
    onChange: (template: OBv3CredentialTemplate) => void;
    onSave: () => void;
    onCancel: () => void;
    issuerName?: string;
    issuerImage?: string;
    onTestIssue?: (credential: Record<string, unknown>) => Promise<{ success: boolean; error?: string; result?: unknown }>;
    validationStatus: ValidationStatus;
    validationError: string | null;
    onValidationChange: (status: ValidationStatus, error?: string) => void;
}

export const ChildEditModal: React.FC<ChildEditModalProps> = ({
    template,
    onChange,
    onSave,
    onCancel,
    issuerName,
    issuerImage,
    onTestIssue,
    validationStatus,
    validationError,
    onValidationChange,
}) => {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                            <Pencil className="w-5 h-5 text-violet-600" />
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-800">
                                Customize Boost
                            </h3>
                            <p className="text-sm text-gray-500">
                                {template.name?.value || 'Untitled'}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onCancel}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Body - CredentialBuilder */}
                <div className="flex-1 min-h-0 overflow-auto" style={{ height: '600px' }}>
                    <CredentialBuilder
                        template={template}
                        onChange={onChange}
                        issuerName={issuerName}
                        issuerImage={issuerImage}
                        onTestIssue={onTestIssue}
                        onValidationChange={onValidationChange}
                        initialValidationStatus={validationStatus}
                    />
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-between gap-3 p-4 border-t border-gray-200 bg-gray-50">
                    {/* Validation status hint */}
                    <div className="flex-1">
                        {validationStatus === 'invalid' && validationError && (
                            <div className="flex items-start gap-2 text-sm text-red-700">
                                <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <span className="line-clamp-2">{validationError}</span>
                            </div>
                        )}
                        {validationStatus === 'unknown' && (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span>Click "Validate" in the builder to verify before saving</span>
                            </div>
                        )}
                        {validationStatus === 'valid' && (
                            <div className="flex items-center gap-2 text-sm text-emerald-600">
                                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                                <span>Credential validated successfully</span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>

                        <button
                            onClick={onSave}
                            disabled={validationStatus === 'invalid'}
                            className="flex items-center gap-2 px-4 py-2 bg-violet-500 text-white rounded-xl font-medium hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title={validationStatus === 'invalid' ? 'Fix validation errors before saving' : undefined}
                        >
                            <Save className="w-4 h-4" />
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChildEditModal;
