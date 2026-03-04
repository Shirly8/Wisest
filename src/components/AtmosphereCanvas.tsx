import React, { useRef, useEffect } from 'react';

class Smoke {
  x: number; y: number; vx: number; vy: number;
  sz: number; a: number; ma: number;
  life: number; ml: number; hue: number;

  constructor(spawn: boolean) {
    this.x = 0; this.y = 0; this.vx = 0; this.vy = 0;
    this.sz = 0; this.a = 0; this.ma = 0;
    this.life = 0; this.ml = 0; this.hue = 0;
    this.reset(spawn);
  }

  reset(s: boolean) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.min(window.innerWidth, window.innerHeight) * 0.3 * (0.4 + Math.random() * 0.9);
    this.x = window.innerWidth / 2 + Math.cos(a) * r;
    this.y = window.innerHeight / 2 + Math.sin(a) * r * 0.72;
    this.vx = (Math.random() - 0.5) * 0.28;
    this.vy = -(0.18 + Math.random() * 0.38);
    this.sz = 10 + Math.random() * 44;
    this.a = 0;
    this.ma = 0.018 + Math.random() * 0.032;
    this.life = 0;
    this.ml = 90 + Math.random() * 190;
    this.hue = 225 + Math.random() * 28;
    if (s) this.life = Math.random() * this.ml;
  }

  tick() {
    this.life++;
    this.x += this.vx;
    this.y += this.vy;
    this.sz += 0.09;
    const t = this.life / this.ml;
    this.a = t < 0.2 ? (t / 0.2) * this.ma : (1 - (t - 0.2) / 0.8) * this.ma;
    if (this.life >= this.ml) this.reset(false);
  }

  draw(cx: CanvasRenderingContext2D) {
    cx.save();
    cx.globalAlpha = this.a;
    const g = cx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.sz);
    g.addColorStop(0, `hsla(${this.hue},48%,38%,1)`);
    g.addColorStop(1, 'transparent');
    cx.fillStyle = g;
    cx.beginPath();
    cx.arc(this.x, this.y, this.sz, 0, Math.PI * 2);
    cx.fill();
    cx.restore();
  }
}

class StarDot {
  x: number; y: number; a: number; ma: number;
  life: number; ml: number; sz: number;

  constructor() {
    this.x = 0; this.y = 0; this.a = 0; this.ma = 0;
    this.life = 0; this.ml = 0; this.sz = 0;
    this.reset();
  }

  reset() {
    this.x = Math.random() * window.innerWidth;
    this.y = Math.random() * window.innerHeight;
    this.a = 0;
    this.ma = 0.055 + Math.random() * 0.17;
    this.life = 0;
    this.ml = 150 + Math.random() * 280;
    this.sz = 0.35 + Math.random() * 0.75;
    if (Math.random() > 0.35) this.life = Math.random() * this.ml;
  }

  tick() {
    this.life++;
    this.a = Math.sin((this.life / this.ml) * Math.PI) * this.ma;
    if (this.life >= this.ml) this.reset();
  }

  draw(cx: CanvasRenderingContext2D) {
    cx.save();
    cx.globalAlpha = this.a;
    cx.fillStyle = 'rgba(185,205,255,1)';
    cx.beginPath();
    cx.arc(this.x, this.y, this.sz, 0, Math.PI * 2);
    cx.fill();
    cx.restore();
  }
}

const AtmosphereCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const cx = cv.getContext('2d');
    if (!cx) return;

    const rsz = () => { cv.width = window.innerWidth; cv.height = window.innerHeight; };
    rsz();
    window.addEventListener('resize', rsz);

    const smk = Array.from({ length: 22 }, () => new Smoke(true));
    const sts = Array.from({ length: 105 }, () => new StarDot());

    let raf: number;
    const loop = () => {
      cx.clearRect(0, 0, cv.width, cv.height);
      sts.forEach(s => { s.tick(); s.draw(cx); });
      smk.forEach(s => { s.tick(); s.draw(cx); });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', rsz);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}
    />
  );
};

export default AtmosphereCanvas;
