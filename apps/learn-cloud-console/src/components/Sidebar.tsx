import React, { useState } from 'react';
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
    AppWindow,
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
    LogOut,
    PanelLeft,
    ChevronRight,
} from 'lucide-react';
import { cn } from '../lib/utils';
import eduosHorizontal from '../assets/eduos-horizontal-black.png';

interface SidebarProps {
    collapsed: boolean;
    onToggle: () => void;
}

interface MenuItem {
    title: string;
    icon: React.ElementType;
    href: string;
    active?: boolean;
}

const topItems: MenuItem[] = [
    { title: 'Overview', icon: LayoutDashboard, href: '#', active: true },
    { title: 'Ecosystem', icon: Building2, href: '#' },
    { title: 'My Stack', icon: Layers, href: '#' },
    { title: 'Users', icon: Users, href: '#' },
];

const appsItems: MenuItem[] = [
    { title: 'Analytics', icon: BarChart3, href: '#' },
    { title: 'Funding', icon: HandCoins, href: '#' },
    { title: 'Admissions', icon: GraduationCap, href: '#' },
    { title: 'Credential Finder', icon: Search, href: '#' },
    { title: 'LER Test Suite', icon: FlaskConical, href: '#' },
];

const pluginsItems: MenuItem[] = [
    { title: 'Bundles', icon: Package, href: '#' },
    { title: 'User Apps', icon: LayoutGrid, href: '#' },
    { title: 'Wallets', icon: Wallet, href: '#' },
    { title: 'Infrastructure', icon: Plug, href: '#' },
    { title: 'Integrations', icon: Cable, href: '#' },
    { title: 'Data Sources', icon: Database, href: '#' },
    { title: 'Data Packages', icon: PackageCheck, href: '#' },
    { title: 'Trust Registries', icon: ShieldCheck, href: '#' },
    { title: 'Skills Registries', icon: BookMarked, href: '#' },
    { title: 'Pathway Registries', icon: Route, href: '#' },
];

const dataItems: MenuItem[] = [
    { title: 'LearnClouds', icon: Globe, href: '#' },
    { title: 'Pipelines', icon: Route, href: '#' },
    { title: 'Bindings', icon: Link2, href: '#' },
];

function MenuItems({ items, collapsed }: { items: MenuItem[]; collapsed: boolean }) {
    return (
        <ul className="flex w-full min-w-0 flex-col gap-0.5">
            {items.map(item => (
                <li key={item.title} className="relative">
                    <a
                        href={item.href}
                        className={cn(
                            'flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-[13px] outline-none transition-[width,height,padding] hover:bg-muted/50 h-8',
                            item.active ? 'text-lc-blue font-medium' : 'text-sidebar-foreground'
                        )}
                    >
                        <span className="relative mr-2 shrink-0">
                            <item.icon
                                className={cn('h-4 w-4', item.active ? 'text-lc-blue' : '')}
                            />
                        </span>
                        {!collapsed && <span>{item.title}</span>}
                    </a>
                </li>
            ))}
        </ul>
    );
}

function CollapsibleGroup({
    label,
    items,
    collapsed,
    icon: GroupIcon,
    open,
    onOpenChange,
}: {
    label: string;
    items: MenuItem[];
    collapsed: boolean;
    icon: React.ElementType;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    if (collapsed) {
        return (
            <div className="relative flex w-full min-w-0 flex-col py-0">
                <div className="w-full text-sm">
                    <MenuItems items={items} collapsed={collapsed} />
                </div>
            </div>
        );
    }

    return (
        <div className="group/collapsible">
            <div className="relative flex w-full min-w-0 flex-col py-0">
                <button
                    type="button"
                    onClick={() => onOpenChange(!open)}
                    className="h-8 w-full rounded-md bg-lc-blue/10 hover:bg-lc-blue/15 transition-colors cursor-pointer flex items-center gap-2 px-2 text-[13px]"
                >
                    <span className="relative mr-2 shrink-0">
                        <GroupIcon className="h-4 w-4" />
                    </span>
                    <span className="flex-1 text-left text-[13px]">{label}</span>
                    <ChevronRight
                        className={cn(
                            'h-3 w-3 transition-transform duration-200',
                            open ? 'rotate-90' : ''
                        )}
                    />
                </button>
                {open && (
                    <div className="w-full text-sm pl-3 mt-0.5">
                        <MenuItems items={items} collapsed={collapsed} />
                    </div>
                )}
            </div>
        </div>
    );
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
    const [openGroup, setOpenGroup] = useState<'apps' | 'plugins' | 'data' | null>(null);

    const handleOpenChange = (group: 'apps' | 'plugins' | 'data') => (open: boolean) => {
        setOpenGroup(open ? group : null);
    };

    return (
        <aside
            className={cn(
                'hidden lg:flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border h-full transition-[width] duration-200 ease-linear shrink-0',
                collapsed ? 'w-[3rem]' : 'w-[16rem]'
            )}
        >
            <div className="flex min-h-0 flex-1 flex-col gap-0 overflow-auto">
                <div
                    className={cn(
                        'flex shrink-0',
                        collapsed
                            ? 'flex-col items-center justify-center px-2 py-3 gap-2'
                            : 'items-center px-3 py-3 gap-2'
                    )}
                >
                    <button
                        type="button"
                        onClick={onToggle}
                        className={cn(
                            'inline-flex items-center justify-center rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors shrink-0',
                            collapsed ? 'h-7 w-7 order-2' : 'h-8 w-8'
                        )}
                        aria-label="Toggle sidebar"
                    >
                        <PanelLeft className="h-4 w-4" />
                    </button>
                    {!collapsed && (
                        <a href="#" className="block flex-1 min-w-0">
                            <img
                                src={eduosHorizontal}
                                alt="Education OS"
                                className="object-contain cursor-pointer h-auto max-h-7 max-w-full w-auto"
                            />
                        </a>
                    )}
                    {!collapsed && (
                        <span className="inline-flex items-center justify-center rounded-full border px-1.5 py-0 text-[9px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-primary/30 text-primary h-4 shrink-0">
                            DEMO
                        </span>
                    )}
                </div>

                <div className="relative flex w-full min-w-0 flex-col p-2 py-1 pb-4">
                    <div className="w-full text-sm">
                        <MenuItems items={topItems} collapsed={collapsed} />
                    </div>
                </div>

                <div className="px-2">
                    <CollapsibleGroup
                        label="Apps"
                        items={appsItems}
                        collapsed={collapsed}
                        icon={LayoutGrid}
                        open={openGroup === 'apps'}
                        onOpenChange={handleOpenChange('apps')}
                    />
                    <div className="h-4" />
                    <CollapsibleGroup
                        label="Plugins"
                        items={pluginsItems}
                        collapsed={collapsed}
                        icon={AppWindow}
                        open={openGroup === 'plugins'}
                        onOpenChange={handleOpenChange('plugins')}
                    />
                    <div className="h-4" />
                    <CollapsibleGroup
                        label="Data"
                        items={dataItems}
                        collapsed={collapsed}
                        icon={Database}
                        open={openGroup === 'data'}
                        onOpenChange={handleOpenChange('data')}
                    />
                    <div className="h-4" />
                </div>

                <div className="relative flex w-full min-w-0 flex-col p-2 py-0">
                    <div className="w-full text-sm">
                        <MenuItems
                            items={[{ title: 'Settings', icon: Settings, href: '#' }]}
                            collapsed={collapsed}
                        />
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-2 p-2 mt-auto">
                <ul className="flex w-full min-w-0 flex-col gap-1">
                    <li className="relative">
                        <div className="flex items-center gap-1">
                            <a
                                href="#"
                                className="flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left outline-none transition-[width,height,padding] hover:bg-muted/50 text-[13px] text-muted-foreground h-8 flex-1"
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                {!collapsed && <span>Back to Site</span>}
                            </a>
                        </div>
                    </li>
                </ul>
            </div>
        </aside>
    );
}
