import { useState } from 'react';
import { ExternalLink, Maximize2, Minimize2, RefreshCw, Search } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { useConsoleSurfaces } from '../hooks/useConsoleSurfaces';
import { SurfaceGate } from '../components/SurfaceGate';
import type { DashboardSession } from '../api';

const SURFACE_SLUG = 'credential-finder';

// ADR-015 D1/D4: this page is the console-owned FIRST_PARTY renderer for the surface declared on
// the Credential Engine registry-adapter Integration's signed manifest. It renders only while
// brain projects that surface (READY install + ACTIVE registry-adapter binding + role).
export function CredentialFinder({ session }: { session: DashboardSession }) {
    const surfaces = useConsoleSurfaces(session);
    const surface = surfaces.find(candidate => candidate.slug === SURFACE_SLUG);
    const [frameKey, setFrameKey] = useState(0);
    const [fullscreen, setFullscreen] = useState(false);

    return (
        <SurfaceGate
            session={session}
            pageName="Credential Finder"
            listingName="Credential Engine"
            listingId={surface?.listingId || 'credential-engine'}
            catalogHref="/bundles"
            requiredCapabilities={['registry-adapter']}
        >
            <div
                className={
                    fullscreen
                        ? 'fixed inset-0 z-50 bg-background p-4 flex flex-col gap-3'
                        : 'space-y-4'
                }
            >
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="font-display text-3xl font-bold text-foreground flex items-center gap-2">
                            <Search className="w-7 h-7 text-lc-blue" />
                            {surface?.navLabel || 'Credential Finder'}
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Search every credential, organization, and competency published to the
                            Credential Registry.
                            {surface?.listingDisplayName && (
                                <Badge variant="secondary" className="ml-2 text-[10px]">
                                    {surface.listingDisplayName}
                                </Badge>
                            )}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setFrameKey(k => k + 1)}>
                            <RefreshCw className="w-4 h-4 mr-1.5" /> Reload
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setFullscreen(f => !f)}>
                            {fullscreen ? (
                                <Minimize2 className="w-4 h-4 mr-1.5" />
                            ) : (
                                <Maximize2 className="w-4 h-4 mr-1.5" />
                            )}
                            {fullscreen ? 'Exit' : 'Fullscreen'}
                        </Button>
                        {surface?.entryUrl && (
                            <a href={surface.entryUrl} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" size="sm">
                                    <ExternalLink className="w-4 h-4 mr-1.5" /> Open
                                </Button>
                            </a>
                        )}
                    </div>
                </div>
                <div
                    className={`rounded-xl border border-border overflow-hidden bg-card ${
                        fullscreen ? 'flex-1' : ''
                    }`}
                >
                    {surface?.entryUrl && (
                        <iframe
                            key={frameKey}
                            src={surface.entryUrl}
                            title={surface.navLabel || 'Credential Finder'}
                            className={`w-full ${
                                fullscreen ? 'h-full' : 'h-[calc(100vh-16rem)] min-h-[600px]'
                            }`}
                            loading="lazy"
                        />
                    )}
                </div>
            </div>
        </SurfaceGate>
    );
}
