/**
 * Build-time minifier for inline SVG path data in JSX (`d="..."`).
 *
 * The icon components are Figma exports: absolute coordinates with four decimals on 200-unit
 * view boxes. They are ~1 MB of the JS the app loads before the first dashboard paint. This
 * rounds every point to a fixed grid and writes each command in whichever of absolute or
 * relative form is shorter. Points are rounded as absolutes, so the error per point stays
 * under half a grid step and never accumulates along a path.
 *
 * Grid: 0.01 when the path's largest coordinate is >= 10, 0.001 when >= 1. Paths with smaller
 * coordinates (e.g. objectBoundingBox clip paths) and anything we cannot parse are left as is.
 */

const PARAMS: Record<string, number> = {
    m: 2,
    l: 2,
    h: 1,
    v: 1,
    c: 6,
    s: 4,
    q: 4,
    t: 2,
    a: 7,
    z: 0,
};

const TOKEN = /([MmZzLlHhVvCcSsQqTtAa])|([-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?)|([\s,]+)/y;

type Seg = { cmd: string; vals: number[] };

const parse = (d: string): Seg[] | null => {
    const tokens: (string | number)[] = [];
    const raw: string[] = [];
    TOKEN.lastIndex = 0;
    while (TOKEN.lastIndex < d.length) {
        const m = TOKEN.exec(d);
        if (!m) return null;
        if (m[1]) {
            tokens.push(m[1]);
            raw.push(m[1]);
        } else if (m[2]) {
            tokens.push(Number(m[2]));
            raw.push(m[2]);
        }
    }
    const segs: Seg[] = [];
    let i = 0;
    let cmd = '';
    while (i < tokens.length) {
        const t = tokens[i];
        if (typeof t === 'string') {
            cmd = t;
            i++;
            if (cmd === 'z' || cmd === 'Z') {
                segs.push({ cmd, vals: [] });
                continue;
            }
        } else if (!cmd || cmd === 'z' || cmd === 'Z') return null;
        const n = PARAMS[cmd.toLowerCase()];
        const vals = tokens.slice(i, i + n);
        if (vals.length !== n || vals.some(v => typeof v !== 'number')) return null;
        if (cmd === 'a' || cmd === 'A') {
            // flags may be written packed ("0 01 5"); only accept them as separate 0/1 tokens
            const flags = [raw[i + 3], raw[i + 4]];
            if (flags.some(f => f !== '0' && f !== '1')) return null;
        }
        segs.push({ cmd, vals: vals as number[] });
        i += n;
        // implicit repeats: extra pairs after a moveto are linetos
        if (cmd === 'M') cmd = 'L';
        else if (cmd === 'm') cmd = 'l';
    }
    return segs;
};

const fmt = (n: number, scale: number, decimals: number): string => {
    if (n === 0) return '0';
    let s = (n / scale).toFixed(decimals);
    if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
    return s.replace(/^(-?)0\./, '$1.');
};

const join = (nums: string[]): string => {
    let out = '';
    for (const s of nums) {
        if (out && !s.startsWith('-') && !(s.startsWith('.') && /\.\d*$/.test(out))) out += ' ';
        out += s;
    }
    return out;
};

export const minifyPathData = (d: string): string => {
    const segs = parse(d);
    if (!segs || segs.length === 0) return d;

    // pass 1: absolute float coordinates, to pick the grid
    let maxAbs = 0;
    {
        let x = 0;
        let y = 0;
        let sx = 0;
        let sy = 0;
        for (const { cmd, vals } of segs) {
            const rel = cmd === cmd.toLowerCase();
            const c = cmd.toLowerCase();
            if (c === 'z') {
                x = sx;
                y = sy;
                continue;
            }
            if (c === 'h') x = (rel ? x : 0) + vals[0];
            else if (c === 'v') y = (rel ? y : 0) + vals[0];
            else {
                const ex = (rel ? x : 0) + vals[vals.length - 2];
                const ey = (rel ? y : 0) + vals[vals.length - 1];
                x = ex;
                y = ey;
                if (c === 'm') {
                    sx = x;
                    sy = y;
                }
            }
            maxAbs = Math.max(maxAbs, Math.abs(x), Math.abs(y));
        }
    }
    if (!(maxAbs >= 1) || !Number.isFinite(maxAbs)) return d;
    const decimals = maxAbs >= 10 ? 2 : 3;
    const scale = 10 ** decimals;
    const r = (v: number) => Math.round(v * scale);

    let out = '';
    let lastCmd = '';
    let x = 0; // exact current point
    let y = 0;
    let sx = 0;
    let sy = 0;
    let xi = 0; // rounded current point (grid units)
    let yi = 0;
    let sxi = 0;
    let syi = 0;

    const emit = (cmdAbs: string, absNums: string[], relNums: string[]) => {
        const cmdRel = cmdAbs.toLowerCase();
        const a = join(absNums);
        const b = join(relNums);
        const useRel = b.length < a.length || (b.length === a.length && lastCmd === cmdRel);
        const c = useRel ? cmdRel : cmdAbs;
        const body = useRel ? b : a;
        const repeat = c === lastCmd && c !== 'm' && c !== 'M';
        if (repeat && !body.startsWith('-')) {
            // implicit repeat needs a separator unless the number carries its own
            const sep = body.startsWith('.') && /\.\d*$/.test(out) ? '' : ' ';
            out += sep + body;
        } else if (repeat) out += body;
        else out += c + body;
        lastCmd = c;
    };

    for (const { cmd, vals } of segs) {
        const rel = cmd === cmd.toLowerCase();
        const c = cmd.toLowerCase();
        if (c === 'z') {
            out += lastCmd === 'z' ? '' : 'z';
            lastCmd = 'z';
            x = sx;
            y = sy;
            xi = sxi;
            yi = syi;
            continue;
        }
        const ox = rel ? x : 0;
        const oy = rel ? y : 0;
        if (c === 'h') {
            const ax = ox + vals[0];
            const axi = r(ax);
            emit('H', [fmt(axi, scale, decimals)], [fmt(axi - xi, scale, decimals)]);
            x = ax;
            xi = axi;
            continue;
        }
        if (c === 'v') {
            const ay = oy + vals[0];
            const ayi = r(ay);
            emit('V', [fmt(ayi, scale, decimals)], [fmt(ayi - yi, scale, decimals)]);
            y = ay;
            yi = ayi;
            continue;
        }
        if (c === 'a') {
            const [rx, ry, rot, large, sweep, ex, ey] = vals;
            const ax = ox + ex;
            const ay = oy + ey;
            const axi = r(ax);
            const ayi = r(ay);
            const head = [
                fmt(r(rx), scale, decimals),
                fmt(r(ry), scale, decimals),
                fmt(r(rot), scale, decimals),
                String(large),
                String(sweep),
            ];
            emit(
                'A',
                [...head, fmt(axi, scale, decimals), fmt(ayi, scale, decimals)],
                [...head, fmt(axi - xi, scale, decimals), fmt(ayi - yi, scale, decimals)]
            );
            x = ax;
            y = ay;
            xi = axi;
            yi = ayi;
            continue;
        }
        // m l c s q t: all params are x,y pairs
        const absNums: string[] = [];
        const relNums: string[] = [];
        let px = 0;
        let py = 0;
        for (let k = 0; k < vals.length; k += 2) {
            px = ox + vals[k];
            py = oy + vals[k + 1];
            const pxi = r(px);
            const pyi = r(py);
            absNums.push(fmt(pxi, scale, decimals), fmt(pyi, scale, decimals));
            relNums.push(fmt(pxi - xi, scale, decimals), fmt(pyi - yi, scale, decimals));
        }
        emit(cmd.toUpperCase(), absNums, relNums);
        x = px;
        y = py;
        xi = r(px);
        yi = r(py);
        if (c === 'm') {
            sx = x;
            sy = y;
            sxi = xi;
            syi = yi;
        }
    }
    return out;
};

const D_ATTR = /(\sd=)(["'])([MmLlHhVvCcSsQqTtAaZz0-9.,\s+eE-]+)\2/g;

/** Rewrite every JSX `d="..."` path string in a source file. Returns null when nothing changed. */
export const minifySvgPathDataInSource = (code: string): string | null => {
    if (!code.includes(' d=')) return null;
    let changed = false;
    const next = code.replace(D_ATTR, (whole, pre: string, q: string, d: string) => {
        if (d.includes('\n')) return whole;
        const min = minifyPathData(d);
        if (min.length >= d.length) return whole;
        changed = true;
        return `${pre}${q}${min}${q}`;
    });
    return changed ? next : null;
};
