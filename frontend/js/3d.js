/* ============================================================
   Gather Nepal — Motion Engine v3 "Paper & Ink"
   Purposeful, restrained motion:
   1. Scroll-triggered reveals with stagger
   2. Hero photograph: slow parallax drift
   3. Condensing navbar on scroll
   4. Animated number counters
   5. Smooth in-page anchors (respects reduced-motion)
   ============================================================ */
(function () {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Scroll reveals (with sibling stagger) ---------- */
  function initScrollReveal() {
    const els = document.querySelectorAll('.reveal, .img-reveal');
    if (!els.length) return;
    if (prefersReduced) { els.forEach(el => el.classList.add('visible')); return; }

    // Auto-stagger cards inside grids that load via JS
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        if (el.classList.contains('event-card') && !el.style.transitionDelay) {
          const siblings = Array.from(el.parentElement.children);
          el.style.transitionDelay = Math.min(siblings.indexOf(el), 5) * 70 + 'ms';
        }
        el.classList.add('visible');
        io.unobserve(el);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -36px 0px' });

    els.forEach(el => io.observe(el));

    // Event cards rendered dynamically get observed too
    const mo = new MutationObserver(() => {
      document.querySelectorAll('.event-card:not(.visible)').forEach(el => io.observe(el));
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  /* ---------- 2. Hero photograph parallax ---------- */
  function initHeroParallax() {
    if (prefersReduced) return;
    const photo = document.getElementById('hero-photo');
    if (!photo) return;

    let ticking = false;
    function update() {
      const y = window.scrollY;
      if (y < window.innerHeight * 1.2) {
        photo.style.transform = 'translateY(' + (-4 + y * 0.08).toFixed(2) + '%) scale(1.02)';
      }
      ticking = false;
    }
    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  /* ---------- 3. Condensing navbar ---------- */
  function initNavbar() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;
    let ticking = false;
    function update() {
      navbar.classList.toggle('scrolled', window.scrollY > 10);
      ticking = false;
    }
    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  /* ---------- 4. Animated counters ---------- */
  function animateCounter(el, target, suffix) {
    if (!el) return;
    if (prefersReduced) { el.textContent = Number(target).toLocaleString() + (suffix || ''); return; }
    const duration = 1400;
    const start = performance.now();
    function update(now) {
      const elapsed = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - elapsed, 3);
      el.textContent = Math.round(target * eased).toLocaleString() + (suffix || '');
      if (elapsed < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }
  window.animateCounter = animateCounter;

  /* ---------- 5. Smooth anchors with fixed-header offset ---------- */
  function initAnchors() {
    document.querySelectorAll('a[href^="/#"], a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        const href = a.getAttribute('href');
        const id = href.split('#')[1];
        if (!id) return;
        const target = document.getElementById(id);
        if (!target) return;
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 70;
        window.scrollTo({ top, behavior: prefersReduced ? 'auto' : 'smooth' });
      });
    });
  }

  /* ---------- Init ---------- */
  function init() {
    initScrollReveal();
    initHeroParallax();
    initNavbar();
    initAnchors();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();