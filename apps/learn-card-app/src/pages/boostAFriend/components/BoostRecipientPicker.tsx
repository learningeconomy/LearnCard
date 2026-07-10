import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, Mail, Loader2, Calendar, Check } from 'lucide-react';
import { useGetSearchProfiles, useGetConnections } from 'learn-card-base';
import useDebounce from '../../../hooks/useDebounce';
import {
    RecipientMode,
    Recipient,
    LinkOptions,
    isEmail,
} from '../../issue/components/recipientTypes';

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

interface BoostRecipientPickerProps {
    mode: RecipientMode;
    onModeChange: (mode: RecipientMode) => void;
    recipients: Recipient[];
    onRecipientsChange: (recipients: Recipient[]) => void;
    linkOptions: LinkOptions;
    onLinkOptionsChange: (options: LinkOptions) => void;
}

export const BoostRecipientPicker: React.FC<BoostRecipientPickerProps> = ({
    mode,
    onModeChange,
    recipients,
    onRecipientsChange,
    linkOptions,
    onLinkOptionsChange,
}) => {
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');

    const updateDebounced = useDebounce(() => setDebouncedQuery(query), 300);
    useEffect(() => {
        updateDebounced();
        return () => updateDebounced.cancel?.();
    }, [query, updateDebounced]);

    const { data: searchResults, isLoading: isSearching } = useGetSearchProfiles(debouncedQuery);
    const { data: connectionsData, isLoading: isConnectionsLoading } = useGetConnections();

    const handleToggleRecipient = (recipient: Recipient) => {
        const isSelected = recipients.some(
            r =>
                (r.kind === 'profile' &&
                    recipient.kind === 'profile' &&
                    r.profileId === recipient.profileId) ||
                (r.kind === 'email' && recipient.kind === 'email' && r.email === recipient.email)
        );

        if (isSelected) {
            onRecipientsChange(
                recipients.filter(
                    r =>
                        !(
                            (r.kind === 'profile' &&
                                recipient.kind === 'profile' &&
                                r.profileId === recipient.profileId) ||
                            (r.kind === 'email' &&
                                recipient.kind === 'email' &&
                                r.email === recipient.email)
                        )
                )
            );
        } else {
            onRecipientsChange([...recipients, recipient]);
        }
    };

    const handleRemoveRecipient = (index: number) => {
        const newRecipients = [...recipients];
        newRecipients.splice(index, 1);
        onRecipientsChange(newRecipients);
    };

    const isValidEmail = isEmail(query);

    const displayList = useMemo(() => {
        if (debouncedQuery.length > 0) {
            return searchResults || [];
        }
        return connectionsData || [];
    }, [debouncedQuery, searchResults, connectionsData]);

    return (
        <div className="flex flex-col h-full">
            <div className="flex gap-1 sm:gap-2 bg-grayscale-100 p-1 rounded-full mb-6 shrink-0">
                <button
                    type="button"
                    onClick={() => onModeChange('people')}
                    className={`flex-1 py-2.5 px-3 rounded-full font-medium text-sm whitespace-nowrap transition-colors ${
                        mode === 'people'
                            ? 'bg-grayscale-900 text-white shadow-sm'
                            : 'text-grayscale-700 hover:bg-grayscale-200'
                    }`}
                >
                    Friend
                </button>
                <button
                    type="button"
                    onClick={() => onModeChange('self')}
                    className={`flex-1 py-2.5 px-3 rounded-full font-medium text-sm whitespace-nowrap transition-colors ${
                        mode === 'self'
                            ? 'bg-grayscale-900 text-white shadow-sm'
                            : 'text-grayscale-700 hover:bg-grayscale-200'
                    }`}
                >
                    Just me
                </button>
                <button
                    type="button"
                    onClick={() => onModeChange('link')}
                    className={`flex-1 py-2.5 px-3 rounded-full font-medium text-sm whitespace-nowrap transition-colors ${
                        mode === 'link'
                            ? 'bg-grayscale-900 text-white shadow-sm'
                            : 'text-grayscale-700 hover:bg-grayscale-200'
                    }`}
                >
                    Share link
                </button>
            </div>

            {mode === 'people' && (
                <div className="flex flex-col flex-1 min-h-0 animate-fade-in-up">
                    {recipients.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4 shrink-0">
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

                    <div className="relative mb-4 shrink-0">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-grayscale-400" />
                        <input
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Search people..."
                            spellCheck={false}
                            autoCapitalize="none"
                            autoCorrect="off"
                            className="w-full py-3.5 pl-12 pr-10 border border-grayscale-300 rounded-xl text-base text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white transition-all"
                        />
                        {query && (
                            <button
                                type="button"
                                onClick={() => setQuery('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-grayscale-400 hover:text-grayscale-700 transition-colors"
                                aria-label="Clear search"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto scrollbar-hide -mx-2 px-2">
                        {isSearching || isConnectionsLoading ? (
                            <div className="flex items-center justify-center p-8 text-grayscale-500">
                                <Loader2 className="w-6 h-6 animate-spin" />
                            </div>
                        ) : (
                            <div className="space-y-1 pb-4">
                                {displayList.map(profile => {
                                    const isSelected = recipients.some(
                                        r =>
                                            r.kind === 'profile' &&
                                            r.profileId === profile.profileId
                                    );
                                    return (
                                        <button
                                            key={profile.profileId}
                                            type="button"
                                            onClick={() =>
                                                handleToggleRecipient({
                                                    kind: 'profile',
                                                    profileId: profile.profileId,
                                                    displayName:
                                                        profile.displayName || profile.profileId,
                                                    image: profile.image,
                                                    did: profile.did,
                                                })
                                            }
                                            className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left ${
                                                isSelected
                                                    ? 'bg-emerald-50 ring-1 ring-emerald-200'
                                                    : 'hover:bg-grayscale-10'
                                            }`}
                                        >
                                            <Avatar
                                                image={profile.image}
                                                name={profile.displayName || profile.profileId}
                                                sizeClass="w-10 h-10"
                                                fallbackClass="bg-grayscale-200 text-grayscale-600"
                                            />
                                            <div className="flex flex-col min-w-0 flex-1">
                                                <span className="text-base font-medium text-grayscale-900 truncate">
                                                    {profile.displayName || profile.profileId}
                                                </span>
                                                {profile.profileId &&
                                                    profile.profileId !== profile.displayName && (
                                                        <span className="text-sm text-grayscale-500 truncate">
                                                            @{profile.profileId}
                                                        </span>
                                                    )}
                                            </div>
                                            {isSelected && (
                                                <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                                                    <Check className="w-3.5 h-3.5 text-white" />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}

                                {isValidEmail &&
                                    !displayList.some(
                                        p => p.profileId === query || p.displayName === query
                                    ) && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                handleToggleRecipient({
                                                    kind: 'email',
                                                    email: query,
                                                });
                                                setQuery('');
                                            }}
                                            className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-grayscale-10 transition-all text-left"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                                                <Mail className="w-5 h-5" />
                                            </div>
                                            <div className="flex flex-col min-w-0 flex-1">
                                                <span className="text-base font-medium text-grayscale-900 truncate">
                                                    Send to {query}
                                                </span>
                                                <span className="text-sm text-grayscale-500 truncate">
                                                    They'll get an email to claim it
                                                </span>
                                            </div>
                                        </button>
                                    )}

                                {displayList.length === 0 && !isValidEmail && (
                                    <div className="p-8 text-center text-sm text-grayscale-500">
                                        {debouncedQuery.length > 0
                                            ? 'No results found. Enter a valid email to send an invite.'
                                            : 'Search for someone by name, @username, or email.'}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {mode === 'self' && (
                <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in-up pb-10">
                    <div className="w-16 h-16 bg-grayscale-100 rounded-full flex items-center justify-center mb-4">
                        <Check className="w-8 h-8 text-grayscale-900" />
                    </div>
                    <h3 className="text-lg font-semibold text-grayscale-900 mb-2">
                        Add to Passport
                    </h3>
                    <p className="text-sm text-grayscale-600 max-w-[240px]">
                        This badge will be added directly to your own Passport.
                    </p>
                </div>
            )}

            {mode === 'link' && (
                <div className="flex-1 animate-fade-in-up">
                    <p className="text-sm text-grayscale-600 mb-6">
                        Anyone with the link can claim this badge.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className={LABEL_CLASS}>Expires (optional)</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={linkOptions.expiresAt || ''}
                                    onChange={e =>
                                        onLinkOptionsChange({
                                            ...linkOptions,
                                            expiresAt: e.target.value,
                                        })
                                    }
                                    className={`${INPUT_CLASS} appearance-none pr-10 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer`}
                                />
                                <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-grayscale-400 pointer-events-none" />
                            </div>
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
