/**
 * Beranda storytelling. Dimuat lewat dynamic import hanya bila [data-home] ada,
 * sehingga GSAP dan three.js tidak ikut ke halaman lain.
 */
import type { Globe as GlobeType, GlobeLayout } from './globe/Globe';
import { hasWebGL } from './globe/webgl';
import { counterText } from '../lib/time';
import type { Lang } from '../i18n/ui';
import { duration, gsapEase, layer } from '../styles/motion';

type Cleanup = () => void;

declare global {
  interface Window {
    __edIntroSeen?: boolean;
  }
}

const html = document.documentElement;

function layoutFor(w: number, h: number): GlobeLayout {
  if (w >= 1024) return { x: 0.68, y: 0.5, diameter: Math.min(0.72 * h, 0.5 * w) };
  return { x: 0.5, y: 0.25, diameter: Math.min(0.4 * h, 0.84 * w) };
}

function formatCounter(el: HTMLElement, v: number) {
  const mode = el.dataset.mode as 'ago' | 'calendar';
  const lang = el.dataset.lang as Lang;
  el.textContent = counterText(v, mode, lang);
  if (mode === 'calendar') {
    const unit = el.parentElement?.querySelector<HTMLElement>('[data-counter-unit]');
    if (unit) unit.textContent = v <= 0 ? el.dataset.unitBce! : el.dataset.unitCe!;
  }
}

export async function initHome(root: HTMLElement): Promise<Cleanup> {
  const cleanups: Cleanup[] = [];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const eras = [...root.querySelectorAll<HTMLElement>('[data-era]')];
  const ticks = [...root.querySelectorAll<HTMLElement>('[data-rail-tick]')];
  const railFill = root.querySelector<HTMLElement>('[data-rail-fill]');
  const railMarker = root.querySelector<HTMLElement>('[data-rail-marker]');
  const tickPos = ticks.map((t) => parseFloat(getComputedStyle(t).getPropertyValue('--p')) || 0);

  let globe: GlobeType | undefined;
  let active = -1;

  const setRail = (pos: number) => {
    railFill?.style.setProperty('--progress', String(pos));
    railMarker?.style.setProperty('--marker', String(pos));
  };

  const activate = (i: number) => {
    if (i === active || !eras[i]) return;
    active = i;
    const el = eras[i];
    const accent = el.dataset.accent!;
    html.style.setProperty('--accent', accent);
    html.dataset.accent = accent;
    ticks.forEach((t, k) => t.classList.toggle('is-active', k === i));
    globe?.setState(Number(el.dataset.state), accent, el.dataset.cities === '1');
  };

  // ---------- Globe (WebGL) atau gambar statis ----------
  const useWebGL = !reduced && hasWebGL();
  html.classList.toggle('globe-live', useWebGL);
  html.classList.toggle('globe-static', !useWebGL);
  cleanups.push(() => html.classList.remove('globe-live', 'globe-static', 'is-outro', 'rail-on', 'intro-done'));

  const firstVisit = !window.__edIntroSeen && !location.hash && window.scrollY < 10;
  const playIntro = !reduced && firstVisit;

  if (useWebGL) {
    try {
      const [{ Globe }, { decodeGlobe }] = await Promise.all([import('./globe/Globe'), import('./globe/data')]);
      const res = await fetch(root.dataset.paleo!);
      const data = decodeGlobe(await res.json());
      const canvas = root.querySelector<HTMLCanvasElement>('[data-globe-canvas]')!;
      const lite = matchMedia('(max-width: 47.99rem), (pointer: coarse)').matches;
      globe = new Globe({
        canvas,
        states: data.states,
        n: data.n,
        lite,
        accent: eras[0]?.dataset.accent,
        dragTarget: root.querySelector<HTMLElement>('[data-globe-drag]') ?? undefined,
        layout: layoutFor,
      });
      globe.setIntro(playIntro ? 0 : 1);
      globe.start();
      cleanups.push(() => globe?.dispose());
    } catch (err) {
      console.warn('Globe tidak dapat dimuat, memakai gambar statis.', err);
      html.classList.remove('globe-live');
      html.classList.add('globe-static');
      globe = undefined;
    }
  }

  // ---------- Reduced motion: tanpa GSAP, hanya pergantian aksen & rail ----------
  if (reduced) {
    html.classList.remove('intro-pending');
    html.classList.add('intro-done', 'rail-on');
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const i = eras.indexOf(e.target as HTMLElement);
            activate(i);
            setRail(tickPos[i] ?? 0);
          }
        }
      },
      { rootMargin: '-45% 0px -45% 0px' },
    );
    eras.forEach((e) => io.observe(e));
    cleanups.push(() => io.disconnect());
    return () => cleanups.reverse().forEach((c) => c());
  }

  // ---------- GSAP + ScrollTrigger ----------
  const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')]);
  gsap.registerPlugin(ScrollTrigger);
  const sec = (ms: number) => ms / 1000;

  const ctx = gsap.context(() => {
    // ----- Intro: ≤ 3 dtk, langsung selesai saat pengguna scroll
    const lines = root.querySelectorAll('[data-intro-line]');
    const items = root.querySelectorAll('[data-intro-item]');
    const introState = { v: playIntro ? 0 : 1 };
    const intro = gsap.timeline({
      defaults: { ease: gsapEase.expoOut },
      onComplete: () => {
        window.__edIntroSeen = true;
        html.classList.add('intro-done');
        html.classList.add('rail-on');
      },
    });
    gsap.set(lines, { y: 0, yPercent: 110 });
    gsap.set(items, { autoAlpha: 0, y: 24 });
    html.classList.remove('intro-pending');
    intro
      .to(introState, {
        v: 1,
        duration: 1.6,
        ease: gsapEase.inOut,
        onUpdate: () => globe?.setIntro(introState.v),
      }, 0)
      .to(lines, { yPercent: 0, duration: 1.1, stagger: 0.15 }, 0.7)
      .to(items, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.1 }, 1.25);
    // batas keras: intro ≤ duration.intro
    if (intro.duration() > sec(duration.intro)) intro.timeScale(intro.duration() / sec(duration.intro));

    if (!playIntro) intro.progress(1);
    else {
      const finish = () => {
        if (intro.progress() < 1) intro.progress(1);
        removeSkip();
      };
      const opts = { passive: true } as const;
      const events = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const;
      const onScroll = () => window.scrollY > 4 && finish();
      events.forEach((ev) => window.addEventListener(ev, finish, opts));
      window.addEventListener('scroll', onScroll, opts);
      const removeSkip = () => {
        events.forEach((ev) => window.removeEventListener(ev, finish));
        window.removeEventListener('scroll', onScroll);
      };
      cleanups.push(removeSkip);
      root.querySelector('[data-skip-intro]')?.addEventListener('click', finish);
    }

    // ----- Section era: mask reveal + lapisan berparallax, di-scrub oleh scroll
    eras.forEach((el, i) => {
      const reveal = el.querySelector('[data-reveal]');
      const layers = [...el.querySelectorAll<HTMLElement>('[data-layer]')];
      const text = el.querySelector('.era-text');
      const tl = gsap.timeline({
        scrollTrigger: { trigger: el, start: 'top 88%', end: 'top 28%', scrub: 0.9 },
        defaults: { ease: gsapEase.power4Out, duration: 1 },
      });
      if (reveal) tl.fromTo(reveal, { yPercent: 105 }, { yPercent: 0 }, 0);
      layers.forEach((l) => {
        const n = Number(l.dataset.layer);
        tl.fromTo(
          l,
          { autoAlpha: 0, y: layer.parallax * (0.4 + n * 0.3) },
          { autoAlpha: 1, y: 0 },
          0.15 + n * layer.stagger * 1.5,
        );
      });
      if (text) {
        gsap.fromTo(
          text,
          { y: 0 },
          {
            y: -layer.parallax,
            ease: gsapEase.linear,
            scrollTrigger: { trigger: el, start: 'center center', end: 'bottom top', scrub: true },
          },
        );
      }

      const counterEl = el.querySelector<HTMLElement>('[data-counter]');
      let counted = false;
      ScrollTrigger.create({
        trigger: el,
        start: 'top 55%',
        end: 'bottom 55%',
        onToggle: (self) => {
          if (!self.isActive) return;
          activate(i);
          if (counterEl && !counted) {
            counted = true;
            const from = Number(counterEl.dataset.from);
            const to = Number(counterEl.dataset.to);
            const obj = { v: from };
            gsap.to(obj, {
              v: to,
              duration: sec(duration.counter),
              ease: gsapEase.expoOut,
              onUpdate: () => formatCounter(counterEl, obj.v),
            });
          }
        },
        onUpdate: (self) => {
          if (!self.isActive) return;
          const a = tickPos[i] ?? 0;
          const b = tickPos[i + 1] ?? a;
          setRail(a + (b - a) * self.progress);
        },
      });
    });

    // Rail muncul setelah intro; sebelum era pertama, posisi di atas
    ScrollTrigger.create({
      trigger: eras[0],
      start: 'top 55%',
      onLeaveBack: () => setRail(0),
    });

    // ----- Outro: globe menjauh sampai tinggal satu titik cahaya
    const outro = root.querySelector<HTMLElement>('[data-outro]');
    if (outro) {
      const reveal = outro.querySelector('[data-reveal]');
      const layers = [...outro.querySelectorAll<HTMLElement>('[data-layer]')];
      const tl = gsap.timeline({
        scrollTrigger: { trigger: outro, start: 'top -35%', end: 'bottom bottom', scrub: 0.9 },
        defaults: { ease: gsapEase.power4Out, duration: 1 },
      });
      if (reveal) tl.fromTo(reveal, { yPercent: 105 }, { yPercent: 0 }, 0.3);
      layers.forEach((l) => {
        const n = Number(l.dataset.layer);
        tl.fromTo(l, { autoAlpha: 0, y: layer.parallax * (0.4 + n * 0.3) }, { autoAlpha: 1, y: 0 }, 0.2 + n * 0.2);
      });
      ScrollTrigger.create({
        trigger: outro,
        start: 'top bottom',
        end: 'top top',
        scrub: 0.6,
        onUpdate: (self) => {
          const p = self.progress;
          html.classList.toggle('is-outro', p > 0.05);
          globe?.setLayoutMix(Math.min(1, p * 1.4));
          globe?.setOutro(p);
          setRail(tickPos[tickPos.length - 1] + (1 - tickPos[tickPos.length - 1]) * p);
        },
        onLeave: () => globe?.setActive(false),
        onEnterBack: () => globe?.setActive(true),
      });
    }
  }, root);

  const refresh = () => ScrollTrigger.refresh();
  document.fonts?.ready.then(refresh);
  cleanups.push(() => ctx.revert());

  // Aktifkan era pertama sebagai keadaan awal globe bila halaman dibuka di atas.
  if (window.scrollY < 10) {
    const first = eras[0];
    if (first) {
      html.style.setProperty('--accent', first.dataset.accent!);
    }
  }

  return () => cleanups.reverse().forEach((c) => c());
}
