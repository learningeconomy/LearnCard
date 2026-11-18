import { describe, expect, it } from 'vitest';

import { minifyPathData, minifySvgPathDataInSource } from './minifySvgPathData';

// Absolute coordinates of every point (end and control points) a path visits, per segment.
const absPoints = (d: string): number[][] => {
    const toks = d.match(/[MmZzLlHhVvCcSsQqTtAa]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g) ?? [];
    const n: Record<string, number> = {
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
    const out: number[][] = [];
    let x = 0,
        y = 0,
        sx = 0,
        sy = 0,
        cmd = '',
        i = 0;
    while (i < toks.length) {
        if (/[a-z]/i.test(toks[i])) cmd = toks[i++];
        const c = cmd.toLowerCase();
        const rel = cmd !== cmd.toUpperCase();
        if (c === 'z') {
            x = sx;
            y = sy;
            out.push([x, y]);
            continue;
        }
        const v = toks.slice(i, i + n[c]).map(Number);
        i += n[c];
        const pts: number[] = [];
        if (c === 'h') {
            x = (rel ? x : 0) + v[0];
            pts.push(x, y);
        } else if (c === 'v') {
            y = (rel ? y : 0) + v[0];
            pts.push(x, y);
        } else if (c === 'a') {
            pts.push(v[0], v[1], v[2], v[3], v[4]);
            x = (rel ? x : 0) + v[5];
            y = (rel ? y : 0) + v[6];
            pts.push(x, y);
        } else {
            const ox = rel ? x : 0,
                oy = rel ? y : 0;
            for (let k = 0; k < v.length; k += 2) pts.push(ox + v[k], oy + v[k + 1]);
            x = pts[pts.length - 2];
            y = pts[pts.length - 1];
        }
        if (c === 'm') {
            sx = x;
            sy = y;
            cmd = rel ? 'l' : 'L';
        }
        out.push(pts);
    }
    return out;
};

const expectClose = (a: string, b: string, tol: number) => {
    const pa = absPoints(a);
    const pb = absPoints(b);
    expect(pb.length).toBe(pa.length);
    pa.forEach((seg, i) => {
        expect(pb[i].length).toBe(seg.length);
        seg.forEach((v, k) => expect(Math.abs(v - pb[i][k])).toBeLessThanOrEqual(tol));
    });
};

describe('minifyPathData', () => {
    it('keeps every point within half a grid step and shortens Figma output', () => {
        const d =
            'M113.833 50C113.833 55.3043 115.941 60.3914 119.691 64.1421C123.442 67.8928 128.529 70 133.833 70H140.5V80.25L120.125 90.75Z';
        const min = minifyPathData(d);
        expect(min.length).toBeLessThan(d.length);
        expectClose(d, min, 0.005 + 1e-9);
    });

    it('does not accumulate rounding error along long relative paths', () => {
        const d = 'M10 10' + ' l0.004 0.004'.repeat(500);
        expectClose(d, minifyPathData(d), 0.005 + 1e-9);
    });

    it('handles arcs, implicit linetos and multiple subpaths', () => {
        const d =
            'M20 20 30 30 40 20A5.555 5.555 0 0 1 50.123 25.456Z m5 5 h10v10z M100.5 100.5 L 110.25,-120.75';
        expectClose(d, minifyPathData(d), 0.005 + 1e-9);
    });

    it('uses a finer grid for small view boxes and leaves sub-unit paths alone', () => {
        const d = 'M1.23456 2.34567L3.45678 4.56789';
        expectClose(d, minifyPathData(d), 0.0005 + 1e-9);
        expect(minifyPathData('M0.1234 0.2345L0.5 0.5Z')).toBe('M0.1234 0.2345L0.5 0.5Z');
    });

    it('leaves unparseable or packed-flag paths unchanged', () => {
        expect(minifyPathData('M10 10 L foo')).toBe('M10 10 L foo');
        expect(minifyPathData('M10 10a5 5 0 01 20 20')).toBe('M10 10a5 5 0 01 20 20');
    });
});

describe('minifySvgPathDataInSource', () => {
    it('rewrites only d attributes', () => {
        const src = '<path d="M10.0000 10.0000L20.0000 20.0000" id="d" data-d="M1 1" />';
        expect(minifySvgPathDataInSource(src)).toBe(
            '<path d="M10 10L20 20" id="d" data-d="M1 1" />'
        );
        expect(minifySvgPathDataInSource('const d = 1;')).toBeNull();
    });
});
