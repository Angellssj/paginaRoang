// Metas y objetivos con hitos.
'use strict';

const AREAS = ['Espiritual', 'Personal', 'Salud', 'Finanzas', 'Familia', 'Estudio / Trabajo'];
const ICONO_AREA = { 'Espiritual': '🙏', 'Personal': '🌱', 'Salud': '💪', 'Finanzas': '💰', 'Familia': '👨‍👩‍👧', 'Estudio / Trabajo': '📚' };

function progresoMeta(m) {
  if (m.completada) return 100;
  if (!m.hitos.length) return 0;
  return pct(m.hitos.filter(h => h.hecha).length, m.hitos.length);
}

function formMeta(m = {}) {
  return `
    <input type="hidden" name="id" value="${m.id || ''}">
    ${campo('¿Qué quieres lograr?', `<input name="titulo" required maxlength="120" value="${esc(m.titulo || '')}" placeholder="Ej: Ahorrar para el fondo de emergencia">`)}
    <div class="fila">
      ${campo('Área', `<select name="area">${opciones(AREAS, m.area || 'Personal')}</select>`)}
      ${campo('Fecha límite', `<input type="date" name="limite" value="${m.limite || ''}">`)}
    </div>
    ${campo('¿Por qué es importante?', `<textarea name="nota" rows="3">${esc(m.nota || '')}</textarea>`)}
    <div class="acciones-form">
      ${m.id ? `<button type="button" class="peligro" data-act="borrarMeta" data-id="${m.id}">Eliminar</button>` : ''}
      <button class="primario">Guardar</button>
    </div>`;
}

function detalleMeta(id) {
  const m = Store.state.metas.find(x => x.id === id);
  if (!m) return;
  const p = progresoMeta(m);
  const hitos = m.hitos.map(h => `
    <div class="check ${h.hecha ? 'hecho' : ''}">
      <button type="button" class="caja" data-act="toggleHito" data-meta="${m.id}" data-id="${h.id}">${h.hecha ? '✓' : ''}</button>
      <span class="texto">${esc(h.texto)}</span>
      <button type="button" class="icono chico" data-act="borrarHito" data-meta="${m.id}" data-id="${h.id}" aria-label="Quitar">✕</button>
    </div>`).join('') || '<p class="vacio">Divide la meta en pasos pequeños.</p>';
  const dias = m.limite ? diasEntre(hoyStr(), m.limite) : null;
  const plazo = dias === null ? '' : dias < 0 ? `Venció hace ${-dias} días` : dias === 0 ? 'Vence hoy' : `Faltan ${dias} días`;
  abrirModal(`${ICONO_AREA[m.area] || '🎯'} ${m.titulo}`, `
    ${m.nota ? `<p class="sub">${esc(m.nota)}</p>` : ''}
    <div class="sub">${esc(m.area)}${plazo ? ' · ' + plazo : ''}</div>
    <div class="grande">${p}%</div>${barra(p)}
    <h4 class="momento">Pasos</h4>${hitos}
    <div class="fila-agregar">
      <input name="texto" placeholder="Nuevo paso" maxlength="120" required>
      <input type="hidden" name="metaId" value="${m.id}">
      <button class="primario">Agregar</button>
    </div>
    <div class="acciones-form">
      <button type="button" data-act="editarMeta" data-id="${m.id}">Editar</button>
      <button type="button" class="${m.completada ? '' : 'primario'}" data-act="completarMeta" data-id="${m.id}">${m.completada ? 'Reabrir' : 'Marcar lograda ✓'}</button>
    </div>`, 'hito');
}

Acciones.nuevaMeta = () => abrirModal('Nueva meta', formMeta(), 'meta');
Acciones.verMeta = el => detalleMeta(el.dataset.id);
Acciones.editarMeta = el => {
  const m = Store.state.metas.find(x => x.id === el.dataset.id);
  if (m) abrirModal('Editar meta', formMeta(m), 'meta');
};
Acciones.borrarMeta = el => {
  if (!confirmar('¿Eliminar esta meta?')) return;
  Store.state.metas = Store.state.metas.filter(m => m.id !== el.dataset.id);
  Store.state.tareas.forEach(t => { if (t.metaId === el.dataset.id) t.metaId = ''; });
  Store.guardar();
  cerrarModal();
  refrescar();
};
Acciones.completarMeta = el => {
  const m = Store.state.metas.find(x => x.id === el.dataset.id);
  m.completada = !m.completada;
  Store.guardar();
  cerrarModal();
  refrescar();
  if (m.completada) toast('¡Meta lograda! 🎉');
};
Acciones.toggleHito = el => {
  const h = Store.state.metas.find(x => x.id === el.dataset.meta).hitos.find(x => x.id === el.dataset.id);
  h.hecha = !h.hecha;
  Store.guardar();
  detalleMeta(el.dataset.meta);
  refrescar();
};
Acciones.borrarHito = el => {
  const m = Store.state.metas.find(x => x.id === el.dataset.meta);
  m.hitos = m.hitos.filter(h => h.id !== el.dataset.id);
  Store.guardar();
  detalleMeta(m.id);
  refrescar();
};

Formularios.meta = d => {
  const s = Store.state;
  if (d.id) {
    Object.assign(s.metas.find(m => m.id === d.id), { titulo: d.titulo.trim(), area: d.area, limite: d.limite, nota: d.nota });
  } else {
    s.metas.push({ id: uid(), titulo: d.titulo.trim(), area: d.area, limite: d.limite, nota: d.nota, hitos: [], completada: false, creada: hoyStr() });
  }
  Store.guardar();
  cerrarModal();
  refrescar();
};

Formularios.hito = d => {
  const m = Store.state.metas.find(x => x.id === d.metaId);
  m.hitos.push({ id: uid(), texto: d.texto.trim(), hecha: false });
  Store.guardar();
  detalleMeta(m.id);
  refrescar();
};

Vistas.metas = {
  titulo: 'Metas', icono: '🎯',
  render() {
    const todas = Store.state.metas;
    const tarjeta = m => {
      const p = progresoMeta(m);
      const dias = m.limite ? diasEntre(hoyStr(), m.limite) : null;
      const plazo = dias === null ? '' : dias < 0 ? `<span class="alerta">Vencida</span>` : `${dias} d`;
      return `<button type="button" class="tarjeta boton-tarjeta" data-act="verMeta" data-id="${m.id}">
        <div class="fila-espaciada"><strong>${ICONO_AREA[m.area] || '🎯'} ${esc(m.titulo)}</strong><span class="sub">${plazo}</span></div>
        <div class="sub">${esc(m.area)} · ${m.hitos.filter(h => h.hecha).length}/${m.hitos.length} pasos</div>
        ${barra(p, m.completada ? 'ok' : '')}
      </button>`;
    };
    const activas = todas.filter(m => !m.completada);
    const logradas = todas.filter(m => m.completada);
    return `
      <header class="cabecera"><h1>Metas</h1><button class="primario" data-act="nuevaMeta">+ Meta</button></header>
      ${activas.map(tarjeta).join('') || '<p class="vacio">Define tu primera meta y divídela en pasos.</p>'}
      ${logradas.length ? `<h4 class="momento">Logradas (${logradas.length})</h4>${logradas.map(tarjeta).join('')}` : ''}`;
  }
};
