import React, { useState, useCallback, useEffect } from 'react';

import { COMMANDS, CommandTemplate, CommandParam } from './CommandSidebar';

export interface ChainStep {
    id: string;
    type: 'template' | 'custom';
    templateId?: string;
    customCommand?: string;
    paramValues: Record<string, string>;
    output?: string;
    error?: string;
    status: 'pending' | 'running' | 'success' | 'error';
}

export interface Chain {
    id: string;
    name: string;
    steps: ChainStep[];
    createdAt: number;
    updatedAt: number;
    imported?: boolean;
    trusted?: boolean;
}

interface ChainBuilderProps {
    isOpen: boolean;
    onToggle: () => void;
    onExecuteChain: (chain: Chain) => Promise<{ stepId: string; result?: string; error?: string }[]>;
}

const STORAGE_KEY = 'learncard-cli-chains';

const generateId = () => Math.random().toString(36).substring(2, 15);

const loadChains = (): Chain[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

const saveChains = (chains: Chain[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chains));
};

const ChainBuilder: React.FC<ChainBuilderProps> = ({ isOpen, onToggle, onExecuteChain }) => {
    const [chains, setChains] = useState<Chain[]>(() => loadChains());
    const [activeChainId, setActiveChainId] = useState<string | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [showCommandPicker, setShowCommandPicker] = useState(false);
    const [commandSearch, setCommandSearch] = useState('');
    const [editingStepId, setEditingStepId] = useState<string | null>(null);
    const [draggedStepId, setDraggedStepId] = useState<string | null>(null);
    const [showTrustWarning, setShowTrustWarning] = useState(false);

    const activeChain = chains.find(c => c.id === activeChainId) || null;

    useEffect(() => {
        saveChains(chains);
    }, [chains]);

    const createNewChain = useCallback(() => {
        const newChain: Chain = {
            id: generateId(),
            name: `Chain ${chains.length + 1}`,
            steps: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        setChains(prev => [...prev, newChain]);
        setActiveChainId(newChain.id);
    }, [chains.length]);

    const deleteChain = useCallback((chainId: string) => {
        setChains(prev => prev.filter(c => c.id !== chainId));

        if (activeChainId === chainId) {
            setActiveChainId(null);
        }
    }, [activeChainId]);

    const renameChain = useCallback((chainId: string, newName: string) => {
        setChains(prev => prev.map(c =>
            c.id === chainId ? { ...c, name: newName, updatedAt: Date.now() } : c
        ));
    }, []);

    const exportChain = useCallback((chain: Chain) => {
        const exportData = {
            ...chain,
            steps: chain.steps.map(step => ({
                ...step,
                output: undefined,
                error: undefined,
                status: 'pending' as const,
            })),
            exportedAt: Date.now(),
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${chain.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-chain.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, []);

    const importChain = useCallback(() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';

        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            const reader = new FileReader();

            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target?.result as string);

                    if (!data.name || !Array.isArray(data.steps)) {
                        alert('Invalid chain file format');
                        return;
                    }

                    const importedChain: Chain = {
                        id: generateId(),
                        name: data.name + ' (imported)',
                        steps: data.steps.map((step: ChainStep) => ({
                            ...step,
                            id: generateId(),
                            output: undefined,
                            error: undefined,
                            status: 'pending' as const,
                        })),
                        createdAt: Date.now(),
                        updatedAt: Date.now(),
                        imported: true,
                        trusted: false,
                    };

                    setChains(prev => [...prev, importedChain]);
                    setActiveChainId(importedChain.id);
                    setShowTrustWarning(true);
                } catch {
                    alert('Failed to parse chain file');
                }
            };

            reader.readAsText(file);
        };

        input.click();
    }, []);

    const addTemplateStep = useCallback((template: CommandTemplate) => {
        if (!activeChainId) return;

        const newStep: ChainStep = {
            id: generateId(),
            type: 'template',
            templateId: template.id,
            paramValues: {},
            status: 'pending',
        };

        setChains(prev => prev.map(c =>
            c.id === activeChainId
                ? { ...c, steps: [...c.steps, newStep], updatedAt: Date.now() }
                : c
        ));

        setShowCommandPicker(false);
        setCommandSearch('');
    }, [activeChainId]);

    const addCustomStep = useCallback(() => {
        if (!activeChainId) return;

        const newStep: ChainStep = {
            id: generateId(),
            type: 'custom',
            customCommand: '',
            paramValues: {},
            status: 'pending',
        };

        setChains(prev => prev.map(c =>
            c.id === activeChainId
                ? { ...c, steps: [...c.steps, newStep], updatedAt: Date.now() }
                : c
        ));

        setEditingStepId(newStep.id);
    }, [activeChainId]);

    const updateStep = useCallback((stepId: string, updates: Partial<ChainStep>) => {
        if (!activeChainId) return;

        setChains(prev => prev.map(c =>
            c.id === activeChainId
                ? {
                    ...c,
                    steps: c.steps.map(s => s.id === stepId ? { ...s, ...updates } : s),
                    updatedAt: Date.now(),
                }
                : c
        ));
    }, [activeChainId]);

    const deleteStep = useCallback((stepId: string) => {
        if (!activeChainId) return;

        setChains(prev => prev.map(c =>
            c.id === activeChainId
                ? { ...c, steps: c.steps.filter(s => s.id !== stepId), updatedAt: Date.now() }
                : c
        ));
    }, [activeChainId]);

    const moveStep = useCallback((stepId: string, direction: 'up' | 'down') => {
        if (!activeChainId) return;

        setChains(prev => prev.map(c => {
            if (c.id !== activeChainId) return c;

            const steps = [...c.steps];
            const index = steps.findIndex(s => s.id === stepId);

            if (index === -1) return c;
            if (direction === 'up' && index === 0) return c;
            if (direction === 'down' && index === steps.length - 1) return c;

            const newIndex = direction === 'up' ? index - 1 : index + 1;
            [steps[index], steps[newIndex]] = [steps[newIndex], steps[index]];

            return { ...c, steps, updatedAt: Date.now() };
        }));
    }, [activeChainId]);

    const trustChain = useCallback((chainId: string) => {
        setChains(prev => prev.map(c =>
            c.id === chainId ? { ...c, trusted: true } : c
        ));
        setShowTrustWarning(false);
    }, []);

    const runChain = useCallback(async () => {
        if (!activeChain || isRunning) return;

        // Check if imported chain needs to be trusted first
        if (activeChain.imported && !activeChain.trusted) {
            setShowTrustWarning(true);
            return;
        }

        setIsRunning(true);

        // Reset all steps to pending
        setChains(prev => prev.map(c =>
            c.id === activeChainId
                ? {
                    ...c,
                    steps: c.steps.map(s => ({ ...s, status: 'pending' as const, output: undefined, error: undefined })),
                }
                : c
        ));

        try {
            const results = await onExecuteChain(activeChain);

            setChains(prev => prev.map(c => {
                if (c.id !== activeChainId) return c;

                return {
                    ...c,
                    steps: c.steps.map(step => {
                        const result = results.find(r => r.stepId === step.id);

                        if (!result) return step;

                        return {
                            ...step,
                            status: result.error ? 'error' as const : 'success' as const,
                            output: result.result,
                            error: result.error,
                        };
                    }),
                };
            }));
        } finally {
            setIsRunning(false);
        }
    }, [activeChain, activeChainId, isRunning, onExecuteChain]);

    const getStepCommand = (step: ChainStep): string => {
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
    };

    const getTemplateForStep = (step: ChainStep): CommandTemplate | undefined => {
        if (step.type !== 'template') return undefined;
        return COMMANDS.find(c => c.id === step.templateId);
    };

    const filteredCommands = commandSearch
        ? COMMANDS.filter(c =>
            c.name.toLowerCase().includes(commandSearch.toLowerCase()) ||
            c.description.toLowerCase().includes(commandSearch.toLowerCase())
        )
        : COMMANDS;

    if (!isOpen) {
        return (
            <button
                onClick={onToggle}
                className="chain-toggle-closed"
                title="Open Chain Builder"
            >
                <span>⛓️</span>
            </button>
        );
    }

    return (
        <div className="chain-builder" style={{ position: 'relative' }}>
            <div className="chain-header">
                <h3>Chain Builder</h3>

                <button onClick={onToggle} className="chain-close-btn" title="Close">
                    ✕
                </button>
            </div>

            <div className="chain-selector">
                <select
                    value={activeChainId || ''}
                    onChange={(e) => setActiveChainId(e.target.value || null)}
                    className="chain-select"
                >
                    <option value="">Select a chain...</option>

                    {chains.map(chain => (
                        <option key={chain.id} value={chain.id}>{chain.name}</option>
                    ))}
                </select>

                <button onClick={createNewChain} className="chain-new-btn" title="New Chain">
                    +
                </button>

                <button onClick={importChain} className="chain-import-btn" title="Import Chain">
                    📥
                </button>
            </div>

            {activeChain && (
                <>
                    <div className="chain-name-row">
                        <input
                            type="text"
                            value={activeChain.name}
                            onChange={(e) => renameChain(activeChain.id, e.target.value)}
                            className="chain-name-input"
                            placeholder="Chain name..."
                        />

                        <button
                            onClick={() => exportChain(activeChain)}
                            className="chain-export-btn"
                            title="Export Chain"
                        >
                            📤
                        </button>

                        <button
                            onClick={() => deleteChain(activeChain.id)}
                            className="chain-delete-btn"
                            title="Delete Chain"
                        >
                            🗑️
                        </button>
                    </div>

                    <div className="chain-steps">
                        {activeChain.steps.length === 0 ? (
                            <div className="chain-empty">
                                No steps yet. Add a command or custom step.
                            </div>
                        ) : (
                            activeChain.steps.map((step, index) => {
                                const template = getTemplateForStep(step);

                                return (
                                    <div
                                        key={step.id}
                                        className={`chain-step chain-step-${step.status}`}
                                        draggable
                                        onDragStart={() => setDraggedStepId(step.id)}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={() => {
                                            if (draggedStepId && draggedStepId !== step.id) {
                                                // Reorder steps
                                                setChains(prev => prev.map(c => {
                                                    if (c.id !== activeChainId) return c;

                                                    const steps = [...c.steps];
                                                    const draggedIndex = steps.findIndex(s => s.id === draggedStepId);
                                                    const dropIndex = steps.findIndex(s => s.id === step.id);

                                                    if (draggedIndex === -1 || dropIndex === -1) return c;

                                                    const [removed] = steps.splice(draggedIndex, 1);
                                                    steps.splice(dropIndex, 0, removed);

                                                    return { ...c, steps, updatedAt: Date.now() };
                                                }));
                                            }

                                            setDraggedStepId(null);
                                        }}
                                    >
                                        <div className="chain-step-header">
                                            <span className="chain-step-number">{index + 1}</span>

                                            <span className="chain-step-name">
                                                {step.type === 'custom' ? 'Custom' : template?.name || 'Unknown'}
                                            </span>

                                            <div className="chain-step-actions">
                                                <button
                                                    onClick={() => moveStep(step.id, 'up')}
                                                    disabled={index === 0}
                                                    title="Move up"
                                                >
                                                    ↑
                                                </button>

                                                <button
                                                    onClick={() => moveStep(step.id, 'down')}
                                                    disabled={index === activeChain.steps.length - 1}
                                                    title="Move down"
                                                >
                                                    ↓
                                                </button>

                                                <button
                                                    onClick={() => setEditingStepId(editingStepId === step.id ? null : step.id)}
                                                    title="Edit"
                                                >
                                                    ✏️
                                                </button>

                                                <button
                                                    onClick={() => deleteStep(step.id)}
                                                    title="Delete"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </div>

                                        {editingStepId === step.id && (
                                            <div className="chain-step-edit">
                                                {step.type === 'custom' ? (
                                                    <textarea
                                                        value={step.customCommand || ''}
                                                        onChange={(e) => updateStep(step.id, { customCommand: e.target.value })}
                                                        placeholder="Enter JavaScript command..."
                                                        className="chain-custom-input"
                                                    />
                                                ) : template?.params.map(param => (
                                                    <div key={param.name} className="chain-param">
                                                        <label>{param.name}</label>

                                                        {param.type === 'json' ? (
                                                            <textarea
                                                                value={step.paramValues[param.name] || ''}
                                                                onChange={(e) => updateStep(step.id, {
                                                                    paramValues: { ...step.paramValues, [param.name]: e.target.value }
                                                                })}
                                                                placeholder={param.placeholder}
                                                            />
                                                        ) : param.type === 'select' ? (
                                                            <select
                                                                value={step.paramValues[param.name] || param.defaultValue || ''}
                                                                onChange={(e) => updateStep(step.id, {
                                                                    paramValues: { ...step.paramValues, [param.name]: e.target.value }
                                                                })}
                                                            >
                                                                {param.options?.map(opt => (
                                                                    <option key={opt} value={opt}>{opt}</option>
                                                                ))}
                                                            </select>
                                                        ) : (
                                                            <input
                                                                type={param.type === 'number' ? 'number' : 'text'}
                                                                value={step.paramValues[param.name] || ''}
                                                                onChange={(e) => updateStep(step.id, {
                                                                    paramValues: { ...step.paramValues, [param.name]: e.target.value }
                                                                })}
                                                                placeholder={param.placeholder}
                                                            />
                                                        )}
                                                    </div>
                                                ))}

                                                <div className="chain-step-preview">
                                                    <code>{getStepCommand(step) || '(empty)'}</code>
                                                </div>
                                            </div>
                                        )}

                                        {step.status !== 'pending' && (
                                            <div className={`chain-step-output chain-step-output-${step.status}`}>
                                                {step.status === 'running' && <span>Running...</span>}

                                                {step.status === 'success' && (
                                                    <pre>{step.output || '(no output)'}</pre>
                                                )}

                                                {step.status === 'error' && (
                                                    <pre className="error">{step.error}</pre>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <div className="chain-add-buttons">
                        <button
                            onClick={() => setShowCommandPicker(true)}
                            className="chain-add-template-btn"
                        >
                            + Add Command
                        </button>

                        <button
                            onClick={addCustomStep}
                            className="chain-add-custom-btn"
                        >
                            + Custom
                        </button>
                    </div>

                    {showCommandPicker && (
                        <div className="chain-command-picker">
                            <div className="chain-picker-header">
                                <input
                                    type="text"
                                    value={commandSearch}
                                    onChange={(e) => setCommandSearch(e.target.value)}
                                    placeholder="Search commands..."
                                    className="chain-picker-search"
                                    autoFocus
                                />

                                <button onClick={() => { setShowCommandPicker(false); setCommandSearch(''); }}>
                                    ✕
                                </button>
                            </div>

                            <div className="chain-picker-list">
                                {filteredCommands.map(cmd => (
                                    <button
                                        key={cmd.id}
                                        onClick={() => addTemplateStep(cmd)}
                                        className="chain-picker-item"
                                    >
                                        <span className="chain-picker-name">{cmd.name}</span>

                                        <span className="chain-picker-desc">{cmd.description}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {showTrustWarning && activeChain.imported && !activeChain.trusted && (
                        <div className="chain-trust-overlay">
                            <div className="chain-trust-modal">
                                <div className="chain-trust-icon">⚠️</div>

                                <h4>Security Warning</h4>

                                <p>
                                    This chain was imported from an external source.
                                    <strong> Only run chains from sources you trust.</strong>
                                </p>

                                <p className="chain-trust-details">
                                    Imported chains can execute arbitrary JavaScript code with access to your
                                    LearnCard wallet, including issuing credentials, sending data to the network,
                                    and accessing stored information.
                                </p>

                                <div className="chain-trust-commands">
                                    <p>This chain contains {activeChain.steps.length} command(s):</p>

                                    <ul>
                                        {activeChain.steps.slice(0, 5).map((step, i) => {
                                            const cmd = getStepCommand(step);
                                            return (
                                                <li key={step.id}>
                                                    {cmd.length > 50 ? cmd.substring(0, 50) + '...' : cmd || '(custom command)'}
                                                </li>
                                            );
                                        })}

                                        {activeChain.steps.length > 5 && (
                                            <li>...and {activeChain.steps.length - 5} more</li>
                                        )}
                                    </ul>
                                </div>

                                <div className="chain-trust-actions">
                                    <button
                                        onClick={() => setShowTrustWarning(false)}
                                        className="chain-trust-cancel"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        onClick={() => trustChain(activeChain.id)}
                                        className="chain-trust-accept"
                                    >
                                        I Trust This Chain
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={runChain}
                        disabled={isRunning || activeChain.steps.length === 0}
                        className="chain-run-btn"
                    >
                        {isRunning ? '⏳ Running...' : '▶️ Run Chain'}
                    </button>
                </>
            )}

            {!activeChain && chains.length === 0 && (
                <div className="chain-empty-state">
                    <p>No chains yet.</p>

                    <button onClick={createNewChain} className="chain-create-first-btn">
                        Create your first chain
                    </button>
                </div>
            )}
        </div>
    );
};

export default ChainBuilder;
