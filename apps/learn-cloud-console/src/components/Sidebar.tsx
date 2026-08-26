import {
    LayoutDashboard,
    Network,
    Users,
    Wallet,
    Library,
    Download,
    Link as LinkIcon,
    Cloud,
    ShieldCheck,
    Map,
    Activity,
} from 'lucide-react';
import { cn } from '../lib/utils';

const navItems = [
    {
        title: 'Overview',
        items: [
            { title: 'Overview', icon: LayoutDashboard, href: '#', active: false },
            { title: 'Ecosystem', icon: Network, href: '#', active: false },
            { title: 'Users', icon: Users, href: '#', active: false },
            { title: 'Funding', icon: Wallet, href: '#', active: false },
        ],
    },
    {
        title: 'Ecosystem',
        items: [
            { title: 'Catalog', icon: Library, href: '#', active: false },
            { title: 'Installs', icon: Download, href: '#', active: true },
            { title: 'Connections', icon: LinkIcon, href: '#', active: false },
        ],
    },
    {
        title: 'Infrastructure',
        items: [
            { title: 'LearnCloud', icon: Cloud, href: '#', active: false },
            { title: 'Registries', icon: ShieldCheck, href: '#', active: false },
            { title: 'Pathways', icon: Map, href: '#', active: false },
        ],
    },
    {
        title: 'Governance',
        items: [{ title: 'Activity', icon: Activity, href: '#', active: false }],
    },
];

export function Sidebar() {
    return (
        <aside className="hidden border-r bg-sidebar lg:block w-64 flex-shrink-0">
            <div className="flex h-full flex-col gap-2">
                <div className="flex h-16 items-center border-b px-6">
                    <div className="flex items-center gap-2 font-display font-bold text-xl tracking-tight text-sidebar-foreground">
                        <div className="h-8 w-8 rounded-lg bg-gradient-brand flex items-center justify-center text-white">
                            <Cloud className="h-5 w-5" />
                        </div>
                        EducationOS
                    </div>
                </div>
                <div className="flex-1 overflow-auto py-4">
                    <nav className="grid items-start px-4 text-sm font-medium gap-6">
                        {navItems.map((section, i) => (
                            <div key={i} className="flex flex-col gap-2">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50 px-2">
                                    {section.title}
                                </h4>
                                <div className="flex flex-col gap-1">
                                    {section.items.map((item, j) => (
                                        <a
                                            key={j}
                                            href={item.href}
                                            className={cn(
                                                'flex items-center gap-3 rounded-md px-3 py-2 text-sidebar-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                                                item.active
                                                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold'
                                                    : 'text-sidebar-foreground/80'
                                            )}
                                        >
                                            <item.icon className="h-4 w-4" />
                                            {item.title}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </nav>
                </div>
            </div>
        </aside>
    );
}
