import React, { useEffect, useRef, useState, useCallback } from 'react';
import { IonPage, IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonButton, IonIcon } from '@ionic/react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';

import { useWallet } from 'learn-card-base/hooks/useWallet';
import { BespokeLearnCard } from 'learn-card-base/types/learn-card';
import * as types from '@learncard/types';
import CommandSidebar, { COMMANDS } from './CommandSidebar';
import ChainBuilder, { Chain, ChainStep } from './ChainBuilder';

const WELCOME_MESSAGE = `
Welcome to the LearnCard Browser CLI!

Variables available:
  learnCard   - Your LearnCard wallet instance
  types       - Zod validators from @learncard/types
  _           - Last command result

Example commands:
  learnCard.id.did()
  await learnCard.invoke.getTestVc()
  copy(_)     - Copy last result to clipboard

Type 'help' for more commands.
`;

const HELP_TEXT = `
Available Commands:
  help                    - Show this help message
  clear                   - Clear the terminal
  did                     - Show your DID
  profile                 - Show your profile
  credentials             - List credential categories

Copy Functions:
  copy(value)             - Copy any value to clipboard
  copy(_)                 - Copy last result to clipboard
  
Special Variables:
  _                       - Contains the last command result

Clickable Identifiers:
  LC URIs (lc:...) are highlighted in cyan
  DIDs (did:...) are highlighted in magenta
  Click any identifier to copy it to clipboard.
  
JavaScript Execution:
  Any valid JavaScript expression will be evaluated.
  Use 'await' for async operations.
  
  Examples:
    learnCard.id.did()
    await learnCard.invoke.getTestVc()
    copy(await learnCard.invoke.getProfile())
`;

// Regex to match LearnCard URIs like lc:network:..., lc:boost:..., etc.
const LC_URI_REGEX = /lc:[a-zA-Z0-9]+:[^\s"',}\]]+/g;

// Regex to match DIDs like did:web:..., did:key:..., did:pkh:..., etc.
const DID_REGEX = /did:[a-zA-Z0-9]+:[^\s"',}\]]+/g;

// Combined regex for clickable identifiers (LC URIs and DIDs)
const CLICKABLE_ID_REGEX = /(lc:[a-zA-Z0-9]+:[^\s"',}\]]+|did:[a-zA-Z0-9]+:[^\s"',}\]]+)/g;

const formatOutput = (value: unknown): string => {
    if (value === undefined) return 'undefined';
    if (value === null) return 'null';

    if (typeof value === 'string') return value;

    if (typeof value === 'function') return `[Function: ${value.name || 'anonymous'}]`;

    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return String(value);
    }
};

// Get highlight color for identifier type (Gruvbox colors)
const getIdColor = (id: string): string => {
    if (id.startsWith('lc:')) return '36'; // Aqua/Cyan for LC URIs
    if (id.startsWith('did:')) return '35'; // Purple for DIDs
    return '36';
};

const DevCli: React.FC = () => {
    const terminalRef = useRef<HTMLDivElement>(null);
    const terminalInstanceRef = useRef<Terminal | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);
    const learnCardRef = useRef<BespokeLearnCard | null>(null);
    const commandBufferRef = useRef<string>('');
    const historyRef = useRef<string[]>([]);
    const historyIndexRef = useRef<number>(-1);
    const lastResultRef = useRef<unknown>(undefined);

    const [isReady, setIsReady] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [chainSidebarOpen, setChainSidebarOpen] = useState(false);
    const [copyNotification, setCopyNotification] = useState<string | null>(null);
    const [showWelcome, setShowWelcome] = useState(() => {
        return !localStorage.getItem('learncard-cli-welcomed');
    });
    const { initWallet } = useWallet();

    const dismissWelcome = useCallback(() => {
        localStorage.setItem('learncard-cli-welcomed', 'true');
        setShowWelcome(false);
    }, []);

    const copyToClipboard = useCallback(async (value: unknown): Promise<string> => {
        const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2);

        try {
            await navigator.clipboard.writeText(text);
            setCopyNotification('Copied to clipboard!');
            setTimeout(() => setCopyNotification(null), 2000);
            return `Copied ${text.length} characters to clipboard`;
        } catch (err) {
            throw new Error('Failed to copy to clipboard');
        }
    }, []);

    const writePrompt = useCallback(() => {
        const term = terminalInstanceRef.current;

        if (term) {
            // Gruvbox orange prompt
            term.write('\r\n\x1b[38;2;254;128;25m❯\x1b[0m ');
        }
    }, []);

    const writeLine = useCallback((text: string, color?: string) => {
        const term = terminalInstanceRef.current;

        if (term) {
            const colorCode = color || '37';
            const lines = text.split('\n');

            lines.forEach((line, i) => {
                if (i > 0) term.write('\r\n');

                // Check if line contains clickable identifiers (LC URIs or DIDs)
                CLICKABLE_ID_REGEX.lastIndex = 0;

                if (CLICKABLE_ID_REGEX.test(line)) {
                    // Reset regex lastIndex
                    CLICKABLE_ID_REGEX.lastIndex = 0;

                    // Split line by identifiers and highlight them
                    let lastIndex = 0;
                    let match;

                    while ((match = CLICKABLE_ID_REGEX.exec(line)) !== null) {
                        // Write text before the identifier
                        if (match.index > lastIndex) {
                            term.write(`\x1b[${colorCode}m${line.slice(lastIndex, match.index)}\x1b[0m`);
                        }

                        // Write the identifier with appropriate color and underline
                        const idColor = getIdColor(match[0]);
                        term.write(`\x1b[${idColor};4m${match[0]}\x1b[0m`);
                        lastIndex = match.index + match[0].length;
                    }

                    // Write remaining text after last identifier
                    if (lastIndex < line.length) {
                        term.write(`\x1b[${colorCode}m${line.slice(lastIndex)}\x1b[0m`);
                    }
                } else {
                    term.write(`\x1b[${colorCode}m${line}\x1b[0m`);
                }
            });
        }
    }, []);

    const executeCommand = useCallback(async (command: string) => {
        const term = terminalInstanceRef.current;
        const learnCard = learnCardRef.current;

        if (!term) return;

        const trimmedCommand = command.trim();

        if (!trimmedCommand) {
            writePrompt();
            return;
        }

        // Add to history
        if (historyRef.current[historyRef.current.length - 1] !== trimmedCommand) {
            historyRef.current.push(trimmedCommand);
        }

        historyIndexRef.current = -1;

        // Handle built-in commands
        if (trimmedCommand === 'help') {
            writeLine(HELP_TEXT, '33');
            writePrompt();
            return;
        }

        if (trimmedCommand === 'clear') {
            term.clear();
            writePrompt();
            return;
        }

        if (trimmedCommand === 'did') {
            if (learnCard) {
                try {
                    const did = learnCard.id.did();
                    term.write('\r\n');
                    writeLine(did, '32');
                } catch (e) {
                    term.write('\r\n');
                    writeLine(`Error: ${e instanceof Error ? e.message : String(e)}`, '31');
                }
            } else {
                term.write('\r\n');
                writeLine('LearnCard not initialized', '31');
            }

            writePrompt();
            return;
        }

        if (trimmedCommand === 'profile') {
            if (learnCard) {
                try {
                    const profile = await learnCard.invoke.getProfile();
                    term.write('\r\n');
                    writeLine(formatOutput(profile), '32');
                } catch (e) {
                    term.write('\r\n');
                    writeLine(`Error: ${e instanceof Error ? e.message : String(e)}`, '31');
                }
            } else {
                term.write('\r\n');
                writeLine('LearnCard not initialized', '31');
            }

            writePrompt();
            return;
        }

        if (trimmedCommand === 'credentials') {
            term.write('\r\n');
            writeLine('Credential Categories: Achievement, ID, Learning History, Work History, Social Badge, Accommodation', '33');
            writePrompt();
            return;
        }

        // Execute as JavaScript
        try {
            // Create a function that has access to learnCard, types, copy, and _
            const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

            const fn = new AsyncFunction(
                'learnCard',
                'types',
                'copy',
                '_',
                `return (${trimmedCommand})`
            );

            const result = await fn(learnCard, types, copyToClipboard, lastResultRef.current);

            // Store result for next command (unless it's a copy result message)
            if (typeof result !== 'string' || !result.startsWith('Copied ')) {
                lastResultRef.current = result;
            }

            term.write('\r\n');
            writeLine(formatOutput(result), '32');
        } catch (e) {
            term.write('\r\n');
            writeLine(`Error: ${e instanceof Error ? e.message : String(e)}`, '31');
        }

        writePrompt();
    }, [writeLine, writePrompt, copyToClipboard]);

    // Initialize terminal
    useEffect(() => {
        if (!terminalRef.current || terminalInstanceRef.current) return;

        const term = new Terminal({
            cursorBlink: true,
            cursorStyle: 'bar',
            fontSize: 14,
            fontFamily: '"JetBrains Mono", "Fira Code", Menlo, Monaco, "Courier New", monospace',
            lineHeight: 1.4,
            letterSpacing: 0,
            theme: {
                // Gruvbox Dark Theme
                background: '#282828',
                foreground: '#ebdbb2',
                cursor: '#fe8019',
                cursorAccent: '#282828',
                selectionBackground: '#504945',
                selectionForeground: '#fbf1c7',
                black: '#282828',
                red: '#fb4934',
                green: '#b8bb26',
                yellow: '#fabd2f',
                blue: '#83a598',
                magenta: '#d3869b',
                cyan: '#8ec07c',
                white: '#ebdbb2',
                brightBlack: '#928374',
                brightRed: '#fb4934',
                brightGreen: '#b8bb26',
                brightYellow: '#fabd2f',
                brightBlue: '#83a598',
                brightMagenta: '#d3869b',
                brightCyan: '#8ec07c',
                brightWhite: '#fbf1c7',
            },
            allowProposedApi: true,
        });

        const fitAddon = new FitAddon();
        const webLinksAddon = new WebLinksAddon();

        term.loadAddon(fitAddon);
        term.loadAddon(webLinksAddon);

        term.open(terminalRef.current);
        fitAddon.fit();

        terminalInstanceRef.current = term;
        fitAddonRef.current = fitAddon;

        // Register link provider for click-to-copy (LC URIs and DIDs)
        term.registerLinkProvider({
            provideLinks: (bufferLineNumber, callback) => {
                const line = term.buffer.active.getLine(bufferLineNumber - 1);

                if (!line) {
                    callback(undefined);
                    return;
                }

                const lineText = line.translateToString();
                const links: Array<{
                    range: { start: { x: number; y: number }; end: { x: number; y: number } };
                    text: string;
                    activate: () => void;
                }> = [];

                // Reset regex
                CLICKABLE_ID_REGEX.lastIndex = 0;
                let match;

                while ((match = CLICKABLE_ID_REGEX.exec(lineText)) !== null) {
                    const id = match[0];
                    const startX = match.index + 1; // 1-indexed
                    const label = id.startsWith('did:') ? 'DID' : 'URI';

                    links.push({
                        range: {
                            start: { x: startX, y: bufferLineNumber },
                            end: { x: startX + id.length, y: bufferLineNumber },
                        },
                        text: id,
                        activate: () => {
                            navigator.clipboard.writeText(id).then(() => {
                                setCopyNotification(`Copied ${label}: ${id.slice(0, 35)}${id.length > 35 ? '...' : ''}`);
                                setTimeout(() => setCopyNotification(null), 2000);
                            });
                        },
                    });
                }

                callback(links.length > 0 ? links : undefined);
            },
        });

        // Handle resize
        const handleResize = () => {
            fitAddon.fit();
        };

        window.addEventListener('resize', handleResize);

        // Handle input
        term.onData((data) => {
            const code = data.charCodeAt(0);

            // Enter key
            if (code === 13) {
                const command = commandBufferRef.current;

                commandBufferRef.current = '';
                executeCommand(command);
                return;
            }

            // Backspace
            if (code === 127) {
                if (commandBufferRef.current.length > 0) {
                    commandBufferRef.current = commandBufferRef.current.slice(0, -1);
                    term.write('\b \b');
                }

                return;
            }

            // Arrow keys (escape sequences)
            if (data === '\x1b[A') {
                // Up arrow - history
                if (historyRef.current.length > 0) {
                    if (historyIndexRef.current === -1) {
                        historyIndexRef.current = historyRef.current.length - 1;
                    } else if (historyIndexRef.current > 0) {
                        historyIndexRef.current--;
                    }

                    const historyCommand = historyRef.current[historyIndexRef.current];

                    // Clear current line (Gruvbox orange prompt)
                    term.write('\r\x1b[38;2;254;128;25m❯\x1b[0m ');
                    term.write(' '.repeat(commandBufferRef.current.length));
                    term.write('\r\x1b[38;2;254;128;25m❯\x1b[0m ');

                    // Write history command
                    term.write(historyCommand);
                    commandBufferRef.current = historyCommand;
                }

                return;
            }

            if (data === '\x1b[B') {
                // Down arrow - history
                if (historyIndexRef.current !== -1) {
                    if (historyIndexRef.current < historyRef.current.length - 1) {
                        historyIndexRef.current++;
                        const historyCommand = historyRef.current[historyIndexRef.current];

                        term.write('\r\x1b[38;2;254;128;25m❯\x1b[0m ');
                        term.write(' '.repeat(commandBufferRef.current.length));
                        term.write('\r\x1b[38;2;254;128;25m❯\x1b[0m ');
                        term.write(historyCommand);
                        commandBufferRef.current = historyCommand;
                    } else {
                        historyIndexRef.current = -1;
                        term.write('\r\x1b[38;2;254;128;25m❯\x1b[0m ');
                        term.write(' '.repeat(commandBufferRef.current.length));
                        term.write('\r\x1b[38;2;254;128;25m❯\x1b[0m ');
                        commandBufferRef.current = '';
                    }
                }

                return;
            }

            // Ignore other escape sequences
            if (data.startsWith('\x1b')) return;

            // Regular character
            commandBufferRef.current += data;
            term.write(data);
        });

        return () => {
            window.removeEventListener('resize', handleResize);
            term.dispose();
            terminalInstanceRef.current = null;
        };
    }, [executeCommand]);

    // Initialize LearnCard
    useEffect(() => {
        const init = async () => {
            try {
                const wallet = await initWallet();

                learnCardRef.current = wallet;
                setIsReady(true);

                const term = terminalInstanceRef.current;

                if (term) {
                    writeLine(WELCOME_MESSAGE, '36');
                    term.write('\r\n');
                    writeLine(`Your DID: ${wallet.id.did()}`, '32');
                    writePrompt();
                }
            } catch (e) {
                console.error('Failed to initialize LearnCard:', e);

                const term = terminalInstanceRef.current;

                if (term) {
                    writeLine(WELCOME_MESSAGE, '36');
                    term.write('\r\n');
                    writeLine(`Warning: LearnCard initialization failed - ${e instanceof Error ? e.message : String(e)}`, '33');
                    writePrompt();
                }

                setIsReady(true);
            }
        };

        if (terminalInstanceRef.current && !learnCardRef.current) {
            init();
        }
    }, [initWallet, writeLine, writePrompt]);

    // Fit terminal when container size changes or sidebar toggles
    useEffect(() => {
        const fitAddon = fitAddonRef.current;

        if (fitAddon && isReady) {
            setTimeout(() => fitAddon.fit(), 100);
        }
    }, [isReady, sidebarOpen]);

    const handleInsertCommand = useCallback((command: string) => {
        const term = terminalInstanceRef.current;

        if (term) {
            // Clear current line and insert command (Gruvbox orange prompt)
            term.write('\r\x1b[38;2;254;128;25m❯\x1b[0m ');
            term.write(' '.repeat(commandBufferRef.current.length));
            term.write('\r\x1b[38;2;254;128;25m❯\x1b[0m ');
            term.write(command);
            commandBufferRef.current = command;
            term.focus();
        }
    }, []);

    const getStepCommand = useCallback((step: ChainStep): string => {
        if (step.type === 'custom') {
            return step.customCommand || '';
        }

        const template = COMMANDS.find(c => c.id === step.templateId);
        if (!template) return '';

        let result = template.template;

        template.params.forEach(param => {
            let value = step.paramValues[param.name] || param.defaultValue || '';

            if (param.type === 'json' && value.trim()) {
                try {
                    const parsed = JSON.parse(value);
                    value = JSON.stringify(parsed);
                } catch {
                    value = value.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
                }
            }

            result = result.replace(`{{${param.name}}}`, value);
        });

        return result;
    }, []);

    const handleExecuteChain = useCallback(async (chain: Chain): Promise<{ stepId: string; result?: string; error?: string }[]> => {
        const learnCard = learnCardRef.current;
        const term = terminalInstanceRef.current;

        if (!learnCard || !term) {
            return chain.steps.map(step => ({ stepId: step.id, error: 'Terminal or wallet not ready' }));
        }

        const results: { stepId: string; result?: string; error?: string }[] = [];
        let lastResult: unknown = undefined;

        term.write('\r\n');
        writeLine('━━━ Running Chain: ' + chain.name + ' ━━━', '33');

        for (let i = 0; i < chain.steps.length; i++) {
            const step = chain.steps[i];
            const command = getStepCommand(step);

            term.write('\r\n');
            writeLine(`Step ${i + 1}: ${command.substring(0, 60)}${command.length > 60 ? '...' : ''}`, '36');

            if (!command.trim()) {
                results.push({ stepId: step.id, error: 'Empty command' });
                writeLine('  Error: Empty command', '31');
                continue;
            }

            try {
                const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

                const fn = new AsyncFunction(
                    'learnCard',
                    'types',
                    'copy',
                    '_',
                    `return (${command})`
                );

                const result = await fn(learnCard, types, copyToClipboard, lastResult);
                lastResult = result;

                const formatted = formatOutput(result);
                results.push({ stepId: step.id, result: formatted });

                writeLine('  ✓ Success', '32');

                // Show truncated output
                const lines = formatted.split('\n');

                if (lines.length > 3) {
                    writeLine('  ' + lines[0], '32');
                    writeLine('  ' + lines[1], '32');
                    writeLine('  ... (' + (lines.length - 2) + ' more lines)', '90');
                } else {
                    lines.forEach(line => writeLine('  ' + line, '32'));
                }
            } catch (e) {
                const errorMsg = e instanceof Error ? e.message : String(e);
                results.push({ stepId: step.id, error: errorMsg });
                writeLine('  ✗ Error: ' + errorMsg, '31');
            }
        }

        term.write('\r\n');
        writeLine('━━━ Chain Complete ━━━', '33');
        writePrompt();

        return results;
    }, [copyToClipboard, getStepCommand, writeLine, writePrompt]);

    return (
        <IonPage className="cli-page">
            <IonHeader className="cli-header">
                <IonToolbar className="cli-toolbar">
                    <IonButtons slot="start">
                        <IonBackButton defaultHref="/launchpad" className="cli-back-btn" />
                    </IonButtons>

                    <IonTitle className="cli-title">LearnCard CLI</IonTitle>
                </IonToolbar>
            </IonHeader>

            <IonContent className="ion-no-padding">
                <div className="cli-container">
                    <CommandSidebar
                        onInsertCommand={handleInsertCommand}
                        isOpen={sidebarOpen}
                        onToggle={() => setSidebarOpen(!sidebarOpen)}
                    />

                    <div className="terminal-wrapper">
                        <div
                            ref={terminalRef}
                            className="dev-cli-terminal"
                            style={{
                                flex: 1,
                                height: '100%',
                                backgroundColor: '#282828',
                                padding: '12px',
                                letterSpacing: 'normal',
                                minWidth: 0,
                            }}
                        />

                        {copyNotification && (
                            <div className="copy-notification">
                                <span>✓</span> {copyNotification}
                            </div>
                        )}
                    </div>

                    <ChainBuilder
                        isOpen={chainSidebarOpen}
                        onToggle={() => setChainSidebarOpen(!chainSidebarOpen)}
                        onExecuteChain={handleExecuteChain}
                    />

                    {showWelcome && (
                        <div className="welcome-overlay">
                            <div className="welcome-modal">
                                <div className="welcome-icon">👋</div>

                                <h2>Welcome to the LearnCard CLI</h2>

                                <p className="welcome-intro">
                                    This is a <strong>developer tool</strong> for exploring and testing the LearnCard API.
                                    If you're not sure why you're here, you probably don't need this tool!
                                </p>

                                <div className="welcome-section">
                                    <h4>🎯 What you can do here</h4>

                                    <ul>
                                        <li>Execute JavaScript commands with your LearnCard wallet</li>
                                        <li>Issue, verify, and manage credentials</li>
                                        <li>Test network operations and boost workflows</li>
                                        <li>Build and run command chains for automation</li>
                                    </ul>
                                </div>

                                <div className="welcome-section">
                                    <h4>📚 Getting started</h4>

                                    <ul>
                                        <li><code>learnCard</code> — Your wallet instance</li>
                                        <li><code>help</code> — Show available commands</li>
                                        <li>Use the <strong>Command Builder</strong> (left) to explore the API</li>
                                        <li>Use the <strong>Chain Builder</strong> (right) to automate workflows</li>
                                    </ul>
                                </div>

                                <div className="welcome-warning">
                                    <h4>⚠️ Important</h4>

                                    <p>
                                        This CLI executes real commands against your wallet.
                                        Actions like issuing credentials or sending data to the network <strong>cannot be undone</strong>.
                                        Only run commands you understand.
                                    </p>
                                </div>

                                <button onClick={dismissWelcome} className="welcome-btn">
                                    I understand, let's go!
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <style>{`
                    /* Import Google Fonts for better typography */
                    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap');

                    .cli-page {
                        --ion-background-color: #1d2021;
                    }

                    .cli-header {
                        --ion-background-color: #282828;
                    }

                    .cli-toolbar {
                        --background: linear-gradient(180deg, #32302f 0%, #282828 100%);
                        --border-color: #3c3836;
                        --color: #ebdbb2;
                        border-bottom: 1px solid #3c3836;
                    }

                    .cli-title {
                        font-family: 'JetBrains Mono', monospace;
                        font-size: 16px;
                        font-weight: 600;
                        color: #fbf1c7;
                        letter-spacing: 0.02em;
                    }

                    .cli-back-btn {
                        --color: #a89984;
                        --color-hover: #ebdbb2;
                        --color-focused: #fe8019;
                    }

                    .cli-back-btn::part(native) {
                        color: #a89984;
                    }

                    .cli-back-btn::part(native):hover {
                        color: #ebdbb2;
                    }

                    .cli-container {
                        display: flex;
                        height: 100%;
                        overflow: hidden;
                        background: #1d2021;
                    }

                    .terminal-wrapper {
                        flex: 1;
                        display: flex;
                        flex-direction: column;
                        position: relative;
                        min-width: 0;
                        background: #282828;
                    }

                    .copy-notification {
                        position: absolute;
                        top: 16px;
                        right: 16px;
                        padding: 12px 18px;
                        background: linear-gradient(135deg, #b8bb26 0%, #98971a 100%);
                        color: #282828;
                        border-radius: 8px;
                        font-size: 13px;
                        font-weight: 600;
                        font-family: 'JetBrains Mono', monospace;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(184, 187, 38, 0.3);
                        animation: slideIn 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                        z-index: 1000;
                    }

                    .copy-notification span {
                        font-weight: 700;
                        font-size: 15px;
                    }

                    @keyframes slideIn {
                        from {
                            opacity: 0;
                            transform: translateY(-12px) scale(0.95);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0) scale(1);
                        }
                    }

                    .dev-cli-terminal,
                    .dev-cli-terminal * {
                        letter-spacing: normal !important;
                        word-spacing: normal !important;
                        font-kerning: none !important;
                    }

                    .dev-cli-terminal .xterm {
                        padding: 0;
                    }

                    .dev-cli-terminal .xterm-viewport {
                        letter-spacing: normal !important;
                        scrollbar-width: thin;
                        scrollbar-color: #504945 #282828;
                    }

                    .dev-cli-terminal .xterm-viewport::-webkit-scrollbar {
                        width: 8px;
                    }

                    .dev-cli-terminal .xterm-viewport::-webkit-scrollbar-track {
                        background: #282828;
                    }

                    .dev-cli-terminal .xterm-viewport::-webkit-scrollbar-thumb {
                        background: #504945;
                        border-radius: 4px;
                    }

                    .dev-cli-terminal .xterm-viewport::-webkit-scrollbar-thumb:hover {
                        background: #665c54;
                    }

                    .dev-cli-terminal .xterm-rows {
                        letter-spacing: normal !important;
                    }

                    .dev-cli-terminal .xterm-screen {
                        letter-spacing: normal !important;
                    }

                    .sidebar-toggle-closed {
                        position: absolute;
                        left: 0;
                        top: 50%;
                        transform: translateY(-50%);
                        width: 40px;
                        height: 80px;
                        background: linear-gradient(135deg, #3c3836 0%, #282828 100%);
                        border: 1px solid #504945;
                        border-left: none;
                        border-radius: 0 12px 12px 0;
                        color: #ebdbb2;
                        font-size: 20px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 100;
                        transition: all 0.2s ease;
                    }

                    .sidebar-toggle-closed:hover {
                        background: linear-gradient(135deg, #504945 0%, #3c3836 100%);
                        width: 48px;
                        border-color: #665c54;
                    }

                    .command-sidebar {
                        width: 380px;
                        min-width: 380px;
                        height: 100%;
                        background: linear-gradient(180deg, #32302f 0%, #282828 100%);
                        border-right: 1px solid #3c3836;
                        display: flex;
                        flex-direction: column;
                        overflow: hidden;
                        box-shadow: 4px 0 20px rgba(0, 0, 0, 0.3);
                    }

                    .sidebar-header {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        padding: 18px 20px;
                        border-bottom: 1px solid #3c3836;
                        background: rgba(60, 56, 54, 0.5);
                    }

                    .sidebar-header h2 {
                        margin: 0;
                        font-size: 15px;
                        font-weight: 600;
                        color: #fbf1c7;
                        letter-spacing: 0.02em;
                        font-family: 'JetBrains Mono', monospace;
                    }

                    .sidebar-close {
                        width: 30px;
                        height: 30px;
                        border-radius: 8px;
                        border: 1px solid #504945;
                        background: #3c3836;
                        color: #a89984;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 14px;
                        transition: all 0.15s ease;
                    }

                    .sidebar-close:hover {
                        background: #504945;
                        color: #ebdbb2;
                        border-color: #665c54;
                    }

                    .sidebar-search {
                        padding: 14px 16px;
                        border-bottom: 1px solid #3c3836;
                    }

                    .sidebar-search input {
                        width: 100%;
                        padding: 11px 14px;
                        border-radius: 8px;
                        border: 1px solid #504945;
                        background: #1d2021;
                        color: #ebdbb2;
                        font-size: 14px;
                        font-family: 'JetBrains Mono', monospace;
                        outline: none;
                        transition: all 0.15s ease;
                    }

                    .sidebar-search input::placeholder {
                        color: #928374;
                    }

                    .sidebar-search input:focus {
                        border-color: #fe8019;
                        background: #282828;
                        box-shadow: 0 0 0 3px rgba(254, 128, 25, 0.15);
                    }

                    .category-pills {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 8px;
                        padding: 14px 16px;
                        border-bottom: 1px solid #3c3836;
                    }

                    .category-pill {
                        padding: 7px 14px;
                        border-radius: 6px;
                        border: 1px solid #504945;
                        background: #3c3836;
                        color: #bdae93;
                        font-size: 12px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: all 0.15s ease;
                        white-space: nowrap;
                    }

                    .category-pill:hover {
                        background: #504945;
                        border-color: #665c54;
                        color: #ebdbb2;
                    }

                    .category-pill.active {
                        background: linear-gradient(135deg, rgba(254, 128, 25, 0.2) 0%, rgba(214, 93, 14, 0.2) 100%);
                        border-color: #fe8019;
                        color: #fe8019;
                        box-shadow: 0 0 0 2px rgba(254, 128, 25, 0.1);
                    }

                    .command-list {
                        flex: 1;
                        overflow-y: auto;
                        padding: 14px;
                    }

                    .command-list::-webkit-scrollbar {
                        width: 8px;
                    }

                    .command-list::-webkit-scrollbar-track {
                        background: #282828;
                    }

                    .command-list::-webkit-scrollbar-thumb {
                        background: #504945;
                        border-radius: 4px;
                    }

                    .command-list::-webkit-scrollbar-thumb:hover {
                        background: #665c54;
                    }

                    .command-card {
                        background: #32302f;
                        border: 1px solid #3c3836;
                        border-radius: 10px;
                        margin-bottom: 10px;
                        overflow: hidden;
                        transition: all 0.15s ease;
                    }

                    .command-card:hover {
                        background: #3c3836;
                        border-color: #504945;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                    }

                    .command-header {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        padding: 14px 16px;
                        cursor: pointer;
                    }

                    .command-info h3 {
                        margin: 0 0 4px 0;
                        font-size: 14px;
                        font-weight: 500;
                        color: #fbf1c7;
                    }

                    .command-info p {
                        margin: 0;
                        font-size: 12px;
                        color: #a89984;
                    }

                    .expand-icon {
                        color: #928374;
                        font-size: 10px;
                        transition: transform 0.2s ease;
                    }

                    .expand-icon.expanded {
                        transform: rotate(180deg);
                    }

                    .insert-btn {
                        padding: 7px 14px;
                        border-radius: 6px;
                        border: none;
                        font-size: 13px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: all 0.15s ease;
                        font-family: 'JetBrains Mono', monospace;
                    }

                    .insert-btn.quick {
                        background: rgba(254, 128, 25, 0.15);
                        color: #fe8019;
                        padding: 7px 12px;
                        border: 1px solid rgba(254, 128, 25, 0.3);
                    }

                    .insert-btn.quick:hover {
                        background: rgba(254, 128, 25, 0.25);
                        border-color: #fe8019;
                    }

                    .insert-btn.primary {
                        width: 100%;
                        padding: 12px;
                        background: linear-gradient(135deg, #fe8019 0%, #d65d0e 100%);
                        color: #282828;
                        font-weight: 600;
                        border: none;
                        box-shadow: 0 2px 8px rgba(254, 128, 25, 0.3);
                    }

                    .insert-btn.primary:hover {
                        box-shadow: 0 4px 12px rgba(254, 128, 25, 0.4);
                        transform: translateY(-1px);
                    }

                    .command-params {
                        padding: 0 16px 16px 16px;
                        border-top: 1px solid #3c3836;
                        background: rgba(29, 32, 33, 0.5);
                    }

                    .param-field {
                        margin-top: 14px;
                    }

                    .param-field label {
                        display: block;
                        font-size: 12px;
                        font-weight: 500;
                        color: #d5c4a1;
                        margin-bottom: 4px;
                        font-family: 'JetBrains Mono', monospace;
                    }

                    .param-field .required {
                        color: #fb4934;
                        margin-left: 2px;
                    }

                    .param-field .param-desc {
                        display: block;
                        font-size: 11px;
                        color: #928374;
                        margin-bottom: 6px;
                    }

                    .param-field input,
                    .param-field textarea,
                    .param-field select {
                        width: 100%;
                        padding: 10px 12px;
                        border-radius: 6px;
                        border: 1px solid #504945;
                        background: #1d2021;
                        color: #ebdbb2;
                        font-size: 13px;
                        font-family: 'JetBrains Mono', monospace;
                        outline: none;
                        transition: all 0.15s ease;
                    }

                    .param-field input:focus,
                    .param-field textarea:focus,
                    .param-field select:focus {
                        border-color: #fe8019;
                        box-shadow: 0 0 0 3px rgba(254, 128, 25, 0.1);
                    }

                    .param-field textarea {
                        resize: vertical;
                        min-height: 70px;
                    }

                    .param-field select {
                        cursor: pointer;
                        appearance: none;
                        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23928374' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
                        background-repeat: no-repeat;
                        background-position: right 12px center;
                        padding-right: 32px;
                    }

                    .command-preview {
                        margin-top: 14px;
                        padding: 12px 14px;
                        background: #1d2021;
                        border: 1px solid #3c3836;
                        border-radius: 6px;
                        overflow-x: auto;
                    }

                    .command-preview code {
                        font-family: 'JetBrains Mono', monospace;
                        font-size: 12px;
                        color: #b8bb26;
                        white-space: pre-wrap;
                        word-break: break-all;
                        line-height: 1.5;
                    }

                    .no-results {
                        text-align: center;
                        padding: 48px 20px;
                        color: #928374;
                    }

                    .no-results p {
                        font-family: 'JetBrains Mono', monospace;
                        font-size: 14px;
                    }

                    /* Chain Builder Styles */
                    .chain-toggle-closed {
                        position: fixed;
                        right: 0;
                        top: 50%;
                        transform: translateY(-50%);
                        width: 40px;
                        height: 48px;
                        background: linear-gradient(135deg, #3c3836 0%, #282828 100%);
                        border: 1px solid #504945;
                        border-right: none;
                        border-radius: 8px 0 0 8px;
                        color: #ebdbb2;
                        font-size: 18px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        box-shadow: -2px 0 8px rgba(0, 0, 0, 0.3);
                        z-index: 100;
                        transition: all 0.2s ease;
                    }

                    .chain-toggle-closed:hover {
                        background: linear-gradient(135deg, #504945 0%, #3c3836 100%);
                        width: 48px;
                    }

                    .chain-builder {
                        width: 340px;
                        min-width: 340px;
                        height: 100%;
                        background: linear-gradient(180deg, #32302f 0%, #282828 100%);
                        border-left: 1px solid #3c3836;
                        display: flex;
                        flex-direction: column;
                        font-family: 'JetBrains Mono', monospace;
                        overflow: hidden;
                    }

                    .chain-header {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        padding: 14px 16px;
                        border-bottom: 1px solid #3c3836;
                        background: rgba(0, 0, 0, 0.2);
                    }

                    .chain-header h3 {
                        margin: 0;
                        font-size: 14px;
                        font-weight: 600;
                        color: #fbf1c7;
                    }

                    .chain-close-btn {
                        background: none;
                        border: none;
                        color: #928374;
                        font-size: 16px;
                        cursor: pointer;
                        padding: 4px;
                        border-radius: 4px;
                        transition: all 0.15s ease;
                    }

                    .chain-close-btn:hover {
                        color: #ebdbb2;
                        background: rgba(255, 255, 255, 0.1);
                    }

                    .chain-selector {
                        display: flex;
                        gap: 8px;
                        padding: 12px 16px;
                        border-bottom: 1px solid #3c3836;
                    }

                    .chain-select {
                        flex: 1;
                        padding: 8px 12px;
                        background: #1d2021;
                        border: 1px solid #504945;
                        border-radius: 6px;
                        color: #ebdbb2;
                        font-size: 12px;
                        font-family: 'JetBrains Mono', monospace;
                        cursor: pointer;
                    }

                    .chain-select:focus {
                        border-color: #fe8019;
                        outline: none;
                    }

                    .chain-new-btn {
                        padding: 8px 14px;
                        background: #458588;
                        border: none;
                        border-radius: 6px;
                        color: #fbf1c7;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.15s ease;
                    }

                    .chain-new-btn:hover {
                        background: #83a598;
                    }

                    .chain-name-row {
                        display: flex;
                        gap: 8px;
                        padding: 12px 16px;
                        border-bottom: 1px solid #3c3836;
                    }

                    .chain-name-input {
                        flex: 1;
                        padding: 8px 12px;
                        background: #1d2021;
                        border: 1px solid #504945;
                        border-radius: 6px;
                        color: #ebdbb2;
                        font-size: 13px;
                        font-family: 'JetBrains Mono', monospace;
                    }

                    .chain-name-input:focus {
                        border-color: #fe8019;
                        outline: none;
                    }

                    .chain-delete-btn,
                    .chain-export-btn {
                        background: none;
                        border: none;
                        color: #928374;
                        font-size: 14px;
                        cursor: pointer;
                        padding: 8px;
                        border-radius: 6px;
                        transition: all 0.15s ease;
                    }

                    .chain-delete-btn:hover {
                        color: #fb4934;
                        background: rgba(251, 73, 52, 0.1);
                    }

                    .chain-export-btn:hover {
                        color: #83a598;
                        background: rgba(131, 165, 152, 0.1);
                    }

                    .chain-import-btn {
                        padding: 8px 12px;
                        background: #3c3836;
                        border: 1px solid #504945;
                        border-radius: 6px;
                        color: #ebdbb2;
                        font-size: 14px;
                        cursor: pointer;
                        transition: all 0.15s ease;
                    }

                    .chain-import-btn:hover {
                        background: #504945;
                        border-color: #83a598;
                    }

                    .chain-steps {
                        flex: 1;
                        overflow-y: auto;
                        padding: 12px;
                    }

                    .chain-empty {
                        text-align: center;
                        padding: 32px 16px;
                        color: #928374;
                        font-size: 12px;
                    }

                    .chain-step {
                        background: #1d2021;
                        border: 1px solid #3c3836;
                        border-radius: 8px;
                        margin-bottom: 10px;
                        overflow: hidden;
                        cursor: grab;
                        transition: all 0.15s ease;
                    }

                    .chain-step:hover {
                        border-color: #504945;
                    }

                    .chain-step-pending { border-left: 3px solid #928374; }
                    .chain-step-running { border-left: 3px solid #fabd2f; }
                    .chain-step-success { border-left: 3px solid #b8bb26; }
                    .chain-step-error { border-left: 3px solid #fb4934; }

                    .chain-step-header {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        padding: 10px 12px;
                        background: rgba(0, 0, 0, 0.2);
                    }

                    .chain-step-number {
                        width: 22px;
                        height: 22px;
                        background: #504945;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 11px;
                        font-weight: 600;
                        color: #ebdbb2;
                    }

                    .chain-step-name {
                        flex: 1;
                        font-size: 12px;
                        color: #ebdbb2;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }

                    .chain-step-actions {
                        display: flex;
                        gap: 4px;
                    }

                    .chain-step-actions button {
                        background: none;
                        border: none;
                        color: #928374;
                        font-size: 12px;
                        cursor: pointer;
                        padding: 4px 6px;
                        border-radius: 4px;
                        transition: all 0.15s ease;
                    }

                    .chain-step-actions button:hover:not(:disabled) {
                        color: #ebdbb2;
                        background: rgba(255, 255, 255, 0.1);
                    }

                    .chain-step-actions button:disabled {
                        opacity: 0.3;
                        cursor: not-allowed;
                    }

                    .chain-step-edit {
                        padding: 12px;
                        border-top: 1px solid #3c3836;
                    }

                    .chain-param {
                        margin-bottom: 10px;
                    }

                    .chain-param label {
                        display: block;
                        font-size: 10px;
                        color: #928374;
                        margin-bottom: 4px;
                        text-transform: uppercase;
                    }

                    .chain-param input,
                    .chain-param textarea,
                    .chain-param select {
                        width: 100%;
                        padding: 8px 10px;
                        background: #282828;
                        border: 1px solid #504945;
                        border-radius: 4px;
                        color: #ebdbb2;
                        font-size: 11px;
                        font-family: 'JetBrains Mono', monospace;
                    }

                    .chain-param input:focus,
                    .chain-param textarea:focus,
                    .chain-param select:focus {
                        border-color: #fe8019;
                        outline: none;
                    }

                    .chain-param textarea {
                        min-height: 60px;
                        resize: vertical;
                    }

                    .chain-custom-input {
                        width: 100%;
                        min-height: 80px;
                        padding: 10px;
                        background: #282828;
                        border: 1px solid #504945;
                        border-radius: 4px;
                        color: #ebdbb2;
                        font-size: 11px;
                        font-family: 'JetBrains Mono', monospace;
                        resize: vertical;
                    }

                    .chain-custom-input:focus {
                        border-color: #fe8019;
                        outline: none;
                    }

                    .chain-step-preview {
                        margin-top: 10px;
                        padding: 8px;
                        background: #282828;
                        border-radius: 4px;
                        overflow-x: auto;
                    }

                    .chain-step-preview code {
                        font-size: 10px;
                        color: #b8bb26;
                        word-break: break-all;
                        white-space: pre-wrap;
                    }

                    .chain-step-output {
                        padding: 10px 12px;
                        border-top: 1px solid #3c3836;
                        font-size: 11px;
                        max-height: 120px;
                        overflow-y: auto;
                    }

                    .chain-step-output pre {
                        margin: 0;
                        white-space: pre-wrap;
                        word-break: break-all;
                        color: #b8bb26;
                    }

                    .chain-step-output pre.error {
                        color: #fb4934;
                    }

                    .chain-step-output-running {
                        color: #fabd2f;
                    }

                    .chain-add-buttons {
                        display: flex;
                        gap: 8px;
                        padding: 12px 16px;
                        border-top: 1px solid #3c3836;
                    }

                    .chain-add-template-btn,
                    .chain-add-custom-btn {
                        flex: 1;
                        padding: 10px;
                        border: 1px dashed #504945;
                        border-radius: 6px;
                        background: transparent;
                        color: #928374;
                        font-size: 12px;
                        font-family: 'JetBrains Mono', monospace;
                        cursor: pointer;
                        transition: all 0.15s ease;
                    }

                    .chain-add-template-btn:hover,
                    .chain-add-custom-btn:hover {
                        border-color: #fe8019;
                        color: #ebdbb2;
                        background: rgba(254, 128, 25, 0.05);
                    }

                    .chain-command-picker {
                        position: absolute;
                        bottom: 100px;
                        left: 16px;
                        right: 16px;
                        background: #1d2021;
                        border: 1px solid #504945;
                        border-radius: 8px;
                        box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.4);
                        max-height: 300px;
                        display: flex;
                        flex-direction: column;
                        overflow: hidden;
                        z-index: 10;
                    }

                    .chain-picker-header {
                        display: flex;
                        gap: 8px;
                        padding: 10px;
                        border-bottom: 1px solid #3c3836;
                    }

                    .chain-picker-search {
                        flex: 1;
                        padding: 8px 10px;
                        background: #282828;
                        border: 1px solid #504945;
                        border-radius: 4px;
                        color: #ebdbb2;
                        font-size: 12px;
                        font-family: 'JetBrains Mono', monospace;
                    }

                    .chain-picker-search:focus {
                        border-color: #fe8019;
                        outline: none;
                    }

                    .chain-picker-header button {
                        background: none;
                        border: none;
                        color: #928374;
                        font-size: 14px;
                        cursor: pointer;
                        padding: 4px 8px;
                    }

                    .chain-picker-header button:hover {
                        color: #ebdbb2;
                    }

                    .chain-picker-list {
                        flex: 1;
                        overflow-y: auto;
                        padding: 8px;
                    }

                    .chain-picker-item {
                        display: flex;
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 2px;
                        width: 100%;
                        padding: 10px 12px;
                        background: transparent;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        text-align: left;
                        transition: all 0.15s ease;
                    }

                    .chain-picker-item:hover {
                        background: rgba(254, 128, 25, 0.1);
                    }

                    .chain-picker-name {
                        font-size: 12px;
                        font-weight: 500;
                        color: #ebdbb2;
                    }

                    .chain-picker-desc {
                        font-size: 10px;
                        color: #928374;
                    }

                    .chain-run-btn {
                        margin: 12px 16px 16px;
                        padding: 12px;
                        background: linear-gradient(135deg, #98971a 0%, #b8bb26 100%);
                        border: none;
                        border-radius: 8px;
                        color: #1d2021;
                        font-size: 13px;
                        font-weight: 600;
                        font-family: 'JetBrains Mono', monospace;
                        cursor: pointer;
                        transition: all 0.15s ease;
                    }

                    .chain-run-btn:hover:not(:disabled) {
                        background: linear-gradient(135deg, #b8bb26 0%, #98971a 100%);
                        transform: translateY(-1px);
                    }

                    .chain-run-btn:disabled {
                        opacity: 0.5;
                        cursor: not-allowed;
                    }

                    .chain-empty-state {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        padding: 48px 24px;
                        text-align: center;
                    }

                    .chain-empty-state p {
                        color: #928374;
                        font-size: 13px;
                        margin-bottom: 16px;
                    }

                    .chain-create-first-btn {
                        padding: 12px 20px;
                        background: #458588;
                        border: none;
                        border-radius: 8px;
                        color: #fbf1c7;
                        font-size: 13px;
                        font-weight: 500;
                        font-family: 'JetBrains Mono', monospace;
                        cursor: pointer;
                        transition: all 0.15s ease;
                    }

                    .chain-create-first-btn:hover {
                        background: #83a598;
                    }

                    /* Trust Warning Modal */
                    .chain-trust-overlay {
                        position: absolute;
                        inset: 0;
                        background: rgba(0, 0, 0, 0.85);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 100;
                        padding: 16px;
                    }

                    .chain-trust-modal {
                        background: #1d2021;
                        border: 1px solid #fb4934;
                        border-radius: 12px;
                        padding: 24px;
                        max-width: 340px;
                        box-shadow: 0 8px 32px rgba(251, 73, 52, 0.2);
                    }

                    .chain-trust-icon {
                        font-size: 48px;
                        text-align: center;
                        margin-bottom: 16px;
                    }

                    .chain-trust-modal h4 {
                        margin: 0 0 12px;
                        font-size: 18px;
                        font-weight: 600;
                        color: #fb4934;
                        text-align: center;
                    }

                    .chain-trust-modal p {
                        font-size: 13px;
                        color: #ebdbb2;
                        line-height: 1.5;
                        margin: 0 0 12px;
                    }

                    .chain-trust-modal strong {
                        color: #fabd2f;
                    }

                    .chain-trust-details {
                        font-size: 11px !important;
                        color: #928374 !important;
                        background: rgba(0, 0, 0, 0.3);
                        padding: 10px 12px;
                        border-radius: 6px;
                    }

                    .chain-trust-commands {
                        margin: 12px 0;
                        padding: 10px 12px;
                        background: #282828;
                        border-radius: 6px;
                        border: 1px solid #3c3836;
                    }

                    .chain-trust-commands p {
                        font-size: 11px;
                        color: #928374;
                        margin: 0 0 8px;
                    }

                    .chain-trust-commands ul {
                        margin: 0;
                        padding: 0 0 0 16px;
                        font-size: 10px;
                        color: #8ec07c;
                        font-family: 'JetBrains Mono', monospace;
                    }

                    .chain-trust-commands li {
                        margin-bottom: 4px;
                        word-break: break-all;
                    }

                    .chain-trust-actions {
                        display: flex;
                        gap: 10px;
                        margin-top: 16px;
                    }

                    .chain-trust-cancel {
                        flex: 1;
                        padding: 10px;
                        background: #3c3836;
                        border: 1px solid #504945;
                        border-radius: 6px;
                        color: #ebdbb2;
                        font-size: 12px;
                        font-weight: 500;
                        font-family: 'JetBrains Mono', monospace;
                        cursor: pointer;
                        transition: all 0.15s ease;
                    }

                    .chain-trust-cancel:hover {
                        background: #504945;
                    }

                    .chain-trust-accept {
                        flex: 1;
                        padding: 10px;
                        background: linear-gradient(135deg, #cc241d 0%, #fb4934 100%);
                        border: none;
                        border-radius: 6px;
                        color: #fbf1c7;
                        font-size: 12px;
                        font-weight: 600;
                        font-family: 'JetBrains Mono', monospace;
                        cursor: pointer;
                        transition: all 0.15s ease;
                    }

                    .chain-trust-accept:hover {
                        background: linear-gradient(135deg, #fb4934 0%, #cc241d 100%);
                    }

                    /* Welcome Modal */
                    .welcome-overlay {
                        position: absolute;
                        inset: 0;
                        background: rgba(29, 32, 33, 0.95);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 200;
                        padding: 24px;
                    }

                    .welcome-modal {
                        background: linear-gradient(180deg, #32302f 0%, #282828 100%);
                        border: 1px solid #504945;
                        border-radius: 16px;
                        padding: 32px;
                        max-width: 500px;
                        width: 100%;
                        box-shadow: 0 16px 64px rgba(0, 0, 0, 0.5);
                    }

                    .welcome-icon {
                        font-size: 56px;
                        text-align: center;
                        margin-bottom: 16px;
                    }

                    .welcome-modal h2 {
                        margin: 0 0 16px;
                        font-size: 24px;
                        font-weight: 600;
                        color: #fbf1c7;
                        text-align: center;
                        font-family: 'JetBrains Mono', monospace;
                    }

                    .welcome-intro {
                        font-size: 14px;
                        color: #ebdbb2;
                        text-align: center;
                        line-height: 1.6;
                        margin: 0 0 24px;
                    }

                    .welcome-intro strong {
                        color: #fe8019;
                    }

                    .welcome-section {
                        background: rgba(0, 0, 0, 0.2);
                        border-radius: 10px;
                        padding: 16px;
                        margin-bottom: 16px;
                    }

                    .welcome-section h4 {
                        margin: 0 0 12px;
                        font-size: 14px;
                        font-weight: 600;
                        color: #ebdbb2;
                    }

                    .welcome-section ul {
                        margin: 0;
                        padding: 0 0 0 20px;
                        font-size: 13px;
                        color: #a89984;
                        line-height: 1.8;
                    }

                    .welcome-section li {
                        margin-bottom: 4px;
                    }

                    .welcome-section code {
                        background: #1d2021;
                        padding: 2px 6px;
                        border-radius: 4px;
                        font-family: 'JetBrains Mono', monospace;
                        font-size: 12px;
                        color: #8ec07c;
                    }

                    .welcome-section strong {
                        color: #ebdbb2;
                    }

                    .welcome-warning {
                        background: rgba(251, 73, 52, 0.1);
                        border: 1px solid rgba(251, 73, 52, 0.3);
                        border-radius: 10px;
                        padding: 16px;
                        margin-bottom: 24px;
                    }

                    .welcome-warning h4 {
                        margin: 0 0 8px;
                        font-size: 14px;
                        font-weight: 600;
                        color: #fb4934;
                    }

                    .welcome-warning p {
                        margin: 0;
                        font-size: 12px;
                        color: #ebdbb2;
                        line-height: 1.6;
                    }

                    .welcome-warning strong {
                        color: #fabd2f;
                    }

                    .welcome-btn {
                        display: block;
                        width: 100%;
                        padding: 14px 24px;
                        background: linear-gradient(135deg, #98971a 0%, #b8bb26 100%);
                        border: none;
                        border-radius: 10px;
                        color: #1d2021;
                        font-size: 15px;
                        font-weight: 600;
                        font-family: 'JetBrains Mono', monospace;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    }

                    .welcome-btn:hover {
                        background: linear-gradient(135deg, #b8bb26 0%, #98971a 100%);
                        transform: translateY(-2px);
                        box-shadow: 0 4px 16px rgba(184, 187, 38, 0.3);
                    }
                `}</style>
            </IonContent>
        </IonPage>
    );
};

export default DevCli;
