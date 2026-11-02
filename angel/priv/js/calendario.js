// Calendario y planificación: tareas y eventos por día.
'use strict';

const tareasDe = fecha => Store.state.tareas
  .filter(t => t.fecha === fecha)
  .sort((a, b) => (a.hora || '99:99').localeCompare(b.hora || '99:99'));

function itemTarea(t) {
  const meta = t.metaId ? Store.state.metas.find(m => m.id === t.metaId) : null;
  return `<div class="check ${t.hecha ? 'hecho' : ''} ${t.tipo === 'evento' ? 'evento' : ''}">
    <button type="button" class="caja" data-act="toggleTarea" data-id="${t.id}" aria-label="Marcar">${t.hecha ? '✓' : ''}</button>
    <button type="button" class="texto" data-act="editarTarea" data-id="${t.id}">
      ${t.hora ? `<span class="hora">${t.hora}</span>` : ''}
      ${t.tipo === 'evento' ? '📌 ' : ''}${esc(t.titulo)}
      ${meta ? `<span class="etiqueta">🎯 ${esc(meta.titulo)}</span>` : ''}
    </button>
  </div>`;
}

function formTarea(t = {}) {
  const metas = Store.state.metas.filter(m => !m.completada);
  return `
    <input type="hidden" name="id" value="${t.id || ''}">
    ${campo('Título', `<input name="titulo" required maxlength="120" value="${esc(t.titulo || '')}">`)}
    <div class="fila">
      ${campo('Fecha', `<input type="date" name="fecha" required value="${t.fecha || UI.fecha}">`)}
      ${campo('Hora (opcional)', `<input type="time" name="hora" value="${t.hora || ''}">`)}
    </div>
    <div class="fila">
      ${campo('Tipo', `<select name="tipo">${opciones([['tarea', 'Tarea'], ['evento', 'Evento']], t.tipo || 'tarea')}</select>`)}
      ${campo('Meta relacionada', `<select name="metaId"><option value="">— ninguna —</option>${opciones(metas.map(m => [m.id, m.titulo]), t.metaId || '')}</select>`)}
    </div>
    ${campo('Notas', `<textarea name="nota" rows="2">${esc(t.nota || '')}</textarea>`)}
    ${t.id ? '' : campo('Repetir', `<select name="repetir">${opciones([['', 'No repetir'], ['dia', 'Cada día (30 días)'], ['semana', 'Cada semana (12 semanas)'], ['mes', 'Cada mes (6 meses)']], '')}</select>`)}
    <div class="acciones-form">
      ${t.id ? `<button type="button" class="peligro" data-act="borrarTarea" data-id="${t.id}">Eliminar</button>` : ''}
      <button class="primario">Guardar</button>
    </div>`;
}

Acciones.toggleTarea = el => {
  const t = Store.state.tareas.find(x => x.id === el.dataset.id);
  if (!t) return;
  t.hecha = !t.hecha;
  Store.guardar();
  refrescar();
};
Acciones.nuevaTarea = el => {
  if (el.dataset.fecha) UI.fecha = el.dataset.fecha;
  abrirModal('Nueva tarea o evento', formTarea(), 'tarea');
};
Acciones.editarTarea = el => {
  const t = Store.state.tareas.find(x => x.id === el.dataset.id);
  if (t) abrirModal('Editar', formTarea(t), 'tarea');
};
Acciones.borrarTarea = el => {
  if (!confirmar('¿Eliminar este elemento?')) return;
  Store.state.tareas = Store.state.tareas.filter(t => t.id !== el.dataset.id);
  Store.guardar();
  cerrarModal();
  refrescar();
};
Acciones.diaAnterior = () => { UI.fecha = addDias(UI.fecha, -1); UI.mes = mesDe(UI.fecha); refrescar(); };
Acciones.diaSiguiente = () => { UI.fecha = addDias(UI.fecha, 1); UI.mes = mesDe(UI.fecha); refrescar(); };
Acciones.irHoy = () => { UI.fecha = hoyStr(); UI.mes = mesDe(UI.fecha); refrescar(); };
Acciones.elegirDia = el => { UI.fecha = el.dataset.fecha; refrescar(); };
Acciones.mesAnterior = () => { UI.mes = addMeses(UI.mes, -1); refrescar(); };
Acciones.mesSiguiente = () => { UI.mes = addMeses(UI.mes, 1); refrescar(); };

Formularios.tarea = d => {
  const s = Store.state;
  const base = { titulo: d.titulo.trim(), fecha: d.fecha, hora: d.hora, tipo: d.tipo, metaId: d.metaId, nota: d.nota };
  if (d.id) {
    Object.assign(s.tareas.find(t => t.id === d.id), base);
  } else {
    const reps = { dia: [1, 30], semana: [7, 12], mes: [0, 6] }[d.repetir] || [0, 1];
    for (let i = 0; i < reps[1]; i++) {
      let fecha = d.fecha;
      if (d.repetir === 'mes') { const x = parseFecha(d.fecha); x.setMonth(x.getMonth() + i); fecha = ymd(x); }
      else if (i) fecha = addDias(d.fecha, i * reps[0]);
      s.tareas.push({ id: uid(), ...base, fecha, hecha: false });
    }
  }
  UI.fecha = d.fecha;
  UI.mes = mesDe(d.fecha);
  Store.guardar();
  cerrarModal();
  refrescar();
};

function rejillaMes(mes) {
  const [y, m] = mes.split('-').map(Number);
  const primero = new Date(y, m - 1, 1);
  const offset = (primero.getDay() + 6) % 7; // semana empieza en lunes
  const total = new Date(y, m, 0).getDate();
  const hoy = hoyStr();
  const celdas = [];
  for (let i = 0; i < offset; i++) celdas.push('<span class="dia vacio"></span>');
  for (let n = 1; n <= total; n++) {
    const f = `${mes}-${String(n).padStart(2, '0')}`;
    const ts = Store.state.tareas.filter(t => t.fecha === f);
    const pendientes = ts.some(t => !t.hecha);
    const clases = ['dia', f === UI.fecha ? 'sel' : '', f === hoy ? 'hoy' : ''].join(' ');
    celdas.push(`<button type="button" class="${clases}" data-act="elegirDia" data-fecha="${f}">${n}${ts.length ? `<i class="punto ${pendientes ? '' : 'ok'}"></i>` : ''}</button>`);
  }
  const cab = ['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => `<span class="cab">${d}</span>`).join('');
  return `<div class="rejilla">${cab}${celdas.join('')}</div>`;
}

Vistas.calendario = {
  titulo: 'Calendario', icono: '📅',
  render() {
    const f = UI.fecha;
    const ts = tareasDe(f);
    const c = cumplimientoDia(f);
    return `
      <header class="cabecera"><h1>Calendario</h1><button class="primario" data-act="nuevaTarea" data-fecha="${f}">+ Agregar</button></header>
      <section class="tarjeta">
        <div class="navmes">
          <button class="icono" data-act="mesAnterior" aria-label="Mes anterior">‹</button>
          <strong>${nombreMes(UI.mes)}</strong>
          <button class="icono" data-act="mesSiguiente" aria-label="Mes siguiente">›</button>
        </div>
        ${rejillaMes(UI.mes)}
      </section>
      <section class="tarjeta">
        <div class="navmes">
          <button class="icono" data-act="diaAnterior" aria-label="Día anterior">‹</button>
          <strong>${fechaLarga(f)}</strong>
          <button class="icono" data-act="diaSiguiente" aria-label="Día siguiente">›</button>
        </div>
        ${f !== hoyStr() ? `<button class="enlace" data-act="irHoy">Volver a hoy</button>` : ''}
        <h4 class="momento">Agenda</h4>
        ${ts.map(itemTarea).join('') || '<p class="vacio">Nada planificado.</p>'}
        ${c.total ? `<h4 class="momento">Rutina (${c.hechos}/${c.total})</h4>${checklistHabitos(f)}` : ''}
      </section>`;
  }
};
