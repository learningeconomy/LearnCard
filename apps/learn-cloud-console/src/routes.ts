import {
    LayoutDashboard,
    Building2,
    Layers,
    Users,
    LayoutGrid,
    BarChart3,
    HandCoins,
    GraduationCap,
    Search,
    FlaskConical,
    Package,
    Wallet,
    Plug,
    Cable,
    Database,
    PackageCheck,
    ShieldCheck,
    BookMarked,
    Route,
    Globe,
    Link2,
    Settings,
    LucideIcon,
} from 'lucide-react';

export interface RouteDefinition {
    surfaceSlug?: string;
    title: string;
    path: string;
    icon: LucideIcon;
}

export const topRoutes: RouteDefinition[] = [
    { title: 'Overview', path: '/', icon: LayoutDashboard },
    { title: 'Ecosystem', path: '/ecosystem', icon: Building2 },
    { title: 'My Stack', path: '/my-stack', icon: Layers },
    { title: 'Users', path: '/users', icon: Users },
];

export const appsRoutes: RouteDefinition[] = [
    { title: 'Analytics', path: '/analytics', icon: BarChart3 },
    { title: 'Funding', path: '/funding', icon: HandCoins },
    { title: 'Admissions', path: '/admissions', icon: GraduationCap },
    // ADR-015 D4: rendered only while the Credential Engine registry-adapter surface projects.
    {
        title: 'Credential Finder',
        path: '/credential-finder',
        icon: Search,
        surfaceSlug: 'credential-finder',
    },
    { title: 'LER Test Suite', path: '/ler-test-suite', icon: FlaskConical },
];

export const pluginsRoutes: RouteDefinition[] = [
    { title: 'Bundles', path: '/bundles', icon: Package },
    { title: 'User Apps', path: '/apps', icon: LayoutGrid },
    { title: 'Wallets', path: '/wallets', icon: Wallet },
    { title: 'Infrastructure', path: '/plugins', icon: Plug },
    { title: 'Integrations', path: '/integrations', icon: Cable },
    { title: 'Data Sources', path: '/data-sources', icon: Database },
    { title: 'Data Packages', path: '/data-packages', icon: PackageCheck },
    { title: 'Trust Registries', path: '/trust-registries', icon: ShieldCheck },
    { title: 'Skills Registries', path: '/skills-registries', icon: BookMarked },
    { title: 'Pathway Registries', path: '/pathway-registries', icon: Route },
];

export const dataRoutes: RouteDefinition[] = [
    { title: 'LearnClouds', path: '/learncloud', icon: Globe },
    { title: 'Pipelines', path: '/pipelines', icon: Route },
    { title: 'Bindings', path: '/bindings', icon: Link2 },
];

export const bottomRoutes: RouteDefinition[] = [
    { title: 'Settings', path: '/settings', icon: Settings },
];

export const allRoutes = [
    ...topRoutes,
    ...appsRoutes,
    ...pluginsRoutes,
    ...dataRoutes,
    ...bottomRoutes,
];
