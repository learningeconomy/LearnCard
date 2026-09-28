import { Globe, Network, School, Building2 } from 'lucide-react';

export const kindColors = {
    ecosystem: 'bg-violet/10 text-violet',
    group: 'bg-lc-blue/10 text-lc-blue',
    institution: 'bg-emerald/10 text-emerald',
    employer: 'bg-coral/10 text-coral',
} as const;

export const kindIcon = {
    ecosystem: Globe,
    group: Network,
    institution: School,
    employer: Building2,
} as const;
