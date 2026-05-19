import type { CredentialTemplate } from '../ir/types';
import { classicTemplate } from './classic';
import { modernTemplate } from './modern';
import { minimalTemplate } from './minimal';

export interface TemplateGalleryEntry {
    id: string;
    name: string;
    description: string;
    template: CredentialTemplate;
}

export const STARTER_TEMPLATES: TemplateGalleryEntry[] = [
    {
        id: 'classic',
        name: 'Classic Card',
        description: 'Centered avatar, gradient header, two-row footer. Works for badges and IDs.',
        template: classicTemplate,
    },
    {
        id: 'modern',
        name: 'Modern Bold',
        description: 'Full-bleed dark gradient, eyebrow text, large title. Good for premium credentials.',
        template: modernTemplate,
    },
    {
        id: 'minimal',
        name: 'Minimal',
        description: 'Clean, bordered, monochrome. Good for institutional or formal credentials.',
        template: minimalTemplate,
    },
];

export { classicTemplate, modernTemplate, minimalTemplate };
