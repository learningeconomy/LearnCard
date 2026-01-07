import React, { useEffect, useRef, useState, useCallback } from 'react';
import { IonPage, IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton } from '@ionic/react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';

import { useWallet } from 'learn-card-base/hooks/useWallet';
import { BespokeLearnCard } from 'learn-card-base/types/learn-card';
import * as types from '@learncard/types';

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

    // Fit terminal when container size changes
    useEffect(() => {
        const fitAddon = fitAddonRef.current;

        if (fitAddon && isReady) {
            setTimeout(() => fitAddon.fit(), 100);
        }
    }, [isReady]);

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
                <div
                    ref={terminalRef}
                    className="dev-cli-terminal"
                    style={{
                        width: '100%',
                        height: '100%',
                        backgroundColor: '#1a1a2e',
                        padding: '8px',
                        letterSpacing: 'normal',
                    }}
                />
                <style>{`
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
                `}</style>
            </IonContent>
        </IonPage>
    );
};

export default DevCli;
