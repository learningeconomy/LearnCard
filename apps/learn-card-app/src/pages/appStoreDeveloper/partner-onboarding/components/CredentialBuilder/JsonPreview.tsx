/**
 * JsonPreview - Live JSON preview with bidirectional editing
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Copy, Check, AlertCircle, RefreshCw, Code, Eye, PlayCircle, Loader2, CheckCircle, XCircle } from 'lucide-react';

import { OBv3CredentialTemplate } from './types';
import { templateToJson, jsonToTemplate, extractVariablesByType } from './utils';

interface JsonPreviewProps {
    template: OBv3CredentialTemplate;
    onChange: (template: OBv3CredentialTemplate) => void;
    isEditable?: boolean;
    onTestIssue?: (credential: Record<string, unknown>) => Promise<{ success: boolean; error?: string; result?: unknown }>;
}

export const JsonPreview: React.FC<JsonPreviewProps> = ({
    template,
    onChange,
    isEditable = true,
    onTestIssue,
}) => {
    const [editMode, setEditMode] = useState(false);
    const [jsonText, setJsonText] = useState('');
    const [parseError, setParseError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [testIssueState, setTestIssueState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [testIssueError, setTestIssueError] = useState<string | null>(null);

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

    // Extract variables by type for display
    const { system: systemVariables, dynamic: dynamicVariables } = useMemo(() => {
        return extractVariablesByType(template);
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

    const handleTestIssue = useCallback(async () => {
        if (!onTestIssue) return;

        setTestIssueState('loading');
        setTestIssueError(null);

        try {
            const json = templateToJson(template);
            const result = await onTestIssue(json);

            if (result.success) {
                setTestIssueState('success');
                console.log('Test issue successful:', result.result);
                setTimeout(() => setTestIssueState('idle'), 3000);
            } else {
                setTestIssueState('error');
                setTestIssueError(result.error || 'Unknown error');
                setTimeout(() => setTestIssueState('idle'), 5000);
            }
        } catch (e) {
            setTestIssueState('error');
            setTestIssueError((e as Error).message);
            setTimeout(() => setTestIssueState('idle'), 5000);
        }
    }, [template, onTestIssue]);

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

                    {onTestIssue && (
                        <button
                            type="button"
                            onClick={handleTestIssue}
                            disabled={testIssueState === 'loading' || !!parseError}
                            className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                                testIssueState === 'success'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : testIssueState === 'error'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-violet-100 text-violet-700 hover:bg-violet-200'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {testIssueState === 'loading' ? (
                                <>
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Testing...
                                </>
                            ) : testIssueState === 'success' ? (
                                <>
                                    <CheckCircle className="w-3 h-3" />
                                    Valid!
                                </>
                            ) : testIssueState === 'error' ? (
                                <>
                                    <XCircle className="w-3 h-3" />
                                    Failed
                                </>
                            ) : (
                                <>
                                    <PlayCircle className="w-3 h-3" />
                                    Test Issue
                                </>
                            )}
                        </button>
                    )}
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

            {/* Test Issue Error Banner */}
            {testIssueError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border-b border-red-200">
                    <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />

                    <div className="flex-1">
                        <p className="text-xs font-medium text-red-700">Issue Test Failed</p>
                        <p className="text-xs text-red-600 mt-0.5">{testIssueError}</p>
                    </div>
                </div>
            )}

            {/* Variables Summary */}
            {(dynamicVariables.length > 0 || systemVariables.length > 0) && !editMode && (
                <div className="p-3 bg-gray-50 border-b border-gray-200 space-y-2">
                    {/* Dynamic Variables - user must provide */}
                    {dynamicVariables.length > 0 && (
                        <div>
                            <p className="text-xs font-medium text-violet-700 mb-1">
                                Dynamic Variables ({dynamicVariables.length})
                                <span className="font-normal text-gray-500 ml-1">— provide at issuance</span>
                            </p>

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

                    {/* System Variables - auto-injected */}
                    {systemVariables.length > 0 && (
                        <div>
                            <p className="text-xs font-medium text-gray-500 mb-1">
                                System Variables ({systemVariables.length})
                                <span className="font-normal ml-1">— auto-injected</span>
                            </p>

                            <div className="flex flex-wrap gap-1">
                                {systemVariables.map(v => (
                                    <code
                                        key={v}
                                        className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded"
                                    >
                                        {`{{${v}}}`}
                                    </code>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* JSON Content */}
            <div className="flex-1 min-h-0 overflow-hidden">
                {editMode ? (
                    <textarea
                        value={jsonText}
                        onChange={(e) => handleJsonChange(e.target.value)}
                        className={`w-full h-full p-4 font-mono text-xs resize-none outline-none ${
                            parseError ? 'bg-red-50' : 'bg-gray-900 text-gray-100'
                        }`}
                        style={{ minHeight: '400px' }}
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
