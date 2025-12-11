import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';

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
    const [activeTab, setActiveTab] = useState<'build' | 'preview'>('build');
    const [copied, setCopied] = useState(false);

    const updateField = <K extends keyof CredentialData>(field: K, value: CredentialData[K]) => {
        setData((prev) => ({ ...prev, [field]: value }));
    };

    // Build the OBv3 credential object
    const credential = useMemo(() => {
        const cred: Record<string, unknown> = {
            '@context': [
                'https://www.w3.org/2018/credentials/v1',
                'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            ],
            type: ['VerifiableCredential', 'OpenBadgeCredential'],
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
                    ...(data.criteriaText || data.criteriaUrl
                        ? {
                              criteria: {
                                  ...(data.criteriaText && { narrative: data.criteriaText }),
                                  ...(data.criteriaUrl && { id: data.criteriaUrl }),
                              },
                          }
                        : {}),
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
    }, [data]);

    const credentialJson = useMemo(() => JSON.stringify(credential, null, 2), [credential]);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(credentialJson);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSave = () => {
        onSave?.(credential);
        onClose();
    };

    const isValid = data.achievementName.trim().length > 0 && data.achievementDescription.trim().length > 0;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                            <Award className="w-5 h-5 text-white" />
                        </div>

                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">Credential Builder</h2>
                            <p className="text-xs text-gray-500">Create an Open Badges 3.0 credential</p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

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
                        onClick={() => setActiveTab('preview')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                            activeTab === 'preview'
                                ? 'text-cyan-600 border-b-2 border-cyan-500 bg-cyan-50/50'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <Eye className="w-4 h-4" />
                            Preview JSON
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

                                <InputField
                                    label="Badge Image URL"
                                    value={data.achievementImage}
                                    onChange={(v) => updateField('achievementImage', v)}
                                    placeholder="https://example.com/badge.png"
                                    type="url"
                                    optional
                                    tooltip="A square image representing this credential (PNG or SVG recommended)"
                                />
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

                            <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
                                <p className="text-xs text-cyan-800">
                                    <strong>Note:</strong> The <code className="bg-cyan-100 px-1 rounded">issuer</code> and{' '}
                                    <code className="bg-cyan-100 px-1 rounded">credentialSubject.id</code> fields will be 
                                    automatically added when you issue this credential.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
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
