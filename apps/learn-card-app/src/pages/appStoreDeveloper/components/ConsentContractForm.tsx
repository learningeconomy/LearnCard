import React, { useId, useState } from 'react';
import { ChevronDown, ChevronUp, Loader2, Plus, Trash2, Upload, X } from 'lucide-react';
import type { Updater } from 'use-immer';
import * as m from '../../../paraglide/messages.js';
import { mDynamic } from '../../../i18n/mDynamic';
import ContractCategoryMultiSelect from '../../hidden/ContractCategoryMultiSelect';
import type { ConsentContractFormValue } from './consentContractForm.types';
import { CONTRACT_CATEGORIES } from '../../../helpers/contract.helpers';
import { useLocale } from '../../../i18n';
import { CONTRACT_FORM_EXTRA_CATEGORY_LABELS } from './consentContractForm.helpers';

const FORM_CATEGORIES = [
    ...CONTRACT_CATEGORIES,
    ...Object.keys(CONTRACT_FORM_EXTRA_CATEGORY_LABELS),
];

type Props = {
    value: ConsentContractFormValue;
    onChange: Updater<ConsentContractFormValue>;
    disabled?: boolean;
    imageUploading: boolean;
    onSelectImage: () => void;
};

/** Shared fields for creating a request and editing a saved request. No publishing side effects. */
const ConsentContractForm: React.FC<Props> = ({
    value,
    onChange,
    disabled = false,
    imageUploading,
    onSelectImage,
}) => {
    const locale = useLocale();
    const categoryTitleOverrides: Record<string, string> = Object.fromEntries(
        Object.entries(CONTRACT_FORM_EXTRA_CATEGORY_LABELS).map(([key, copy]) => [
            key,
            mDynamic(copy),
        ])
    );
    const id = useId();
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [customField, setCustomField] = useState('');
    const inputClass =
        'w-full rounded-xl border border-grayscale-300 bg-white px-4 py-3 text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent';
    const labelClass = 'mb-1.5 block text-xs font-medium text-grayscale-700';
    const addField = (field: string) => {
        const key = field.trim();
        if (!key || key in value.contract.read.personal) return;
        onChange(draft => {
            draft.contract.read.personal[key] = { required: false, defaultEnabled: true };
        });
        setCustomField('');
    };

    return (
        <fieldset
            lang={locale}
            disabled={disabled || imageUploading}
            className="min-w-0 space-y-5 border-0 p-0 font-poppins"
        >
            <div className="flex items-start gap-4">
                <div className="relative shrink-0">
                    <button
                        type="button"
                        onClick={onSelectImage}
                        aria-label={mDynamic('consentUpdate.editor.selectImage')}
                        className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-grayscale-300 bg-grayscale-100 text-grayscale-500"
                    >
                        {imageUploading ? (
                            <Loader2 className="h-6 w-6 animate-spin" />
                        ) : value.image ? (
                            <img src={value.image} alt="" className="h-full w-full object-cover" />
                        ) : (
                            <Upload className="h-6 w-6" />
                        )}
                    </button>
                    {value.image && (
                        <button
                            type="button"
                            aria-label={mDynamic('consentUpdate.editor.removeImage')}
                            onClick={() =>
                                onChange(draft => {
                                    draft.image = '';
                                })
                            }
                            className="absolute end-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
                <div className="min-w-0 flex-1 space-y-4">
                    <div>
                        <label htmlFor={`${id}-name`} className={labelClass}>
                            {m[
                                'developerPortal.components.createConsentContractModal.contractName'
                            ]()}
                        </label>
                        <input
                            id={`${id}-name`}
                            value={value.name}
                            onChange={event =>
                                onChange(draft => {
                                    draft.name = event.target.value;
                                })
                            }
                            placeholder={
                                m[
                                    'developerPortal.components.createConsentContractModal.contractName'
                                ]() + ' *'
                            }
                            className={inputClass}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor={`${id}-subtitle`} className={labelClass}>
                            {m['developerPortal.components.createConsentContractModal.subtitle']()}
                        </label>
                        <input
                            id={`${id}-subtitle`}
                            value={value.subtitle ?? ''}
                            onChange={event =>
                                onChange(draft => {
                                    draft.subtitle = event.target.value;
                                })
                            }
                            className={inputClass}
                        />
                    </div>
                </div>
            </div>
            <div>
                <label htmlFor={`${id}-description`} className={labelClass}>
                    {m['developerPortal.components.createConsentContractModal.description']()}
                </label>
                <textarea
                    id={`${id}-description`}
                    value={value.description ?? ''}
                    onChange={event =>
                        onChange(draft => {
                            draft.description = event.target.value;
                        })
                    }
                    placeholder={m[
                        'developerPortal.components.createConsentContractModal.descriptionPlaceholder'
                    ]()}
                    rows={3}
                    className={inputClass}
                />
            </div>
            <div>
                <label htmlFor={`${id}-purpose`} className={labelClass}>
                    {m[
                        'developerPortal.components.createConsentContractModal.reasonForAccessing'
                    ]()}
                </label>
                <input
                    id={`${id}-purpose`}
                    value={value.reasonForAccessing ?? ''}
                    onChange={event =>
                        onChange(draft => {
                            draft.reasonForAccessing = event.target.value;
                        })
                    }
                    placeholder={m[
                        'developerPortal.components.createConsentContractModal.reasonPlaceholder'
                    ]()}
                    className={inputClass}
                />
            </div>
            {(['read', 'write'] as const).map(area => (
                <section
                    key={area}
                    aria-label={mDynamic(
                        area === 'read'
                            ? 'consentUpdate.ui.readAccess'
                            : 'consentUpdate.ui.writeAccess'
                    )}
                    className="space-y-4 rounded-2xl border border-grayscale-200 bg-grayscale-10 p-4"
                >
                    <div>
                        <h3 className="text-sm font-semibold text-grayscale-900">
                            {mDynamic(
                                area === 'read'
                                    ? 'developerPortal.components.createConsentContractModal.readAccess'
                                    : 'developerPortal.components.createConsentContractModal.writeAccess'
                            )}
                        </h3>
                        <p className="mt-1 text-xs leading-relaxed text-grayscale-600">
                            {mDynamic(
                                area === 'read'
                                    ? 'developerPortal.components.createConsentContractModal.readAccessDesc'
                                    : 'developerPortal.components.createConsentContractModal.writeAccessDesc'
                            )}
                        </p>
                    </div>
                    <ContractCategoryMultiSelect
                        values={value.contract[area].credentials.categories}
                        onChange={categories =>
                            onChange(draft => {
                                draft.contract[area].credentials.categories = categories;
                            })
                        }
                        mode={area}
                        availableCategories={FORM_CATEGORIES}
                        categoryTitleOverrides={categoryTitleOverrides}
                    />
                    {area === 'read' && (
                        <label className="flex items-start gap-3 border-t border-grayscale-200 pt-4 text-sm text-grayscale-700">
                            <input
                                type="checkbox"
                                checked={value.contract.read.anonymize ?? true}
                                onChange={event =>
                                    onChange(draft => {
                                        draft.contract.read.anonymize = event.target.checked;
                                    })
                                }
                                className="mt-1 accent-emerald-600"
                            />
                            <span>
                                {m[
                                    'developerPortal.components.createConsentContractModal.anonymizeData'
                                ]()}
                                <span className="mt-1 block text-xs text-grayscale-500">
                                    {m[
                                        'developerPortal.components.createConsentContractModal.anonymizeDataDesc'
                                    ]()}
                                </span>
                            </span>
                        </label>
                    )}
                    {area === 'read' && (
                        <div className="space-y-3 border-t border-grayscale-200 pt-4">
                            <p className="text-xs text-grayscale-600">
                                {m[
                                    'developerPortal.components.createConsentContractModal.personalDataFieldsDesc'
                                ]()}
                            </p>
                            <div className="flex gap-2">
                                {['name', 'email']
                                    .filter(field => !(field in value.contract.read.personal))
                                    .map(field => (
                                        <button
                                            key={field}
                                            type="button"
                                            onClick={() => addField(field)}
                                            className="rounded-[20px] border border-grayscale-300 bg-white px-3 py-1.5 text-xs text-grayscale-700"
                                        >
                                            + {field}
                                        </button>
                                    ))}
                            </div>
                            {Object.entries(value.contract.read.personal).map(([field, config]) => (
                                <div
                                    key={field}
                                    className="flex items-center justify-between gap-3 rounded-xl border border-grayscale-200 bg-white p-2.5"
                                >
                                    <span className="text-sm font-medium text-grayscale-900">
                                        {field}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            aria-pressed={config.required}
                                            onClick={() =>
                                                onChange(draft => {
                                                    draft.contract.read.personal[field].required =
                                                        !config.required;
                                                })
                                            }
                                            className={`rounded-full border px-2 py-0.5 text-xs transition-colors ${
                                                config.required
                                                    ? 'border-red-200 bg-red-50 text-red-600'
                                                    : 'border-grayscale-200 bg-grayscale-100 text-grayscale-500'
                                            }`}
                                        >
                                            {mDynamic(
                                                config.required
                                                    ? 'developerPortal.components.createConsentContractModal.required'
                                                    : 'developerPortal.components.createConsentContractModal.optional'
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            aria-label={mDynamic(
                                                'consentUpdate.editor.removeAccess',
                                                {
                                                    label: field,
                                                }
                                            )}
                                            onClick={() =>
                                                onChange(draft => {
                                                    delete draft.contract.read.personal[field];
                                                })
                                            }
                                            className="text-grayscale-500 hover:text-red-600"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <div className="flex gap-2">
                                <input
                                    value={customField}
                                    aria-label={mDynamic('consentUpdate.editor.customField', {
                                        area: mDynamic('consentUpdate.ui.readAccess'),
                                    })}
                                    onChange={event => setCustomField(event.target.value)}
                                    onKeyDown={event => {
                                        if (event.key === 'Enter') {
                                            event.preventDefault();
                                            addField(customField);
                                        }
                                    }}
                                    placeholder={m[
                                        'developerPortal.components.createConsentContractModal.customFieldName'
                                    ]()}
                                    className={inputClass}
                                />
                                <button
                                    type="button"
                                    onClick={() => addField(customField)}
                                    disabled={
                                        !customField.trim() ||
                                        customField.trim() in value.contract.read.personal
                                    }
                                    aria-label={mDynamic('consentUpdate.editor.addField')}
                                    className="rounded-[20px] bg-grayscale-900 px-4 text-white disabled:opacity-40"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </section>
            ))}
            <div className="overflow-hidden rounded-2xl border border-grayscale-200">
                <button
                    type="button"
                    aria-expanded={showAdvanced}
                    onClick={() => setShowAdvanced(current => !current)}
                    className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-grayscale-700"
                >
                    {m['developerPortal.components.createConsentContractModal.advancedOptions']()}
                    {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {showAdvanced && (
                    <div className="space-y-4 border-t border-grayscale-200 p-4">
                        <div>
                            <label htmlFor={`${id}-redirect`} className={labelClass}>
                                {m[
                                    'developerPortal.components.createConsentContractModal.redirectUrl'
                                ]()}
                            </label>
                            <input
                                id={`${id}-redirect`}
                                type="url"
                                value={value.redirectUrl ?? ''}
                                onChange={event =>
                                    onChange(draft => {
                                        draft.redirectUrl = event.target.value;
                                    })
                                }
                                placeholder="https://yourapp.com/callback"
                                className={inputClass}
                            />
                        </div>
                        <label className="flex items-start gap-3 text-sm text-grayscale-700">
                            <input
                                type="checkbox"
                                checked={Boolean(value.needsGuardianConsent)}
                                onChange={event =>
                                    onChange(draft => {
                                        draft.needsGuardianConsent = event.target.checked;
                                    })
                                }
                                className="mt-1 accent-emerald-600"
                            />
                            <span>
                                {m[
                                    'developerPortal.components.createConsentContractModal.guardianConsentFlow'
                                ]()}
                                <span className="mt-1 block text-xs text-grayscale-500">
                                    {m[
                                        'developerPortal.components.createConsentContractModal.guardianConsentFlowDesc'
                                    ]()}
                                </span>
                            </span>
                        </label>
                    </div>
                )}
            </div>
        </fieldset>
    );
};

export default ConsentContractForm;
