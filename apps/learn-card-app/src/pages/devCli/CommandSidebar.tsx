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
        template: 'learnCard.invoke.getTestVc()',
        params: [],
        category: 'credentials',
    },
    {
        id: 'issue-credential',
        name: 'Issue Credential',
        description: 'Sign and issue a Verifiable Credential',
        template: 'await learnCard.invoke.issueCredential({{credential}})',
        params: [
            { name: 'credential', type: 'json', placeholder: 'learnCard.invoke.getTestVc()', description: 'Unsigned VC to sign', required: true },
        ],
        category: 'credentials',
    },
    {
        id: 'verify-credential',
        name: 'Verify Credential',
        description: 'Verify a signed Verifiable Credential',
        template: 'await learnCard.invoke.verifyCredential({{credential}})',
        params: [
            { name: 'credential', type: 'json', placeholder: 'signedVC', description: 'Signed VC to verify', required: true },
        ],
        category: 'credentials',
    },
    {
        id: 'new-credential-basic',
        name: 'New Basic Credential',
        description: 'Create a new unsigned basic credential',
        template: 'learnCard.invoke.newCredential()',
        params: [],
        category: 'credentials',
    },
    {
        id: 'new-credential-achievement',
        name: 'New Achievement Credential',
        description: 'Create an achievement credential template',
        template: "learnCard.invoke.newCredential({ type: 'achievement' })",
        params: [],
        category: 'credentials',
    },
    {
        id: 'new-credential-boost',
        name: 'New Boost Credential',
        description: 'Create a boost credential template',
        template: "learnCard.invoke.newCredential({ type: 'boost' })",
        params: [],
        category: 'credentials',
    },

    // Storage / Network Credentials
    {
        id: 'upload-credential',
        name: 'Upload Credential (Network)',
        description: 'Upload a credential to LearnCard Network storage',
        template: "await learnCard.store['LearnCard Network'].upload({{credential}})",
        params: [
            { name: 'credential', type: 'json', placeholder: 'signedVC', description: 'Signed credential to upload', required: true },
        ],
        category: 'storage',
    },
    {
        id: 'resolve-credential',
        name: 'Resolve Credential (by URI)',
        description: 'Retrieve a credential by its LC URI',
        template: 'await learnCard.read.get("{{uri}}")',
        params: [
            { name: 'uri', type: 'string', placeholder: 'lc:network:...', description: 'Credential URI', required: true },
        ],
        category: 'storage',
    },
    {
        id: 'get-received-credentials',
        name: 'Get Received Credentials',
        description: 'Get credentials sent to you on the network',
        template: 'await learnCard.invoke.getReceivedCredentials()',
        params: [],
        category: 'storage',
    },
    {
        id: 'get-sent-credentials',
        name: 'Get Sent Credentials',
        description: 'Get credentials you have sent',
        template: 'await learnCard.invoke.getSentCredentials()',
        params: [],
        category: 'storage',
    },
    {
        id: 'send-credential',
        name: 'Send Credential',
        description: 'Send a signed credential to another profile',
        template: 'await learnCard.invoke.sendCredential("{{profileId}}", {{credential}})',
        params: [
            { name: 'profileId', type: 'string', placeholder: 'recipient-profile-id', description: 'Recipient profile ID', required: true },
            { name: 'credential', type: 'json', placeholder: 'signedVC', description: 'Signed credential to send', required: true },
        ],
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

    // Boosts - Creation
    {
        id: 'create-boost',
        name: 'Create Boost',
        description: 'Create a new boost template',
        template: `await learnCard.invoke.createBoost({{credential}}, {
    name: '{{name}}',
    category: '{{category}}'
})`,
        params: [
            { name: 'credential', type: 'json', placeholder: 'unsignedVC', description: 'Credential template', required: true },
            { name: 'name', type: 'string', placeholder: 'My Boost', description: 'Boost name', required: true },
            { name: 'category', type: 'select', options: ['Achievement', 'ID', 'Skill', 'Learning History', 'Work History', 'Social Badge'], defaultValue: 'Achievement', description: 'Category', required: true },
        ],
        category: 'boosts',
    },
    {
        id: 'create-child-boost',
        name: 'Create Child Boost',
        description: 'Create a boost as a child of an existing boost',
        template: `await learnCard.invoke.createChildBoost('{{parentUri}}', {{credential}}, {
    name: '{{name}}',
    category: '{{category}}'
})`,
        params: [
            { name: 'parentUri', type: 'string', placeholder: 'urn:lc:boost:parent123', description: 'Parent boost URI', required: true },
            { name: 'credential', type: 'json', placeholder: 'unsignedVC', description: 'Credential template', required: true },
            { name: 'name', type: 'string', placeholder: 'Child Boost', description: 'Boost name', required: true },
            { name: 'category', type: 'select', options: ['Achievement', 'ID', 'Skill', 'Learning History', 'Work History', 'Social Badge'], defaultValue: 'Achievement', description: 'Category', required: true },
        ],
        category: 'boosts',
    },
    {
        id: 'update-boost',
        name: 'Update Boost',
        description: 'Update boost metadata (name, category, permissions)',
        template: `await learnCard.invoke.updateBoost('{{uri}}', {
    name: '{{name}}',
    category: '{{category}}'
})`,
        params: [
            { name: 'uri', type: 'string', placeholder: 'lc:boost:...', description: 'Boost URI', required: true },
            { name: 'name', type: 'string', placeholder: 'Updated Name', description: 'New boost name', required: false },
            { name: 'category', type: 'select', options: ['Achievement', 'ID', 'Skill', 'Learning History', 'Work History', 'Social Badge'], defaultValue: 'Achievement', description: 'New category', required: false },
        ],
        category: 'boosts',
    },

    // Boosts - Retrieval
    {
        id: 'get-boosts',
        name: 'Get My Boosts (Paginated)',
        description: 'Get boost templates you\'ve created',
        template: 'await learnCard.invoke.getPaginatedBoosts()',
        params: [],
        category: 'boosts',
    },
    {
        id: 'get-boost',
        name: 'Get Boost by URI',
        description: 'Get a specific boost template',
        template: 'await learnCard.invoke.getBoost("{{uri}}")',
        params: [
            { name: 'uri', type: 'string', placeholder: 'lc:boost:...', description: 'Boost URI', required: true },
        ],
        category: 'boosts',
    },
    {
        id: 'count-boosts',
        name: 'Count Boosts',
        description: 'Count your boost templates',
        template: 'await learnCard.invoke.countBoosts()',
        params: [],
        category: 'boosts',
    },
    {
        id: 'get-boost-children',
        name: 'Get Boost Children',
        description: 'Get child boosts of a parent boost',
        template: 'await learnCard.invoke.getBoostChildren("{{uri}}")',
        params: [
            { name: 'uri', type: 'string', placeholder: 'lc:boost:parent...', description: 'Parent boost URI', required: true },
        ],
        category: 'boosts',
    },
    {
        id: 'get-boost-parents',
        name: 'Get Boost Parents',
        description: 'Get parent boosts of a child boost',
        template: 'await learnCard.invoke.getBoostParents("{{uri}}")',
        params: [
            { name: 'uri', type: 'string', placeholder: 'lc:boost:child...', description: 'Child boost URI', required: true },
        ],
        category: 'boosts',
    },

    // Boosts - Sending
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
        category: 'boosts',
    },
    {
        id: 'send-boost-template-data',
        name: 'Send Boost (with Template Data)',
        description: 'Send a boost with dynamic template variables',
        template: `await learnCard.invoke.send({
    type: 'boost',
    recipient: '{{recipient}}',
    templateUri: '{{templateUri}}',
    templateData: {
        {{templateData}}
    }
})`,
        params: [
            { name: 'recipient', type: 'string', placeholder: 'profile-id', description: 'Recipient profile ID', required: true },
            { name: 'templateUri', type: 'string', placeholder: 'urn:lc:boost:abc123', description: 'Boost template URI', required: true },
            { name: 'templateData', type: 'json', placeholder: 'courseName: "Web Dev 101",\ngrade: "A"', description: 'Key-value pairs for template variables', required: true },
        ],
        category: 'boosts',
    },
    {
        id: 'send-boost-new',
        name: 'Send Boost (New Template)',
        description: 'Create and send a new boost in one step',
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
        category: 'boosts',
    },
    {
        id: 'sendboost-direct',
        name: 'sendBoost (Direct)',
        description: 'Send boost directly with options',
        template: `await learnCard.invoke.sendBoost('{{recipient}}', '{{boostUri}}', {
    encrypt: {{encrypt}}
})`,
        params: [
            { name: 'recipient', type: 'string', placeholder: 'profile-id', description: 'Recipient profile ID', required: true },
            { name: 'boostUri', type: 'string', placeholder: 'lc:boost:...', description: 'Boost URI', required: true },
            { name: 'encrypt', type: 'select', options: ['true', 'false'], defaultValue: 'true', description: 'Encrypt credential', required: false },
        ],
        category: 'boosts',
    },

    // Boosts - Permissions & Admin
    {
        id: 'get-boost-admins',
        name: 'Get Boost Admins',
        description: 'List all admin profiles for a boost',
        template: 'await learnCard.invoke.getBoostAdmins("{{uri}}")',
        params: [
            { name: 'uri', type: 'string', placeholder: 'lc:boost:...', description: 'Boost URI', required: true },
        ],
        category: 'boosts',
    },
    {
        id: 'add-boost-admin',
        name: 'Add Boost Admin',
        description: 'Grant admin permissions to a profile',
        template: 'await learnCard.invoke.addBoostAdmin("{{boostUri}}", "{{profileId}}")',
        params: [
            { name: 'boostUri', type: 'string', placeholder: 'lc:boost:...', description: 'Boost URI', required: true },
            { name: 'profileId', type: 'string', placeholder: 'profile-id', description: 'Profile to grant admin', required: true },
        ],
        category: 'boosts',
    },
    {
        id: 'remove-boost-admin',
        name: 'Remove Boost Admin',
        description: 'Remove admin permissions from a profile',
        template: 'await learnCard.invoke.removeBoostAdmin("{{boostUri}}", "{{profileId}}")',
        params: [
            { name: 'boostUri', type: 'string', placeholder: 'lc:boost:...', description: 'Boost URI', required: true },
            { name: 'profileId', type: 'string', placeholder: 'profile-id', description: 'Profile to remove admin', required: true },
        ],
        category: 'boosts',
    },
    {
        id: 'get-boost-permissions',
        name: 'Get Boost Permissions',
        description: 'Get permissions for a profile on a boost',
        template: 'await learnCard.invoke.getBoostPermissions("{{boostUri}}", "{{profileId}}")',
        params: [
            { name: 'boostUri', type: 'string', placeholder: 'lc:boost:...', description: 'Boost URI', required: true },
            { name: 'profileId', type: 'string', placeholder: 'profile-id', description: 'Profile ID (optional, defaults to self)', required: false },
        ],
        category: 'boosts',
    },
    {
        id: 'update-boost-permissions',
        name: 'Update Boost Permissions',
        description: 'Update permissions for a profile on a boost',
        template: `await learnCard.invoke.updateBoostPermissions('{{boostUri}}', {
    canIssue: {{canIssue}},
    canRevoke: {{canRevoke}}
}, '{{profileId}}')`,
        params: [
            { name: 'boostUri', type: 'string', placeholder: 'lc:boost:...', description: 'Boost URI', required: true },
            { name: 'canIssue', type: 'select', options: ['true', 'false'], defaultValue: 'true', description: 'Can issue boost', required: true },
            { name: 'canRevoke', type: 'select', options: ['true', 'false'], defaultValue: 'false', description: 'Can revoke issued boosts', required: true },
            { name: 'profileId', type: 'string', placeholder: 'profile-id', description: 'Profile to update', required: true },
        ],
        category: 'boosts',
    },
    {
        id: 'get-boost-recipients',
        name: 'Get Boost Recipients (Paginated)',
        description: 'Get profiles that received this boost',
        template: 'await learnCard.invoke.getPaginatedBoostRecipients("{{uri}}")',
        params: [
            { name: 'uri', type: 'string', placeholder: 'lc:boost:...', description: 'Boost URI', required: true },
        ],
        category: 'boosts',
    },
    {
        id: 'count-boost-recipients',
        name: 'Count Boost Recipients',
        description: 'Count profiles that received this boost',
        template: 'await learnCard.invoke.countBoostRecipients("{{uri}}")',
        params: [
            { name: 'uri', type: 'string', placeholder: 'lc:boost:...', description: 'Boost URI', required: true },
        ],
        category: 'boosts',
    },
    {
        id: 'delete-boost',
        name: 'Delete Boost',
        description: 'Delete a boost template',
        template: 'await learnCard.invoke.deleteBoost("{{uri}}")',
        params: [
            { name: 'uri', type: 'string', placeholder: 'lc:boost:...', description: 'Boost URI to delete', required: true },
        ],
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
            let value = values[param.name] || param.defaultValue || '';

            // For JSON params, try to minify to single line for terminal compatibility
            if (param.type === 'json' && value.trim()) {
                try {
                    // Try to parse and re-stringify to minify
                    const parsed = JSON.parse(value);
                    value = JSON.stringify(parsed);
                } catch {
                    // If not valid JSON, just remove newlines
                    value = value.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
                }
            }

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
