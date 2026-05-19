import React, { useEffect, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { xml } from '@codemirror/lang-xml';
import { githubLight } from '@uiw/codemirror-theme-github';
import type { EditorView } from '@codemirror/view';

export interface CodeEditorProps {
    value: string;
    onChange: (value: string) => void;
    onViewReady?: (view: EditorView) => void;
    height?: string;
    readOnly?: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
    value,
    onChange,
    onViewReady,
    height = '100%',
    readOnly = false,
}) => {
    const viewRef = useRef<EditorView | null>(null);

    useEffect(() => {
        if (viewRef.current && onViewReady) onViewReady(viewRef.current);
    }, [onViewReady]);

    return (
        <CodeMirror
            value={value}
            height={height}
            extensions={[xml()]}
            theme={githubLight}
            readOnly={readOnly}
            onChange={onChange}
            onCreateEditor={view => {
                viewRef.current = view;
                if (onViewReady) onViewReady(view);
            }}
            basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                highlightActiveLine: true,
                bracketMatching: true,
                closeBrackets: true,
                autocompletion: false,
            }}
            style={{ height: '100%', fontSize: '13px' }}
        />
    );
};
