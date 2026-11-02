/* ROANG — progressive enhancement; all contact links work without JavaScript. */
(() => {
  'use strict';
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const themeButton = document.getElementById('themeToggle');
  const motionButton = document.getElementById('motionToggle');
  const readPreference = key => { try { return localStorage.getItem(key); } catch { return null; } };
  const savePreference = (key,value) => { try { localStorage.setItem(key,value); } catch { /* Optional storage. */ } };
  function syncTheme() {
    const light = root.dataset.theme === 'light';
    themeButton?.setAttribute('aria-pressed',String(light));
    themeButton?.setAttribute('aria-label',light ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro');
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = light ? '#f5f5f7' : '#08090b';
  }
  themeButton?.addEventListener('click',() => {
    root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
    savePreference('ag-theme',root.dataset.theme);
    syncTheme();
  });
  syncTheme();
  function syncMotion() {
    const paused = reduced.matches || readPreference('roang-motion') === 'off';
    root.dataset.motion = paused ? 'off' : 'on';
    if (motionButton) {
      motionButton.disabled = reduced.matches;
      motionButton.setAttribute('aria-pressed',String(paused));
      const label = reduced.matches ? 'Movimiento reducido según tu dispositivo' : paused ? 'Activar animaciones' : 'Pausar animaciones';
      motionButton.setAttribute('aria-label',label);
      motionButton.title = label;
      motionButton.firstElementChild.textContent = paused ? '▷' : 'Ⅱ';
    }
  }
  motionButton?.addEventListener('click',() => {
    savePreference('roang-motion',root.dataset.motion === 'off' ? 'on' : 'off');
    syncMotion();
  });
  reduced.addEventListener('change',syncMotion);
  syncMotion();

  const nav = document.getElementById('navMenu');
  const toggle = document.getElementById('mobileToggle');
  const mobile = matchMedia('(max-width: 880px)');
  const closeMenu = (restoreFocus = false) => {
    nav?.classList.remove('open');
    toggle?.setAttribute('aria-expanded','false');
    toggle?.setAttribute('aria-label','Abrir menú');
    if (restoreFocus) toggle?.focus();
  };
  toggle?.addEventListener('click',event => {
    if (nav.classList.contains('open')) { closeMenu(true); return; }
    nav.classList.add('open');
    toggle.setAttribute('aria-expanded','true');
    toggle.setAttribute('aria-label','Cerrar menú');
    if (event.detail === 0) nav.querySelector('a')?.focus();
  });
  nav?.querySelectorAll('a').forEach(link => link.addEventListener('click',() => {
    closeMenu();
    if (link.hash && link.pathname === location.pathname) {
      const target = document.getElementById(link.hash.slice(1));
      if (target) { target.setAttribute('tabindex','-1'); target.focus({preventScroll:true}); }
    }
  }));
  document.addEventListener('keydown',event => {
    if (event.key === 'Escape' && nav?.classList.contains('open')) closeMenu(true);
  });
  document.addEventListener('click',event => {
    if (mobile.matches && nav?.classList.contains('open') && !nav.contains(event.target) && !toggle.contains(event.target)) {
      closeMenu(nav.contains(document.activeElement));
    }
  });
  document.addEventListener('focusin',event => {
    if (mobile.matches && nav?.classList.contains('open') && !nav.contains(event.target) && event.target !== toggle) closeMenu();
  });
  mobile.addEventListener('change',() => closeMenu(nav?.contains(document.activeElement)));

  document.querySelectorAll('[data-year]').forEach(node => node.textContent = String(new Date().getFullYear()));
  document.querySelectorAll('.quote-form').forEach(form => form.addEventListener('submit',event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const fields = new FormData(form);
    const idea = String(fields.get('text') || '').trim();
    const textarea = form.querySelector('textarea');
    if (!idea) {
      textarea.setCustomValidity('Cuéntanos brevemente qué necesitas.');
      textarea.reportValidity();
      textarea.addEventListener('input',() => textarea.setCustomValidity(''),{once:true});
      return;
    }
    const who = {home:'ROANG',angel:'Ángel · ROANG',roselin:'Roselin · ROANG'}[form.dataset.context] || 'ROANG';
    const lines = [`Hola, quiero conversar sobre un proyecto con ${who}.`];
    const name = String(fields.get('nombre') || '').trim();
    const email = String(fields.get('correo') || '').trim();
    if (name) lines.push(`Nombre: ${name}`);
    if (email) lines.push(`Correo: ${email}`);
    lines.push(`Servicio: ${fields.get('servicio')}`,`Idea: ${idea}`);
    const url = 'https://wa.me/56920019066?text=' + encodeURIComponent(lines.join('\n'));
    const link = document.createElement('a');
    link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer';
    link.textContent = 'Volver a abrir mi mensaje en WhatsApp';
    const status = form.querySelector('.form-status');
    status.replaceChildren(document.createTextNode('Mensaje preparado. Envíalo desde WhatsApp. Si no se abrió la ventana: '),link);
    link.click();
    // The page never claims receipt: delivery only occurs after the visitor sends in WhatsApp.
  }));

  const videos = [...document.querySelectorAll('video')];
  videos.forEach(video => video.addEventListener('play',() => videos.filter(other => other !== video).forEach(other => other.pause())));
  document.addEventListener('visibilitychange',() => { if (document.hidden) videos.forEach(video => video.pause()); });
  if ('IntersectionObserver' in window && !reduced.matches && root.dataset.motion !== 'off') {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } });
    },{threshold:.06,rootMargin:'0px 0px 10px 0px'});
    document.querySelectorAll('.reveal').forEach(node => { node.classList.add('will-reveal'); observer.observe(node); });
  }
})();
