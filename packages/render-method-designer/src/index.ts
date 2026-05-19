export { RenderMethodDesigner } from './RenderMethodDesigner';
export type {
    RenderMethodDesignerProps,
    SampleVC,
    SampleCredential,
    SuiteAdapter,
    ValidationResult,
    RenderData,
    DesignerMode,
    VisualSaveResult,
} from './types';

export { BUILT_IN_ADAPTERS, resolveAdapter, svgMustacheAdapter } from './suites';
export { renderSvgMustache } from './renderer/renderSvgMustache';
export { DOMPURIFY_SVG_CONFIG } from './renderer/dompurifyConfig';
export { walkVariables, buildPreviewData } from './lib/walkVariables';
export type { DiscoveredVariable } from './lib/walkVariables';
export { validateMustacheTemplate } from './lib/validateMustache';

export { CodeEditor } from './components/CodeEditor';
export type { CodeEditorProps } from './components/CodeEditor';
export { LivePreview } from './components/LivePreview';
export type { LivePreviewProps } from './components/LivePreview';
export { VariablePicker } from './components/VariablePicker';
export type { VariablePickerProps } from './components/VariablePicker';
export { Toolbar } from './components/Toolbar';
export type { ToolbarProps } from './components/Toolbar';

export { VisualEditor } from './components/visual/VisualEditor';
export type { VisualEditorProps } from './components/visual/VisualEditor';

export type {
    CredentialTemplate,
    DesignerElement,
    ElementType,
    Theme,
    ColorRef,
    FontRef,
    StringValue,
    ImageValue,
    Visibility,
    FillRef,
    RectElement,
    TextElement,
    ImageElement,
    FieldRowElement,
    DividerElement,
} from './ir/types';
export {
    CredentialTemplateSchema,
    DesignerElementSchema,
    parseTemplate,
    safeParseTemplate,
    parseElement,
} from './ir/schema';
export { emitSvgMustache } from './ir/emit';
export { DEFAULT_THEME, resolveColor, resolveFont } from './ir/theme';
export { parseSvgToTemplate, buildFallbackTemplate } from './ir/parse';
export type { ImportResult, ImportOptions, ImportWarning } from './ir/parse';
export {
    clientPointToSvg,
    snap,
    snapPoint,
    applyResize,
    DEFAULT_GRID_STEP,
    DRAG_THRESHOLD_PX,
    RESIZE_CURSORS,
} from './lib/coord';
export type { ResizeDirection, DragState } from './lib/coord';

export { STARTER_TEMPLATES, classicTemplate, modernTemplate, minimalTemplate } from './templates';
export type { TemplateGalleryEntry } from './templates';

export { createDesignerStore } from './store/designerStore';
export type {
    DesignerStore,
    DesignerStoreApi,
    DesignerState,
    DesignerActions,
} from './store/designerStore';
