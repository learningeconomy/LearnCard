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
    // ADR-015 minimumRole: sidebar-only gate (OWNER > ADMIN > MEMBER > VIEWER); omit to
    // leave a route ungated. Real access control stays brain-side (ADR-001 §3.9-3.10).
    minimumRole?: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
}

export const topRoutes: RouteDefinition[] = [
    { title: 'Overview', path: '/', icon: LayoutDashboard },
    { title: 'Ecosystem', path: '/ecosystem', icon: Building2 },
    { title: 'My Stack', path: '/my-stack', icon: Layers },
    { title: 'Users', path: '/users', icon: Users, minimumRole: 'ADMIN' },
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
    { title: 'Bundles', path: '/bundles', icon: Package, minimumRole: 'ADMIN' },
    { title: 'User Apps', path: '/apps', icon: LayoutGrid, minimumRole: 'ADMIN' },
    { title: 'Wallets', path: '/wallets', icon: Wallet, minimumRole: 'ADMIN' },
    { title: 'Infrastructure', path: '/plugins', icon: Plug, minimumRole: 'ADMIN' },
    { title: 'Integrations', path: '/integrations', icon: Cable, minimumRole: 'ADMIN' },
    { title: 'Data Sources', path: '/data-sources', icon: Database, minimumRole: 'ADMIN' },
    { title: 'Data Packages', path: '/data-packages', icon: PackageCheck, minimumRole: 'ADMIN' },
    {
        title: 'Trust Registries',
        path: '/trust-registries',
        icon: ShieldCheck,
        minimumRole: 'ADMIN',
    },
    {
        title: 'Skills Registries',
        path: '/skills-registries',
        icon: BookMarked,
        minimumRole: 'ADMIN',
    },
    { title: 'Pathway Registries', path: '/pathway-registries', icon: Route, minimumRole: 'ADMIN' },
    { title: 'Bindings', path: '/bindings', icon: Link2, minimumRole: 'ADMIN' },
];

export const dataRoutes: RouteDefinition[] = [
    { title: 'LearnClouds', path: '/learncloud', icon: Globe },
    { title: 'Pipelines', path: '/pipelines', icon: Route },
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
