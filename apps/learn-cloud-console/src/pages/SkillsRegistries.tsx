import { useCallback, useEffect, useState } from 'react';
import { BookMarked, Database, Layers, Loader2, Search, Sparkles } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { ClampText } from '../components/ClampText';
import { getSkillFramework, listSkillFrameworks } from '../api';
import type { SkillFramework, SkillFrameworkDetail } from '../api';

export function SkillsRegistries() {
    const [frameworks, setFrameworks] = useState<SkillFramework[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [openId, setOpenId] = useState<string | null>(null);
    const [details, setDetails] = useState<Record<string, SkillFrameworkDetail>>({});
    const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null);
    const [detailError, setDetailError] = useState<string | null>(null);

    const loadFrameworks = useCallback(async () => {
        setError(null);
        try {
            setFrameworks(await listSkillFrameworks({ limit: 200 }));
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadFrameworks();
    }, [loadFrameworks]);

    const toggleFramework = async (id: string) => {
        if (openId === id) {
            setOpenId(null);
            return;
        }

        setOpenId(id);
        setDetailError(null);
        if (details[id]) return;

        setDetailLoadingId(id);
        try {
            const detail = await getSkillFramework({ id });
            setDetails(current => ({ ...current, [id]: detail }));
        } catch (e) {
            setDetailError(e instanceof Error ? e.message : String(e));
        } finally {
            setDetailLoadingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const totalCompetencies = frameworks.reduce((sum, framework) => sum + framework.skillCount, 0);

    // AGENTS.md rule 4: the console has no author-your-own-competency primitive, so this
    // stat is a real zero rather than a faked prototype number.
    const authoredCompetencies = 0;

    const term = search.toLowerCase();
    const filtered = frameworks.filter(
        framework =>
            framework.name.toLowerCase().includes(term) ||
            (framework.description ?? '').toLowerCase().includes(term)
    );

    const renderCard = (framework: SkillFramework) => {
        const detail = details[framework.id];
        const isOpen = openId === framework.id;

        return (
            <div
                key={framework.id}
                className="bg-card border border-border rounded-xl p-4 md:p-6 shadow-card transition-all cursor-pointer hover:shadow-lg hover:border-primary/40"
                onClick={() => void toggleFramework(framework.id)}
                role="button"
                title={`Open ${framework.name}`}
            >
                <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10 text-primary shrink-0 overflow-hidden">
                            {framework.image ? (
                                <img
                                    src={framework.image}
                                    alt={framework.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <BookMarked className="w-6 h-6" />
                            )}
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-display font-bold text-foreground flex items-center gap-1.5">
                                {framework.name}
                            </h3>
                            <div className="flex flex-wrap items-center gap-1 mt-1">
                                <Badge
                                    variant={framework.isPublic ? 'secondary' : 'outline'}
                                    className="text-[10px]"
                                >
                                    {framework.isPublic ? 'Public' : 'Private'}
                                </Badge>
                                {framework.status === 'archived' && (
                                    <Badge variant="warning" className="text-[10px]">
                                        Archived
                                    </Badge>
                                )}
                                <Badge variant="secondary" className="text-[10px] gap-1">
                                    <Database className="w-3 h-3" />
                                    {framework.skillCount.toLocaleString()} competencies
                                </Badge>
                                {detail && (
                                    <Badge variant="secondary" className="text-[10px] gap-1">
                                        <Sparkles className="w-3 h-3" />
                                        {detail.boostCount} boosts
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <ClampText
                    text={framework.description}
                    className="text-sm text-muted-foreground mb-4"
                />

                {isOpen && (
                    <div className="border-t border-border pt-4 space-y-2">
                        {detailLoadingId === framework.id && (
                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        )}
                        {detailError && detailLoadingId !== framework.id && !detail && (
                            <p className="text-sm text-destructive">{detailError}</p>
                        )}
                        {detail && detail.skills.records.length === 0 && (
                            <p className="text-sm text-muted-foreground">
                                This framework has no competencies yet.
                            </p>
                        )}
                        {detail && detail.skills.records.length > 0 && (
                            <ul className="space-y-1">
                                {detail.skills.records.map(skill => (
                                    <li
                                        key={skill.id}
                                        className="text-sm text-foreground flex items-baseline gap-2"
                                    >
                                        <span className="text-muted-foreground">•</span>
                                        <span className="min-w-0">
                                            {skill.statement}
                                            {skill.hasChildren && (
                                                <span className="text-muted-foreground">
                                                    {' '}
                                                    ({skill.children.length} sub-competencies)
                                                </span>
                                            )}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {framework.sourceURI &&
                            (/^https?:/.test(framework.sourceURI) ? (
                                <a
                                    href={framework.sourceURI}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-block text-sm text-lc-blue hover:underline"
                                    onClick={e => e.stopPropagation()}
                                >
                                    {framework.sourceURI}
                                </a>
                            ) : (
                                <p className="text-xs text-muted-foreground">
                                    {framework.sourceURI}
                                </p>
                            ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div>
                <h1 className="font-display text-3xl font-bold text-foreground flex items-center gap-2">
                    <BookMarked className="w-7 h-7 text-lc-blue" />
                    Skills Registries
                </h1>
                <p className="text-muted-foreground mt-1">
                    Install skills and competency frameworks. Everything you install merges into
                    your own skills registry.
                </p>
            </div>

            <div className="bg-gradient-to-br from-primary/10 via-card to-card border border-primary/20 rounded-xl p-4 md:p-5">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <Layers className="w-5 h-5 text-violet" />
                            <h2 className="font-display font-bold text-foreground">
                                Your Skills Registry
                            </h2>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            The combination of every framework you have installed, plus the
                            competencies you author yourself.
                        </p>
                        <div className="flex flex-wrap items-center gap-4 mt-3">
                            <div>
                                <p className="font-display text-xl font-bold text-foreground">
                                    {totalCompetencies.toLocaleString()}
                                </p>
                                <p className="text-xs text-muted-foreground">competencies</p>
                            </div>
                            <div>
                                <p className="font-display text-xl font-bold text-foreground">
                                    {frameworks.length}
                                </p>
                                <p className="text-xs text-muted-foreground">sources installed</p>
                            </div>
                            <div>
                                <p className="font-display text-xl font-bold text-foreground">
                                    {authoredCompetencies}
                                </p>
                                <p className="text-xs text-muted-foreground">your own entries</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {error && (
                <div className="rounded-lg bg-destructive/15 p-4 text-destructive border border-destructive/20">
                    {error}
                </div>
            )}

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    className="pl-10"
                    placeholder="Search skills registries..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {filtered.length > 0 && (
                <section className="space-y-3">
                    <div className="flex items-center gap-2">
                        <h2 className="font-display text-lg font-bold text-foreground">Active</h2>
                        <Badge className="bg-emerald/10 text-emerald border-emerald/30">
                            {filtered.length}
                        </Badge>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3 md:gap-4">
                        {filtered.map(renderCard)}
                    </div>
                </section>
            )}

            {filtered.length === 0 && search && (
                <div className="text-center py-12 text-muted-foreground">
                    No registries match your search.
                </div>
            )}

            {frameworks.length === 0 && !search && (
                <div className="text-center py-12 text-muted-foreground">
                    No skill frameworks available to this ecosystem.
                </div>
            )}
        </div>
    );
}
