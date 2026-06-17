import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, Mail, Loader2 } from 'lucide-react';
import { useGetSearchProfiles, useGetConnections } from 'learn-card-base';
import useDebounce from '../../../hooks/useDebounce';
import { RecipientMode, Recipient, LinkOptions, isEmail } from './recipientTypes';

const INPUT_CLASS =
    'w-full py-3 px-4 border border-grayscale-300 rounded-xl text-base text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white transition-all';
const LABEL_CLASS = 'block text-xs font-medium text-grayscale-700 mb-1.5';

const Avatar: React.FC<{
    image?: string;
    name: string;
    sizeClass: string;
    fallbackClass: string;
}> = ({ image, name, sizeClass, fallbackClass }) => {
    const [errored, setErrored] = useState(false);
    const initial = (name || '?').charAt(0).toUpperCase();

    if (image && !errored) {
        return (
            <img
                src={image}
                alt={name}
                onError={() => setErrored(true)}
                className={`${sizeClass} rounded-full object-cover bg-grayscale-100`}
            />
        );
    }

    return (
        <div
            className={`${sizeClass} rounded-full flex items-center justify-center font-bold ${fallbackClass}`}
        >
            {initial}
        </div>
    );
};

interface RecipientPickerProps {
    mode: RecipientMode;
    onModeChange: (mode: RecipientMode) => void;
    recipients: Recipient[];
    onRecipientsChange: (recipients: Recipient[]) => void;
    linkOptions: LinkOptions;
    onLinkOptionsChange: (options: LinkOptions) => void;
    hideHeader?: boolean;
    inlineResults?: boolean;
}

export const RecipientPicker: React.FC<RecipientPickerProps> = ({
    mode,
    onModeChange,
    recipients,
    onRecipientsChange,
    linkOptions,
    onLinkOptionsChange,
    hideHeader = false,
    inlineResults = false,
}) => {
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    const updateDebounced = useDebounce(() => setDebouncedQuery(query), 300);
    useEffect(() => {
        updateDebounced();
        return () => updateDebounced.cancel?.();
    }, [query, updateDebounced]);

    const { data: searchResults, isLoading: isSearching } = useGetSearchProfiles(debouncedQuery);
    const { data: connectionsData, isLoading: isConnectionsLoading } = useGetConnections();

    const handleAddRecipient = (recipient: Recipient) => {
        if (
            !recipients.some(
                r =>
                    (r.kind === 'profile' &&
                        recipient.kind === 'profile' &&
                        r.profileId === recipient.profileId) ||
                    (r.kind === 'email' &&
                        recipient.kind === 'email' &&
                        r.email === recipient.email)
            )
        ) {
            onRecipientsChange([...recipients, recipient]);
        }
        setQuery('');
    };

    const handleRemoveRecipient = (index: number) => {
        const newRecipients = [...recipients];
        newRecipients.splice(index, 1);
        onRecipientsChange(newRecipients);
    };

    const showDropdown =
        isFocused && (query.length > 0 || (connectionsData && connectionsData.length > 0));

    // Inline mode renders results in the modal flow (single scroll, no floating
    // tooltip), so it isn't gated on focus the way the absolute dropdown is.
    const showResults = inlineResults
        ? query.length > 0 || (connectionsData?.length ?? 0) > 0
        : showDropdown;

    const dropdownResults = useMemo(() => {
        if (debouncedQuery.length > 0) {
            return searchResults || [];
        }
        return connectionsData ? connectionsData.slice(0, 5) : [];
    }, [debouncedQuery, searchResults, connectionsData]);

    const isValidEmail = isEmail(query);

    const resultsContent = isSearching ? (
        <div className="flex items-center justify-center p-4 text-grayscale-500">
            <Loader2 className="w-5 h-5 animate-spin" />
        </div>
    ) : (
        <>
            {dropdownResults.map(profile => (
                <button
                    key={profile.profileId}
                    type="button"
                    onClick={() =>
                        handleAddRecipient({
                            kind: 'profile',
                            profileId: profile.profileId,
                            displayName: profile.displayName || profile.profileId,
                            image: profile.image,
                            did: profile.did,
                        })
                    }
                    className="w-full flex items-center gap-3 p-3 hover:bg-grayscale-10 transition-colors text-left border-b border-grayscale-100 last:border-0"
                >
                    <Avatar
                        image={profile.image}
                        name={profile.displayName || profile.profileId}
                        sizeClass="w-8 h-8"
                        fallbackClass="bg-grayscale-200 text-grayscale-600"
                    />
                    <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-grayscale-900 truncate">
                            {profile.displayName || profile.profileId}
                        </span>
                        {profile.profileId && profile.profileId !== profile.displayName && (
                            <span className="text-xs text-grayscale-500 truncate">
                                @{profile.profileId}
                            </span>
                        )}
                    </div>
                </button>
            ))}
            {isValidEmail &&
                !dropdownResults.some(p => p.profileId === query || p.displayName === query) && (
                    <button
                        type="button"
                        onClick={() => handleAddRecipient({ kind: 'email', email: query })}
                        className="w-full flex items-center gap-3 p-3 hover:bg-grayscale-10 transition-colors text-left border-b border-grayscale-100 last:border-0"
                    >
                        <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <Mail className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium text-grayscale-900 truncate">
                                Send to {query}
                            </span>
                            <span className="text-xs text-grayscale-500 truncate">
                                They'll get an email to claim it
                            </span>
                        </div>
                    </button>
                )}
            {dropdownResults.length === 0 && !isValidEmail && debouncedQuery.length > 0 && (
                <div className="p-4 text-center text-sm text-grayscale-500">
                    No results found. Enter a valid email to send an invite.
                </div>
            )}
        </>
    );

    return (
        <div className="space-y-4">
            {!hideHeader && (
                <>
                    <h3 className="text-base font-semibold text-grayscale-900">Who is this for?</h3>
                    <p className="text-sm text-grayscale-600 leading-relaxed -mt-2">
                        This shapes the preview and how it’s delivered.
                    </p>
                </>
            )}
            <div className="flex gap-2 bg-grayscale-100 p-1 rounded-full">
                <button
                    type="button"
                    onClick={() => onModeChange('self')}
                    className={`flex-1 py-2 px-3 rounded-full font-medium text-sm transition-colors ${
                        mode === 'self'
                            ? 'bg-grayscale-900 text-white shadow-sm'
                            : 'text-grayscale-700 hover:bg-grayscale-200'
                    }`}
                >
                    Just me
                </button>
                <button
                    type="button"
                    onClick={() => onModeChange('people')}
                    className={`flex-1 py-2 px-3 rounded-full font-medium text-sm transition-colors ${
                        mode === 'people'
                            ? 'bg-grayscale-900 text-white shadow-sm'
                            : 'text-grayscale-700 hover:bg-grayscale-200'
                    }`}
                >
                    Specific people
                </button>
                <button
                    type="button"
                    onClick={() => onModeChange('link')}
                    className={`flex-1 py-2 px-3 rounded-full font-medium text-sm transition-colors ${
                        mode === 'link'
                            ? 'bg-grayscale-900 text-white shadow-sm'
                            : 'text-grayscale-700 hover:bg-grayscale-200'
                    }`}
                >
                    Anyone with a link
                </button>
            </div>

            {mode === 'people' && (
                <div className="space-y-3 animate-fade-in-up">
                    {recipients.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {recipients.map((recipient, index) => (
                                <span
                                    key={index}
                                    className="flex items-center gap-1.5 py-1.5 pl-2 pr-3 rounded-full bg-grayscale-900 text-white text-sm"
                                >
                                    {recipient.kind === 'profile' ? (
                                        <Avatar
                                            image={recipient.image}
                                            name={recipient.displayName}
                                            sizeClass="w-5 h-5"
                                            fallbackClass="bg-grayscale-700 text-white text-[10px]"
                                        />
                                    ) : (
                                        <Mail className="w-4 h-4 text-grayscale-400" />
                                    )}
                                    <span className="truncate max-w-[180px]">
                                        {recipient.kind === 'profile'
                                            ? recipient.displayName
                                            : recipient.email}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveRecipient(index)}
                                        className="text-white/70 hover:text-white transition-colors shrink-0 ml-1"
                                        aria-label="Remove recipient"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-grayscale-400" />
                        <input
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                            placeholder="Search by name, @username, or email"
                            spellCheck={false}
                            autoCapitalize="none"
                            autoCorrect="off"
                            className={`w-full py-3 pl-10 pr-10 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white`}
                        />
                        {query && (
                            <button
                                type="button"
                                onClick={() => setQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-grayscale-400 hover:text-grayscale-700 transition-colors"
                                aria-label="Clear search"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}

                        {!inlineResults && showResults && (
                            <div className="absolute z-20 w-full mt-1 bg-white border border-grayscale-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                {resultsContent}
                            </div>
                        )}
                    </div>

                    {inlineResults && showResults && (
                        <div className="w-full bg-white border border-grayscale-200 rounded-xl overflow-hidden">
                            {resultsContent}
                        </div>
                    )}
                </div>
            )}

            {mode === 'link' && (
                <div className="space-y-4 animate-fade-in-up">
                    <p className="text-sm text-grayscale-600">
                        We'll create a shareable link when you issue.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={LABEL_CLASS}>Expires (optional)</label>
                            <input
                                type="date"
                                value={linkOptions.expiresAt || ''}
                                onChange={e =>
                                    onLinkOptionsChange({
                                        ...linkOptions,
                                        expiresAt: e.target.value,
                                    })
                                }
                                className={INPUT_CLASS}
                            />
                        </div>
                        <div>
                            <label className={LABEL_CLASS}>Max claims (optional)</label>
                            <input
                                type="number"
                                min="1"
                                value={linkOptions.maxClaims || ''}
                                onChange={e =>
                                    onLinkOptionsChange({
                                        ...linkOptions,
                                        maxClaims: e.target.value
                                            ? parseInt(e.target.value, 10)
                                            : undefined,
                                    })
                                }
                                placeholder="Unlimited"
                                className={INPUT_CLASS}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
