// Rutinas y hábitos.
'use strict';

const MOMENTOS = [['mañana', '🌅 Mañana'], ['tarde', '☀️ Tarde'], ['noche', '🌙 Noche']];
const ICONOS_HABITO = ['✅', '🙏', '📖', '💪', '🏃', '💧', '🥗', '😴', '🧘', '✍️', '🧹', '💊', '📵', '🎯', '🦷', '💰'];

const habitoProgramado = (h, fecha) =>
  fecha >= h.creado && (!h.dias.length || h.dias.includes(diaSemana(fecha)));
const habitoHecho = (id, fecha) => (Store.state.registroHabitos[fecha] || []).includes(id);

function rachaHabito(h) {
  const hoy = hoyStr();
  let racha = 0;
  let f = hoy;
  for (let i = 0; i < 400 && f >= h.creado; i++, f = addDias(f, -1)) {
    if (!habitoProgramado(h, f)) continue;
    if (habitoHecho(h.id, f)) racha++;
    else if (f !== hoy) break; // hoy sin marcar todavía no corta la racha
  }
  return racha;
}

function habitosDelDia(fecha) {
  return Store.state.habitos.filter(h => habitoProgramado(h, fecha));
}

function cumplimientoDia(fecha) {
  const lista = habitosDelDia(fecha);
  const hechos = lista.filter(h => habitoHecho(h.id, fecha)).length;
  return { total: lista.length, hechos, pct: pct(hechos, lista.length) };
}

function checklistHabitos(fecha) {
  const lista = habitosDelDia(fecha);
  if (!lista.length) return `<p class="vacio">No hay hábitos para este día. <a href="#rutinas">Crear rutina</a></p>`;
  return MOMENTOS.map(([clave, titulo]) => {
    const items = lista.filter(h => h.momento === clave);
    if (!items.length) return '';
    return `<h4 class="momento">${titulo}</h4>` + items.map(h => {
      const hecho = habitoHecho(h.id, fecha);
      const racha = rachaHabito(h);
      return `<button type="button" class="check ${hecho ? 'hecho' : ''}" data-act="toggleHabito" data-id="${h.id}" data-fecha="${fecha}">
        <span class="caja">${hecho ? '✓' : ''}</span>
        <span class="texto">${h.icono} ${esc(h.nombre)}</span>
        ${racha > 1 ? `<span class="racha">🔥 ${racha}</span>` : ''}
      </button>`;
    }).join('');
  }).join('');
}

function formHabito(h = {}) {
  const dias = h.dias || [];
  const chips = [1, 2, 3, 4, 5, 6, 0].map(d =>
    `<label class="chip"><input type="checkbox" name="dia" value="${d}" ${dias.includes(d) ? 'checked' : ''}><span>${DIAS_CORTO[d]}</span></label>`).join('');
  return `
    <input type="hidden" name="id" value="${h.id || ''}">
    ${campo('Nombre', `<input name="nombre" required maxlength="60" value="${esc(h.nombre || '')}" placeholder="Ej: Leer la Biblia 15 min">`)}
    <div class="fila">
      ${campo('Ícono', `<select name="icono">${opciones(ICONOS_HABITO, h.icono || '✅')}</select>`)}
      ${campo('Momento', `<select name="momento">${opciones(MOMENTOS, h.momento || 'mañana')}</select>`)}
    </div>
    <div class="campo"><span>Días (sin marcar = todos los días)</span><div class="chips">${chips}</div></div>
    <div class="acciones-form">
      ${h.id ? `<button type="button" class="peligro" data-act="borrarHabito" data-id="${h.id}">Eliminar</button>` : ''}
      <button class="primario">Guardar</button>
    </div>`;
}

Acciones.toggleHabito = el => {
  const { id, fecha } = el.dataset;
  const reg = Store.state.registroHabitos;
  const lista = reg[fecha] || (reg[fecha] = []);
  const i = lista.indexOf(id);
  if (i >= 0) lista.splice(i, 1); else lista.push(id);
  Store.guardar();
  refrescar();
};

Acciones.nuevoHabito = () => abrirModal('Nuevo hábito', formHabito(), 'habito');
Acciones.editarHabito = el => {
  const h = Store.state.habitos.find(x => x.id === el.dataset.id);
  if (h) abrirModal('Editar hábito', formHabito(h), 'habito');
};
Acciones.borrarHabito = el => {
  if (!confirmar('¿Eliminar este hábito y su historial?')) return;
  const s = Store.state;
  s.habitos = s.habitos.filter(h => h.id !== el.dataset.id);
  for (const f in s.registroHabitos) s.registroHabitos[f] = s.registroHabitos[f].filter(i => i !== el.dataset.id);
  Store.guardar();
  cerrarModal();
  refrescar();
};

Formularios.habito = (d, form) => {
  const dias = $$('input[name=dia]:checked', form).map(c => Number(c.value));
  const s = Store.state;
  if (d.id) {
    const h = s.habitos.find(x => x.id === d.id);
    Object.assign(h, { nombre: d.nombre.trim(), icono: d.icono, momento: d.momento, dias });
  } else {
    s.habitos.push({ id: uid(), nombre: d.nombre.trim(), icono: d.icono, momento: d.momento, dias, creado: hoyStr() });
  }
  Store.guardar();
  cerrarModal();
  refrescar();
};

Vistas.rutinas = {
  titulo: 'Rutinas', icono: '🔁',
  render() {
    const hoy = hoyStr();
    const habitos = Store.state.habitos;
    const ultimos = Array.from({ length: 7 }, (_, i) => addDias(hoy, i - 6));
    const semana = ultimos.map(f => cumplimientoDia(f)).filter(c => c.total);
    const media = semana.length ? Math.round(semana.reduce((a, c) => a + c.pct, 0) / semana.length) : 0;

    const tarjetas = habitos.map(h => {
      const puntos = ultimos.map(f => {
        if (!habitoProgramado(h, f)) return `<i class="pt libre" title="${fechaCorta(f)}"></i>`;
        return `<i class="pt ${habitoHecho(h.id, f) ? 'ok' : 'no'}" title="${fechaCorta(f)}"></i>`;
      }).join('');
      const dias = h.dias.length ? h.dias.map(d => DIAS_CORTO[d]).join(' ') : 'Todos los días';
      return `<div class="tarjeta fila-espaciada">
        <div>
          <strong>${h.icono} ${esc(h.nombre)}</strong>
          <div class="sub">${MOMENTOS.find(m => m[0] === h.momento)[1]} · ${dias}</div>
          <div class="puntos">${puntos}</div>
        </div>
        <div class="derecha">
          <div class="racha-grande">🔥 ${rachaHabito(h)}</div>
          <button class="enlace" data-act="editarHabito" data-id="${h.id}">Editar</button>
        </div>
      </div>`;
    }).join('') || `<p class="vacio">Aún no tienes hábitos. Crea el primero para armar tu rutina diaria.</p>`;

    return `
      <header class="cabecera"><h1>Rutinas</h1><button class="primario" data-act="nuevoHabito">+ Hábito</button></header>
      <section class="tarjeta">
        <div class="sub">Cumplimiento últimos 7 días</div>
        <div class="grande">${media}%</div>
        ${barra(media)}
      </section>
      ${tarjetas}`;
  }
};
