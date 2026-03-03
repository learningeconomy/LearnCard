/**
 * CsvImportModal - Modal for importing course catalog from CSV
 * Extracted from TemplateBuilderStep for lazy loading
 */

import React from 'react';
import {
    X,
    FileSpreadsheet,
    Upload,
    Loader2,
    Check,
    CheckCircle2,
    ArrowDown,
    Award,
} from 'lucide-react';
import { ImageIcon } from 'lucide-react';

import { 
    CATALOG_FIELD_OPTIONS, 
    FIELD_GROUPS, 
    ISSUANCE_FIELDS,
} from './templateBuilderConstants';

interface CsvImportModalProps {
    csvColumns: string[];
    csvAllRows: Record<string, string>[];
    csvSampleRows: Record<string, string>[];
    columnMappings: Record<string, string>;
    setColumnMappings: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    issuanceFieldsIncluded: Record<string, boolean>;
    setIssuanceFieldsIncluded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    defaultImage: string;
    setDefaultImage: (url: string) => void;
    isUploadingImage: boolean;
    handleImageSelect: () => void;
    onConfirm: () => void;
    onCancel: () => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
    csvColumns,
    csvAllRows,
    csvSampleRows,
    columnMappings,
    setColumnMappings,
    issuanceFieldsIncluded,
    setIssuanceFieldsIncluded,
    defaultImage,
    setDefaultImage,
    isUploadingImage,
    handleImageSelect,
    onConfirm,
    onCancel,
}) => {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-800">Import Course Catalog</h3>
                            <p className="text-sm text-gray-500">
                                {csvAllRows.length} courses found • {csvColumns.length} columns
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

                {/* Modal Body */}
                <div className="flex-1 overflow-auto p-4 space-y-6">
                    {/* Explanation */}
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
                        <p className="font-medium mb-1">How this works:</p>
                        <p>
                            We'll create <strong>{csvAllRows.length} separate boosts</strong> — one for each course. 
                            Course data (name, credits, etc.) will be <strong>baked in</strong>. 
                            Recipient data (name, date) stays <strong>dynamic</strong> for issuance.
                        </p>
                    </div>

                    {/* Default Image Section */}
                    <div>
                        <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-700">
                                Default Credential Image
                            </label>
                            <p className="text-xs text-gray-500">
                                This image will be used for all credentials unless overridden by a CSV column
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            {defaultImage ? (
                                <div className="relative group">
                                    <img
                                        src={defaultImage}
                                        alt="Default credential"
                                        className="w-20 h-20 rounded-xl object-cover border border-gray-200"
                                    />

                                    <button
                                        onClick={() => setDefaultImage('')}
                                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ) : (
                                <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                                    <ImageIcon className="w-8 h-8 text-gray-400" />
                                </div>
                            )}

                            <button
                                onClick={handleImageSelect}
                                disabled={isUploadingImage}
                                className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                {isUploadingImage ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4" />
                                        {defaultImage ? 'Change Image' : 'Upload Image'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Catalog Fields Section */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Catalog Fields (Baked into each boost)
                                </label>
                                <p className="text-xs text-gray-500">These values come from your CSV</p>
                            </div>

                            <span className="text-xs text-gray-500">
                                {Object.values(columnMappings).filter(v => v !== 'skip').length} mapped
                            </span>
                        </div>

                        <div className="space-y-2">
                            {csvColumns.map(column => {
                                const mapping = columnMappings[column] || 'skip';
                                const sampleValue = csvSampleRows[0]?.[column] || '';

                                return (
                                    <div
                                        key={column}
                                        className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                                            mapping === 'skip'
                                                ? 'border-gray-200 bg-gray-50'
                                                : 'border-emerald-200 bg-emerald-50'
                                        }`}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-gray-800 truncate">{column}</div>

                                            {sampleValue && (
                                                <div className="text-xs text-gray-500 truncate">
                                                    e.g., "{sampleValue}"
                                                </div>
                                            )}
                                        </div>

                                        <ArrowDown className={`w-4 h-4 flex-shrink-0 ${
                                            mapping === 'skip' ? 'text-gray-300' : 'text-emerald-500'
                                        }`} />

                                        <select
                                            value={mapping}
                                            onChange={(e) => setColumnMappings(prev => ({
                                                ...prev,
                                                [column]: e.target.value
                                            }))}
                                            className={`px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                                                mapping === 'skip'
                                                    ? 'border-gray-300 bg-white'
                                                    : 'border-emerald-300 bg-white'
                                            }`}
                                        >
                                            {/* Skip option */}
                                            <option value="skip">— Skip this column —</option>

                                            {/* Group options by category */}
                                            {Object.entries(FIELD_GROUPS)
                                                .filter(([key]) => key !== 'skip')
                                                .map(([groupKey, groupLabel]) => {
                                                    const groupOptions = CATALOG_FIELD_OPTIONS.filter(o => o.group === groupKey);

                                                    if (groupOptions.length === 0) return null;

                                                    return (
                                                        <optgroup key={groupKey} label={groupLabel}>
                                                            {groupOptions.map(option => (
                                                                <option key={option.id} value={option.id}>{option.label}</option>
                                                            ))}
                                                        </optgroup>
                                                    );
                                                })}
                                        </select>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Issuance Fields Section */}
                    <div>
                        <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-700">
                                Issuance Fields
                            </label>
                            <p className="text-xs text-gray-500">
                                <span className="text-violet-600 font-medium">Dynamic</span> = you provide at issuance time
                            </p>
                        </div>

                        {/* Dynamic fields - user can toggle */}
                        <div className="grid grid-cols-2 gap-2 mb-4">
                            {ISSUANCE_FIELDS.filter(f => f.type === 'dynamic').map(field => {
                                const isIncluded = issuanceFieldsIncluded[field.id] ?? field.defaultIncluded;

                                return (
                                    <label
                                        key={field.id}
                                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                                            isIncluded
                                                ? 'border-violet-200 bg-violet-50'
                                                : 'border-gray-200 bg-gray-50'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isIncluded}
                                            onChange={(e) => setIssuanceFieldsIncluded(prev => ({
                                                ...prev,
                                                [field.id]: e.target.checked
                                            }))}
                                            className="w-4 h-4 rounded border-gray-300 text-violet-500 focus:ring-2 focus:ring-violet-500"
                                        />

                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-gray-800 text-sm">{field.label}</span>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-violet-100 text-violet-700">
                                                    Dynamic
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500">{field.description}</div>
                                        </div>

                                        {isIncluded && (
                                            <code className="text-xs text-violet-600 bg-violet-100 px-1.5 py-0.5 rounded">
                                                {`{{${field.id}}}`}
                                            </code>
                                        )}
                                    </label>
                                );
                            })}
                        </div>

                        {/* System fields - informational only */}
                        <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-xl">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-cyan-100 text-cyan-700">
                                    System
                                </span>
                                <span className="text-xs text-cyan-700 font-medium">Auto-injected at issuance</span>
                            </div>
                            <div className="space-y-1">
                                {ISSUANCE_FIELDS.filter(f => f.type === 'system').map(field => (
                                    <div key={field.id} className="flex items-center gap-2 text-xs text-cyan-800">
                                        <CheckCircle2 className="w-3 h-3 text-cyan-600" />
                                        <span className="font-medium">{field.label}</span>
                                        <span className="text-cyan-600">— {field.description}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="p-4 bg-gray-50 rounded-xl">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                            Preview: First 3 Boosts to Create
                        </h4>

                        <div className="space-y-2">
                            {csvSampleRows.slice(0, 3).map((row, idx) => {
                                const nameCol = Object.entries(columnMappings).find(([_, type]) => type === 'achievement.name')?.[0];
                                const name = nameCol ? row[nameCol] : `Course ${idx + 1}`;

                                return (
                                    <div key={idx} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200">
                                        <Award className="w-4 h-4 text-cyan-500" />
                                        <span className="font-medium text-gray-800">{name} Completion</span>
                                        <span className="text-xs text-gray-500">
                                            + {Object.values(issuanceFieldsIncluded).filter(Boolean).length} dynamic fields
                                        </span>
                                    </div>
                                );
                            })}

                            {csvAllRows.length > 3 && (
                                <div className="text-xs text-gray-500 text-center py-1">
                                    ...and {csvAllRows.length - 3} more
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-between p-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                        Will create <strong>{csvAllRows.length}</strong> course boosts
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>

                        <button
                            onClick={onConfirm}
                            disabled={Object.values(columnMappings).every(v => v === 'skip')}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Check className="w-4 h-4" />
                            Create {csvAllRows.length} Boosts
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CsvImportModal;
