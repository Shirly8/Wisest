import { useEffect } from 'react';

export function useOrbParallax(orbIds: string[], specIds: string[]) {
  useEffect(() => {
    let tRX = 0, tRY = 0, cRX = 0, cRY = 0;
    let raf: number;

    const onMouse = (e: MouseEvent) => {
      const dx = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
      const dy = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
      tRY = dx * 13;
      tRX = -dy * 11;
      specIds.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.style.setProperty('--sx', (40 - dx * 17) + '%');
        el.style.setProperty('--sy', (21 - dy * 14) + '%');
      });
    };

    const onTouch = (e: TouchEvent) => {
      if (!e.touches.length) return;
      const t = e.touches[0];
      const dx = (t.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
      const dy = (t.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
      tRY = dx * 13;
      tRX = -dy * 11;
    };

    const tilt = () => {
      cRX += (tRX - cRX) * 0.08;
      cRY += (tRY - cRY) * 0.08;
      orbIds.forEach(id => {
        const el = document.getElementById(id);
        if (el && !el.classList.contains('shaking')) {
          el.style.transform = `rotateX(${cRX}deg) rotateY(${cRY}deg)`;
        }
      });
      raf = requestAnimationFrame(tilt);
    };

    window.addEventListener('mousemove', onMouse, { passive: true });
    window.addEventListener('touchmove', onTouch, { passive: true });
    raf = requestAnimationFrame(tilt);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('touchmove', onTouch);
    };
  }, [orbIds, specIds]);
}
