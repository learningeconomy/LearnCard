import React, { useState, useMemo } from 'react';

interface CommandParam {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'json' | 'select';
    placeholder?: string;
    description?: string;
    required?: boolean;
    options?: string[];
    defaultValue?: string;
}

interface CommandTemplate {
    id: string;
    name: string;
    description: string;
    template: string;
    params: CommandParam[];
    category: string;
}

interface CommandCategory {
    id: string;
    name: string;
    icon: string;
    description: string;
}

const CATEGORIES: CommandCategory[] = [
    { id: 'identity', name: 'Identity', icon: '🆔', description: 'DID and identity operations' },
    { id: 'credentials', name: 'Credentials', icon: '📜', description: 'Issue, verify, and manage VCs' },
    { id: 'network', name: 'Network', icon: '🌐', description: 'LearnCard Network operations' },
    { id: 'storage', name: 'Storage', icon: '💾', description: 'Store and retrieve data' },
    { id: 'profiles', name: 'Profiles', icon: '👤', description: 'Profile management' },
    { id: 'boosts', name: 'Boosts', icon: '🚀', description: 'Boost templates and sending' },
];

const COMMANDS: CommandTemplate[] = [
    // Identity
    {
        id: 'get-did',
        name: 'Get DID',
        description: 'Get your decentralized identifier',
        template: 'learnCard.id.did()',
        params: [],
        category: 'identity',
    },
    {
        id: 'resolve-did',
        name: 'Resolve DID',
        description: 'Resolve a DID to its DID Document',
        template: 'await learnCard.invoke.resolveDid("{{did}}")',
        params: [
            { name: 'did', type: 'string', placeholder: 'did:web:example.com', description: 'DID to resolve', required: true },
        ],
        category: 'identity',
    },

    // Credentials
    {
        id: 'get-test-vc',
        name: 'Get Test VC',
        description: 'Generate a test Verifiable Credential',
        template: 'await learnCard.invoke.getTestVc()',
        params: [],
        category: 'credentials',
    },
    {
        id: 'issue-credential',
        name: 'Issue Credential',
        description: 'Sign and issue a Verifiable Credential',
        template: 'await learnCard.invoke.issueCredential({{credential}})',
        params: [
            { name: 'credential', type: 'json', placeholder: 'await learnCard.invoke.getTestVc()', description: 'Unsigned VC to sign', required: true },
        ],
        category: 'credentials',
    },
    {
        id: 'verify-credential',
        name: 'Verify Credential',
        description: 'Verify a signed Verifiable Credential',
        template: 'await learnCard.invoke.verifyCredential({{credential}})',
        params: [
            { name: 'credential', type: 'json', placeholder: '{ ... }', description: 'Signed VC to verify', required: true },
        ],
        category: 'credentials',
    },
    {
        id: 'new-credential',
        name: 'New Credential',
        description: 'Create a new unsigned credential',
        template: `await learnCard.invoke.newCredential({
    type: "{{type}}",
    subject: "{{subject}}"
})`,
        params: [
            { name: 'type', type: 'string', placeholder: 'Achievement', description: 'Credential type', required: true },
            { name: 'subject', type: 'string', placeholder: 'did:example:recipient', description: 'Subject DID', required: true },
        ],
        category: 'credentials',
    },

    // Network
    {
        id: 'send-boost-template',
        name: 'Send Boost (Template)',
        description: 'Send a boost using an existing template URI',
        template: `await learnCard.invoke.send({
    type: 'boost',
    recipient: '{{recipient}}',
    templateUri: '{{templateUri}}'
})`,
        params: [
            { name: 'recipient', type: 'string', placeholder: 'profile-id or DID', description: 'Recipient profile ID or DID', required: true },
            { name: 'templateUri', type: 'string', placeholder: 'urn:lc:boost:abc123', description: 'Boost template URI', required: true },
        ],
        category: 'network',
    },
    {
        id: 'send-boost-new',
        name: 'Send Boost (New)',
        description: 'Create and send a new boost',
        template: `await learnCard.invoke.send({
    type: 'boost',
    recipient: '{{recipient}}',
    template: {
        credential: {{credential}},
        name: '{{name}}',
        category: '{{category}}'
    }
})`,
        params: [
            { name: 'recipient', type: 'string', placeholder: 'profile-id', description: 'Recipient profile ID', required: true },
            { name: 'credential', type: 'json', placeholder: 'unsignedVC', description: 'Unsigned credential', required: true },
            { name: 'name', type: 'string', placeholder: 'Course Completion', description: 'Boost name', required: true },
            { name: 'category', type: 'select', options: ['Achievement', 'ID', 'Skill', 'Learning History', 'Work History', 'Social Badge'], defaultValue: 'Achievement', description: 'Category', required: true },
        ],
        category: 'network',
    },

    // Storage
    {
        id: 'store-credential',
        name: 'Store Credential',
        description: 'Store a credential in your wallet',
        template: 'await learnCard.invoke.addCredential({{credential}})',
        params: [
            { name: 'credential', type: 'json', placeholder: '{ ... }', description: 'Credential to store', required: true },
        ],
        category: 'storage',
    },
    {
        id: 'get-credentials',
        name: 'Get Credentials',
        description: 'Retrieve stored credentials',
        template: 'await learnCard.invoke.getCredentials()',
        params: [],
        category: 'storage',
    },

    // Profiles
    {
        id: 'get-profile',
        name: 'Get My Profile',
        description: 'Get your LearnCard Network profile',
        template: 'await learnCard.invoke.getProfile()',
        params: [],
        category: 'profiles',
    },
    {
        id: 'get-other-profile',
        name: 'Get Profile by ID',
        description: 'Get another user\'s profile',
        template: 'await learnCard.invoke.getProfile("{{profileId}}")',
        params: [
            { name: 'profileId', type: 'string', placeholder: 'profile-id', description: 'Profile ID to look up', required: true },
        ],
        category: 'profiles',
    },
    {
        id: 'search-profiles',
        name: 'Search Profiles',
        description: 'Search for profiles by display name',
        template: 'await learnCard.invoke.searchProfiles("{{query}}")',
        params: [
            { name: 'query', type: 'string', placeholder: 'John', description: 'Search query', required: true },
        ],
        category: 'profiles',
    },

    // Boosts
    {
        id: 'get-boosts',
        name: 'Get Boosts',
        description: 'Get boost templates you\'ve created',
        template: 'await learnCard.invoke.getBoosts()',
        params: [],
        category: 'boosts',
    },
    {
        id: 'get-boost',
        name: 'Get Boost by URI',
        description: 'Get a specific boost template',
        template: 'await learnCard.invoke.getBoost("{{uri}}")',
        params: [
            { name: 'uri', type: 'string', placeholder: 'urn:lc:boost:abc123', description: 'Boost URI', required: true },
        ],
        category: 'boosts',
    },
    {
        id: 'get-received-boosts',
        name: 'Get Received Boosts',
        description: 'Get boosts sent to you',
        template: 'await learnCard.invoke.getReceivedBoosts()',
        params: [],
        category: 'boosts',
    },
];

interface CommandSidebarProps {
    onInsertCommand: (command: string) => void;
    isOpen: boolean;
    onToggle: () => void;
}

const CommandSidebar: React.FC<CommandSidebarProps> = ({ onInsertCommand, isOpen, onToggle }) => {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [expandedCommand, setExpandedCommand] = useState<string | null>(null);
    const [paramValues, setParamValues] = useState<Record<string, Record<string, string>>>({});
    const [searchQuery, setSearchQuery] = useState('');

    const filteredCommands = useMemo(() => {
        let commands = COMMANDS;

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            commands = commands.filter(
                cmd => cmd.name.toLowerCase().includes(query) || cmd.description.toLowerCase().includes(query)
            );
        } else if (selectedCategory) {
            commands = commands.filter(cmd => cmd.category === selectedCategory);
        }

        return commands;
    }, [selectedCategory, searchQuery]);

    const handleParamChange = (commandId: string, paramName: string, value: string) => {
        setParamValues(prev => ({
            ...prev,
            [commandId]: {
                ...(prev[commandId] || {}),
                [paramName]: value,
            },
        }));
    };

    const buildCommand = (command: CommandTemplate): string => {
        let result = command.template;
        const values = paramValues[command.id] || {};

        command.params.forEach(param => {
            const value = values[param.name] || param.defaultValue || '';
            result = result.replace(`{{${param.name}}}`, value);
        });

        return result;
    };

    const handleInsert = (command: CommandTemplate) => {
        const builtCommand = buildCommand(command);
        onInsertCommand(builtCommand);
    };

    const handleQuickInsert = (command: CommandTemplate) => {
        if (command.params.length === 0) {
            onInsertCommand(command.template);
        } else {
            setExpandedCommand(expandedCommand === command.id ? null : command.id);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={onToggle}
                className="sidebar-toggle-closed"
                title="Open Command Builder"
            >
                <span>📚</span>
            </button>
        );
    }

    return (
        <div className="command-sidebar">
            <div className="sidebar-header">
                <h2>Command Builder</h2>

                <button onClick={onToggle} className="sidebar-close" title="Close">
                    ✕
                </button>
            </div>

            <div className="sidebar-search">
                <input
                    type="text"
                    placeholder="Search commands..."
                    value={searchQuery}
                    onChange={e => {
                        setSearchQuery(e.target.value);
                        if (e.target.value) setSelectedCategory(null);
                    }}
                />
            </div>

            {!searchQuery && (
                <div className="category-pills">
                    <button
                        className={`category-pill ${selectedCategory === null ? 'active' : ''}`}
                        onClick={() => setSelectedCategory(null)}
                    >
                        All
                    </button>

                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            className={`category-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                            onClick={() => setSelectedCategory(cat.id)}
                            title={cat.description}
                        >
                            {cat.icon} {cat.name}
                        </button>
                    ))}
                </div>
            )}

            <div className="command-list">
                {filteredCommands.map(command => (
                    <div key={command.id} className="command-card">
                        <div
                            className="command-header"
                            onClick={() => handleQuickInsert(command)}
                        >
                            <div className="command-info">
                                <h3>{command.name}</h3>
                                <p>{command.description}</p>
                            </div>

                            {command.params.length === 0 ? (
                                <button
                                    className="insert-btn quick"
                                    onClick={e => {
                                        e.stopPropagation();
                                        onInsertCommand(command.template);
                                    }}
                                    title="Insert command"
                                >
                                    ⏎
                                </button>
                            ) : (
                                <span className={`expand-icon ${expandedCommand === command.id ? 'expanded' : ''}`}>
                                    ▼
                                </span>
                            )}
                        </div>

                        {expandedCommand === command.id && command.params.length > 0 && (
                            <div className="command-params">
                                {command.params.map(param => (
                                    <div key={param.name} className="param-field">
                                        <label>
                                            {param.name}
                                            {param.required && <span className="required">*</span>}
                                        </label>

                                        {param.description && (
                                            <span className="param-desc">{param.description}</span>
                                        )}

                                        {param.type === 'select' ? (
                                            <select
                                                value={paramValues[command.id]?.[param.name] || param.defaultValue || ''}
                                                onChange={e => handleParamChange(command.id, param.name, e.target.value)}
                                            >
                                                {param.options?.map(opt => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        ) : param.type === 'json' ? (
                                            <textarea
                                                placeholder={param.placeholder}
                                                value={paramValues[command.id]?.[param.name] || ''}
                                                onChange={e => handleParamChange(command.id, param.name, e.target.value)}
                                                rows={3}
                                            />
                                        ) : (
                                            <input
                                                type={param.type === 'number' ? 'number' : 'text'}
                                                placeholder={param.placeholder}
                                                value={paramValues[command.id]?.[param.name] || ''}
                                                onChange={e => handleParamChange(command.id, param.name, e.target.value)}
                                            />
                                        )}
                                    </div>
                                ))}

                                <div className="command-preview">
                                    <code>{buildCommand(command)}</code>
                                </div>

                                <button
                                    className="insert-btn primary"
                                    onClick={() => handleInsert(command)}
                                >
                                    Insert Command ⏎
                                </button>
                            </div>
                        )}
                    </div>
                ))}

                {filteredCommands.length === 0 && (
                    <div className="no-results">
                        <p>No commands found</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommandSidebar;
