export type CoverageEntry = {
    id: string;
    sourceRef: string;
    novaViews: number;
    openaiViews: number;
    stable: boolean;
};
export type CoverageChange = {
    id?: string;
    sourceRef?: string;
    deleted?: boolean;
    reset?: boolean;
};
export type CoverageScanStorage = {
    highWater: () => Promise<string>;
    page: (
        cursor: string,
        highWater: string,
        limit: number
    ) => Promise<{
        rows: CoverageEntry[];
        cursor: string;
        done: boolean;
        scanned: number;
    }>;
    byIds: (ids: string[]) => Promise<CoverageEntry[]>;
    changes: (limit: number) => Promise<{ events: CoverageChange[]; drained: boolean }>;
};
/** Process-local resumable scan. No learner identifiers or content are persisted. */
export class CoverageScan {
    private entries = new Map<string, CoverageEntry & { seen: number }>();
    private dirty = new Set<string>();
    private bySource = new Map<string, string>();
    private remove(id: string) {
        const prior = this.entries.get(id);
        if (prior && this.bySource.get(prior.sourceRef) === id)
            this.bySource.delete(prior.sourceRef);
        this.entries.delete(id);
    }
    private cursor = '';
    private high = '';
    private round = 0;
    private finished = true;
    private initialized = false;
    private completeAt: string | null = null;
    private scanned = 0;
    private processedDirtyLast = false;
    constructor(
        private storage: CoverageScanStorage,
        private batchSize = 100,
        private capacity = 100000
    ) {}
    private apply(events: CoverageChange[]) {
        for (const event of events) {
            if (event.reset) throw new Error('Coverage inventory invalidated');
            const ids = event.id
                ? [event.id]
                : event.sourceRef && this.bySource.has(event.sourceRef)
                  ? [this.bySource.get(event.sourceRef)!]
                  : [];
            for (const id of ids) {
                if (event.deleted) {
                    this.remove(id);
                    this.dirty.delete(id);
                } else {
                    this.dirty.add(id);
                    const prior = this.entries.get(id);
                    if (prior) this.entries.set(id, { ...prior, stable: false });
                }
            }
        }
        if (this.dirty.size > this.capacity)
            throw new Error('Coverage change backlog exceeds capacity');
    }
    private save(rows: CoverageEntry[], requested?: string[]) {
        if (requested)
            for (const id of requested) {
                this.remove(id);
                this.dirty.delete(id);
            }
        for (const row of rows) {
            this.remove(row.id);
            this.entries.set(row.id, { ...row, seen: this.round });
            this.bySource.set(row.sourceRef, row.id);
            if (!row.stable) this.dirty.add(row.id);
        }
        if (this.entries.size > this.capacity)
            throw new Error('Coverage inventory exceeds capacity');
    }
    async step() {
        const before = await this.storage.changes(this.batchSize);
        this.apply(before.events);
        if (this.finished) {
            this.high = await this.storage.highWater();
            this.cursor = '';
            this.finished = false;
            this.round += 1;
            this.scanned = 0;
        }
        const pending = [...this.dirty].slice(0, this.batchSize);
        if (pending.length && (!this.processedDirtyLast || this.finished)) {
            this.save(await this.storage.byIds(pending), pending);
            this.processedDirtyLast = true;
        } else {
            this.processedDirtyLast = false;
            const page = this.high
                ? await this.storage.page(this.cursor, this.high, this.batchSize)
                : { rows: [], cursor: this.cursor, done: true, scanned: 0 };
            this.save(page.rows);
            this.scanned += page.scanned;
            this.cursor = page.cursor;
            if (page.done) {
                for (const [id, row] of this.entries)
                    if (row.seen !== this.round && id <= this.high) this.remove(id);
                this.finished = true;
                this.initialized = true;
            }
        }
        const after = await this.storage.changes(this.batchSize);
        this.apply(after.events);
        const complete = this.initialized && !this.dirty.size && before.drained && after.drained;
        if (complete) this.completeAt = new Date().toISOString();
        return {
            rows: [...this.entries.values()].map(
                ({ seen: _, id: __, sourceRef: ___, ...row }) => row
            ),
            complete,
            scanning: !this.finished,
            scannedThisPass: this.scanned,
            pendingChanges: this.dirty.size,
            snapshotAt: this.completeAt,
            batchSize: this.batchSize,
        };
    }
}
