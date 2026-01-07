import React, { useEffect, useRef, useState, useCallback } from 'react';
import { IonPage, IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonButton, IonIcon } from '@ionic/react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';

import { useWallet } from 'learn-card-base/hooks/useWallet';
import { BespokeLearnCard } from 'learn-card-base/types/learn-card';
import * as types from '@learncard/types';
import CommandSidebar from './CommandSidebar';

const WELCOME_MESSAGE = `

Welcome to the LearnCard Browser CLI!

Variables available:
  learnCard   - Your LearnCard wallet instance
  types       - Zod validators from @learncard/types

Example commands:
  learnCard.id.did()
  await learnCard.invoke.getTestVc()
  await learnCard.invoke.issueCredential(await learnCard.invoke.getTestVc())
  await learnCard.invoke.verifyCredential(vc)

Type 'help' for more commands.
`;

const HELP_TEXT = `
Available Commands:
  help                    - Show this help message
  clear                   - Clear the terminal
  did                     - Show your DID
  profile                 - Show your profile
  credentials             - List credential categories
  
JavaScript Execution:
  Any valid JavaScript expression will be evaluated.
  Use 'await' for async operations.
  
  Examples:
    learnCard.id.did()
    await learnCard.invoke.getTestVc()
    await learnCard.invoke.issueCredential(uvc)
    await learnCard.invoke.verifyCredential(vc)
    await learnCard.invoke.getProfile()
    types.VCValidator.safeParse(vc)
`;

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

const DevCli: React.FC = () => {
    const terminalRef = useRef<HTMLDivElement>(null);
    const terminalInstanceRef = useRef<Terminal | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);
    const learnCardRef = useRef<BespokeLearnCard | null>(null);
    const commandBufferRef = useRef<string>('');
    const historyRef = useRef<string[]>([]);
    const historyIndexRef = useRef<number>(-1);

    const [isReady, setIsReady] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const { initWallet } = useWallet();

    const writePrompt = useCallback(() => {
        const term = terminalInstanceRef.current;

        if (term) {
            term.write('\r\n\x1b[36m❯\x1b[0m ');
        }
    }, []);

    const writeLine = useCallback((text: string, color?: string) => {
        const term = terminalInstanceRef.current;

        if (term) {
            const colorCode = color || '37';
            const lines = text.split('\n');

            lines.forEach((line, i) => {
                if (i > 0) term.write('\r\n');
                term.write(`\x1b[${colorCode}m${line}\x1b[0m`);
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
            // Create a function that has access to learnCard and types
            const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

            const fn = new AsyncFunction(
                'learnCard',
                'types',
                `return (${trimmedCommand})`
            );

            const result = await fn(learnCard, types);

            term.write('\r\n');
            writeLine(formatOutput(result), '32');
        } catch (e) {
            term.write('\r\n');
            writeLine(`Error: ${e instanceof Error ? e.message : String(e)}`, '31');
        }

        writePrompt();
    }, [writeLine, writePrompt]);

    // Initialize terminal
    useEffect(() => {
        if (!terminalRef.current || terminalInstanceRef.current) return;

        const term = new Terminal({
            cursorBlink: true,
            fontSize: 14,
            fontFamily: 'Menlo, Monaco, "Courier New", monospace',
            theme: {
                background: '#1a1a2e',
                foreground: '#eaeaea',
                cursor: '#00d9ff',
                cursorAccent: '#1a1a2e',
                selectionBackground: '#3d3d5c',
                black: '#1a1a2e',
                red: '#ff6b6b',
                green: '#4ade80',
                yellow: '#fbbf24',
                blue: '#60a5fa',
                magenta: '#c084fc',
                cyan: '#22d3ee',
                white: '#eaeaea',
                brightBlack: '#4a4a6a',
                brightRed: '#ff8a8a',
                brightGreen: '#6ee7a0',
                brightYellow: '#fcd34d',
                brightBlue: '#93c5fd',
                brightMagenta: '#d8b4fe',
                brightCyan: '#67e8f9',
                brightWhite: '#ffffff',
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

                    // Clear current line
                    term.write('\r\x1b[36m❯\x1b[0m ');
                    term.write(' '.repeat(commandBufferRef.current.length));
                    term.write('\r\x1b[36m❯\x1b[0m ');

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

                        term.write('\r\x1b[36m❯\x1b[0m ');
                        term.write(' '.repeat(commandBufferRef.current.length));
                        term.write('\r\x1b[36m❯\x1b[0m ');
                        term.write(historyCommand);
                        commandBufferRef.current = historyCommand;
                    } else {
                        historyIndexRef.current = -1;
                        term.write('\r\x1b[36m❯\x1b[0m ');
                        term.write(' '.repeat(commandBufferRef.current.length));
                        term.write('\r\x1b[36m❯\x1b[0m ');
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
            // Clear current line and insert command
            term.write('\r\x1b[36m❯\x1b[0m ');
            term.write(' '.repeat(commandBufferRef.current.length));
            term.write('\r\x1b[36m❯\x1b[0m ');
            term.write(command);
            commandBufferRef.current = command;
            term.focus();
        }
    }, []);

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonBackButton defaultHref="/admin-tools" />
                    </IonButtons>

                    <IonTitle>LearnCard CLI</IonTitle>
                </IonToolbar>
            </IonHeader>

            <IonContent className="ion-no-padding">
                <div className="cli-container">
                    <CommandSidebar
                        onInsertCommand={handleInsertCommand}
                        isOpen={sidebarOpen}
                        onToggle={() => setSidebarOpen(!sidebarOpen)}
                    />

                    <div
                        ref={terminalRef}
                        className="dev-cli-terminal"
                        style={{
                            flex: 1,
                            height: '100%',
                            backgroundColor: '#1a1a2e',
                            padding: '8px',
                            letterSpacing: 'normal',
                            minWidth: 0,
                        }}
                    />
                </div>

                <style>{`
                    .cli-container {
                        display: flex;
                        height: 100%;
                        overflow: hidden;
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
                        background: linear-gradient(135deg, #2d2d4a 0%, #1a1a2e 100%);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        border-left: none;
                        border-radius: 0 12px 12px 0;
                        color: #fff;
                        font-size: 20px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 100;
                        transition: all 0.2s ease;
                    }

                    .sidebar-toggle-closed:hover {
                        background: linear-gradient(135deg, #3d3d5a 0%, #2a2a3e 100%);
                        width: 48px;
                    }

                    .command-sidebar {
                        width: 360px;
                        min-width: 360px;
                        height: 100%;
                        background: linear-gradient(180deg, #1e1e32 0%, #16162a 100%);
                        border-right: 1px solid rgba(255, 255, 255, 0.08);
                        display: flex;
                        flex-direction: column;
                        overflow: hidden;
                    }

                    .sidebar-header {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        padding: 16px 20px;
                        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                        background: rgba(255, 255, 255, 0.02);
                    }

                    .sidebar-header h2 {
                        margin: 0;
                        font-size: 16px;
                        font-weight: 600;
                        color: #fff;
                        letter-spacing: -0.02em;
                    }

                    .sidebar-close {
                        width: 28px;
                        height: 28px;
                        border-radius: 8px;
                        border: none;
                        background: rgba(255, 255, 255, 0.05);
                        color: rgba(255, 255, 255, 0.6);
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 14px;
                        transition: all 0.15s ease;
                    }

                    .sidebar-close:hover {
                        background: rgba(255, 255, 255, 0.1);
                        color: #fff;
                    }

                    .sidebar-search {
                        padding: 12px 16px;
                        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
                    }

                    .sidebar-search input {
                        width: 100%;
                        padding: 10px 14px;
                        border-radius: 10px;
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        background: rgba(0, 0, 0, 0.3);
                        color: #fff;
                        font-size: 14px;
                        outline: none;
                        transition: all 0.15s ease;
                    }

                    .sidebar-search input::placeholder {
                        color: rgba(255, 255, 255, 0.4);
                    }

                    .sidebar-search input:focus {
                        border-color: rgba(34, 211, 238, 0.5);
                        background: rgba(0, 0, 0, 0.4);
                    }

                    .category-pills {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 6px;
                        padding: 12px 16px;
                        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
                    }

                    .category-pill {
                        padding: 6px 12px;
                        border-radius: 20px;
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        background: transparent;
                        color: rgba(255, 255, 255, 0.7);
                        font-size: 12px;
                        cursor: pointer;
                        transition: all 0.15s ease;
                        white-space: nowrap;
                    }

                    .category-pill:hover {
                        background: rgba(255, 255, 255, 0.05);
                        border-color: rgba(255, 255, 255, 0.2);
                    }

                    .category-pill.active {
                        background: linear-gradient(135deg, rgba(34, 211, 238, 0.2) 0%, rgba(96, 165, 250, 0.2) 100%);
                        border-color: rgba(34, 211, 238, 0.4);
                        color: #22d3ee;
                    }

                    .command-list {
                        flex: 1;
                        overflow-y: auto;
                        padding: 12px;
                    }

                    .command-list::-webkit-scrollbar {
                        width: 6px;
                    }

                    .command-list::-webkit-scrollbar-track {
                        background: transparent;
                    }

                    .command-list::-webkit-scrollbar-thumb {
                        background: rgba(255, 255, 255, 0.1);
                        border-radius: 3px;
                    }

                    .command-card {
                        background: rgba(255, 255, 255, 0.03);
                        border: 1px solid rgba(255, 255, 255, 0.06);
                        border-radius: 12px;
                        margin-bottom: 8px;
                        overflow: hidden;
                        transition: all 0.15s ease;
                    }

                    .command-card:hover {
                        background: rgba(255, 255, 255, 0.05);
                        border-color: rgba(255, 255, 255, 0.1);
                    }

                    .command-header {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        padding: 12px 14px;
                        cursor: pointer;
                    }

                    .command-info h3 {
                        margin: 0 0 2px 0;
                        font-size: 14px;
                        font-weight: 500;
                        color: #fff;
                    }

                    .command-info p {
                        margin: 0;
                        font-size: 12px;
                        color: rgba(255, 255, 255, 0.5);
                    }

                    .expand-icon {
                        color: rgba(255, 255, 255, 0.4);
                        font-size: 10px;
                        transition: transform 0.2s ease;
                    }

                    .expand-icon.expanded {
                        transform: rotate(180deg);
                    }

                    .insert-btn {
                        padding: 6px 12px;
                        border-radius: 8px;
                        border: none;
                        font-size: 13px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: all 0.15s ease;
                    }

                    .insert-btn.quick {
                        background: rgba(34, 211, 238, 0.15);
                        color: #22d3ee;
                        padding: 6px 10px;
                    }

                    .insert-btn.quick:hover {
                        background: rgba(34, 211, 238, 0.25);
                    }

                    .insert-btn.primary {
                        width: 100%;
                        padding: 10px;
                        background: linear-gradient(135deg, #22d3ee 0%, #60a5fa 100%);
                        color: #000;
                        font-weight: 600;
                    }

                    .insert-btn.primary:hover {
                        opacity: 0.9;
                        transform: translateY(-1px);
                    }

                    .command-params {
                        padding: 0 14px 14px 14px;
                        border-top: 1px solid rgba(255, 255, 255, 0.06);
                    }

                    .param-field {
                        margin-top: 12px;
                    }

                    .param-field label {
                        display: block;
                        font-size: 12px;
                        font-weight: 500;
                        color: rgba(255, 255, 255, 0.8);
                        margin-bottom: 4px;
                    }

                    .param-field .required {
                        color: #ff6b6b;
                        margin-left: 2px;
                    }

                    .param-field .param-desc {
                        display: block;
                        font-size: 11px;
                        color: rgba(255, 255, 255, 0.4);
                        margin-bottom: 6px;
                    }

                    .param-field input,
                    .param-field textarea,
                    .param-field select {
                        width: 100%;
                        padding: 8px 12px;
                        border-radius: 8px;
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        background: rgba(0, 0, 0, 0.3);
                        color: #fff;
                        font-size: 13px;
                        font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
                        outline: none;
                        transition: all 0.15s ease;
                    }

                    .param-field input:focus,
                    .param-field textarea:focus,
                    .param-field select:focus {
                        border-color: rgba(34, 211, 238, 0.5);
                    }

                    .param-field textarea {
                        resize: vertical;
                        min-height: 60px;
                    }

                    .param-field select {
                        cursor: pointer;
                    }

                    .command-preview {
                        margin-top: 12px;
                        padding: 10px 12px;
                        background: rgba(0, 0, 0, 0.4);
                        border-radius: 8px;
                        overflow-x: auto;
                    }

                    .command-preview code {
                        font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
                        font-size: 12px;
                        color: #4ade80;
                        white-space: pre-wrap;
                        word-break: break-all;
                    }

                    .no-results {
                        text-align: center;
                        padding: 40px 20px;
                        color: rgba(255, 255, 255, 0.4);
                    }
                `}</style>
            </IonContent>
        </IonPage>
    );
};

export default DevCli;
