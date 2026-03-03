/**
 * Fine-grained Shiki highlighter component.
 *
 * Replaces `react-shiki` (which imports ALL 100+ language grammars via `shiki`)
 * with a fine-grained bundle using `shiki/core` that only imports the languages
 * we actually need. This reduces the Shiki bundle from ~7.7 MB to ~200 KB.
 *
 * Reference: https://shiki.style/guide/bundles#fine-grained-bundle
 */
import React, { useEffect, useState, useRef, type ReactNode } from 'react';
import parse from 'html-react-parser';
import { createHighlighterCore, type HighlighterCore } from 'shiki/core';
import { createOnigurumaEngine } from 'shiki/engine/oniguruma';

// Only import the languages we actually need for AI chat code rendering
const LANG_IMPORTS: Record<string, () => Promise<any>> = {
    javascript: () => import('@shikijs/langs/javascript'),
    js: () => import('@shikijs/langs/javascript'),
    typescript: () => import('@shikijs/langs/typescript'),
    ts: () => import('@shikijs/langs/typescript'),
    jsx: () => import('@shikijs/langs/jsx'),
    tsx: () => import('@shikijs/langs/tsx'),
    python: () => import('@shikijs/langs/python'),
    py: () => import('@shikijs/langs/python'),
    json: () => import('@shikijs/langs/json'),
    html: () => import('@shikijs/langs/html'),
    css: () => import('@shikijs/langs/css'),
    bash: () => import('@shikijs/langs/bash'),
    sh: () => import('@shikijs/langs/bash'),
    shell: () => import('@shikijs/langs/shellscript'),
    shellscript: () => import('@shikijs/langs/shellscript'),
    sql: () => import('@shikijs/langs/sql'),
    markdown: () => import('@shikijs/langs/markdown'),
    md: () => import('@shikijs/langs/markdown'),
    yaml: () => import('@shikijs/langs/yaml'),
    yml: () => import('@shikijs/langs/yaml'),
    rust: () => import('@shikijs/langs/rust'),
    go: () => import('@shikijs/langs/go'),
    java: () => import('@shikijs/langs/java'),
    c: () => import('@shikijs/langs/c'),
    cpp: () => import('@shikijs/langs/cpp'),
    csharp: () => import('@shikijs/langs/csharp'),
    ruby: () => import('@shikijs/langs/ruby'),
    php: () => import('@shikijs/langs/php'),
    swift: () => import('@shikijs/langs/swift'),
    kotlin: () => import('@shikijs/langs/kotlin'),
    r: () => import('@shikijs/langs/r'),
    graphql: () => import('@shikijs/langs/graphql'),
    toml: () => import('@shikijs/langs/toml'),
    diff: () => import('@shikijs/langs/diff'),
    dockerfile: () => import('@shikijs/langs/dockerfile'),
    docker: () => import('@shikijs/langs/dockerfile'),
    xml: () => import('@shikijs/langs/xml'),
};

// Singleton highlighter instance
let highlighterPromise: Promise<HighlighterCore> | null = null;

function getHighlighter(): Promise<HighlighterCore> {
    if (!highlighterPromise) {
        highlighterPromise = createHighlighterCore({
            themes: [import('@shikijs/themes/one-light')],
            langs: [],  // Load languages on-demand
            engine: createOnigurumaEngine(import('shiki/wasm')),
        });
    }
    return highlighterPromise;
}

interface CodeHighlighterProps {
    children: string;
    language?: string;
    showLanguage?: boolean;
    as?: React.ElementType;
}

const CodeHighlighter: React.FC<CodeHighlighterProps> = ({
    children: code,
    language = 'text',
    showLanguage = true,
    as: Element = 'div',
}) => {
    const [rendered, setRendered] = useState<ReactNode>(null);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const lang = language?.toLowerCase() ?? 'text';
            const highlighter = await getHighlighter();

            // Load the language on-demand if we have it
            const langLoader = LANG_IMPORTS[lang];
            if (langLoader) {
                const loadedLangs = highlighter.getLoadedLanguages();
                if (!loadedLangs.includes(lang)) {
                    try {
                        await highlighter.loadLanguage(await langLoader());
                    } catch {
                        // Fall back to plaintext if language fails to load
                    }
                }
            }

            const loadedLangs = highlighter.getLoadedLanguages();
            const actualLang = loadedLangs.includes(lang) ? lang : 'plaintext';

            const html = highlighter.codeToHtml(code, {
                lang: actualLang,
                theme: 'one-light',
                transformers: [
                    { pre(node) { node.properties.tabindex = '-1'; return node; } },
                ],
            });

            if (!cancelled && isMounted.current) {
                setRendered(parse(html));
            }
        })();

        return () => { cancelled = true; };
    }, [code, language]);

    if (!rendered) {
        return (
            <Element
                className="relative not-prose"
                style={{ borderRadius: '0.5rem', padding: '1.25rem 1.5rem', overflow: 'auto', background: '#fafafa' }}
            >
                <pre><code>{code}</code></pre>
            </Element>
        );
    }

    return (
        <Element className="relative not-prose" style={{ borderRadius: '0.5rem', overflow: 'auto' }}>
            {showLanguage && language && language !== 'text' && (
                <span style={{
                    position: 'absolute', right: '0.75rem', top: '0.5rem',
                    fontFamily: 'monospace', fontSize: '0.75rem',
                    letterSpacing: '-0.05em', color: 'rgba(107, 114, 128, 0.85)',
                }}>
                    {language}
                </span>
            )}
            {rendered}
        </Element>
    );
};

export default CodeHighlighter;

/**
 * Checks if a hast node is inline code (single line, no newlines).
 */
export function isInlineCode(node: any): boolean {
    const children = node?.children || [];
    const text = children
        .filter((c: any) => c.type === 'text')
        .map((c: any) => c.value)
        .join('');
    return !text.includes('\n');
}
