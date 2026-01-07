import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
    X,
    Copy,
    Check,
    ChevronDown,
    ChevronUp,
    Eye,
    Sparkles,
    Award,
    FileText,
    Image as ImageIcon,
    Calendar,
    Link as LinkIcon,
    HelpCircle,
    Upload,
    Loader2,
    Save,
    FolderOpen,
    Trash2,
    Clock,
    Plus,
    ChevronLeft,
    CheckCircle2,
    AlertCircle,
    ShieldCheck,
} from 'lucide-react';

import { useFilestack, BoostCategoryOptionsEnum, BoostPageViewMode, useWallet } from 'learn-card-base';
import { BoostEarnedCard } from '../boost/boost-earned-card/BoostEarnedCard';

// Storage key for saved credentials
const STORAGE_KEY = 'lc-credential-builder-saved';
const DRAFT_KEY = 'lc-credential-builder-draft';

// Saved credential type
interface SavedCredential {
    id: string;
    name: string;
    data: CredentialData;
    createdAt: number;
    updatedAt: number;
}

// Storage helpers
const getSavedCredentials = (): SavedCredential[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

const saveCredentials = (credentials: SavedCredential[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(credentials));
};

const getDraft = (): { data: CredentialData; savedAt: number } | null => {
    try {
        const stored = localStorage.getItem(DRAFT_KEY);
        return stored ? JSON.parse(stored) : null;
    } catch {
        return null;
    }
};

const saveDraft = (data: CredentialData) => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ data, savedAt: Date.now() }));
};

const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
};

// Format relative time
const formatRelativeTime = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 5) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;

    return new Date(timestamp).toLocaleDateString();
};

// Valid OBv3 Achievement Types
const ACHIEVEMENT_TYPES = [
    { value: 'Achievement', label: 'Achievement', description: 'Generic achievement or accomplishment' },
    { value: 'Badge', label: 'Badge', description: 'A digital badge or micro-credential' },
    { value: 'Certificate', label: 'Certificate', description: 'A certificate of completion or participation' },
    { value: 'CertificateOfCompletion', label: 'Certificate of Completion', description: 'Completed a course or program' },
    { value: 'Course', label: 'Course', description: 'Completed a specific course' },
    { value: 'Competency', label: 'Competency', description: 'Demonstrated a specific skill or competency' },
    { value: 'MicroCredential', label: 'Micro-Credential', description: 'A focused, skill-based credential' },
    { value: 'Award', label: 'Award', description: 'Recognition or honor received' },
    { value: 'Assessment', label: 'Assessment', description: 'Passed an assessment or exam' },
    { value: 'LearningProgram', label: 'Learning Program', description: 'Completed a learning program' },
    { value: 'Certification', label: 'Certification', description: 'Professional certification earned' },
    { value: 'License', label: 'License', description: 'Professional or occupational license' },
    { value: 'Diploma', label: 'Diploma', description: 'Educational diploma' },
    { value: 'Membership', label: 'Membership', description: 'Membership in an organization' },
] as const;

type AchievementType = (typeof ACHIEVEMENT_TYPES)[number]['value'];

interface CredentialData {
    // Basic
    credentialName: string;
    achievementName: string;
    achievementDescription: string;
    achievementType: AchievementType;
    achievementImage: string;

    // Advanced
    criteriaText: string;
    criteriaUrl: string;
    evidenceUrl: string;
    evidenceDescription: string;
    validFrom: string;
    expiresOn: string;
}

const DEFAULT_DATA: CredentialData = {
    credentialName: '',
    achievementName: '',
    achievementDescription: '',
    achievementType: 'Achievement',
    achievementImage: '',
    criteriaText: '',
    criteriaUrl: '',
    evidenceUrl: '',
    evidenceDescription: '',
    validFrom: '',
    expiresOn: '',
};

interface OBv3CredentialBuilderProps {
    isOpen: boolean;
    onClose: () => void;
    onSave?: (credential: Record<string, unknown>) => void;
    initialData?: Partial<CredentialData>;
}

const InputField: React.FC<{
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    tooltip?: string;
    type?: 'text' | 'url' | 'date' | 'textarea';
    optional?: boolean;
}> = ({ label, value, onChange, placeholder, tooltip, type = 'text', optional = false }) => {
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
                <label className="text-sm font-medium text-gray-700">{label}</label>

                {optional && <span className="text-xs text-gray-400">(optional)</span>}

                {tooltip && (
                    <div className="relative">
                        <button
                            type="button"
                            onMouseEnter={() => setShowTooltip(true)}
                            onMouseLeave={() => setShowTooltip(false)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <HelpCircle className="w-3.5 h-3.5" />
                        </button>

                        {showTooltip && (
                            <div className="absolute z-50 left-0 bottom-full mb-1 w-48 p-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg">
                                {tooltip}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {type === 'textarea' ? (
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    rows={3}
                    className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-none placeholder:text-gray-400"
                />
            ) : (
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 placeholder:text-gray-400"
                />
            )}
        </div>
    );
};

export const OBv3CredentialBuilder: React.FC<OBv3CredentialBuilderProps> = ({
    isOpen,
    onClose,
    onSave,
    initialData,
}) => {
    const [data, setData] = useState<CredentialData>({ ...DEFAULT_DATA, ...initialData });
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [activeTab, setActiveTab] = useState<'build' | 'preview' | 'visual'>('build');
    const [copied, setCopied] = useState(false);
    const [userDid, setUserDid] = useState<string>('did:web:preview.learncard.com');

    // Saved credentials state
    const [savedCredentials, setSavedCredentials] = useState<SavedCredential[]>([]);
    const [currentCredentialId, setCurrentCredentialId] = useState<string | null>(null);
    const [showLibrary, setShowLibrary] = useState(false);
    const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);
    const [showSaveAs, setShowSaveAs] = useState(false);
    const [saveAsName, setSaveAsName] = useState('');

    // Verification state
    const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'valid' | 'invalid'>('idle');
    const [verificationError, setVerificationError] = useState<string | null>(null);

    // Load saved credentials and draft on mount
    useEffect(() => {
        if (isOpen) {
            const saved = getSavedCredentials();
            setSavedCredentials(saved);

            // Load draft if no initialData and no current credential
            if (!initialData && !currentCredentialId) {
                const draft = getDraft();

                if (draft) {
                    setData(draft.data);
                    setDraftSavedAt(draft.savedAt);
                }
            }
        }
    }, [isOpen, initialData, currentCredentialId]);

    // Auto-save draft with debounce
    useEffect(() => {
        if (!isOpen) return;

        const timeoutId = setTimeout(() => {
            // Only save draft if there's meaningful content
            if (data.achievementName || data.achievementDescription) {
                saveDraft(data);
                setDraftSavedAt(Date.now());
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [data, isOpen]);

    // Get user's wallet for DID
    const { initWallet } = useWallet();

    useEffect(() => {
        const fetchDid = async () => {
            try {
                const wallet = await initWallet();
                const did = wallet.id.did();
                if (did) setUserDid(did);
            } catch (e) {
                // Keep default preview DID
            }
        };

        if (isOpen) fetchDid();
    }, [isOpen, initWallet]);

    // Filestack for image upload
    const { handleFileSelect, isLoading: isUploading } = useFilestack({
        onUpload: (url: string) => {
            updateField('achievementImage', url);
        },
        fileType: 'image/*',
    });

    const updateField = <K extends keyof CredentialData>(field: K, value: CredentialData[K]) => {
        setData((prev) => ({ ...prev, [field]: value }));
    };

    // Save credential to library
    const handleSaveToLibrary = useCallback((name?: string) => {
        const credName = name || data.achievementName || 'Untitled Credential';
        const now = Date.now();

        if (currentCredentialId) {
            // Update existing
            const updated = savedCredentials.map(c => 
                c.id === currentCredentialId 
                    ? { ...c, name: credName, data, updatedAt: now }
                    : c
            );
            setSavedCredentials(updated);
            saveCredentials(updated);
        } else {
            // Create new
            const newCred: SavedCredential = {
                id: crypto.randomUUID(),
                name: credName,
                data,
                createdAt: now,
                updatedAt: now,
            };
            const updated = [newCred, ...savedCredentials];
            setSavedCredentials(updated);
            saveCredentials(updated);
            setCurrentCredentialId(newCred.id);
        }

        clearDraft();
        setShowSaveAs(false);
        setSaveAsName('');
    }, [data, currentCredentialId, savedCredentials]);

    // Load a saved credential
    const handleLoadCredential = useCallback((cred: SavedCredential) => {
        setData(cred.data);
        setCurrentCredentialId(cred.id);
        setShowLibrary(false);
        clearDraft();
    }, []);

    // Delete a saved credential
    const handleDeleteCredential = useCallback((id: string) => {
        const updated = savedCredentials.filter(c => c.id !== id);
        setSavedCredentials(updated);
        saveCredentials(updated);

        if (currentCredentialId === id) {
            setCurrentCredentialId(null);
        }
    }, [savedCredentials, currentCredentialId]);

    // Start new credential (auto-save current if it has content)
    const handleNewCredential = useCallback(() => {
        // Auto-save current credential if it has meaningful content and isn't already saved
        const hasContent = data.achievementName || data.achievementDescription;
        
        if (hasContent && !currentCredentialId) {
            // Save the current work as a new credential
            const credName = data.achievementName || 'Untitled Credential';
            const now = Date.now();
            const newCred: SavedCredential = {
                id: crypto.randomUUID(),
                name: credName,
                data,
                createdAt: now,
                updatedAt: now,
            };
            const updated = [newCred, ...savedCredentials];
            setSavedCredentials(updated);
            saveCredentials(updated);
        } else if (hasContent && currentCredentialId) {
            // Update the existing credential before starting new
            const updated = savedCredentials.map(c => 
                c.id === currentCredentialId 
                    ? { ...c, data, updatedAt: Date.now() }
                    : c
            );
            setSavedCredentials(updated);
            saveCredentials(updated);
        }

        // Now start fresh
        setData({ ...DEFAULT_DATA });
        setCurrentCredentialId(null);
        setShowLibrary(false);
        clearDraft();
    }, [data, currentCredentialId, savedCredentials]);

    // Build the OBv3 credential object (proper spec-compliant structure)
    const credential = useMemo(() => {
        const credentialId = `urn:uuid:${crypto.randomUUID()}`;
        const achievementId = `urn:uuid:${crypto.randomUUID()}`;
        const issuerDid = userDid || 'did:example:issuer';

        const cred: Record<string, unknown> = {
            '@context': [
                'https://www.w3.org/2018/credentials/v1',
                'https://purl.imsglobal.org/spec/ob/v3p0/context.json',
            ],
            id: credentialId,
            type: ['VerifiableCredential', 'OpenBadgeCredential'],
            name: data.credentialName || data.achievementName || 'Untitled Credential',
            issuer: issuerDid,
            issuanceDate: new Date().toISOString(),
            credentialSubject: {
                id: issuerDid, // Will be replaced with recipient DID when issued
                type: ['AchievementSubject'],
                achievement: {
                    id: achievementId,
                    type: ['Achievement'],
                    name: data.achievementName || 'Untitled',
                    description: data.achievementDescription || '',
                    achievementType: data.achievementType,
                    criteria: data.criteriaText || data.criteriaUrl
                        ? {
                              ...(data.criteriaText && { narrative: data.criteriaText }),
                              ...(data.criteriaUrl && { id: data.criteriaUrl }),
                          }
                        : { narrative: 'Criteria for earning this credential.' },
                    ...(data.achievementImage && {
                        image: {
                            id: data.achievementImage,
                            type: 'Image',
                        },
                    }),
                },
            },
        };

        // Add evidence if provided
        if (data.evidenceUrl || data.evidenceDescription) {
            (cred.credentialSubject as Record<string, unknown>).evidence = [
                {
                    type: ['Evidence'],
                    ...(data.evidenceUrl && { id: data.evidenceUrl }),
                    ...(data.evidenceDescription && { narrative: data.evidenceDescription }),
                },
            ];
        }

        // Add dates if provided
        if (data.validFrom) {
            cred.validFrom = new Date(data.validFrom).toISOString();
        }

        if (data.expiresOn) {
            cred.expirationDate = new Date(data.expiresOn).toISOString();
        }

        return cred;
    }, [data, userDid]);

    const credentialJson = useMemo(() => JSON.stringify(credential, null, 2), [credential]);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(credentialJson);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Verify credential by attempting to issue it
    const handleVerify = useCallback(async () => {
        setVerificationStatus('verifying');
        setVerificationError(null);

        try {
            const wallet = await initWallet();

            // Try to issue the credential - this will validate the JSON-LD structure
            await wallet.invoke.issueCredential(credential as Parameters<typeof wallet.invoke.issueCredential>[0]);

            setVerificationStatus('valid');
        } catch (err) {
            setVerificationStatus('invalid');
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setVerificationError(errorMessage);
            console.error('Credential verification failed:', err);
        }
    }, [credential, initWallet]);

    // Reset verification when data changes
    useEffect(() => {
        setVerificationStatus('idle');
        setVerificationError(null);
    }, [data]);

    const handleSave = () => {
        onSave?.(credential);
        onClose();
    };

    const isValid = data.achievementName.trim().length > 0 && data.achievementDescription.trim().length > 0;

    if (!isOpen) return null;

    // Get current credential name for display
    const currentCredName = savedCredentials.find(c => c.id === currentCredentialId)?.name;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        {showLibrary ? (
                            <button
                                onClick={() => setShowLibrary(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5 text-gray-500" />
                            </button>
                        ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                                <Award className="w-5 h-5 text-white" />
                            </div>
                        )}

                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">
                                {showLibrary ? 'Saved Credentials' : 'Credential Builder'}
                            </h2>

                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                {showLibrary ? (
                                    <span>{savedCredentials.length} saved credential{savedCredentials.length !== 1 ? 's' : ''}</span>
                                ) : (
                                    <>
                                        {currentCredName ? (
                                            <span className="text-cyan-600 font-medium">{currentCredName}</span>
                                        ) : (
                                            <span>New credential</span>
                                        )}

                                        {draftSavedAt && !currentCredentialId && (
                                            <span className="flex items-center gap-1 text-emerald-600">
                                                <Clock className="w-3 h-3" />
                                                Draft saved {formatRelativeTime(draftSavedAt)}
                                            </span>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {!showLibrary && (
                            <button
                                onClick={() => setShowLibrary(true)}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <FolderOpen className="w-4 h-4" />
                                Library
                                {savedCredentials.length > 0 && (
                                    <span className="px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded text-xs font-medium">
                                        {savedCredentials.length}
                                    </span>
                                )}
                            </button>
                        )}

                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Library Panel */}
                {showLibrary ? (
                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="space-y-4">
                            {/* New Credential Button */}
                            <button
                                onClick={handleNewCredential}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-cyan-400 hover:text-cyan-600 transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                                Create New Credential
                            </button>

                            {/* Saved Credentials List */}
                            {savedCredentials.length > 0 ? (
                                <div className="space-y-2">
                                    {savedCredentials.map((cred) => (
                                        <div
                                            key={cred.id}
                                            className={`p-4 border rounded-xl transition-colors ${
                                                currentCredentialId === cred.id
                                                    ? 'border-cyan-300 bg-cyan-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                    {cred.data.achievementImage ? (
                                                        <img
                                                            src={cred.data.achievementImage}
                                                            alt=""
                                                            className="w-8 h-8 rounded object-cover"
                                                        />
                                                    ) : (
                                                        <Award className="w-5 h-5 text-cyan-600" />
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-medium text-gray-800 truncate">{cred.name}</h4>

                                                    <p className="text-xs text-gray-500 truncate">
                                                        {cred.data.achievementType} • Updated {formatRelativeTime(cred.updatedAt)}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => handleLoadCredential(cred)}
                                                        className="px-3 py-1.5 text-sm text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                                                    >
                                                        {currentCredentialId === cred.id ? 'Editing' : 'Load'}
                                                    </button>

                                                    <button
                                                        onClick={() => handleDeleteCredential(cred.id)}
                                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-8 text-center">
                                    <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />

                                    <p className="text-gray-600 mb-1">No saved credentials yet</p>

                                    <p className="text-sm text-gray-500">
                                        Save your credentials to quickly reuse them later
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Tabs */}
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('build')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                            activeTab === 'build'
                                ? 'text-cyan-600 border-b-2 border-cyan-500 bg-cyan-50/50'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            Build
                        </div>
                    </button>

                    <button
                        onClick={() => setActiveTab('visual')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                            activeTab === 'visual'
                                ? 'text-cyan-600 border-b-2 border-cyan-500 bg-cyan-50/50'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <Award className="w-4 h-4" />
                            Preview
                        </div>
                    </button>

                    <button
                        onClick={() => setActiveTab('preview')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                            activeTab === 'preview'
                                ? 'text-cyan-600 border-b-2 border-cyan-500 bg-cyan-50/50'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <Eye className="w-4 h-4" />
                            JSON
                        </div>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {activeTab === 'build' ? (
                        <div className="space-y-6">
                            {/* Basic Section */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                                    <FileText className="w-4 h-4 text-cyan-500" />
                                    Basic Information
                                </div>

                                <InputField
                                    label="What is this credential for?"
                                    value={data.achievementName}
                                    onChange={(v) => updateField('achievementName', v)}
                                    placeholder="e.g., Introduction to Python"
                                    tooltip="The name of the achievement or skill being recognized"
                                />

                                <InputField
                                    label="Describe the achievement"
                                    value={data.achievementDescription}
                                    onChange={(v) => updateField('achievementDescription', v)}
                                    placeholder="e.g., Successfully completed the introductory Python programming course"
                                    type="textarea"
                                    tooltip="What did the recipient do to earn this?"
                                />

                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700">Type of credential</label>

                                    <select
                                        value={data.achievementType}
                                        onChange={(e) =>
                                            updateField('achievementType', e.target.value as AchievementType)
                                        }
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-white"
                                    >
                                        {ACHIEVEMENT_TYPES.map((type) => (
                                            <option key={type.value} value={type.value}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>

                                    <p className="text-xs text-gray-500">
                                        {ACHIEVEMENT_TYPES.find((t) => t.value === data.achievementType)?.description}
                                    </p>
                                </div>

                                {/* Badge Image with Upload */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-1.5">
                                        <label className="text-sm font-medium text-gray-700">Badge Image</label>
                                        <span className="text-xs text-gray-400">(optional)</span>
                                    </div>

                                    <div className="flex gap-2">
                                        <input
                                            type="url"
                                            value={data.achievementImage}
                                            onChange={(e) => updateField('achievementImage', e.target.value)}
                                            placeholder="https://example.com/badge.png"
                                            disabled={isUploading}
                                            className="flex-1 px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 placeholder:text-gray-400 disabled:opacity-50"
                                        />

                                        <button
                                            type="button"
                                            onClick={() => handleFileSelect()}
                                            disabled={isUploading}
                                            className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {isUploading ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Upload className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>

                                    {data.achievementImage && (
                                        <div className="mt-2 flex items-center gap-3">
                                            <img
                                                src={data.achievementImage}
                                                alt="Badge preview"
                                                className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                }}
                                            />

                                            <button
                                                type="button"
                                                onClick={() => updateField('achievementImage', '')}
                                                className="text-xs text-red-500 hover:text-red-600"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    )}

                                    <p className="text-xs text-gray-500">
                                        Upload or paste a URL for a square image (PNG or SVG recommended)
                                    </p>
                                </div>
                            </div>

                            {/* Advanced Toggle */}
                            <button
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                            >
                                {showAdvanced ? (
                                    <ChevronUp className="w-4 h-4" />
                                ) : (
                                    <ChevronDown className="w-4 h-4" />
                                )}
                                {showAdvanced ? 'Hide' : 'Show'} Advanced Options
                            </button>

                            {/* Advanced Section */}
                            {showAdvanced && (
                                <div className="space-y-6 pt-2">
                                    {/* Criteria */}
                                    <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                                            <FileText className="w-4 h-4 text-indigo-500" />
                                            Criteria (How to Earn)
                                        </div>

                                        <InputField
                                            label="Criteria Description"
                                            value={data.criteriaText}
                                            onChange={(v) => updateField('criteriaText', v)}
                                            placeholder="e.g., Complete all 10 modules and pass the final assessment with 80% or higher"
                                            type="textarea"
                                            optional
                                            tooltip="Describe what someone needs to do to earn this credential"
                                        />

                                        <InputField
                                            label="Criteria URL"
                                            value={data.criteriaUrl}
                                            onChange={(v) => updateField('criteriaUrl', v)}
                                            placeholder="https://example.com/course-requirements"
                                            type="url"
                                            optional
                                            tooltip="Link to a page with full criteria details"
                                        />
                                    </div>

                                    {/* Evidence */}
                                    <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                                            <LinkIcon className="w-4 h-4 text-emerald-500" />
                                            Evidence (Proof of Completion)
                                        </div>

                                        <InputField
                                            label="Evidence URL"
                                            value={data.evidenceUrl}
                                            onChange={(v) => updateField('evidenceUrl', v)}
                                            placeholder="https://example.com/portfolio/project"
                                            type="url"
                                            optional
                                            tooltip="Link to work or proof that demonstrates the achievement"
                                        />

                                        <InputField
                                            label="Evidence Description"
                                            value={data.evidenceDescription}
                                            onChange={(v) => updateField('evidenceDescription', v)}
                                            placeholder="e.g., Submitted a working Python application that processes data"
                                            type="textarea"
                                            optional
                                        />
                                    </div>

                                    {/* Dates */}
                                    <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                                            <Calendar className="w-4 h-4 text-amber-500" />
                                            Validity Period
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <InputField
                                                label="Valid From"
                                                value={data.validFrom}
                                                onChange={(v) => updateField('validFrom', v)}
                                                type="date"
                                                optional
                                            />

                                            <InputField
                                                label="Expires On"
                                                value={data.expiresOn}
                                                onChange={(v) => updateField('expiresOn', v)}
                                                type="date"
                                                optional
                                                tooltip="Leave blank for credentials that never expire"
                                            />
                                        </div>
                                    </div>

                                    {/* Credential Name Override */}
                                    <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                                            <Award className="w-4 h-4 text-violet-500" />
                                            Display Name
                                        </div>

                                        <InputField
                                            label="Credential Display Name"
                                            value={data.credentialName}
                                            onChange={(v) => updateField('credentialName', v)}
                                            placeholder={data.achievementName || 'Leave blank to use achievement name'}
                                            optional
                                            tooltip="Override the credential name shown in wallets (defaults to achievement name)"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : activeTab === 'visual' ? (
                        <div className="space-y-6">
                            <p className="text-sm text-gray-600 text-center">
                                Click the credential to see the full preview:
                            </p>

                            {/* Full Credential Preview using BoostEarnedCard */}
                            <div className="flex justify-center py-4">
                                <div className="w-[180px]">
                                    <BoostEarnedCard
                                        credential={{
                                            '@context': [
                                                'https://www.w3.org/2018/credentials/v1',
                                                'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                                            ],
                                            type: ['VerifiableCredential', 'OpenBadgeCredential'],
                                            issuer: {
                                                id: userDid,
                                                type: 'Profile',
                                                name: 'You (Preview)',
                                            },
                                            issuanceDate: new Date().toISOString(),
                                            name: data.credentialName || data.achievementName || 'Untitled Credential',
                                            credentialSubject: {
                                                achievement: {
                                                    type: ['Achievement'],
                                                    name: data.achievementName || 'Untitled',
                                                    description: data.achievementDescription || '',
                                                    achievementType: data.achievementType,
                                                    ...(data.achievementImage && {
                                                        image: {
                                                            id: data.achievementImage,
                                                            type: 'Image',
                                                        },
                                                    }),
                                                },
                                            },
                                        } as any}
                                        categoryType={BoostCategoryOptionsEnum.socialBadge}
                                        boostPageViewMode={BoostPageViewMode.Card}
                                        useWrapper={false}
                                        className="shadow-lg"
                                    />
                                </div>
                            </div>

                            <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
                                <p className="text-xs text-cyan-800 text-center">
                                    <strong>Tip:</strong> Click the credential card above to open the full detail view, 
                                    just like users will see it in their wallet.
                                </p>
                            </div>

                            {!data.achievementImage && (
                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                    <p className="text-xs text-amber-800 text-center">
                                        <strong>Note:</strong> Add a badge image to make your credential more visually distinctive!
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-600">
                                    This is the Open Badges 3.0 JSON that will be created:
                                </p>

                                <button
                                    onClick={handleCopy}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
                                >
                                    {copied ? (
                                        <>
                                            <Check className="w-4 h-4 text-green-500" />
                                            <span className="text-green-600">Copied!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-4 h-4 text-gray-500" />
                                            <span className="text-gray-600">Copy JSON</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            <pre className="p-4 bg-gray-900 text-gray-100 rounded-xl text-xs overflow-x-auto font-mono">
                                {credentialJson}
                            </pre>

                            {/* Verification Section */}
                            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                            <ShieldCheck className="w-4 h-4 text-gray-500" />
                                            Verify Credential Structure
                                        </h4>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Test that this credential can be issued as valid OBv3
                                        </p>
                                    </div>

                                    <button
                                        onClick={handleVerify}
                                        disabled={!isValid || verificationStatus === 'verifying'}
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-900 transition-colors disabled:opacity-50"
                                    >
                                        {verificationStatus === 'verifying' ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Verifying...
                                            </>
                                        ) : (
                                            <>
                                                <ShieldCheck className="w-4 h-4" />
                                                Verify
                                            </>
                                        )}
                                    </button>
                                </div>

                                {verificationStatus === 'valid' && (
                                    <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                        <div>
                                            <p className="text-sm font-medium text-emerald-800">Valid OBv3 Credential</p>
                                            <p className="text-xs text-emerald-600">This credential structure passed JSON-LD expansion and can be issued.</p>
                                        </div>
                                    </div>
                                )}

                                {verificationStatus === 'invalid' && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                        <div className="flex items-center gap-2 mb-1">
                                            <AlertCircle className="w-5 h-5 text-red-600" />
                                            <p className="text-sm font-medium text-red-800">Invalid Credential Structure</p>
                                        </div>
                                        <p className="text-xs text-red-600 font-mono bg-red-100 p-2 rounded mt-2 overflow-x-auto">
                                            {verificationError}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            {copied ? (
                                <Check className="w-4 h-4 text-green-500" />
                            ) : (
                                <Copy className="w-4 h-4" />
                            )}
                            Copy JSON
                        </button>

                        {/* Save to Library */}
                        {showSaveAs ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={saveAsName}
                                    onChange={(e) => setSaveAsName(e.target.value)}
                                    placeholder={data.achievementName || 'Credential name'}
                                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveToLibrary(saveAsName || undefined);
                                        if (e.key === 'Escape') {
                                            setShowSaveAs(false);
                                            setSaveAsName('');
                                        }
                                    }}
                                />

                                <button
                                    onClick={() => handleSaveToLibrary(saveAsName || undefined)}
                                    className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors"
                                >
                                    Save
                                </button>

                                <button
                                    onClick={() => { setShowSaveAs(false); setSaveAsName(''); }}
                                    className="px-3 py-1.5 text-gray-600 hover:bg-gray-200 rounded-lg text-sm transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => {
                                    if (currentCredentialId) {
                                        handleSaveToLibrary();
                                    } else {
                                        setShowSaveAs(true);
                                    }
                                }}
                                disabled={!isValid}
                                className="flex items-center gap-2 px-4 py-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                                {currentCredentialId ? 'Save' : 'Save to Library'}
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>

                        <button
                            onClick={handleSave}
                            disabled={!isValid}
                            className="px-6 py-2 bg-cyan-500 text-white rounded-lg font-medium hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Use This Credential
                        </button>
                    </div>
                </div>
                </>
                )}
            </div>
        </div>
    );
};

// Hook for easy modal management
export const useOBv3CredentialBuilder = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [credential, setCredential] = useState<Record<string, unknown> | null>(null);

    const open = () => setIsOpen(true);
    const close = () => setIsOpen(false);

    const handleSave = (cred: Record<string, unknown>) => {
        setCredential(cred);
    };

    return {
        isOpen,
        open,
        close,
        credential,
        setCredential,
        ModalComponent: (props: Omit<OBv3CredentialBuilderProps, 'isOpen' | 'onClose' | 'onSave'>) => (
            <OBv3CredentialBuilder
                isOpen={isOpen}
                onClose={close}
                onSave={handleSave}
                {...props}
            />
        ),
    };
};

export default OBv3CredentialBuilder;
