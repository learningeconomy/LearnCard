/**
 * JsonPreview - Live JSON preview with bidirectional editing
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Copy, Check, AlertCircle, RefreshCw, Code, Eye } from 'lucide-react';

import { OBv3CredentialTemplate } from './types';
import { templateToJson, jsonToTemplate, extractDynamicVariables } from './utils';

interface JsonPreviewProps {
    template: OBv3CredentialTemplate;
    onChange: (template: OBv3CredentialTemplate) => void;
    isEditable?: boolean;
}

export const JsonPreview: React.FC<JsonPreviewProps> = ({
    template,
    onChange,
    isEditable = true,
}) => {
    const [editMode, setEditMode] = useState(false);
    const [jsonText, setJsonText] = useState('');
    const [parseError, setParseError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // Convert template to JSON string
    const jsonFromTemplate = useMemo(() => {
        try {
            const json = templateToJson(template);
            return JSON.stringify(json, null, 2);
        } catch (e) {
            return '{}';
        }
    }, [template]);

    // Sync JSON text when template changes (only in view mode)
    useEffect(() => {
        if (!editMode) {
            setJsonText(jsonFromTemplate);
            setParseError(null);
        }
    }, [jsonFromTemplate, editMode]);

    // Extract dynamic variables for display
    const dynamicVariables = useMemo(() => {
        return extractDynamicVariables(template);
    }, [template]);

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(jsonFromTemplate);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (e) {
            console.error('Failed to copy:', e);
        }
    }, [jsonFromTemplate]);

    const handleJsonChange = useCallback((value: string) => {
        setJsonText(value);

        try {
            const parsed = JSON.parse(value);
            setParseError(null);

            // Convert back to template
            const newTemplate = jsonToTemplate(parsed);
            onChange(newTemplate);
        } catch (e) {
            setParseError((e as Error).message);
        }
    }, [onChange]);

    const handleEnterEditMode = useCallback(() => {
        setJsonText(jsonFromTemplate);
        setEditMode(true);
        setParseError(null);
    }, [jsonFromTemplate]);

    const handleExitEditMode = useCallback(() => {
        setEditMode(false);
        setJsonText(jsonFromTemplate);
        setParseError(null);
    }, [jsonFromTemplate]);

    const handleResetJson = useCallback(() => {
        setJsonText(jsonFromTemplate);
        setParseError(null);
    }, [jsonFromTemplate]);

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2">
                    <Code className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">JSON Preview</span>
                </div>

                <div className="flex items-center gap-2">
                    {isEditable && (
                        <button
                            type="button"
                            onClick={editMode ? handleExitEditMode : handleEnterEditMode}
                            className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                                editMode
                                    ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {editMode ? (
                                <>
                                    <Eye className="w-3 h-3" />
                                    View Mode
                                </>
                            ) : (
                                <>
                                    <Code className="w-3 h-3" />
                                    Edit Mode
                                </>
                            )}
                        </button>
                    )}

                    {editMode && parseError && (
                        <button
                            type="button"
                            onClick={handleResetJson}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                        >
                            <RefreshCw className="w-3 h-3" />
                            Reset
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={handleCopy}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                    >
                        {copied ? (
                            <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                Copied!
                            </>
                        ) : (
                            <>
                                <Copy className="w-3 h-3" />
                                Copy
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Error Banner */}
            {parseError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border-b border-red-200">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />

                    <div className="flex-1">
                        <p className="text-xs font-medium text-red-700">Invalid JSON</p>
                        <p className="text-xs text-red-600 mt-0.5">{parseError}</p>
                    </div>
                </div>
            )}

            {/* Dynamic Variables Summary */}
            {dynamicVariables.length > 0 && !editMode && (
                <div className="p-3 bg-violet-50 border-b border-violet-200">
                    <p className="text-xs font-medium text-violet-700 mb-1">Dynamic Variables ({dynamicVariables.length})</p>

                    <div className="flex flex-wrap gap-1">
                        {dynamicVariables.map(v => (
                            <code
                                key={v}
                                className="text-xs bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded"
                            >
                                {`{{${v}}}`}
                            </code>
                        ))}
                    </div>
                </div>
            )}

            {/* JSON Content */}
            <div className="flex-1 overflow-hidden">
                {editMode ? (
                    <textarea
                        value={jsonText}
                        onChange={(e) => handleJsonChange(e.target.value)}
                        className={`w-full h-full p-4 font-mono text-xs resize-none outline-none ${
                            parseError ? 'bg-red-50' : 'bg-gray-900 text-gray-100'
                        }`}
                        spellCheck={false}
                    />
                ) : (
                    <pre className="w-full h-full p-4 overflow-auto bg-gray-900 text-gray-100 font-mono text-xs">
                        <JsonHighlighter json={jsonFromTemplate} />
                    </pre>
                )}
            </div>
        </div>
    );
};

/**
 * Simple JSON syntax highlighter
 */
const JsonHighlighter: React.FC<{ json: string }> = ({ json }) => {
    // Simple regex-based highlighting
    const highlighted = json
        .replace(/"([^"]+)":/g, '<span class="text-cyan-400">"$1"</span>:')
        .replace(/: "([^"]+)"/g, ': <span class="text-emerald-400">"$1"</span>')
        .replace(/: (\d+)/g, ': <span class="text-amber-400">$1</span>')
        .replace(/: (true|false|null)/g, ': <span class="text-rose-400">$1</span>')
        .replace(/\{\{(\w+)\}\}/g, '<span class="text-violet-400 bg-violet-900/30 px-0.5 rounded">{{$1}}</span>');

    return <code dangerouslySetInnerHTML={{ __html: highlighted }} />;
};

export default JsonPreview;
