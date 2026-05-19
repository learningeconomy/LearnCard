import type { UnsignedVC, VC } from '@learncard/types';

import type { CredentialTemplate } from './ir/types';

export type SampleCredential = UnsignedVC | VC;

export interface SampleVC {
    id: string;
    name: string;
    credential: SampleCredential;
}

export type RenderData = Record<string, unknown>;

export interface SuiteAdapter {
    suite: string;
    mediaType: string;
    label: string;
    render: (template: string, data: RenderData) => string;
    starterTemplate: string;
}

export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}

/**
 * Result handed back to the consumer on Save in Visual mode. `svgMustache` is the
 * `templateValue` suitable for `attachRenderMethod`; `template` is the IR the consumer
 * should persist alongside if they want to re-open the visual editor next session.
 * Consumers who don't care about visual round-trip can ignore `template`.
 */
export interface VisualSaveResult {
    svgMustache: string;
    template: CredentialTemplate;
}

export type DesignerMode = 'visual' | 'code';

export interface RenderMethodDesignerProps {
    /** Starting IR for the visual editor. Defaults to the first STARTER_TEMPLATES entry. */
    initialTemplate?: CredentialTemplate;
    /** Initial mode. Defaults to `'visual'`. */
    initialMode?: DesignerMode;
    /** Whether the user can switch modes. Defaults to `true`. */
    allowModeSwitch?: boolean;
    /** Initial code-mode template content. If omitted, defaults to the active suite's starter. */
    initialCodeTemplate?: string;
    /** Code-mode render suite. Defaults to `'svg-mustache'`. */
    renderSuite?: string;
    /** Suite adapters beyond the built-in `svg-mustache`. */
    adapters?: SuiteAdapter[];
    /** Sample credentials for live preview + variable picker. */
    sampleVCs?: SampleVC[];
    /**
     * Save callback. Receives `{ svgMustache, template? }`. `svgMustache` is always the
     * value to pass to `attachRenderMethod`. `template` (the IR) is only present when
     * saved from Visual mode.
     */
    onSave?: (output: { svgMustache: string; template?: CredentialTemplate }) => void | Promise<void>;
    /** Cancel callback. */
    onCancel?: () => void;
    /** Optional className applied to the outer wrapper. */
    className?: string;
}
