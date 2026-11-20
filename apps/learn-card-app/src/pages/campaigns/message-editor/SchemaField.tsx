import React, { useId, useState } from 'react';
import { z } from 'zod';
import { buttonClass, inputClass, textButtonClass } from '../ui';
import {
    FIELD_HINTS,
    FIELD_LABELS,
    OPTION_LABELS,
    initialFieldValue,
    matchesUnionBranch,
    objectValue,
    unionKey,
    type MessagePath,
} from './schemaFields';

interface Props {
    schema: z.ZodType;
    value: unknown;
    path: MessagePath;
    onChange: (value: unknown) => void;
    onRemoveItem: (path: MessagePath, index: number) => void;
    label?: string;
    depth?: number;
}
const groupClass =
    'flex min-w-0 flex-col gap-4 rounded-2xl border border-grayscale-200 bg-white p-4';
const labelClass = 'text-xs font-medium text-grayscale-700';

/** Render supported schema options without converting or normalizing the original message. */
export const SchemaField: React.FC<Props> = props => {
    const { schema, value, path, onChange, onRemoveItem, depth = 0 } = props;
    const id = useId();
    const key = String(path[path.length - 1]);
    const label = props.label ?? FIELD_LABELS[key] ?? key;
    const hint = FIELD_HINTS[key];
    const nested = (nextSchema: z.ZodType, nextValue = value): React.ReactNode => (
        <SchemaField {...props} schema={nextSchema} value={nextValue} depth={depth + 1} />
    );
    if (depth > 40)
        return (
            <p className="text-xs text-grayscale-600">
                Edit further nested conditions in JSON. Your values are preserved.
            </p>
        );
    if (schema instanceof z.ZodDefault)
        return nested(
            schema.unwrap() as z.ZodType,
            value === undefined ? initialFieldValue(schema) : value
        );
    if (schema instanceof z.ZodLazy) return nested(schema.unwrap() as z.ZodType);
    if (schema instanceof z.ZodOptional) {
        const inner = schema.unwrap() as z.ZodType;
        // Common copy fields stay visible and remove the optional property when cleared.
        if (inner instanceof z.ZodString && ['body', 'alt', 'title'].includes(key)) {
            return (
                <SchemaField
                    {...props}
                    schema={inner}
                    value={value ?? ''}
                    onChange={next => onChange(next === '' ? undefined : next)}
                />
            );
        }
        return (
            <div className={groupClass}>
                <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-grayscale-900">
                    <input
                        type="checkbox"
                        checked={value !== undefined}
                        onChange={e =>
                            onChange(e.target.checked ? initialFieldValue(inner) : undefined)
                        }
                        className="h-4 w-4 accent-emerald-600"
                    />
                    {label}
                </label>
                {value === undefined && hint && (
                    <p className="text-xs leading-relaxed text-grayscale-600">{hint}</p>
                )}
                {value !== undefined && nested(inner)}
            </div>
        );
    }
    if (schema instanceof z.ZodNullable)
        return (
            <div className="flex flex-col gap-3">
                <label className="flex items-center gap-3 text-xs text-grayscale-700">
                    <input
                        type="checkbox"
                        checked={value !== null && value !== undefined}
                        onChange={e =>
                            onChange(
                                e.target.checked
                                    ? initialFieldValue(schema.unwrap() as z.ZodType)
                                    : null
                            )
                        }
                        className="h-4 w-4 accent-emerald-600"
                    />
                    Override {label.toLowerCase()}
                </label>
                {value !== null && value !== undefined ? (
                    nested(schema.unwrap() as z.ZodType)
                ) : (
                    <p className="text-xs text-grayscale-500">Uses the original content.</p>
                )}
            </div>
        );
    if (schema instanceof z.ZodLiteral) return null;
    if (schema instanceof z.ZodObject) {
        const record = objectValue(value);
        return (
            <div className="flex min-w-0 flex-col gap-4">
                {Object.entries(schema.shape as Record<string, z.ZodType>).map(
                    ([child, childSchema]) => (
                        <SchemaField
                            key={child}
                            schema={childSchema}
                            value={record[child]}
                            path={[...path, child]}
                            depth={depth + 1}
                            onRemoveItem={onRemoveItem}
                            onChange={next => {
                                const changed = { ...record, [child]: next };
                                if (next === undefined) delete changed[child];
                                onChange(changed);
                            }}
                        />
                    )
                )}
            </div>
        );
    }
    if (schema instanceof z.ZodUnion) {
        const options = schema.options as readonly z.ZodType[];
        const selected = options.findIndex(option => matchesUnionBranch(option, value));
        return (
            <div className="flex flex-col gap-3">
                <label htmlFor={id} className={labelClass}>
                    {label}
                </label>
                <select
                    id={id}
                    className={inputClass}
                    value={selected < 0 ? '' : selected}
                    onChange={e => onChange(initialFieldValue(options[Number(e.target.value)]))}
                >
                    {selected < 0 && (
                        <option value="" disabled>
                            Choose an option
                        </option>
                    )}
                    {options.map((option, index) => (
                        <option key={index} value={index}>
                            {OPTION_LABELS[unionKey(option)] ??
                                FIELD_LABELS[unionKey(option)] ??
                                unionKey(option)}
                        </option>
                    ))}
                </select>
                {hint && <p className="text-xs leading-relaxed text-grayscale-600">{hint}</p>}
                {selected >= 0 && nested(options[selected])}
            </div>
        );
    }
    if (schema instanceof z.ZodArray) {
        const items: unknown[] = Array.isArray(value) ? value : [];
        const itemSchema = schema.element as z.ZodType;
        const itemLabel =
            key === 'actions'
                ? 'button'
                : key === 'steps'
                  ? 'screen'
                  : key === 'all' || key === 'any'
                    ? 'condition'
                    : 'value';
        return (
            <div className="flex min-w-0 flex-col gap-3">
                <p className={labelClass}>{label}</p>
                {hint && <p className="text-xs leading-relaxed text-grayscale-600">{hint}</p>}
                {key === 'steps' && path.length === 1 && (
                    <p className="text-xs leading-relaxed text-grayscale-600">
                        Only the final screen can have its own buttons.
                    </p>
                )}
                {items.map((item, index) => (
                    <div key={index} className={groupClass}>
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-xs font-semibold capitalize text-grayscale-700">
                                {itemLabel} {index + 1}
                            </span>
                            <button
                                type="button"
                                className={`${textButtonClass} !px-2 !py-1 text-red-700`}
                                aria-label={`Remove ${label.toLowerCase()} ${index + 1}`}
                                onClick={() => onRemoveItem(path, index)}
                            >
                                Remove
                            </button>
                        </div>
                        <SchemaField
                            schema={itemSchema}
                            value={item}
                            path={[...path, index]}
                            label={`${label} ${index + 1}`}
                            depth={depth + 1}
                            onRemoveItem={onRemoveItem}
                            onChange={next =>
                                onChange(items.map((entry, i) => (i === index ? next : entry)))
                            }
                        />
                    </div>
                ))}
                <button
                    type="button"
                    className={`${buttonClass} self-start`}
                    onClick={() => onChange([...items, initialFieldValue(itemSchema)])}
                >
                    Add {itemLabel}
                </button>
            </div>
        );
    }
    if (schema instanceof z.ZodRecord)
        return <RecordFields {...props} schema={schema} label={label} />;
    if (schema instanceof z.ZodBoolean)
        return (
            <div className="flex flex-col gap-2">
                <label className="flex cursor-pointer items-center gap-3 text-sm text-grayscale-900">
                    <input
                        type="checkbox"
                        checked={value === true}
                        onChange={e => onChange(e.target.checked)}
                        className="h-4 w-4 accent-emerald-600"
                    />
                    {label}
                </label>
                {hint && <p className="text-xs leading-relaxed text-grayscale-600">{hint}</p>}
            </div>
        );
    if (!(
        schema instanceof z.ZodString ||
        schema instanceof z.ZodNumber ||
        schema instanceof z.ZodEnum
    )) {
        return (
            <p className="text-xs text-grayscale-600">
                Edit {label.toLowerCase()} in JSON. Its current value is preserved.
            </p>
        );
    }
    const scalar = typeof value === 'string' || typeof value === 'number' ? value : '';
    return (
        <div className="flex min-w-0 flex-col gap-2">
            <label htmlFor={id} className={labelClass}>
                {label}
            </label>
            {schema instanceof z.ZodEnum ? (
                <select
                    id={id}
                    className={inputClass}
                    value={String(scalar)}
                    onChange={e => onChange(e.target.value)}
                >
                    {!schema.options.includes(scalar) && (
                        <option value={scalar} disabled>
                            {scalar || 'Choose an option'}
                        </option>
                    )}
                    {schema.options.map(option => (
                        <option key={String(option)} value={String(option)}>
                            {OPTION_LABELS[String(option)] ?? String(option)}
                        </option>
                    ))}
                </select>
            ) : key === 'body' ? (
                <textarea
                    id={id}
                    className={inputClass}
                    rows={3}
                    value={scalar}
                    onChange={e => onChange(e.target.value)}
                />
            ) : (
                <input
                    id={id}
                    className={inputClass}
                    type={schema instanceof z.ZodNumber ? 'number' : 'text'}
                    step={schema instanceof z.ZodNumber ? 'any' : undefined}
                    value={scalar}
                    onChange={e =>
                        onChange(
                            schema instanceof z.ZodNumber && e.target.value !== ''
                                ? Number(e.target.value)
                                : e.target.value
                        )
                    }
                />
            )}
            {hint && <p className="text-xs leading-relaxed text-grayscale-600">{hint}</p>}
        </div>
    );
};

const RecordFields: React.FC<Props & { schema: z.ZodRecord }> = props => {
    const { value, schema, path, onChange, onRemoveItem, depth = 0 } = props;
    const [newKey, setNewKey] = useState('');
    const id = useId();
    const entries = objectValue(value);
    const language = newKey.trim();
    const canAdd =
        /^[a-z]{2,3}(?:-[a-zA-Z0-9]{2,8})*$/.test(language) && !Object.hasOwn(entries, language);
    return (
        <div className="flex min-w-0 flex-col gap-4">
            <p className="text-xs leading-relaxed text-grayscale-600">{FIELD_HINTS.locales}</p>
            {Object.entries(entries).map(([key, translation]) => (
                <div key={key} className={groupClass}>
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-grayscale-900">{key}</span>
                        <button
                            type="button"
                            className={textButtonClass}
                            aria-label={`Remove translation ${key}`}
                            onClick={() => {
                                const next = { ...entries };
                                delete next[key];
                                onChange(next);
                            }}
                        >
                            Remove
                        </button>
                    </div>
                    <SchemaField
                        schema={schema.valueType as z.ZodType}
                        value={translation}
                        path={[...path, key]}
                        depth={depth + 1}
                        onRemoveItem={onRemoveItem}
                        onChange={next => onChange({ ...entries, [key]: next })}
                    />
                </div>
            ))}
            <div className="flex flex-col gap-2">
                <label htmlFor={id} className={labelClass}>
                    Language tag
                </label>
                <div className="flex flex-wrap items-center gap-3">
                    <input
                        id={id}
                        className={`${inputClass} min-w-0 flex-1`}
                        placeholder="e.g. es or pt-BR"
                        value={newKey}
                        onChange={e => setNewKey(e.target.value)}
                    />
                    <button
                        type="button"
                        className={buttonClass}
                        disabled={!canAdd}
                        onClick={() => {
                            if (canAdd) {
                                onChange({
                                    ...entries,
                                    [language]: initialFieldValue(schema.valueType as z.ZodType),
                                });
                                setNewKey('');
                            }
                        }}
                    >
                        Add language
                    </button>
                </div>
                {Object.hasOwn(entries, language) && (
                    <p className="text-xs text-amber-700">This language is already listed.</p>
                )}
            </div>
        </div>
    );
};
