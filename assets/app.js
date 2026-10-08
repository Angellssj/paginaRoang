/** ROANG · sitio corporativo estático */
(() => {
  'use strict';
  // Contacto heredado de la landing original de Ángel; verificar si será el canal central de ROANG.
  const WHATSAPP_NUMBER = '56920019066';
  const urlWhatsApp = message => 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(message);
  const page = document.body.dataset.page || 'home';
  const context = {home:'ROANG',angel:'Ángel · ROANG',roselin:'Roselin · ROANG'}[page] || 'ROANG';

  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = String(new Date().getFullYear()); });

  const nav = document.getElementById('navMenu');
  const toggle = document.getElementById('mobileToggle');
  if (nav && toggle) {
    const close = () => { nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-label','Abrir menú'); };
    toggle.addEventListener('click', () => {
      const expanded = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(expanded));
      toggle.setAttribute('aria-label', expanded ? 'Cerrar menú' : 'Abrir menú');
    });
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    document.addEventListener('click', e => { if (!nav.contains(e.target) && !toggle.contains(e.target)) close(); });
  }

  document.querySelectorAll('a[data-quote]').forEach(link => {
    const service = link.dataset.quote;
    const intro = page === 'angel' ? 'Hola Ángel' : 'Hola, equipo ROANG';
    const msg = `${intro}, quiero solicitar una cotización privada sobre ${service}. ¿Podemos conversar sobre mi proyecto?`;
    link.href = urlWhatsApp(msg);
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  });

  document.querySelectorAll('form.quote-form').forEach(form => form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const fields = new FormData(form);
    const msg = [
      `Hola, quiero solicitar una cotización privada a ${context}.`,
      `Nombre: ${fields.get('nombre') || ''}`,
      `Contacto: ${fields.get('contacto') || ''}`,
      `Servicio: ${fields.get('servicio') || ''}`,
      `Proyecto: ${fields.get('proyecto') || ''}`
    ].join('\n');
    const link = document.createElement('a');
    link.href = urlWhatsApp(msg);
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    link.remove();
  }));

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealNodes = [...document.querySelectorAll('.reveal')];
  if (prefersReduced || !('IntersectionObserver' in window)) {
    revealNodes.forEach(el => el.classList.add('visible'));
  } else {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .075, rootMargin:'0px 0px 20px 0px' });
    revealNodes.forEach(el => observer.observe(el));
  }

  let currentVideo = null;
  const videoButtons = [...document.querySelectorAll('[data-reel], [data-hero-reel]')];
  const pause = button => {
    const v = button.querySelector('video');
    if (!v) return;
    v.pause();
    try { v.currentTime = 0; } catch (e) { /* metadata may not be loaded */ }
    button.classList.remove('playing');
    const mark = button.querySelector('.play-mark,.play-bubble');
    if (mark) mark.textContent = '▶';
    button.setAttribute('aria-label', button.getAttribute('aria-label').replace(/^Pausar/, 'Reproducir'));
  };
  videoButtons.forEach(button => button.addEventListener('click', () => {
    const v = button.querySelector('video');
    if (!v) return;
    if (currentVideo === v && !v.paused) { pause(button); currentVideo = null; return; }
    videoButtons.filter(b => b !== button).forEach(pause);
    if (!v.src && v.dataset.src) v.src = v.dataset.src;
    v.muted = true;
    v.playsInline = true;
    const mark = button.querySelector('.play-mark,.play-bubble');
    v.play().then(() => {
      currentVideo = v;
      button.classList.add('playing');
      if (mark) mark.textContent = '❚❚';
      button.setAttribute('aria-label', button.getAttribute('aria-label').replace(/^Reproducir/, 'Pausar'));
    }).catch(() => { if (mark) mark.textContent = '▶'; });
  }));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      videoButtons.forEach(pause);
      currentVideo = null;
    }
  });
})();
