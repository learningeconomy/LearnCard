import React, { useState } from 'react';
import { resumeBuilderStore, RESUME_SECTIONS, ResumeSectionKey, PersonalDetails } from '../../../stores/resumeBuilderStore';

const ChevronIcon: React.FC<{ open: boolean }> = ({ open }) => (
    <svg
        className={`w-4 h-4 text-grayscale-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        fill="none" viewBox="0 0 24 24" stroke="currentColor"
    >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
);

const PersonalInfoSection: React.FC = () => {
    const [open, setOpen] = useState(true);
    const personalDetails = resumeBuilderStore.useTracked.personalDetails();
    const setPersonalDetails = resumeBuilderStore.set.setPersonalDetails;

    const fields: { key: keyof PersonalDetails; label: string; placeholder: string; multiline?: boolean }[] = [
        { key: 'name', label: 'Full Name', placeholder: 'Jane Doe' },
        { key: 'email', label: 'Email', placeholder: 'jane@example.com' },
        { key: 'phone', label: 'Phone', placeholder: '+1 (555) 000-0000' },
        { key: 'location', label: 'Location', placeholder: 'San Francisco, CA' },
        { key: 'summary', label: 'Summary', placeholder: 'Brief professional summary...', multiline: true },
    ];

    return (
        <div className="border-b border-grayscale-100">
            <button
                className="w-full flex items-center justify-between px-4 py-3 text-left"
                onClick={() => setOpen(o => !o)}
            >
                <span className="text-sm font-semibold text-grayscale-800">Personal Info</span>
                <ChevronIcon open={open} />
            </button>
            {open && (
                <div className="px-4 pb-4 flex flex-col gap-3">
                    {fields.map(({ key, label, placeholder, multiline }) => (
                        <div key={key} className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-grayscale-500">{label}</label>
                            {multiline ? (
                                <textarea
                                    rows={3}
                                    className="w-full text-sm bg-grayscale-50 border border-grayscale-200 rounded-lg px-3 py-2 text-grayscale-800 placeholder-grayscale-300 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                    placeholder={placeholder}
                                    value={personalDetails[key]}
                                    onChange={e => setPersonalDetails({ [key]: e.target.value })}
                                />
                            ) : (
                                <input
                                    type="text"
                                    className="w-full text-sm bg-grayscale-50 border border-grayscale-200 rounded-lg px-3 py-2 text-grayscale-800 placeholder-grayscale-300 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                    placeholder={placeholder}
                                    value={personalDetails[key]}
                                    onChange={e => setPersonalDetails({ [key]: e.target.value })}
                                />
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const CredentialSection: React.FC<{ sectionKey: ResumeSectionKey; label: string }> = ({ sectionKey, label }) => {
    const [open, setOpen] = useState(false);
    const selectedCredentialUris = resumeBuilderStore.useTracked.selectedCredentialUris();
    const toggleCredential = resumeBuilderStore.set.toggleCredential;

    const selected = selectedCredentialUris[sectionKey] ?? [];
    const count = selected.length;

    return (
        <div className="border-b border-grayscale-100">
            <button
                className="w-full flex items-center justify-between px-4 py-3 text-left"
                onClick={() => setOpen(o => !o)}
            >
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-grayscale-800">{label}</span>
                    {count > 0 && (
                        <span className="text-xs font-semibold bg-indigo-100 text-indigo-600 rounded-full px-2 py-0.5">
                            {count}
                        </span>
                    )}
                </div>
                <ChevronIcon open={open} />
            </button>
            {open && (
                <div className="px-4 pb-4">
                    <p className="text-xs text-grayscale-400 mb-3">
                        Credential selection coming soon — credentials from your wallet will appear here.
                    </p>
                    {count > 0 && (
                        <div className="flex flex-col gap-2">
                            {selected.map(uri => (
                                <div key={uri} className="flex items-center justify-between bg-indigo-50 rounded-lg px-3 py-2">
                                    <span className="text-xs text-indigo-700 font-mono truncate max-w-[220px]">{uri}</span>
                                    <button
                                        onClick={() => toggleCredential(sectionKey, uri)}
                                        className="ml-2 text-grayscale-400 hover:text-rose-500 shrink-0"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const ResumeConfigPanel: React.FC = () => {
    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto">
                <PersonalInfoSection />
                {RESUME_SECTIONS.map(section => (
                    <CredentialSection
                        key={section.key}
                        sectionKey={section.key as ResumeSectionKey}
                        label={section.label}
                    />
                ))}
            </div>
        </div>
    );
};

export default ResumeConfigPanel;
