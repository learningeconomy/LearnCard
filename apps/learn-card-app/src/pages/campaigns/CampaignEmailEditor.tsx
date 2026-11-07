import React from 'react';
import { hasEmailDestination } from './model';
import type { CampaignForm } from './types';
import { Field, inputClass } from './ui';

export const CampaignEmailEditor: React.FC<{
    form: CampaignForm;
    onChange: <K extends keyof CampaignForm>(key: K, value: CampaignForm[K]) => void;
}> = ({ form, onChange }) => (
    <div className="space-y-4">
        <div>
            <h3 className="text-sm font-semibold text-grayscale-900">Email content</h3>
            <p className="mt-1 text-xs text-grayscale-600">
                Your branding and unsubscribe link are added automatically.
            </p>
        </div>
        <Field label="Email subject" htmlFor="campaign-email-subject">
            <input
                id="campaign-email-subject"
                className={inputClass}
                placeholder="Give people a reason to open"
                maxLength={200}
                value={form.emailSubject}
                onChange={e => onChange('emailSubject', e.target.value)}
            />
        </Field>
        <Field label="Email heading" htmlFor="campaign-email-title">
            <input
                id="campaign-email-title"
                className={inputClass}
                placeholder="Introduce your announcement"
                maxLength={200}
                value={form.emailTitle}
                onChange={e => onChange('emailTitle', e.target.value)}
            />
        </Field>
        <Field label="Email body" htmlFor="campaign-email-body">
            <textarea
                id="campaign-email-body"
                className={inputClass}
                placeholder="Write your announcement in plain text"
                rows={5}
                maxLength={20000}
                value={form.emailBody}
                onChange={e => onChange('emailBody', e.target.value)}
            />
        </Field>
        {hasEmailDestination(form) ? (
            <>
                <Field label="Email button text" htmlFor="campaign-email-cta">
                    <input
                        id="campaign-email-cta"
                        className={inputClass}
                        placeholder="Open campaign"
                        maxLength={100}
                        value={form.emailCtaLabel}
                        onChange={e => onChange('emailCtaLabel', e.target.value)}
                    />
                </Field>
                <p className="text-xs text-grayscale-600">
                    The button opens this campaign in the app.
                </p>
            </>
        ) : (
            <p className="text-xs text-grayscale-600">
                This email has no button because there is no enabled in-app message.
            </p>
        )}
        <Field label="Email image URL (optional)" htmlFor="campaign-email-image">
            <input
                id="campaign-email-image"
                type="url"
                className={inputClass}
                placeholder="https://example.com/image.png"
                maxLength={2048}
                value={form.emailHeroImageUrl}
                onChange={e => onChange('emailHeroImageUrl', e.target.value)}
            />
        </Field>
    </div>
);
