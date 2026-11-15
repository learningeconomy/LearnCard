// All sounds are synthesized live with WebAudio: no audio files, nothing licensed.
export class Sfx {
    constructor() {
        this.ctx = null;
        this.muted = false;
    }
    unlock() {
        if (this.ctx) {
            if (this.ctx.state === 'suspended') this.ctx.resume();
            return;
        }
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        const c = (this.ctx = new AC());
        this.master = c.createGain();
        this.master.gain.value = this.muted ? 0 : 0.5;
        this.master.connect(c.destination);
        // boulder rumble: looped brown noise through a lowpass
        const len = c.sampleRate * 2,
            buf = c.createBuffer(1, len, c.sampleRate),
            d = buf.getChannelData(0);
        let last = 0;
        for (let i = 0; i < len; i++) {
            last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
            d[i] = last * 3.5;
        }
        this.noise = buf;
        const src = c.createBufferSource();
        src.buffer = buf;
        src.loop = true;
        const lp = c.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 160;
        this.rumbleGain = c.createGain();
        this.rumbleGain.gain.value = 0;
        src.connect(lp).connect(this.rumbleGain).connect(this.master);
        src.start();
    }
    toggleMute() {
        this.muted = !this.muted;
        if (this.master) this.master.gain.value = this.muted ? 0 : 0.5;
        return this.muted;
    }
    tone(freq, dur, { type = 'square', vol = 0.15, slide = 0, delay = 0 } = {}) {
        const c = this.ctx;
        if (!c) return;
        const t = c.currentTime + delay;
        const o = c.createOscillator(),
            g = c.createGain();
        o.type = type;
        o.frequency.setValueAtTime(freq, t);
        if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g).connect(this.master);
        o.start(t);
        o.stop(t + dur + 0.02);
    }
    thud(vol = 0.5, f = 300) {
        const c = this.ctx;
        if (!c) return;
        const s = c.createBufferSource();
        s.buffer = this.noise;
        const lp = c.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = f;
        const g = c.createGain();
        g.gain.setValueAtTime(vol, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.35);
        s.connect(lp).connect(g).connect(this.master);
        s.start();
        s.stop(c.currentTime + 0.4);
    }
    coin() {
        this.tone(988, 0.07, { vol: 0.09 });
        this.tone(1319, 0.14, { vol: 0.09, delay: 0.06 });
    }
    relic() {
        [784, 988, 1175, 1568].forEach((f, i) =>
            this.tone(f, 0.18, { type: 'triangle', vol: 0.16, delay: i * 0.07 })
        );
    }
    jump() {
        this.tone(330, 0.16, { type: 'triangle', vol: 0.12, slide: 330 });
    }
    swish() {
        this.tone(500, 0.06, { type: 'sine', vol: 0.05, slide: -200 });
    }
    hit() {
        this.thud(0.7, 500);
        this.tone(220, 0.25, { type: 'sawtooth', vol: 0.12, slide: -140 });
        // a little "quack": two detuned saws with a fast downward slide
        this.tone(640, 0.12, { type: 'sawtooth', vol: 0.08, slide: -260, delay: 0.05 });
    }
    win() {
        [523, 659, 784, 1047, 784, 1047].forEach((f, i) =>
            this.tone(f, i === 5 ? 0.5 : 0.16, { type: 'square', vol: 0.1, delay: i * 0.13 })
        );
    }
    lose() {
        this.thud(0.9, 200);
        [392, 330, 262, 196].forEach((f, i) =>
            this.tone(f, 0.25, { type: 'triangle', vol: 0.13, delay: 0.2 + i * 0.18 })
        );
    }
    rumble(level) {
        if (this.rumbleGain)
            this.rumbleGain.gain.setTargetAtTime(level * 0.9, this.ctx.currentTime, 0.1);
    }
    music(on) {
        if (!this.ctx) return;
        clearInterval(this._m);
        if (!on) return;
        // short adventurous loop in D minor, original
        const seq = [294, 0, 349, 440, 0, 392, 349, 0, 330, 0, 294, 349, 440, 0, 523, 440];
        let i = 0;
        this._m = setInterval(() => {
            const f = seq[i++ % seq.length];
            if (f) this.tone(f / 2, 0.16, { type: 'triangle', vol: 0.05 });
            if (i % 4 === 1) this.thud(0.12, 120);
        }, 150);
    }
}
