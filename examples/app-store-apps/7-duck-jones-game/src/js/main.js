import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Sfx } from './sfx.js';

// ---------- config ----------
const params = new URLSearchParams(location.search);
const LANE_W = 2.2;
const LEVEL_LEN = Number(params.get('len')) || 430;
const RELIC_COUNT = 5;
const BR = 1.3; // boulder radius
const MAX_HEARTS = 3;
const GRAVITY = 26;
const JUMP_V = 9.2;
let seed = Number(params.get('seed')) || 0;
let autopilot = params.get('autopilot') === '1';

const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
if (isTouch) document.body.classList.add('touch');

// ---------- renderer / scene ----------
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !isTouch,
    powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isTouch ? 1.5 : 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
const BG = 0x2a1a10;
scene.background = new THREE.Color(BG);
scene.fog = new THREE.Fog(BG, 22, 80);
const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);

scene.add(new THREE.HemisphereLight(0xffe6b8, 0x4a2c16, 1.15));
const sun = new THREE.DirectionalLight(0xfff1d6, 1.7);
sun.position.set(3, 9, 5);
scene.add(sun);
scene.add(sun.target);
const torchGlow = new THREE.PointLight(0xff9a3c, 14, 14, 1.6);
scene.add(torchGlow);
const idolGlow = new THREE.PointLight(0xffd36b, 30, 16, 1.5);
scene.add(idolGlow);

const gradientMap = (() => {
    const d = new Uint8Array([90, 175, 255]);
    const t = new THREE.DataTexture(d, d.length, 1, THREE.RedFormat);
    t.minFilter = t.magFilter = THREE.NearestFilter;
    t.needsUpdate = true;
    return t;
})();

const toonCache = new Map();
function toon(m) {
    if (toonCache.has(m.name)) return toonCache.get(m.name);
    const gold = /gold|brass/.test(m.name);
    const t = new THREE.MeshToonMaterial({
        color: m.color,
        gradientMap,
        name: m.name,
        emissive:
            m.emissive && m.emissive.getHex()
                ? m.emissive
                : gold
                  ? new THREE.Color(0x5a3a00)
                  : new THREE.Color(0),
        emissiveIntensity: m.emissive && m.emissive.getHex() ? 1.6 : 1,
    });
    toonCache.set(m.name, t);
    return t;
}

// Screen-space inverted-hull outline: constant pixel width, ink colour.
const outlineMat = new THREE.ShaderMaterial({
    uniforms: {
        res: { value: new THREE.Vector2(1, 1) },
        width: { value: 2.6 },
        color: { value: new THREE.Color(0x1a0e04) },
    },
    vertexShader: `uniform vec2 res; uniform float width;
    void main(){ vec4 p = vec4(position,1.0); vec3 nn = normal;
      #ifdef USE_INSTANCING
        p = instanceMatrix * p; nn = mat3(instanceMatrix) * nn;
      #endif
      vec4 clip = projectionMatrix * modelViewMatrix * p;
      vec3 n = normalize(normalMatrix * nn); vec2 d = (projectionMatrix * vec4(n,0.0)).xy;
      float l = length(d); if (l > 1e-5) d /= l;
      clip.xy += d * width * 2.0 * clip.w / res; gl_Position = clip; }`,
    fragmentShader: `uniform vec3 color; void main(){ gl_FragColor = vec4(color,1.0); }`,
    side: THREE.BackSide,
});
const NO_OUTLINE = /Shine|Pupil|Mouth|Brow|BellyShade|Ridge|Moss|Flame|Eye/;
function outline(root) {
    const meshes = [];
    root.traverse(o => {
        if (o.isMesh && !NO_OUTLINE.test(o.name) && !o.userData.isOutline) meshes.push(o);
    });
    for (const m of meshes) {
        const h = new THREE.Mesh(m.geometry, outlineMat);
        h.userData.isOutline = true;
        h.name = m.name + '_ink';
        m.add(h);
    }
}

// Bake a GLB group into one merged geometry per material, for instancing.
function partsOf(group) {
    group.updateMatrixWorld(true);
    const inv = group.matrixWorld.clone().invert();
    const byMat = new Map();
    group.traverse(o => {
        if (!o.isMesh) return;
        const g = o.geometry.clone();
        for (const k of Object.keys(g.attributes))
            if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
        g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
        const nonIdx = g.index ? g.toNonIndexed() : g;
        const key = o.material.name;
        if (!byMat.has(key)) byMat.set(key, { mat: toon(o.material), geos: [] });
        byMat.get(key).geos.push(nonIdx);
    });
    return [...byMat.values()].map(p => ({ mat: p.mat, geo: mergeGeometries(p.geos) }));
}
class Instanced {
    constructor(parts, count, { ink = false } = {}) {
        this.count = count;
        this.group = new THREE.Group();
        this.meshes = parts.map(p => {
            const m = new THREE.InstancedMesh(p.geo, p.mat, count);
            m.frustumCulled = false;
            this.group.add(m);
            return m;
        });
        if (ink)
            for (const p of parts) {
                if (/Flame/i.test(p.mat.name)) continue;
                const m = new THREE.InstancedMesh(p.geo, outlineMat, count);
                m.frustumCulled = false;
                this.meshes.push(m);
                this.group.add(m);
            }
        this.tmp = new THREE.Object3D();
        scene.add(this.group);
    }
    set(i, x, y, z, ry = 0, s = 1, sy = s, rx = 0, rz = 0) {
        const t = this.tmp;
        t.position.set(x, y, z);
        t.rotation.set(rx, ry, rz);
        t.scale.set(s, sy, s);
        t.updateMatrix();
        for (const m of this.meshes) m.setMatrixAt(i, t.matrix);
    }
    hide(i) {
        this.set(i, 0, -999, 0, 0, 0.0001);
    }
    commit() {
        for (const m of this.meshes) m.instanceMatrix.needsUpdate = true;
    }
}

// ---------- procedural textures ----------
function canvasTex(w, h, draw, rx, ry) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(rx, ry);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
}
function rnd(a) {
    let s = a >>> 0;
    return () => {
        s = (s + 0x6d2b79f5) >>> 0;
        let t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
function floorTex() {
    const r = rnd(7);
    return canvasTex(
        256,
        256,
        (g, w, h) => {
            g.fillStyle = '#6b4a2b';
            g.fillRect(0, 0, w, h);
            const cols = ['#c29a62', '#b88f58', '#caa46c', '#ad8550'];
            for (let y = 0; y < 2; y++)
                for (let x = 0; x < 2; x++) {
                    g.fillStyle = cols[(x + y * 2) % 4];
                    g.fillRect(x * 128 + 4, y * 128 + 4, 120, 120);
                    for (let i = 0; i < 70; i++) {
                        g.fillStyle = `rgba(60,35,15,${0.05 + r() * 0.1})`;
                        g.fillRect(
                            x * 128 + 4 + r() * 116,
                            y * 128 + 4 + r() * 116,
                            2 + r() * 6,
                            2 + r() * 6
                        );
                    }
                }
            g.strokeStyle = 'rgba(70,40,15,0.55)';
            g.lineWidth = 2;
            g.beginPath();
            g.moveTo(30, 40);
            g.lineTo(60, 70);
            g.lineTo(55, 100);
            g.stroke();
            g.beginPath();
            g.moveTo(170, 150);
            g.lineTo(200, 180);
            g.lineTo(240, 182);
            g.stroke();
            // a teal inlay duck-footprint glyph
            g.fillStyle = 'rgba(1,165,175,0.55)';
            g.beginPath();
            g.arc(192, 64, 10, 0, 7);
            g.fill();
            for (const a of [-0.6, 0, 0.6]) {
                g.beginPath();
                g.ellipse(192 + Math.sin(a) * 16, 64 - Math.cos(a) * 16, 4, 8, a, 0, 7);
                g.fill();
            }
        },
        2,
        LEVEL_LEN / 4
    );
}
function wallTex() {
    const r = rnd(11);
    return canvasTex(
        256,
        256,
        (g, w, h) => {
            g.fillStyle = '#4e331c';
            g.fillRect(0, 0, w, h);
            for (let row = 0; row < 4; row++)
                for (let i = -1; i < 3; i++) {
                    const x = i * 128 + (row % 2) * 64,
                        y = row * 64;
                    g.fillStyle = ['#9c7646', '#a77f4c', '#8f6a3e'][Math.floor(r() * 3)];
                    g.fillRect(x + 3, y + 3, 122, 58);
                }
            // carved glyphs: hat, duck head, wave
            g.strokeStyle = 'rgba(40,22,8,0.7)';
            g.lineWidth = 4;
            g.lineCap = 'round';
            g.beginPath();
            g.arc(70, 100, 14, Math.PI, 0);
            g.moveTo(46, 100);
            g.lineTo(94, 100);
            g.stroke();
            g.beginPath();
            g.arc(190, 160, 14, 0, 7);
            g.moveTo(204, 160);
            g.lineTo(222, 164);
            g.stroke();
            g.beginPath();
            for (let i = 0; i < 5; i++)
                g.quadraticCurveTo(40 + i * 20, i % 2 ? 216 : 236, 50 + i * 20, 226);
            g.stroke();
            g.fillStyle = 'rgba(1,165,175,0.6)';
            g.fillRect(150, 30, 26, 26);
        },
        LEVEL_LEN / 6,
        1.5
    );
}

// ---------- world ----------
const loader = new GLTFLoader();
const load = url => new Promise((res, rej) => loader.load(url, res, undefined, rej));
const W = {};
const lanesX = [-LANE_W, 0, LANE_W];

function buildWorld(duckGltf, propsGltf) {
    // duck
    const duck = duckGltf.scene.getObjectByName('DuckJones') || duckGltf.scene;
    duck.traverse(o => {
        if (o.isMesh) o.material = toon(o.material);
    });
    outline(duck);
    const duckRoot = new THREE.Group();
    duckRoot.add(duck);
    scene.add(duckRoot);
    W.duckRoot = duckRoot;
    W.duck = duck;
    W.parts = Object.fromEntries(
        ['HeadPivot', 'WingL', 'WingR', 'FootL', 'FootR', 'Hat', 'Satchel'].map(n => [
            n,
            duck.getObjectByName(n),
        ])
    );
    for (const p of Object.values(W.parts))
        if (p) p.userData.base = { pos: p.position.clone(), rot: p.rotation.clone() };
    const shadow = new THREE.Mesh(
        new THREE.CircleGeometry(0.45, 24),
        new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.35,
            depthWrite: false,
        })
    );
    shadow.rotation.x = -Math.PI / 2;
    scene.add(shadow);
    W.shadow = shadow;

    const P = propsGltf.scene;
    const get = n => P.getObjectByName(n);
    // floor + walls + ceiling beams
    const len = LEVEL_LEN + 90;
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(8.4, len),
        new THREE.MeshToonMaterial({ map: floorTex(), gradientMap })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, -LEVEL_LEN / 2 + 20);
    scene.add(floor);
    const wt = wallTex();
    for (const s of [-1, 1]) {
        const wall = new THREE.Mesh(
            new THREE.PlaneGeometry(len, 7),
            new THREE.MeshToonMaterial({ map: wt, gradientMap })
        );
        wall.rotation.y = (-s * Math.PI) / 2;
        wall.position.set(4.2 * s, 3.5, -LEVEL_LEN / 2 + 20);
        scene.add(wall);
    }
    const endWall = new THREE.Mesh(
        new THREE.PlaneGeometry(8.4, 7),
        new THREE.MeshToonMaterial({ map: wallTex(), gradientMap })
    );
    endWall.material.map.repeat.set(1.4, 1.5);
    endWall.position.set(0, 3.5, -LEVEL_LEN - 12);
    scene.add(endWall);
    // pillars + torches along both walls
    const spacing = 7,
        nP = Math.ceil(len / spacing);
    W.pillars = new Instanced(partsOf(get('Pillar')), nP * 2, { ink: true });
    W.torches = new Instanced(partsOf(get('Torch')), nP * 2);
    W.beams = new Instanced(
        [
            {
                mat: toon({ name: 'beam', color: new THREE.Color(0x58361d) }),
                geo: new THREE.BoxGeometry(8.6, 0.5, 0.7),
            },
        ],
        nP
    );
    for (let i = 0; i < nP; i++) {
        const z = 20 - i * spacing;
        W.pillars.set(i * 2, -3.55, 0, z, 0, 0.85);
        W.pillars.set(i * 2 + 1, 3.55, 0, z, 0, 0.85);
        W.torches.set(i * 2, -3.85, 0, z - spacing / 2, 0, 1.5);
        W.torches.set(i * 2 + 1, 3.85, 0, z - spacing / 2, 0, 1.5);
        W.beams.set(i, 0, 5.2, z);
    }
    W.pillars.commit();
    W.torches.commit();
    W.beams.commit();
    W.flameMat = toonCache.get('flame');

    // obstacles, coins, relics (filled per run)
    W.spikes = new Instanced(partsOf(get('Spikes')), 80, { ink: true });
    W.rubble = new Instanced(partsOf(get('Rubble')), 80, { ink: true });
    W.coins = new Instanced(partsOf(get('Coin')), 260, { ink: true });
    W.relics = new Instanced(partsOf(get('Relic')), RELIC_COUNT, { ink: true });

    // boulder
    const boulder = get('Boulder');
    boulder.traverse(o => {
        if (o.isMesh) o.material = toon(o.material);
    });
    outline(boulder);
    boulder.scale.setScalar(BR);
    scene.add(boulder);
    W.boulder = boulder;
    // idol on its altar + exit doorway
    const idol = get('Idol');
    idol.traverse(o => {
        if (o.isMesh) o.material = toon(o.material);
    });
    outline(idol);
    idol.scale.setScalar(1.6);
    scene.add(idol);
    W.idol = idol;
    const altar = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 1.0, 1.6),
        toon({ name: 'sandstone_dark', color: new THREE.Color(0x8e6b40) })
    );
    scene.add(altar);
    W.altar = altar;
    outline(altar);
    const sparkle = new THREE.Mesh(
        new THREE.RingGeometry(1.0, 1.25, 32),
        new THREE.MeshBasicMaterial({
            color: 0xffe08a,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide,
            depthWrite: false,
        })
    );
    scene.add(sparkle);
    W.sparkle = sparkle;
}

// ---------- level ----------
const G = { state: 'loading', sfx: new Sfx() };
function makeLevel(s) {
    const r = rnd(s || Math.floor(Math.random() * 1e9));
    const obstacles = [],
        coins = [],
        relics = [];
    let z = -30,
        row = 0;
    const relicRows = new Set();
    const totalRows = [];
    // first pass: row positions
    while (z > -LEVEL_LEN + 22) {
        totalRows.push(z);
        const p = -z / LEVEL_LEN;
        z -= 13 - 5 * p + r() * 3;
    }
    for (let k = 0; k < RELIC_COUNT; k++)
        relicRows.add(Math.floor(((k + 0.6) * totalRows.length) / RELIC_COUNT));
    for (const zr of totalRows) {
        const lanes = [0, 1, 2].sort(() => r() - 0.5);
        const free = lanes[0];
        const nBlock = r() < 0.35 + 0.4 * (-zr / LEVEL_LEN) ? 2 : 1;
        for (let i = 1; i <= nBlock; i++) {
            const type = r() < 0.55 ? 'spikes' : 'rubble';
            obstacles.push({ z: zr, lane: lanes[i], type, hit: false });
            if (type === 'spikes' && r() < 0.5)
                for (const [dz, y] of [
                    [1.4, 1.2],
                    [0, 1.9],
                    [-1.4, 1.2],
                ])
                    coins.push({ x: lanesX[lanes[i]], y, z: zr + dz });
        }
        if (relicRows.has(row)) relics.push({ x: lanesX[free], y: 1.0, z: zr });
        else {
            const cl = r() < 0.6 ? free : lanes[Math.floor(r() * 3)];
            for (let k = 0; k < 4; k++) coins.push({ x: lanesX[cl], y: 0.8, z: zr - 3 - k * 1.5 });
        }
        row++;
    }
    return { obstacles, coins: coins.slice(0, W.coins.count), relics };
}
function placeLevel(L) {
    let si = 0,
        ri = 0;
    for (const o of L.obstacles) {
        if (o.type === 'spikes') {
            o.idx = si;
            W.spikes.set(si++, lanesX[o.lane], 0, o.z, 0, 1);
        } else {
            o.idx = ri;
            W.rubble.set(ri++, lanesX[o.lane], 0, o.z, (o.z * 13) % 0.5, 1, 1.9);
        }
    }
    for (let i = si; i < W.spikes.count; i++) W.spikes.hide(i);
    for (let i = ri; i < W.rubble.count; i++) W.rubble.hide(i);
    W.spikes.commit();
    W.rubble.commit();
    L.coins.forEach((c, i) => {
        c.idx = i;
        c.taken = false;
    });
    for (let i = L.coins.length; i < W.coins.count; i++) W.coins.hide(i);
    L.relics.forEach((c, i) => {
        c.idx = i;
        c.taken = false;
    });
    const endZ = -LEVEL_LEN - 7;
    W.altar.position.set(0, 0.5, endZ);
    W.idol.position.set(0, 1.0, endZ);
    W.idol.rotation.set(0, 0, 0);
    W.sparkle.position.set(0, 2.6, endZ);
    idolGlow.position.set(0, 3, endZ + 1);
}

// ---------- run state ----------
function resetRun() {
    const L = makeLevel(seed ? seed++ : 0);
    placeLevel(L);
    Object.assign(G, {
        L,
        t: 0,
        z: 0,
        x: 0,
        y: 0,
        vy: 0,
        lane: 1,
        hearts: MAX_HEARTS,
        coins: 0,
        relics: 0,
        score: 0,
        bz: 11,
        stumble: 0,
        boost: 0,
        invuln: 0,
        shake: 0,
        endT: 0,
        result: null,
        anim: 0,
        flat: 0,
    });
    W.boulder.position.set(0, BR, G.bz);
    W.duckRoot.scale.set(1, 1, 1);
}
function start() {
    if (G.state === 'loading') return;
    G.sfx.unlock();
    resetRun();
    G.state = 'play';
    show('title', false);
    show('end', false);
    show('pause', false);
    show('hud', true);
    show('touch', isTouch);
    G.sfx.music(true);
}
function endRun(won, why) {
    if (G.state !== 'play') return;
    G.state = won ? 'won' : 'lost';
    G.result = { won, why };
    G.endT = 0;
    if (won) G.score += 1000 + G.hearts * 300;
    G.sfx.music(false);
    if (won) G.sfx.win();
    else G.sfx.lose();
    setTimeout(
        () => {
            if (G.state !== 'won' && G.state !== 'lost') return;
            document.getElementById('endTitle').textContent = won
                ? 'IT BELONGS IN A MUSEUM!'
                : why === 'boulder'
                  ? 'FLATTENED!'
                  : 'OUT OF HEARTS!';
            document.getElementById('endSub').textContent = won
                ? 'Duck Jones grabbed the Golden Quack and escaped the temple.'
                : why === 'boulder'
                  ? 'The boulder caught up. Keep moving, and grab relics for a speed burst.'
                  : 'Too many traps. Jump the spikes, dodge the rubble.';
            document.getElementById('stats').innerHTML =
                `<span>Score</span><b>${G.score}</b><span>Coins</span><b>${G.coins}</b><span>Relics</span><b>${G.relics}/${RELIC_COUNT}</b>` +
                `<span>Time</span><b>${G.t.toFixed(1)}s</b><span>Distance</span><b>${Math.min(LEVEL_LEN, Math.round(-G.z))} m</b>`;
            show('hud', false);
            show('touch', false);
            show('end', true);
        },
        won ? 1600 : 1300
    );
}
function setPaused(p) {
    if (p && G.state === 'play') {
        G.state = 'paused';
        show('pause', true);
        G.sfx.music(false);
    } else if (!p && G.state === 'paused') {
        G.state = 'play';
        show('pause', false);
        G.sfx.music(true);
    }
}
function act(a) {
    if (G.state === 'title' || G.state === 'won' || G.state === 'lost') {
        if (a === 'jump' || a === 'start') {
            if (G.state === 'title' || G.endT > 1.2) start();
        }
        return;
    }
    if (G.state !== 'play') return;
    if (a === 'left' && G.lane > 0) {
        G.lane--;
        G.sfx.swish();
    }
    if (a === 'right' && G.lane < 2) {
        G.lane++;
        G.sfx.swish();
    }
    if (a === 'jump' && G.y <= 0.001) {
        G.vy = JUMP_V;
        G.sfx.jump();
    }
}

// ---------- simulation ----------
function step(dt) {
    if (G.state === 'play') {
        if (autopilot) pilot();
        G.t += dt;
        const base = 9 + 4 * Math.min(1, G.t / 35);
        G.stumble = Math.max(0, G.stumble - dt);
        G.boost = Math.max(0, G.boost - dt);
        G.invuln = Math.max(0, G.invuln - dt);
        const speed = base * (G.stumble > 0 ? 0.4 : G.boost > 0 ? 1.4 : 1);
        G.z -= speed * dt;
        G.speed = speed;
        G.x += (lanesX[G.lane] - G.x) * Math.min(1, dt * 14);
        G.vy -= GRAVITY * dt;
        G.y = Math.max(0, G.y + G.vy * dt);
        if (G.y === 0) G.vy = Math.max(0, G.vy);
        G.anim += dt * speed * 1.4;
        // boulder
        const bSpeed = base + 0.3;
        G.bz = Math.min(G.bz - bSpeed * dt, G.z + 12);
        W.boulder.rotation.x -= (bSpeed * dt) / BR;
        const gap = G.bz - G.z;
        G.gap = gap;
        if (gap < 1.5) {
            G.flat = 1;
            endRun(false, 'boulder');
        }
        G.sfx.rumble(Math.max(0, 1 - gap / 14));
        // collisions
        for (const o of G.L.obstacles) {
            if (o.hit || Math.abs(o.z - G.z) > 0.75 || Math.abs(lanesX[o.lane] - G.x) > 1.05)
                continue;
            const clears = o.type === 'spikes' ? G.y > 0.55 : G.y > 1.75;
            if (clears) continue;
            o.hit = true;
            if (G.invuln > 0) continue;
            G.hearts--;
            G.stumble = 0.55;
            G.invuln = 1.1;
            G.shake = 0.35;
            G.sfx.hit();
            if (G.hearts <= 0) endRun(false, 'hearts');
        }
        for (const c of G.L.coins) {
            if (
                c.taken ||
                Math.abs(c.z - G.z) > 0.8 ||
                Math.abs(c.x - G.x) > 0.9 ||
                Math.abs(c.y - (G.y + 0.7)) > 1.0
            )
                continue;
            c.taken = true;
            G.coins++;
            G.score += 10;
            G.sfx.coin();
        }
        for (const c of G.L.relics) {
            if (
                c.taken ||
                Math.abs(c.z - G.z) > 0.9 ||
                Math.abs(c.x - G.x) > 1.0 ||
                Math.abs(c.y - (G.y + 0.7)) > 1.1
            )
                continue;
            c.taken = true;
            G.relics++;
            G.score += 250;
            G.boost = 1.2;
            G.sfx.relic();
        }
        G.score = Math.max(G.score, 0);
        if (G.z <= -LEVEL_LEN) endRun(true);
    } else if (G.state === 'won' || G.state === 'lost') {
        G.endT += dt;
        G.anim += dt * 3;
        if (G.state === 'won') {
            G.z = Math.max(-LEVEL_LEN - 2, G.z - Math.max(0, 6 - G.endT * 8) * dt);
            G.bz = Math.max(G.bz, G.z + 8);
        } else if (G.result.why === 'boulder') {
            G.bz -= Math.max(0, 9 - G.endT * 5) * dt;
            W.boulder.rotation.x -= 4 * dt;
        }
        G.y = Math.max(0, G.y + (G.vy -= GRAVITY * dt) * dt);
        if (G.y === 0) G.vy = Math.max(0, G.vy);
        G.sfx.rumble(0);
    } else if (G.state === 'title') {
        G.anim += dt * 2.2;
        G.t += dt;
    }
}

// Simple test/demo bot: dodge rubble, jump spikes, prefer lanes with stuff to grab.
function pilot() {
    const ahead = (lane, maxD) =>
        G.L.obstacles.filter(o => !o.hit && o.lane === lane && o.z < G.z + 0.6 && o.z > G.z - maxD);
    const look = 8;
    const mine = ahead(G.lane, look).sort((a, b) => b.z - a.z)[0];
    const laneCost = l => {
        const os = ahead(l, look);
        return (
            os.reduce((s, o) => s + (o.type === 'rubble' ? 10 : 3) / Math.max(0.5, G.z - o.z), 0) +
            Math.abs(l - G.lane) * 0.02
        );
    };
    if (mine && Math.abs(G.x - lanesX[G.lane]) < 0.4) {
        const cand = [G.lane - 1, G.lane + 1]
            .filter(l => l >= 0 && l <= 2)
            .sort((a, b) => laneCost(a) - laneCost(b));
        const best = cand[0];
        if (mine.type === 'rubble' || laneCost(best) + 0.01 < laneCost(G.lane)) {
            if (laneCost(best) < laneCost(G.lane)) {
                act(best < G.lane ? 'left' : 'right');
                return;
            }
        }
        if (mine.type === 'spikes' && G.z - mine.z < G.speed * 0.36 && G.z - mine.z > 0.2)
            act('jump');
    }
    const gem = G.L.relics.find(r => !r.taken && r.z < G.z && r.z > G.z - 12);
    if (gem && !mine) {
        const l = lanesX.indexOf(gem.x);
        if (l !== G.lane && ahead(l > G.lane ? G.lane + 1 : G.lane - 1, 6).length === 0)
            act(l < G.lane ? 'left' : 'right');
    }
}

// ---------- render ----------
const tmpV = new THREE.Vector3();
function updateVisuals(dt, now) {
    const D = W.duckRoot,
        p = W.parts;
    const running = G.state === 'play';
    D.position.set(G.x, G.y, G.z);
    const bob = running && G.y === 0 ? Math.abs(Math.sin(G.anim * 2)) * 0.09 : 0;
    W.duck.position.y = bob;
    const facing = (G.state === 'won' && G.endT > 0.6) || G.state === 'title' ? Math.PI : Math.PI; // face -Z
    D.rotation.y = facing + (running ? (lanesX[G.lane] - G.x) * 0.25 : 0);
    D.rotation.z = running ? Math.sin(G.anim * 2) * 0.08 : Math.sin(G.anim) * 0.03;
    const flap =
        G.y > 0.05
            ? 1.1
            : running
              ? Math.sin(G.anim * 4) * 0.5
              : G.state === 'won'
                ? Math.sin(G.anim * 4) * 0.8 + 0.6
                : Math.sin(G.anim * 2) * 0.12;
    if (p.WingL) p.WingL.rotation.z = p.WingL.userData.base.rot.z + flap;
    if (p.WingR) p.WingR.rotation.z = p.WingR.userData.base.rot.z - flap;
    for (const [f, ph] of [
        [p.FootL, 0],
        [p.FootR, Math.PI],
    ])
        if (f) {
            const b = f.userData.base.pos;
            const s = running && G.y === 0 ? Math.sin(G.anim * 2 + ph) : 0;
            f.position.set(b.x, b.y + Math.max(0, s) * 0.12, b.z + s * 0.16);
        }
    if (p.HeadPivot) {
        const b = p.HeadPivot.userData.base.rot;
        p.HeadPivot.rotation.set(
            b.x + (running ? 0.06 : 0),
            b.y + (G.state === 'title' ? Math.sin(G.t * 0.7) * 0.2 : 0),
            b.z + Math.sin(G.anim * 2) * 0.04
        );
    }
    // hurt blink + flattened
    D.visible = !(G.invuln > 0 && Math.floor(now * 14) % 2 === 0);
    if (G.state === 'lost' && G.result.why === 'boulder') {
        D.scale.set(1.5, 0.12, 1.5);
    } else if (G.state === 'lost') {
        D.rotation.x = Math.min(1.4, G.endT * 4);
    } else {
        D.scale.set(1, 1, 1);
        D.rotation.x = 0;
    }
    W.shadow.position.set(G.x, 0.02, G.z);
    W.shadow.scale.setScalar(1 - Math.min(0.5, G.y * 0.25));

    W.boulder.position.set(0, BR, G.bz);
    // coins spin, relics bob
    const spin = now * 3;
    for (const c of G.L.coins) {
        if (c.taken) W.coins.hide(c.idx);
        else if (Math.abs(c.z - G.z) < 85)
            W.coins.set(c.idx, c.x, c.y + Math.sin(now * 3 + c.z) * 0.08, c.z, spin);
        else W.coins.hide(c.idx);
    }
    W.coins.commit();
    for (const c of G.L.relics) {
        if (c.taken) W.relics.hide(c.idx);
        else W.relics.set(c.idx, c.x, c.y + Math.sin(now * 2 + c.z) * 0.15, c.z, now * 1.5, 1.4);
    }
    W.relics.commit();
    if (W.flameMat)
        W.flameMat.emissiveIntensity = 1.4 + Math.sin(now * 17) * 0.25 + Math.sin(now * 7.3) * 0.2;
    W.idol.rotation.y = G.state === 'won' ? now * 2 : Math.sin(now) * 0.3;
    if (G.state === 'won') {
        W.idol.position.set(G.x, G.y + 1.75 + Math.min(1, G.endT) * 0.15, G.z - 0.05);
        W.idol.scale.setScalar(0.85);
    } else W.idol.scale.setScalar(1.6);
    W.sparkle.rotation.z = now;
    W.sparkle.lookAt(camera.position);

    // camera
    let cx, cy, cz, lx, ly, lz;
    if (G.state === 'title' || (G.state === 'won' && G.endT > 0.4)) {
        const k = G.state === 'won' ? Math.min(1, (G.endT - 0.4) * 1.5) : 1;
        const far = G.portrait ? 4.6 : 3.6;
        cx = G.x - 1.6 * k + Math.sin(G.t * 0.4) * 0.25;
        cy = 1.3 + (1 - k) * 2.2;
        cz = G.z - far * k + (1 - k) * 6;
        lx = G.x;
        ly = (G.portrait ? 0.05 : 0.45) + (G.state === 'won' ? 0.55 : 0);
        lz = G.z;
    } else {
        const intro = G.state === 'play' ? Math.max(0, 1 - G.t / 2.2) : 0,
            e = intro * intro * (3 - 2 * intro);
        cx = G.x * 0.55;
        cy = 3.4 + e * 2.8;
        cz = G.z + 6.2 + e * 9;
        lx = G.x * 0.7;
        ly = 1.1;
        lz = G.z - 5 + e * 6;
    }
    const sh = G.shake > 0 ? G.shake : 0;
    G.shake = Math.max(0, G.shake - dt);
    const gapShake = G.state === 'play' ? Math.max(0, 1 - G.gap / 7) * 0.08 : 0;
    const s = sh * 0.4 + gapShake;
    tmpV.set(cx + (Math.random() - 0.5) * s, cy + (Math.random() - 0.5) * s, cz);
    if (G.camInit) camera.position.lerp(tmpV, Math.min(1, dt * 6));
    else {
        camera.position.copy(tmpV);
        G.camInit = true;
    }
    camera.lookAt(lx, ly, lz);
    sun.position.set(G.x + 3, 9, G.z + 5);
    sun.target.position.set(G.x, 0, G.z);
    torchGlow.position.set(G.x, 2.6, G.z - 1.5);
}

function hud() {
    if (G.state !== 'play') return;
    setText('score', G.score);
    setText('coins', G.coins);
    setText('relics', `${G.relics}/${RELIC_COUNT}`);
    setText('time', G.t.toFixed(1));
    const h =
        '<span class="heart">&#9829;</span>'.repeat(Math.max(0, G.hearts)) +
        '<span class="heart off">&#9829;</span>'.repeat(MAX_HEARTS - Math.max(0, G.hearts));
    if (h !== G._h) {
        document.getElementById('hearts').innerHTML = h;
        G._h = h;
    }
    const pr = Math.min(1, -G.z / LEVEL_LEN) * 100;
    document.getElementById('bar').style.width = pr + '%';
    document.getElementById('pin').style.left = pr + '%';
    document.getElementById('danger').classList.toggle('on', G.gap < 6);
}
const textCache = {};
function setText(id, v) {
    v = String(v);
    if (textCache[id] !== v) {
        document.getElementById(id).textContent = v;
        textCache[id] = v;
    }
}
function show(id, on) {
    document.getElementById(id).classList.toggle('hidden', !on);
}

function resize() {
    const w = window.innerWidth,
        h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    G.portrait = w / h < 0.8;
    camera.fov = G.portrait ? 72 : 60;
    camera.updateProjectionMatrix();
    const b = renderer.getDrawingBufferSize(new THREE.Vector2());
    outlineMat.uniforms.res.value.copy(b);
    outlineMat.uniforms.width.value = 1.4 * renderer.getPixelRatio();
}
window.addEventListener('resize', resize);

// ---------- input ----------
window.addEventListener('keydown', e => {
    const k = e.key;
    if (['ArrowLeft', 'a', 'A'].includes(k)) act('left');
    else if (['ArrowRight', 'd', 'D'].includes(k)) act('right');
    else if ([' ', 'ArrowUp', 'w', 'W'].includes(k)) act('jump');
    else if (k === 'Enter') {
        if (G.state === 'paused') setPaused(false);
        else act('start');
    } else if (k === 'p' || k === 'P' || k === 'Escape') setPaused(G.state === 'play');
    else if ((k === 'r' || k === 'R') && G.state !== 'loading' && G.state !== 'title') start();
    else return;
    e.preventDefault();
});
let touchStart = null;
canvas.addEventListener('pointerdown', e => {
    touchStart = { x: e.clientX, y: e.clientY, t: performance.now(), done: false };
});
canvas.addEventListener('pointermove', e => {
    if (!touchStart || touchStart.done) return;
    const dx = e.clientX - touchStart.x,
        dy = e.clientY - touchStart.y;
    if (Math.hypot(dx, dy) > 28) {
        touchStart.done = true;
        act(Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'jump' : 'none');
    }
});
canvas.addEventListener('pointerup', () => {
    if (touchStart && !touchStart.done && performance.now() - touchStart.t < 300) act('jump');
    touchStart = null;
});
for (const b of document.querySelectorAll('#touch button'))
    b.addEventListener('pointerdown', e => {
        e.preventDefault();
        act(b.dataset.act);
    });
document.getElementById('startBtn').addEventListener('click', start);
document.getElementById('againBtn').addEventListener('click', start);
document.getElementById('resumeBtn').addEventListener('click', () => setPaused(false));
document.getElementById('pauseBtn').addEventListener('click', () => setPaused(true));
const muteBtn = document.getElementById('muteBtn');
muteBtn.addEventListener('click', () => {
    G.sfx.unlock();
    const m = G.sfx.toggleMute();
    muteBtn.innerHTML = m ? '&#128263;' : '&#128266;';
});
document.addEventListener('visibilitychange', () => {
    if (document.hidden) setPaused(true);
});

// ---------- loop ----------
let last = performance.now(),
    frames = 0,
    fpsT = 0;
function frame(now) {
    requestAnimationFrame(frame);
    let dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (G.state !== 'loading') {
        const n = Math.ceil(dt / (1 / 120));
        for (let i = 0; i < n; i++) step(dt / n);
        updateVisuals(dt, now / 1000);
        hud();
    }
    renderer.render(scene, camera);
    frames++;
    fpsT += dt;
    if (fpsT > 1) {
        G.fps = frames / fpsT;
        frames = 0;
        fpsT = 0;
    }
}

// Test hooks (harmless in prod): read-only state + the same actions the controls use.
window.__duck = {
    state: () => ({
        state: G.state,
        level: G.L && G.L.obstacles.length + ':' + G.L.coins.length,
        t: G.t,
        z: G.z,
        lane: G.lane,
        hearts: G.hearts,
        invuln: G.invuln,
        coins: G.coins,
        relics: G.relics,
        score: G.score,
        gap: G.gap,
        fps: G.fps,
        result: G.result,
    }),
    act,
    start,
    setAutopilot: v => {
        autopilot = !!v;
    },
    pause: setPaused,
};

resize();
Promise.all([load('./models/duck.glb'), load('./models/props.glb')])
    .then(([d, p]) => {
        buildWorld(d, p);
        resetRun();
        G.state = 'title';
        document.getElementById('loading').classList.add('hidden');
        requestAnimationFrame(frame);
    })
    .catch(err => {
        console.error(err);
        document.getElementById('loading').textContent =
            'Could not load the temple: ' + err.message;
    });
