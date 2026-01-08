/**
 * FieldEditor - Editable field with dynamic variable toggle
 */

import React, { useState, useCallback } from 'react';
import { Zap, ZapOff, ChevronDown, ChevronUp, HelpCircle, Upload, Loader2, Settings, Lock } from 'lucide-react';

import { useFilestack } from 'learn-card-base';

import { TemplateFieldValue, staticField, dynamicField } from './types';
import { labelToVariableName } from './utils';

interface FieldEditorProps {
    label: string;
    field: TemplateFieldValue;
    onChange: (field: TemplateFieldValue) => void;
    placeholder?: string;
    helpText?: string;
    type?: 'text' | 'textarea' | 'url' | 'email' | 'select';
    options?: { value: string; label: string }[];
    required?: boolean;
    disabled?: boolean;
    showDynamicToggle?: boolean;
    enableFileUpload?: boolean;
}

export const FieldEditor: React.FC<FieldEditorProps> = ({
    label,
    field,
    onChange,
    placeholder,
    helpText,
    type = 'text',
    options,
    required = false,
    disabled = false,
    showDynamicToggle = true,
    enableFileUpload = false,
}) => {
    const [showHelp, setShowHelp] = useState(false);
    const [customVarName, setCustomVarName] = useState(false);

    const { handleFileSelect, isLoading: isUploading } = useFilestack({
        onUpload: (url: string) => {
            handleValueChange(url);
        },
        fileType: 'image/*',
        resizeBeforeUploading: true,
    });

    const handleValueChange = useCallback((value: string) => {
        onChange({
            ...field,
            value,
            variableName: field.variableName || labelToVariableName(label),
        });
    }, [field, onChange, label]);

    const handleToggleDynamic = useCallback(() => {
        if (field.isDynamic) {
            // Switching to static - keep the value
            onChange(staticField(field.value));
        } else {
            // Switching to dynamic - generate variable name from label
            const varName = field.variableName || labelToVariableName(label);
            onChange(dynamicField(varName, field.value));
        }
    }, [field, onChange, label]);

    const handleVariableNameChange = useCallback((varName: string) => {
        onChange({
            ...field,
            variableName: varName.replace(/[^a-z0-9_]/gi, '_').toLowerCase(),
        });
    }, [field, onChange]);

    const renderInput = () => {
        const baseClasses = `w-full px-3 py-2 border rounded-lg text-sm outline-none transition-colors ${
            field.isDynamic 
                ? 'border-violet-300 bg-violet-50 focus:ring-2 focus:ring-violet-500 focus:border-violet-500' 
                : 'border-gray-200 bg-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`;

        if (type === 'select' && options) {
            return (
                <select
                    value={field.value}
                    onChange={(e) => handleValueChange(e.target.value)}
                    disabled={disabled}
                    className={baseClasses}
                >
                    <option value="">Select...</option>

                    {options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            );
        }

        if (type === 'textarea') {
            return (
                <textarea
                    value={field.value}
                    onChange={(e) => handleValueChange(e.target.value)}
                    placeholder={field.isDynamic ? `Dynamic: {{${field.variableName || labelToVariableName(label)}}}` : placeholder}
                    disabled={disabled}
                    rows={3}
                    className={`${baseClasses} resize-none`}
                />
            );
        }

        if (enableFileUpload) {
            return (
                <div className="flex gap-2">
                    <input
                        type={type}
                        value={field.value}
                        onChange={(e) => handleValueChange(e.target.value)}
                        placeholder={field.isDynamic ? `Dynamic: {{${field.variableName || labelToVariableName(label)}}}` : placeholder}
                        disabled={disabled}
                        className={`${baseClasses} flex-1`}
                    />

                    <button
                        type="button"
                        onClick={handleFileSelect}
                        disabled={disabled || isUploading}
                        className="flex items-center gap-1 px-3 py-2 bg-cyan-50 text-cyan-700 border border-cyan-200 rounded-lg text-sm font-medium hover:bg-cyan-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Upload image"
                    >
                        {isUploading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Upload className="w-4 h-4" />
                        )}
                    </button>
                </div>
            );
        }

        return (
            <input
                type={type}
                value={field.value}
                onChange={(e) => handleValueChange(e.target.value)}
                placeholder={field.isDynamic ? `Dynamic: {{${field.variableName || labelToVariableName(label)}}}` : placeholder}
                disabled={disabled}
                className={baseClasses}
            />
        );
    };

    // Render system field (non-editable, auto-injected)
    if (field.isSystem) {
        return (
            <div className="space-y-1">
                <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
                        {label}

                        {helpText && (
                            <button
                                type="button"
                                onClick={() => setShowHelp(!showHelp)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <HelpCircle className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </label>

                    <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
                        <Settings className="w-3 h-3" />
                        System
                    </span>
                </div>

                {showHelp && helpText && (
                    <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">{helpText}</p>
                )}

                <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                    <Lock className="w-4 h-4 text-amber-600 flex-shrink-0" />

                    <div className="flex-1">
                        <p className="text-sm text-amber-800 font-medium">Auto-generated at issuance</p>

                        {field.systemDescription && (
                            <p className="text-xs text-amber-600 mt-0.5">{field.systemDescription}</p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between">
                <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
                    {label}
                    {required && <span className="text-red-500">*</span>}

                    {helpText && (
                        <button
                            type="button"
                            onClick={() => setShowHelp(!showHelp)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <HelpCircle className="w-3.5 h-3.5" />
                        </button>
                    )}
                </label>

                {showDynamicToggle && (
                    <button
                        type="button"
                        onClick={handleToggleDynamic}
                        disabled={disabled}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                            field.isDynamic
                                ? 'bg-violet-100 text-violet-700 hover:bg-violet-200'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={field.isDynamic ? 'Click to make static' : 'Click to make dynamic'}
                    >
                        {field.isDynamic ? (
                            <>
                                <Zap className="w-3 h-3" />
                                Dynamic
                            </>
                        ) : (
                            <>
                                <ZapOff className="w-3 h-3" />
                                Static
                            </>
                        )}
                    </button>
                )}
            </div>

            {showHelp && helpText && (
                <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">{helpText}</p>
            )}

            {renderInput()}

            {field.isDynamic && (
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-violet-600">Variable:</span>

                    {customVarName ? (
                        <input
                            type="text"
                            value={field.variableName}
                            onChange={(e) => handleVariableNameChange(e.target.value)}
                            className="flex-1 px-2 py-0.5 text-xs border border-violet-200 rounded bg-violet-50 focus:outline-none focus:ring-1 focus:ring-violet-500"
                            placeholder="variable_name"
                        />
                    ) : (
                        <code className="text-xs bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded">
                            {`{{${field.variableName || labelToVariableName(label)}}}`}
                        </code>
                    )}

                    <button
                        type="button"
                        onClick={() => setCustomVarName(!customVarName)}
                        className="text-xs text-violet-600 hover:text-violet-800"
                    >
                        {customVarName ? 'Done' : 'Edit'}
                    </button>
                </div>
            )}
        </div>
    );
};

/**
 * CollapsibleSection - Expandable section container
 */
interface CollapsibleSectionProps {
    title: string;
    icon: React.ReactNode;
    isExpanded: boolean;
    onToggle: () => void;
    children: React.ReactNode;
    badge?: string;
    optional?: boolean;
    onAdd?: () => void;
    onRemove?: () => void;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
    title,
    icon,
    isExpanded,
    onToggle,
    children,
    badge,
    optional = false,
    onAdd,
    onRemove,
}) => {
    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
            <button
                type="button"
                onClick={onToggle}
                className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    {icon}
                </div>

                <span className="flex-1 text-left font-medium text-gray-800">{title}</span>

                {optional && (
                    <span className="text-xs text-gray-400 px-2 py-0.5 bg-gray-200 rounded">Optional</span>
                )}

                {badge && (
                    <span className="text-xs text-cyan-700 px-2 py-0.5 bg-cyan-100 rounded">{badge}</span>
                )}

                {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
            </button>

            {isExpanded && (
                <div className="p-4 space-y-4 border-t border-gray-100">
                    {children}

                    {(onAdd || onRemove) && (
                        <div className="flex gap-2 pt-2 border-t border-gray-100">
                            {onRemove && (
                                <button
                                    type="button"
                                    onClick={onRemove}
                                    className="text-xs text-red-600 hover:text-red-800"
                                >
                                    Remove Section
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default FieldEditor;
