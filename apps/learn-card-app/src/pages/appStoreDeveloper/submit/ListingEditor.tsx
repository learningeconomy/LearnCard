import React, { useState } from 'react';
import { IonIcon } from '@ionic/react';
import { addOutline, chevronDownOutline, closeOutline } from 'ionicons/icons';

import { ImageUpload, ScreenshotUpload } from '../components/ImageUpload';
import { AGE_RATING_OPTIONS, CATEGORY_OPTIONS } from '../types';
import type { AgeRating } from '../types';
import { DEFAULT_APP_ICON_URL } from './constants';
import {
    DEFAULT_HERO_COLOR,
    MAX_HIGHLIGHTS,
    MAX_SCREENSHOTS,
    isValidContactEmail,
} from './listingForm';
import type { ListingData, ListingDetails } from './listingForm';

const INPUT_CLASS =
    'w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white';
const LABEL_CLASS = 'block text-xs font-medium text-grayscale-700 mb-1.5';
const ADD_BUTTON_CLASS =
    'mt-3 flex items-center gap-1 text-sm font-medium text-grayscale-700 hover:text-grayscale-900 transition-colors';

const Counter: React.FC<{ value: string; max: number }> = ({ value, max }) => (
    <div className="mt-1 text-right text-xs text-grayscale-400">
        {value.length}/{max}
    </div>
);

interface ListingIdentityFieldsProps {
    data: Pick<ListingData, 'name' | 'tagline' | 'iconUrl'>;
    onChange: (updates: Partial<ListingData>) => void;
    iconRef?: React.RefObject<HTMLDivElement>;
    nameRef?: React.RefObject<HTMLInputElement>;
    taglineRef?: React.RefObject<HTMLInputElement>;
}

export const ListingIdentityFields: React.FC<ListingIdentityFieldsProps> = ({
    data,
    onChange,
    iconRef,
    nameRef,
    taglineRef,
}) => (
    <div className="space-y-5">
        <div ref={iconRef} tabIndex={-1} className="outline-none">
            <label className={LABEL_CLASS}>App icon</label>
            <ImageUpload
                value={data.iconUrl === DEFAULT_APP_ICON_URL ? '' : data.iconUrl}
                onChange={url => onChange({ iconUrl: url })}
                onRemove={() => onChange({ iconUrl: DEFAULT_APP_ICON_URL })}
                placeholder="Upload icon"
                previewClassName="w-20 h-20 rounded-2xl"
            />
        </div>
        <div>
            <label className={LABEL_CLASS}>App name</label>
            <input
                ref={nameRef}
                type="text"
                value={data.name}
                onChange={e => onChange({ name: e.target.value })}
                placeholder="My Awesome App"
                maxLength={50}
                className={INPUT_CLASS}
            />
        </div>
        <div>
            <label className={LABEL_CLASS}>Tagline</label>
            <input
                ref={taglineRef}
                type="text"
                value={data.tagline}
                onChange={e => onChange({ tagline: e.target.value })}
                placeholder="One sentence about your app"
                maxLength={100}
                className={INPUT_CLASS}
            />
        </div>
    </div>
);

interface ListingDetailsFieldsProps {
    details: ListingDetails;
    onChange: (updates: Partial<ListingDetails>) => void;
    descriptionRef?: React.RefObject<HTMLTextAreaElement>;
}

export const ListingDetailsFields: React.FC<ListingDetailsFieldsProps> = ({
    details,
    onChange,
    descriptionRef,
}) => {
    const setScreenshot = (index: number, url: string) =>
        onChange({ screenshots: details.screenshots.map((s, i) => (i === index ? url : s)) });

    return (
        <div className="space-y-5">
            <div>
                <label className={LABEL_CLASS}>Description</label>
                <textarea
                    ref={descriptionRef}
                    value={details.description}
                    onChange={e => onChange({ description: e.target.value })}
                    placeholder="What does your app do, and who is it for?"
                    maxLength={2000}
                    rows={5}
                    className={`${INPUT_CLASS} resize-y leading-relaxed`}
                />
                <Counter value={details.description} max={2000} />
            </div>

            <div>
                <label className={LABEL_CLASS}>Screenshots</label>
                <p className="text-xs text-grayscale-500 mb-3">
                    Optional, but listings with screenshots get more installs.
                </p>
                {details.screenshots.length > 0 && (
                    <div className="grid grid-cols-3 gap-3">
                        {details.screenshots.map((url, index) => (
                            <ScreenshotUpload
                                key={index}
                                index={index}
                                value={url}
                                onChange={next => setScreenshot(index, next)}
                                onRemove={() =>
                                    onChange({
                                        screenshots: details.screenshots.filter(
                                            (_, i) => i !== index
                                        ),
                                    })
                                }
                            />
                        ))}
                    </div>
                )}
                {details.screenshots.length < MAX_SCREENSHOTS && (
                    <button
                        type="button"
                        onClick={() => onChange({ screenshots: [...details.screenshots, ''] })}
                        className={ADD_BUTTON_CLASS}
                    >
                        <IonIcon icon={addOutline} />
                        Add screenshot
                    </button>
                )}
            </div>
        </div>
    );
};

interface StandOutSectionProps {
    details: ListingDetails;
    onChange: (updates: Partial<ListingDetails>) => void;
    contactEmailRef?: React.RefObject<HTMLInputElement>;
    defaultOpen?: boolean;
}

export const StandOutSection: React.FC<StandOutSectionProps> = ({
    details,
    onChange,
    contactEmailRef,
    defaultOpen = false,
}) => {
    const [open, setOpen] = useState(defaultOpen);
    const emailInvalid =
        details.contactEmail.trim() !== '' && !isValidContactEmail(details.contactEmail);

    return (
        <div className="bg-white rounded-[20px] border border-grayscale-200 overflow-hidden">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                aria-expanded={open}
                className="w-full p-6 flex items-center justify-between text-left hover:bg-grayscale-10 transition-colors"
            >
                <div>
                    <h3 className="text-base font-semibold text-grayscale-900">
                        Make it stand out
                    </h3>
                    <p className="text-sm text-grayscale-500 mt-0.5">
                        Optional details that help people find and trust your app.
                    </p>
                </div>
                <IonIcon
                    icon={chevronDownOutline}
                    className={`text-grayscale-500 text-xl shrink-0 ml-4 transition-transform ${
                        open ? 'rotate-180' : ''
                    }`}
                />
            </button>

            {(open || emailInvalid) && (
                <div className="px-6 pb-6 pt-5 border-t border-grayscale-100 space-y-5">
                    <div>
                        <label className={LABEL_CLASS}>Highlights</label>
                        <div className="space-y-2">
                            {details.highlights.map((highlight, index) => (
                                <div key={index} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={highlight}
                                        onChange={e =>
                                            onChange({
                                                highlights: details.highlights.map((h, i) =>
                                                    i === index ? e.target.value : h
                                                ),
                                            })
                                        }
                                        placeholder="e.g. Earn badges as you learn"
                                        maxLength={200}
                                        className={INPUT_CLASS}
                                    />
                                    <button
                                        type="button"
                                        aria-label="Remove highlight"
                                        onClick={() =>
                                            onChange({
                                                highlights: details.highlights.filter(
                                                    (_, i) => i !== index
                                                ),
                                            })
                                        }
                                        className="px-3 text-grayscale-400 hover:text-red-500 transition-colors"
                                    >
                                        <IonIcon icon={closeOutline} className="text-xl" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        {details.highlights.length < MAX_HIGHLIGHTS && (
                            <button
                                type="button"
                                onClick={() =>
                                    onChange({ highlights: [...details.highlights, ''] })
                                }
                                className={ADD_BUTTON_CLASS}
                            >
                                <IonIcon icon={addOutline} />
                                Add highlight
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className={LABEL_CLASS}>Category</label>
                            <select
                                value={details.category}
                                onChange={e => onChange({ category: e.target.value })}
                                className={INPUT_CLASS}
                            >
                                <option value="">Choose a category</option>
                                {CATEGORY_OPTIONS.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={LABEL_CLASS}>Age rating</label>
                            <select
                                value={details.ageRating}
                                onChange={e =>
                                    onChange({ ageRating: e.target.value as AgeRating | '' })
                                }
                                className={INPUT_CLASS}
                            >
                                <option value="">Choose an age rating</option>
                                {AGE_RATING_OPTIONS.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className={LABEL_CLASS}>Privacy policy link</label>
                            <input
                                type="url"
                                value={details.privacyPolicyUrl}
                                onChange={e => onChange({ privacyPolicyUrl: e.target.value })}
                                placeholder="https://"
                                className={INPUT_CLASS}
                            />
                        </div>
                        <div>
                            <label className={LABEL_CLASS}>Terms of service link</label>
                            <input
                                type="url"
                                value={details.termsUrl}
                                onChange={e => onChange({ termsUrl: e.target.value })}
                                placeholder="https://"
                                className={INPUT_CLASS}
                            />
                        </div>
                    </div>

                    <div>
                        <label className={LABEL_CLASS}>Contact email</label>
                        <input
                            ref={contactEmailRef}
                            type="email"
                            value={details.contactEmail}
                            onChange={e => onChange({ contactEmail: e.target.value })}
                            placeholder="support@myapp.com"
                            className={`${INPUT_CLASS} ${emailInvalid ? 'border-red-300' : ''}`}
                        />
                        {emailInvalid && (
                            <p className="mt-1.5 text-xs text-red-600">
                                Enter an email like support@myapp.com.
                            </p>
                        )}
                    </div>

                    <div>
                        <label className={LABEL_CLASS}>Promo video link</label>
                        <input
                            type="url"
                            value={details.promoVideoUrl}
                            onChange={e => onChange({ promoVideoUrl: e.target.value })}
                            placeholder="https://youtube.com/..."
                            className={INPUT_CLASS}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className={LABEL_CLASS}>App Store ID (iPhone)</label>
                            <input
                                type="text"
                                value={details.iosAppStoreId}
                                onChange={e => onChange({ iosAppStoreId: e.target.value })}
                                placeholder="e.g. 123456789"
                                className={INPUT_CLASS}
                            />
                        </div>
                        <div>
                            <label className={LABEL_CLASS}>Google Play ID (Android)</label>
                            <input
                                type="text"
                                value={details.androidAppStoreId}
                                onChange={e => onChange({ androidAppStoreId: e.target.value })}
                                placeholder="e.g. com.myapp.android"
                                className={INPUT_CLASS}
                            />
                        </div>
                    </div>

                    <div>
                        <label className={LABEL_CLASS}>Header color</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                aria-label="Pick header color"
                                value={details.heroColor || DEFAULT_HERO_COLOR}
                                onChange={e => onChange({ heroColor: e.target.value })}
                                className="w-11 h-11 rounded-xl cursor-pointer border border-grayscale-300 p-1 bg-white"
                            />
                            <input
                                type="text"
                                value={details.heroColor}
                                onChange={e => onChange({ heroColor: e.target.value })}
                                placeholder={DEFAULT_HERO_COLOR}
                                maxLength={7}
                                className={INPUT_CLASS}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
