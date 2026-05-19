import React from 'react';
import { useStore } from 'zustand';

import type { DesignerStoreApi } from '../../store/designerStore';
import type {
    DesignerElement,
    DividerElement,
    FieldRowElement,
    ImageElement,
    PathElement,
    RectElement,
    ShadowEffect,
    StringValue,
    TextElement,
    Theme,
} from '../../ir/types';
import type { RenderData } from '../../types';
import { ColorInput } from './ColorInput';
import { BindingPicker } from './BindingPicker';

export interface PropertiesPanelProps {
    store: DesignerStoreApi;
    data: RenderData;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div style={{ marginBottom: '16px' }}>
        <div
            style={{
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.8px',
                color: '#8B91A7',
                textTransform: 'uppercase',
                marginBottom: '8px',
            }}
        >
            {title}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>{children}</div>
    </div>
);

const NumberInput: React.FC<{
    value: number;
    onChange: (n: number) => void;
    label: string;
    step?: number;
}> = ({ value, onChange, label, step = 1 }) => (
    <div>
        <div style={{ fontSize: '11px', color: '#6F7590', marginBottom: '4px' }}>{label}</div>
        <input
            type="number"
            value={value}
            step={step}
            onChange={e => onChange(Number(e.target.value) || 0)}
            style={{
                width: '100%',
                padding: '6px 10px',
                fontSize: '12px',
                fontFamily: "'JetBrains Mono', monospace",
                border: '1px solid #E2E3E9',
                borderRadius: '6px',
                color: '#18224E',
                background: '#FFFFFF',
                outline: 'none',
            }}
        />
    </div>
);

const TextInput: React.FC<{
    value: string;
    onChange: (s: string) => void;
    label: string;
}> = ({ value, onChange, label }) => (
    <div>
        <div style={{ fontSize: '11px', color: '#6F7590', marginBottom: '4px' }}>{label}</div>
        <input
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
            style={{
                width: '100%',
                padding: '6px 10px',
                fontSize: '12px',
                border: '1px solid #E2E3E9',
                borderRadius: '6px',
                color: '#18224E',
                background: '#FFFFFF',
                outline: 'none',
            }}
        />
    </div>
);

const SelectInput: <T extends string>(props: {
    value: T;
    onChange: (v: T) => void;
    options: ReadonlyArray<{ value: T; label: string }>;
    label: string;
}) => React.ReactElement = ({ value, onChange, options, label }) => (
    <div>
        <div style={{ fontSize: '11px', color: '#6F7590', marginBottom: '4px' }}>{label}</div>
        <select
            value={value}
            onChange={e => onChange(e.target.value as typeof value)}
            style={{
                width: '100%',
                padding: '6px 10px',
                fontSize: '12px',
                border: '1px solid #E2E3E9',
                borderRadius: '6px',
                color: '#18224E',
                background: '#FFFFFF',
                outline: 'none',
                cursor: 'pointer',
            }}
        >
            {options.map(o => (
                <option key={o.value} value={o.value}>
                    {o.label}
                </option>
            ))}
        </select>
    </div>
);

const PositionFields: React.FC<{
    el: { x: number; y: number; w?: number; h?: number };
    onPatch: (patch: Partial<{ x: number; y: number; w: number; h: number }>) => void;
    includeSize: boolean;
}> = ({ el, onPatch, includeSize }) => (
    <Section title="Position">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <NumberInput label="X" value={el.x} onChange={n => onPatch({ x: n })} />
            <NumberInput label="Y" value={el.y} onChange={n => onPatch({ y: n })} />
            {includeSize && (
                <>
                    <NumberInput label="W" value={el.w ?? 0} onChange={n => onPatch({ w: n })} />
                    <NumberInput label="H" value={el.h ?? 0} onChange={n => onPatch({ h: n })} />
                </>
            )}
        </div>
    </Section>
);

const VisibilitySection: React.FC<{
    visibility: DesignerElement['visibility'];
    onChange: (v: DesignerElement['visibility']) => void;
}> = ({ visibility, onChange }) => (
    <Section title="Visibility">
        <SelectInput
            label="Show element"
            value={visibility?.kind ?? 'always'}
            onChange={kind => {
                if (kind === 'always') onChange({ kind: 'always' });
                else onChange({ kind: 'whenPresent', path: visibility?.kind === 'whenPresent' ? visibility.path : '' });
            }}
            options={[
                { value: 'always', label: 'Always' },
                { value: 'whenPresent', label: 'When field is present' },
            ]}
        />
        {visibility?.kind === 'whenPresent' && (
            <TextInput
                label="Field path"
                value={visibility.path}
                onChange={path => onChange({ kind: 'whenPresent', path })}
            />
        )}
    </Section>
);

const TextPanel: React.FC<{
    el: TextElement;
    patch: (p: Partial<TextElement>) => void;
    theme: Theme;
    data: RenderData;
}> = ({ el, patch, theme, data }) => (
    <>
        <Section title="Content">
            <BindingPicker
                value={el.content}
                onChange={(v: StringValue) => patch({ content: v })}
                data={data}
                label="Text"
            />
        </Section>
        <PositionFields el={el} onPatch={p => patch(p)} includeSize={false} />
        <Section title="Typography">
            <SelectInput
                label="Font"
                value={el.font}
                onChange={font => patch({ font })}
                options={[
                    { value: 'heading', label: 'Heading' },
                    { value: 'body', label: 'Body' },
                ]}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <NumberInput label="Size" value={el.size} onChange={n => patch({ size: n })} />
                <SelectInput
                    label="Weight"
                    value={String(el.weight)}
                    onChange={w => patch({ weight: Number(w) as 400 | 500 | 600 | 700 })}
                    options={[
                        { value: '400', label: 'Regular' },
                        { value: '500', label: 'Medium' },
                        { value: '600', label: 'Semibold' },
                        { value: '700', label: 'Bold' },
                    ]}
                />
            </div>
            <SelectInput
                label="Alignment"
                value={el.align}
                onChange={align => patch({ align })}
                options={[
                    { value: 'start', label: 'Left' },
                    { value: 'middle', label: 'Center' },
                    { value: 'end', label: 'Right' },
                ]}
            />
            <ColorInput
                label="Color"
                value={el.color}
                onChange={color => patch({ color })}
                theme={theme}
            />
            <NumberInput
                label="Letter spacing"
                value={el.letterSpacing ?? 0}
                step={0.1}
                onChange={n => patch({ letterSpacing: n })}
            />
        </Section>
        <Section title="Wrapping">
            <label
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '12px',
                    color: '#52597A',
                    cursor: 'pointer',
                }}
            >
                <input
                    type="checkbox"
                    checked={!!el.wrap}
                    onChange={e =>
                        patch(
                            e.target.checked
                                ? {
                                      maxWidth: el.maxWidth ?? 220,
                                      wrap: { lineHeight: 1.2, maxLines: 2, overflow: 'ellipsis' },
                                  }
                                : { wrap: undefined }
                        )
                    }
                />
                <span>Wrap text in box</span>
            </label>
            {el.wrap && (
                <>
                    <NumberInput
                        label="Box width"
                        value={el.maxWidth ?? 220}
                        onChange={n => patch({ maxWidth: Math.max(1, n) })}
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <NumberInput
                            label="Line height"
                            value={el.wrap.lineHeight}
                            step={0.1}
                            onChange={n => patch({ wrap: { ...el.wrap!, lineHeight: Math.max(0.8, n) } })}
                        />
                        <NumberInput
                            label="Max lines"
                            value={el.wrap.maxLines}
                            onChange={n => patch({ wrap: { ...el.wrap!, maxLines: Math.max(1, Math.round(n)) } })}
                        />
                    </div>
                    <SelectInput
                        label="Overflow"
                        value={el.wrap.overflow}
                        onChange={overflow => patch({ wrap: { ...el.wrap!, overflow } })}
                        options={[
                            { value: 'clip', label: 'Clip' },
                            { value: 'ellipsis', label: 'Ellipsis' },
                        ]}
                    />
                </>
            )}
        </Section>
    </>
);

const RectPanel: React.FC<{
    el: RectElement;
    patch: (p: Partial<RectElement>) => void;
    theme: Theme;
}> = ({ el, patch, theme }) => (
    <>
        <PositionFields el={el} onPatch={p => patch(p)} includeSize={true} />
        <Section title="Appearance">
            <NumberInput
                label="Corner radius"
                value={el.rx ?? 0}
                onChange={n => patch({ rx: n || undefined })}
            />
            <SelectInput
                label="Fill type"
                value={el.fill.kind}
                onChange={kind => {
                    if (kind === 'solid') patch({ fill: { kind: 'solid', color: '$surface' } });
                    else patch({ fill: { kind: 'linear-gradient', from: '$primary', to: '$secondary', direction: 'horizontal' } });
                }}
                options={[
                    { value: 'solid', label: 'Solid' },
                    { value: 'linear-gradient', label: 'Gradient' },
                ]}
            />
            {el.fill.kind === 'solid' ? (
                <ColorInput
                    label="Fill"
                    value={el.fill.color}
                    onChange={c => patch({ fill: { kind: 'solid', color: c } })}
                    theme={theme}
                />
            ) : (
                <>
                    <ColorInput
                        label="From"
                        value={el.fill.from}
                        onChange={c =>
                            patch({
                                fill: { ...el.fill, kind: 'linear-gradient', from: c } as RectElement['fill'],
                            })
                        }
                        theme={theme}
                    />
                    <ColorInput
                        label="To"
                        value={el.fill.to}
                        onChange={c =>
                            patch({
                                fill: { ...el.fill, kind: 'linear-gradient', to: c } as RectElement['fill'],
                            })
                        }
                        theme={theme}
                    />
                    <SelectInput
                        label="Direction"
                        value={el.fill.direction}
                        onChange={d =>
                            patch({
                                fill: { ...el.fill, kind: 'linear-gradient', direction: d } as RectElement['fill'],
                            })
                        }
                        options={[
                            { value: 'horizontal', label: 'Horizontal' },
                            { value: 'vertical', label: 'Vertical' },
                            { value: 'diagonal', label: 'Diagonal' },
                        ]}
                    />
                </>
            )}
        </Section>
    </>
);

const ImagePanel: React.FC<{
    el: ImageElement;
    patch: (p: Partial<ImageElement>) => void;
    theme: Theme;
}> = ({ el, patch }) => (
    <>
        <Section title="Source">
            <SelectInput
                label="Source type"
                value={el.source.kind}
                onChange={kind => {
                    if (kind === 'url') patch({ source: { kind: 'url', value: '' } });
                    else patch({ source: { kind: 'binding', path: '' } });
                }}
                options={[
                    { value: 'url', label: 'URL' },
                    { value: 'binding', label: 'From credential' },
                ]}
            />
            {el.source.kind === 'url' ? (
                <TextInput
                    label="Image URL"
                    value={el.source.value}
                    onChange={v => patch({ source: { kind: 'url', value: v } })}
                />
            ) : (
                <TextInput
                    label="Field path"
                    value={el.source.path}
                    onChange={path => patch({ source: { kind: 'binding', path } })}
                />
            )}
        </Section>
        <PositionFields el={el} onPatch={p => patch(p)} includeSize={true} />
        <Section title="Display">
            <SelectInput
                label="Fit"
                value={el.fit}
                onChange={fit => patch({ fit })}
                options={[
                    { value: 'cover', label: 'Cover' },
                    { value: 'contain', label: 'Contain' },
                ]}
            />
            <SelectInput
                label="Clip"
                value={el.clip}
                onChange={clip => patch({ clip })}
                options={[
                    { value: 'none', label: 'None' },
                    { value: 'rounded', label: 'Rounded' },
                    { value: 'circle', label: 'Circle' },
                ]}
            />
            {el.clip === 'rounded' && (
                <NumberInput
                    label="Corner radius"
                    value={el.cornerRadius ?? 12}
                    onChange={n => patch({ cornerRadius: n })}
                />
            )}
        </Section>
    </>
);

const FieldRowPanel: React.FC<{
    el: FieldRowElement;
    patch: (p: Partial<FieldRowElement>) => void;
    theme: Theme;
    data: RenderData;
}> = ({ el, patch, theme, data }) => (
    <>
        <PositionFields el={{ x: el.x, y: el.y, w: el.w }} onPatch={p => patch(p)} includeSize={false} />
        <Section title="Label">
            <TextInput label="Label text" value={el.label} onChange={label => patch({ label })} />
            <ColorInput label="Label color" value={el.labelColor} onChange={c => patch({ labelColor: c })} theme={theme} />
        </Section>
        <Section title="Value">
            <BindingPicker value={el.value} onChange={v => patch({ value: v })} data={data} label="Value" />
            <ColorInput label="Value color" value={el.valueColor} onChange={c => patch({ valueColor: c })} theme={theme} />
        </Section>
        <Section title="Layout">
            <NumberInput label="Width" value={el.w} onChange={w => patch({ w })} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <NumberInput label="Label size" value={el.labelSize ?? 10} onChange={s => patch({ labelSize: s })} />
                <NumberInput label="Value size" value={el.valueSize ?? 13} onChange={s => patch({ valueSize: s })} />
            </div>
        </Section>
    </>
);

const DividerPanel: React.FC<{
    el: DividerElement;
    patch: (p: Partial<DividerElement>) => void;
    theme: Theme;
}> = ({ el, patch, theme }) => (
    <>
        <PositionFields el={{ x: el.x, y: el.y, w: el.w }} onPatch={p => patch(p)} includeSize={false} />
        <Section title="Style">
            <NumberInput label="Width" value={el.w} onChange={w => patch({ w })} />
            <NumberInput label="Thickness" value={el.thickness} onChange={t => patch({ thickness: t })} />
            <ColorInput label="Color" value={el.color} onChange={c => patch({ color: c })} theme={theme} />
        </Section>
    </>
);

const PathPanel: React.FC<{
    el: PathElement;
    patch: (p: Partial<PathElement>) => void;
    theme: Theme;
}> = ({ el, patch, theme }) => (
    <>
        <PositionFields el={el} onPatch={p => patch(p)} includeSize={true} />
        <Section title="Appearance">
            <SelectInput
                label="Fill type"
                value={el.fill.kind}
                onChange={kind => {
                    if (kind === 'solid') patch({ fill: { kind: 'solid', color: '$primary' } });
                    else
                        patch({
                            fill: {
                                kind: 'linear-gradient',
                                from: '$primary',
                                to: '$secondary',
                                direction: 'horizontal',
                            },
                        });
                }}
                options={[
                    { value: 'solid', label: 'Solid' },
                    { value: 'linear-gradient', label: 'Gradient' },
                ]}
            />
            {el.fill.kind === 'solid' ? (
                <ColorInput
                    label="Fill"
                    value={el.fill.color}
                    onChange={c => patch({ fill: { kind: 'solid', color: c } })}
                    theme={theme}
                />
            ) : (
                <>
                    <ColorInput
                        label="From"
                        value={el.fill.from}
                        onChange={c =>
                            patch({
                                fill: { ...el.fill, kind: 'linear-gradient', from: c } as PathElement['fill'],
                            })
                        }
                        theme={theme}
                    />
                    <ColorInput
                        label="To"
                        value={el.fill.to}
                        onChange={c =>
                            patch({
                                fill: { ...el.fill, kind: 'linear-gradient', to: c } as PathElement['fill'],
                            })
                        }
                        theme={theme}
                    />
                </>
            )}
        </Section>
        <Section title="Path data">
            <div style={{ fontSize: '11px', color: '#8B91A7', fontStyle: 'italic' }}>
                Imported from SVG. Edit shape via the source SVG; the designer doesn&apos;t edit
                path geometry directly.
            </div>
            <div
                style={{
                    fontSize: '10px',
                    fontFamily: "'JetBrains Mono', monospace",
                    color: '#52597A',
                    background: '#FBFBFC',
                    padding: '6px',
                    borderRadius: '4px',
                    border: '1px solid #E2E3E9',
                    maxHeight: '60px',
                    overflowY: 'auto',
                    wordBreak: 'break-all',
                }}
            >
                {el.d.length > 200 ? `${el.d.slice(0, 200)}…` : el.d}
            </div>
        </Section>
    </>
);

/**
 * Shadow editor — reusable across rect, image, and path elements. Toggle adds/removes
 * the shadow property; the four numeric fields control offset + blur + opacity + color.
 */
const ShadowSection: React.FC<{
    shadow: ShadowEffect | undefined;
    onChange: (next: ShadowEffect | undefined) => void;
    theme: Theme;
}> = ({ shadow, onChange, theme }) => (
    <Section title="Shadow">
        <label
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                color: '#52597A',
                cursor: 'pointer',
            }}
        >
            <input
                type="checkbox"
                checked={!!shadow}
                onChange={e =>
                    onChange(
                        e.target.checked
                            ? { offsetX: 0, offsetY: 3, blur: 4, color: '#000000', opacity: 0.25 }
                            : undefined
                    )
                }
            />
            <span>Drop shadow</span>
        </label>
        {shadow && (
            <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <NumberInput
                        label="Offset X"
                        value={shadow.offsetX}
                        onChange={n => onChange({ ...shadow, offsetX: n })}
                    />
                    <NumberInput
                        label="Offset Y"
                        value={shadow.offsetY}
                        onChange={n => onChange({ ...shadow, offsetY: n })}
                    />
                    <NumberInput
                        label="Blur"
                        value={shadow.blur}
                        onChange={n => onChange({ ...shadow, blur: Math.max(0, n) })}
                    />
                    <NumberInput
                        label="Opacity"
                        value={shadow.opacity}
                        step={0.05}
                        onChange={n =>
                            onChange({ ...shadow, opacity: Math.max(0, Math.min(1, n)) })
                        }
                    />
                </div>
                <ColorInput
                    label="Color"
                    value={shadow.color}
                    onChange={c => onChange({ ...shadow, color: c })}
                    theme={theme}
                />
            </>
        )}
    </Section>
);

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ store, data }) => {
    const selectedId = useStore(store, s => s.selectedElementId);
    const element = useStore(store, s =>
        s.selectedElementId
            ? s.template.elements.find(e => e.id === s.selectedElementId) ?? null
            : null
    );
    const theme = useStore(store, s => s.template.theme);
    const updateElement = useStore(store, s => s.updateElement);

    if (!selectedId || !element) {
        return (
            <div
                style={{
                    padding: '24px 16px',
                    fontSize: '12px',
                    color: '#8B91A7',
                    textAlign: 'center',
                    height: '100%',
                }}
            >
                Select an element on the canvas or in the Layers panel to edit its properties.
            </div>
        );
    }

    const patch = <T extends DesignerElement>(p: Partial<T>) => {
        updateElement(element.id, el => {
            Object.assign(el, p);
        });
    };

    const setVisibility = (v: DesignerElement['visibility']) =>
        updateElement(element.id, el => {
            el.visibility = v;
        });

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                overflowY: 'auto',
                padding: '16px',
                background: '#FFFFFF',
            }}
        >
            <div
                style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#18224E',
                    marginBottom: '4px',
                }}
            >
                {element.type.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </div>
            <div style={{ fontSize: '11px', color: '#8B91A7', marginBottom: '16px' }}>
                id: <code style={{ fontFamily: "'JetBrains Mono', monospace" }}>{element.id}</code>
            </div>

            {element.type === 'text' && <TextPanel el={element} patch={patch} theme={theme} data={data} />}
            {element.type === 'rect' && <RectPanel el={element} patch={patch} theme={theme} />}
            {element.type === 'image' && <ImagePanel el={element} patch={patch} theme={theme} />}
            {element.type === 'field-row' && <FieldRowPanel el={element} patch={patch} theme={theme} data={data} />}
            {element.type === 'divider' && <DividerPanel el={element} patch={patch} theme={theme} />}
            {element.type === 'path' && <PathPanel el={element} patch={patch} theme={theme} />}

            {(element.type === 'rect' || element.type === 'image' || element.type === 'path') && (
                <ShadowSection
                    shadow={element.shadow}
                    onChange={next =>
                        updateElement(element.id, el => {
                            if (el.type === 'rect' || el.type === 'image' || el.type === 'path') {
                                el.shadow = next;
                            }
                        })
                    }
                    theme={theme}
                />
            )}

            <VisibilitySection visibility={element.visibility} onChange={setVisibility} />
        </div>
    );
};
