// Tema claro/oscuro (compartido con el portafolio) y bloqueo con PIN.
// El PIN es un candado de pantalla: protege el uso del dispositivo, no cifra los datos guardados.
'use strict';

/* ---------- Tema ---------- */
Acciones.tema = () => {
  const raiz = document.documentElement;
  const nuevo = raiz.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  raiz.setAttribute('data-theme', nuevo);
  try { localStorage.setItem('ag-theme', nuevo); } catch (e) { /* sin almacenamiento */ }
  const meta = $('meta[name=theme-color]');
  if (meta) meta.content = nuevo === 'light' ? '#f8f8f6' : '#050b18';
};

/* ---------- PIN ---------- */
const Bloqueo = {
  claveSesion: 'mivida.desbloqueado',
  limiteOcioso: 5 * 60 * 1000,
  fallos: 0,

  disponible: () => !!(window.crypto && crypto.subtle),
  activo: () => !!Store.state.config.pin,
  desbloqueado() { try { return sessionStorage.getItem(this.claveSesion) === '1'; } catch (e) { return false; } },
  marcar(valor) { try { sessionStorage.setItem(this.claveSesion, valor ? '1' : '0'); } catch (e) { /* ignorar */ } },
  requerido() { return this.activo() && !this.desbloqueado(); },

  async derivar(pin, saltHex) {
    const sal = Uint8Array.from(saltHex.match(/../g).map(h => parseInt(h, 16)));
    const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: sal, iterations: 150000, hash: 'SHA-256' }, base, 256);
    return [...new Uint8Array(bits)].map(b => b.toString(16).padStart(2, '0')).join('');
  },

  async crear(pin) {
    const sal = crypto.getRandomValues(new Uint8Array(16));
    const salHex = [...sal].map(b => b.toString(16).padStart(2, '0')).join('');
    Store.state.config.pin = { sal: salHex, hash: await this.derivar(pin, salHex) };
    Store.guardar();
  },

  async verificar(pin) {
    const { sal, hash } = Store.state.config.pin;
    return (await this.derivar(pin, sal)) === hash;
  },

  mostrar(alDesbloquear) {
    const capa = $('#bloqueo');
    capa.innerHTML = `
      <form class="bloqueo-caja" autocomplete="off">
        <img src="assets/brand/roang-icon-dark-512.webp" alt="" width="34" height="34">
        <h1>Mi Vida</h1>
        <p class="sub">Ingresa tu PIN</p>
        <input type="password" name="pin" inputmode="numeric" pattern="[0-9]*" maxlength="12" required aria-label="PIN" autofocus>
        <p class="error" role="alert"></p>
        <button class="primario ancho">Entrar</button>
      </form>`;
    capa.hidden = false;
    const form = $('form', capa);
    $('input', form).focus();
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const campoPin = form.elements.pin;
      if (await this.verificar(campoPin.value)) {
        this.fallos = 0;
        this.marcar(true);
        capa.hidden = true;
        capa.innerHTML = '';
        alDesbloquear();
      } else {
        this.fallos++;
        campoPin.value = '';
        $('.error', form).textContent = 'PIN incorrecto';
        form.querySelector('button').disabled = true;
        setTimeout(() => { form.querySelector('button').disabled = false; campoPin.focus(); }, Math.min(this.fallos, 6) * 1000);
      }
    });
  },

  bloquear() {
    if (!this.activo()) return;
    this.marcar(false);
    $('#app').innerHTML = '';
    this.mostrar(() => render());
  },

  actualizarBoton() { $('#btn-bloquear').hidden = !this.activo(); }
};

Acciones.bloquear = () => Bloqueo.bloquear();

Formularios.pin = async d => {
  if (!/^\d{4,12}$/.test(d.pin)) return toast('El PIN debe tener de 4 a 12 números');
  if (d.pin !== d.pin2) return toast('Los PIN no coinciden');
  await Bloqueo.crear(d.pin);
  Bloqueo.marcar(true);
  Bloqueo.actualizarBoton();
  toast('PIN activado 🔒');
  refrescar();
};

Acciones.quitarPin = () => {
  if (!confirmar('¿Quitar el bloqueo con PIN?')) return;
  delete Store.state.config.pin;
  Store.guardar();
  Bloqueo.actualizarBoton();
  refrescar();
};

function seccionPin() {
  if (!Bloqueo.disponible()) {
    return `<section class="tarjeta"><h3>Bloqueo con PIN</h3>
      <p class="sub">No está disponible en esta conexión: el navegador solo lo permite en https o en localhost.</p></section>`;
  }
  const activo = Bloqueo.activo();
  return `<section class="tarjeta">
    <h3>Bloqueo con PIN</h3>
    <p class="sub">${activo ? '🔒 Activo. Se pide al abrir la app y tras 5 minutos fuera de ella.' : 'Pide un PIN al abrir la app en este dispositivo.'} Es un candado de pantalla: no cifra los datos guardados.</p>
    <form data-form="pin" autocomplete="off">
      <div class="fila">
        ${campo(activo ? 'Nuevo PIN' : 'PIN (4 a 12 números)', `<input type="password" name="pin" inputmode="numeric" pattern="[0-9]{4,12}" maxlength="12" required>`)}
        ${campo('Repetir PIN', `<input type="password" name="pin2" inputmode="numeric" pattern="[0-9]{4,12}" maxlength="12" required>`)}
      </div>
      <div class="acciones-form">
        ${activo ? `<button type="button" class="peligro" data-act="quitarPin">Quitar PIN</button>` : ''}
        <button class="primario">${activo ? 'Cambiar PIN' : 'Activar PIN'}</button>
      </div>
    </form>
  </section>`;
}

// Bloqueo automático tras un rato fuera de la app.
let ocultoDesde = 0;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { ocultoDesde = Date.now(); return; }
  if (ocultoDesde && Date.now() - ocultoDesde > Bloqueo.limiteOcioso) Bloqueo.bloquear();
  ocultoDesde = 0;
});
