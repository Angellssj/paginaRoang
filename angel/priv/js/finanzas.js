// Finanzas: movimientos, presupuesto, deudas y ahorro.
'use strict';

UI.finMes = mesDe(hoyStr());
const TABS_FIN = [['resumen', 'Resumen'], ['movs', 'Movimientos'], ['presupuesto', 'Presupuesto'], ['deudas', 'Deudas'], ['ahorro', 'Ahorro']];

const movsDelMes = mes => Store.state.fin.movs.filter(m => mesDe(m.fecha) === mes);
const sumar = lista => lista.reduce((a, m) => a + m.monto, 0);

function gastosPorCategoria(mes) {
  const r = {};
  movsDelMes(mes).filter(m => m.tipo === 'gasto').forEach(m => { r[m.categoria] = (r[m.categoria] || 0) + m.monto; });
  return r;
}

const navMes = () => `
  <div class="navmes">
    <button class="icono" data-act="finMesAnterior" aria-label="Mes anterior">‹</button>
    <strong>${nombreMes(UI.finMes)}</strong>
    <button class="icono" data-act="finMesSiguiente" aria-label="Mes siguiente">›</button>
  </div>`;

/* ---------- Pestañas ---------- */
function tabResumen() {
  const mes = UI.finMes;
  const movs = movsDelMes(mes);
  const ingresos = sumar(movs.filter(m => m.tipo === 'ingreso'));
  const gastos = sumar(movs.filter(m => m.tipo === 'gasto'));
  const saldo = ingresos - gastos;
  const previo = movsDelMes(addMeses(mes, -1));
  const gastoPrevio = sumar(previo.filter(m => m.tipo === 'gasto'));
  const porCat = Object.entries(gastosPorCategoria(mes)).sort((a, b) => b[1] - a[1]);
  const maximo = porCat.length ? porCat[0][1] : 0;
  const ahorro = ingresos > 0 ? Math.round((saldo / ingresos) * 100) : null;
  const diezmoReal = gastosPorCategoria(mes)['Diezmo y ofrendas'] || 0;

  let comparacion = '';
  if (gastoPrevio > 0) {
    const dif = gastos - gastoPrevio;
    comparacion = `<div class="sub">${dif <= 0 ? '📉 ' : '📈 '}${dinero(Math.abs(dif))} ${dif <= 0 ? 'menos' : 'más'} que ${MESES[parseFecha(addMeses(mes, -1) + '-01').getMonth()].toLowerCase()}</div>`;
  }

  return `
    <section class="tarjeta">
      <div class="trio">
        <div><span class="sub">Ingresos</span><strong class="pos">${dinero(ingresos)}</strong></div>
        <div><span class="sub">Gastos</span><strong class="neg">${dinero(gastos)}</strong></div>
        <div><span class="sub">Saldo</span><strong class="${saldo < 0 ? 'neg' : ''}">${dinero(saldo)}</strong></div>
      </div>
      ${ahorro !== null ? `<div class="sub">Ahorro del mes: ${ahorro}% de tus ingresos</div>` : ''}
      ${comparacion}
    </section>
    <section class="tarjeta">
      <h3>Gastos por categoría</h3>
      ${porCat.map(([c, v]) => `<div class="meta-mini"><div class="fila-espaciada"><span>${esc(c)}</span><span>${dinero(v)}</span></div>${barra(pct(v, maximo))}</div>`).join('') || '<p class="vacio">Sin gastos este mes.</p>'}
    </section>
    ${ingresos > 0 ? `<section class="tarjeta"><h3>🙏 Diezmo</h3>
      <div class="sub">10% de tus ingresos: ${dinero(ingresos * 0.1)} · Registrado: ${dinero(diezmoReal)}</div>
      ${barra(pct(diezmoReal, ingresos * 0.1), 'ok')}</section>` : ''}`;
}

function tabMovs() {
  const movs = movsDelMes(UI.finMes).sort((a, b) => b.fecha.localeCompare(a.fecha));
  let ultima = '';
  const filas = movs.map(m => {
    const cab = m.fecha !== ultima ? `<h4 class="momento">${fechaLarga(m.fecha)}</h4>` : '';
    ultima = m.fecha;
    return `${cab}<button type="button" class="mov" data-act="editarMov" data-id="${m.id}">
      <span><strong>${esc(m.categoria)}</strong>${m.nota ? `<span class="sub"> · ${esc(m.nota)}</span>` : ''}</span>
      <span class="${m.tipo === 'ingreso' ? 'pos' : 'neg'}">${m.tipo === 'ingreso' ? '+' : '−'}${dinero(m.monto)}</span>
    </button>`;
  }).join('');
  return `<section class="tarjeta">${filas || '<p class="vacio">Sin movimientos este mes.</p>'}</section>`;
}

function tabPresupuesto() {
  const gastado = gastosPorCategoria(UI.finMes);
  const pres = Store.state.fin.presupuestos;
  const cats = Store.state.fin.catGasto.filter(c => pres[c] > 0);
  const totalPres = cats.reduce((a, c) => a + pres[c], 0);
  const totalGas = cats.reduce((a, c) => a + (gastado[c] || 0), 0);
  const filas = cats.map(c => {
    const p = pct(gastado[c] || 0, pres[c]);
    const sobre = (gastado[c] || 0) > pres[c];
    return `<div class="meta-mini"><div class="fila-espaciada"><span>${esc(c)}</span>
      <span class="${sobre ? 'neg' : ''}">${dinero(gastado[c] || 0)} / ${dinero(pres[c])}</span></div>
      ${barra(p, sobre ? 'alerta' : p > 80 ? 'aviso' : '')}</div>`;
  }).join('');
  return `
    <section class="tarjeta">
      ${totalPres ? `<div class="fila-espaciada"><h3>Presupuesto mensual</h3><span class="sub">${dinero(totalGas)} de ${dinero(totalPres)}</span></div>` : ''}
      ${filas || '<p class="vacio">Define cuánto quieres gastar por categoría cada mes.</p>'}
      <div class="acciones-form"><button class="primario" data-act="editarPresupuesto">Editar presupuestos</button></div>
    </section>`;
}

function tabDeudas() {
  const deudas = Store.state.fin.deudas;
  const pendiente = deudas.reduce((a, d) => a + Math.max(0, d.total - d.pagado), 0);
  const tarjetas = deudas.map(d => {
    const resta = Math.max(0, d.total - d.pagado);
    const cuotas = d.cuota > 0 && resta > 0 ? ` · ~${Math.ceil(resta / d.cuota)} cuotas` : '';
    return `<div class="tarjeta">
      <div class="fila-espaciada"><strong>${esc(d.nombre)}</strong><span class="${resta ? 'neg' : 'pos'}">${resta ? dinero(resta) : 'Pagada ✓'}</span></div>
      <div class="sub">Pagado ${dinero(d.pagado)} de ${dinero(d.total)}${d.cuota ? ` · cuota ${dinero(d.cuota)}` : ''}${cuotas}${d.dia ? ` · vence día ${d.dia}` : ''}</div>
      ${barra(pct(d.pagado, d.total), 'ok')}
      <div class="acciones-form">
        <button data-act="editarDeuda" data-id="${d.id}">Editar</button>
        ${resta ? `<button class="primario" data-act="abonarDeuda" data-id="${d.id}">Abonar</button>` : ''}
      </div>
    </div>`;
  }).join('') || '<p class="vacio">¡Sin deudas registradas!</p>';
  return `${deudas.length ? `<section class="tarjeta"><span class="sub">Total pendiente</span><div class="grande neg">${dinero(pendiente)}</div></section>` : ''}
    ${tarjetas}
    <button class="primario ancho" data-act="nuevaDeuda">+ Agregar deuda</button>`;
}

function tabAhorro() {
  const lista = Store.state.fin.ahorros;
  const total = lista.reduce((a, x) => a + x.ahorrado, 0);
  const tarjetas = lista.map(a => `<div class="tarjeta">
      <div class="fila-espaciada"><strong>🐷 ${esc(a.nombre)}</strong><span>${dinero(a.ahorrado)} / ${dinero(a.meta)}</span></div>
      ${barra(pct(a.ahorrado, a.meta), 'ok')}
      <div class="acciones-form">
        <button data-act="editarAhorro" data-id="${a.id}">Editar</button>
        <button class="primario" data-act="aportarAhorro" data-id="${a.id}">Aportar</button>
      </div>
    </div>`).join('') || '<p class="vacio">Crea una meta de ahorro: fondo de emergencia, viaje, compra…</p>';
  return `${lista.length ? `<section class="tarjeta"><span class="sub">Total ahorrado</span><div class="grande pos">${dinero(total)}</div></section>` : ''}
    ${tarjetas}
    <button class="primario ancho" data-act="nuevoAhorro">+ Nueva meta de ahorro</button>`;
}

/* ---------- Formularios ---------- */
function formMov(m = {}) {
  const tipo = m.tipo || 'gasto';
  const f = Store.state.fin;
  return `
    <input type="hidden" name="id" value="${m.id || ''}">
    <div class="fila">
      ${campo('Tipo', `<select name="tipo">${opciones([['gasto', 'Gasto'], ['ingreso', 'Ingreso']], tipo)}</select>`)}
      ${campo('Monto', `<input type="number" name="monto" required min="1" step="any" inputmode="decimal" value="${m.monto || ''}">`)}
    </div>
    <div class="fila">
      ${campo('Categoría', `<select name="categoria">${opciones(tipo === 'gasto' ? f.catGasto : f.catIngreso, m.categoria)}</select>`)}
      ${campo('Fecha', `<input type="date" name="fecha" required value="${m.fecha || hoyStr()}">`)}
    </div>
    ${campo('Nota (opcional)', `<input name="nota" maxlength="80" value="${esc(m.nota || '')}">`)}
    <div class="acciones-form">
      ${m.id ? `<button type="button" class="peligro" data-act="borrarMov" data-id="${m.id}">Eliminar</button>` : ''}
      <button class="primario">Guardar</button>
    </div>`;
}

const formDeuda = (d = {}) => `
  <input type="hidden" name="id" value="${d.id || ''}">
  ${campo('Nombre', `<input name="nombre" required maxlength="60" value="${esc(d.nombre || '')}" placeholder="Ej: Tarjeta de crédito">`)}
  <div class="fila">
    ${campo('Monto total', `<input type="number" name="total" required min="1" step="any" value="${d.total || ''}">`)}
    ${campo('Ya pagado', `<input type="number" name="pagado" min="0" step="any" value="${d.pagado || 0}">`)}
  </div>
  <div class="fila">
    ${campo('Cuota mensual', `<input type="number" name="cuota" min="0" step="any" value="${d.cuota || ''}">`)}
    ${campo('Día de pago (1-31)', `<input type="number" name="dia" min="1" max="31" value="${d.dia || ''}">`)}
  </div>
  <div class="acciones-form">
    ${d.id ? `<button type="button" class="peligro" data-act="borrarDeuda" data-id="${d.id}">Eliminar</button>` : ''}
    <button class="primario">Guardar</button>
  </div>`;

const formAhorro = (a = {}) => `
  <input type="hidden" name="id" value="${a.id || ''}">
  ${campo('Nombre', `<input name="nombre" required maxlength="60" value="${esc(a.nombre || '')}" placeholder="Ej: Fondo de emergencia">`)}
  <div class="fila">
    ${campo('Meta', `<input type="number" name="meta" required min="1" step="any" value="${a.meta || ''}">`)}
    ${campo('Ahorrado', `<input type="number" name="ahorrado" min="0" step="any" value="${a.ahorrado || 0}">`)}
  </div>
  <div class="acciones-form">
    ${a.id ? `<button type="button" class="peligro" data-act="borrarAhorro" data-id="${a.id}">Eliminar</button>` : ''}
    <button class="primario">Guardar</button>
  </div>`;

const formMonto = (id, etiqueta, extra = '') => `
  <input type="hidden" name="id" value="${id}">
  ${campo(etiqueta, `<input type="number" name="monto" required step="any" inputmode="decimal">`)}
  ${extra}
  <div class="acciones-form"><button class="primario">Guardar</button></div>`;

/* ---------- Acciones ---------- */
Acciones.finTab = el => { UI.finTab = el.dataset.tab; refrescar(); };
Acciones.finMesAnterior = () => { UI.finMes = addMeses(UI.finMes, -1); refrescar(); };
Acciones.finMesSiguiente = () => { UI.finMes = addMeses(UI.finMes, 1); refrescar(); };

Acciones.nuevoMov = () => abrirModal('Nuevo movimiento', formMov(), 'mov');
Acciones.editarMov = el => abrirModal('Editar movimiento', formMov(Store.state.fin.movs.find(m => m.id === el.dataset.id)), 'mov');
Acciones.borrarMov = el => {
  if (!confirmar('¿Eliminar este movimiento?')) return;
  Store.state.fin.movs = Store.state.fin.movs.filter(m => m.id !== el.dataset.id);
  Store.guardar(); cerrarModal(); refrescar();
};

Acciones.editarPresupuesto = () => {
  const { catGasto, presupuestos } = Store.state.fin;
  abrirModal('Presupuesto mensual', catGasto.map((c, i) =>
    campo(esc(c), `<input type="number" name="p${i}" min="0" step="any" value="${presupuestos[c] || ''}" placeholder="Sin límite">`)).join('') +
    `<div class="acciones-form"><button class="primario">Guardar</button></div>`, 'presupuesto');
};

Acciones.nuevaDeuda = () => abrirModal('Nueva deuda', formDeuda(), 'deuda');
Acciones.editarDeuda = el => abrirModal('Editar deuda', formDeuda(Store.state.fin.deudas.find(d => d.id === el.dataset.id)), 'deuda');
Acciones.borrarDeuda = el => {
  if (!confirmar('¿Eliminar esta deuda?')) return;
  Store.state.fin.deudas = Store.state.fin.deudas.filter(d => d.id !== el.dataset.id);
  Store.guardar(); cerrarModal(); refrescar();
};
Acciones.abonarDeuda = el => {
  const d = Store.state.fin.deudas.find(x => x.id === el.dataset.id);
  abrirModal(`Abonar a ${d.nombre}`, formMonto(d.id, 'Monto del abono',
    `<label class="chip largo"><input type="checkbox" name="comoGasto" checked><span>Registrar también como gasto</span></label>`), 'abono');
};

Acciones.nuevoAhorro = () => abrirModal('Nueva meta de ahorro', formAhorro(), 'ahorro');
Acciones.editarAhorro = el => abrirModal('Editar ahorro', formAhorro(Store.state.fin.ahorros.find(a => a.id === el.dataset.id)), 'ahorro');
Acciones.borrarAhorro = el => {
  if (!confirmar('¿Eliminar esta meta de ahorro?')) return;
  Store.state.fin.ahorros = Store.state.fin.ahorros.filter(a => a.id !== el.dataset.id);
  Store.guardar(); cerrarModal(); refrescar();
};
Acciones.aportarAhorro = el => {
  const a = Store.state.fin.ahorros.find(x => x.id === el.dataset.id);
  abrirModal(`Aportar a ${a.nombre}`, formMonto(a.id, 'Monto (usa negativo para retirar)'), 'aporte');
};

Formularios.mov = d => {
  const f = Store.state.fin;
  const datos = { tipo: d.tipo, monto: Number(d.monto), categoria: d.categoria, fecha: d.fecha, nota: d.nota.trim() };
  if (d.id) Object.assign(f.movs.find(m => m.id === d.id), datos);
  else f.movs.push({ id: uid(), ...datos });
  UI.finMes = mesDe(d.fecha);
  Store.guardar(); cerrarModal(); refrescar();
};

Formularios.presupuesto = d => {
  const f = Store.state.fin;
  f.presupuestos = {};
  f.catGasto.forEach((c, i) => { const v = Number(d['p' + i]); if (v > 0) f.presupuestos[c] = v; });
  Store.guardar(); cerrarModal(); refrescar();
};

Formularios.deuda = d => {
  const f = Store.state.fin;
  const datos = { nombre: d.nombre.trim(), total: Number(d.total), pagado: Number(d.pagado) || 0, cuota: Number(d.cuota) || 0, dia: Number(d.dia) || 0 };
  if (d.id) Object.assign(f.deudas.find(x => x.id === d.id), datos);
  else f.deudas.push({ id: uid(), ...datos });
  Store.guardar(); cerrarModal(); refrescar();
};

Formularios.abono = (d, form) => {
  const f = Store.state.fin;
  const deuda = f.deudas.find(x => x.id === d.id);
  const monto = Number(d.monto);
  deuda.pagado += monto;
  if (form.elements.comoGasto && form.elements.comoGasto.checked) {
    f.movs.push({ id: uid(), tipo: 'gasto', monto, categoria: 'Deudas', fecha: hoyStr(), nota: `Abono ${deuda.nombre}` });
  }
  Store.guardar(); cerrarModal(); refrescar();
};

Formularios.ahorro = d => {
  const f = Store.state.fin;
  const datos = { nombre: d.nombre.trim(), meta: Number(d.meta), ahorrado: Number(d.ahorrado) || 0 };
  if (d.id) Object.assign(f.ahorros.find(x => x.id === d.id), datos);
  else f.ahorros.push({ id: uid(), ...datos });
  Store.guardar(); cerrarModal(); refrescar();
};

Formularios.aporte = d => {
  const a = Store.state.fin.ahorros.find(x => x.id === d.id);
  a.ahorrado = Math.max(0, a.ahorrado + Number(d.monto));
  Store.guardar(); cerrarModal(); refrescar();
};

// Al cambiar Gasto/Ingreso, cambian las categorías disponibles.
document.addEventListener('change', e => {
  const sel = e.target;
  if (sel.name !== 'tipo' || !sel.form || sel.form.dataset.form !== 'mov') return;
  const f = Store.state.fin;
  sel.form.elements.categoria.innerHTML = opciones(sel.value === 'gasto' ? f.catGasto : f.catIngreso);
});

/* ---------- Vista ---------- */
Vistas.finanzas = {
  titulo: 'Finanzas', icono: '💰',
  render() {
    const tabs = TABS_FIN.map(([k, t]) => `<button class="pestana ${UI.finTab === k ? 'activa' : ''}" data-act="finTab" data-tab="${k}">${t}</button>`).join('');
    const cuerpo = { resumen: tabResumen, movs: tabMovs, presupuesto: tabPresupuesto, deudas: tabDeudas, ahorro: tabAhorro }[UI.finTab] || tabResumen;
    const conMes = ['resumen', 'movs', 'presupuesto'].includes(UI.finTab);
    return `
      <header class="cabecera"><h1>Finanzas</h1><button class="primario" data-act="nuevoMov">+ Movimiento</button></header>
      <div class="pestanas">${tabs}</div>
      ${conMes ? navMes() : ''}
      ${cuerpo()}`;
  }
};
