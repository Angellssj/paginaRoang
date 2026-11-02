// Pantalla "Hoy": resumen del día.
'use strict';

function saludo() {
  const h = new Date().getHours();
  const base = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
  const n = Store.state.config.nombre;
  return n ? `${base}, ${esc(n)}` : base;
}

function balanceMes(mes) {
  const movs = Store.state.fin.movs.filter(m => mesDe(m.fecha) === mes);
  const ingresos = movs.filter(m => m.tipo === 'ingreso').reduce((a, m) => a + m.monto, 0);
  const gastos = movs.filter(m => m.tipo === 'gasto').reduce((a, m) => a + m.monto, 0);
  return { ingresos, gastos, saldo: ingresos - gastos };
}

Vistas.hoy = {
  titulo: 'Hoy', icono: '🏠',
  render() {
    const f = hoyStr();
    const s = Store.state;
    const c = cumplimientoDia(f);
    const ts = tareasDe(f);
    const atrasadas = s.tareas.filter(t => t.fecha < f && !t.hecha && t.tipo !== 'evento');
    const bal = balanceMes(mesDe(f));
    const metas = s.metas.filter(m => !m.completada).slice(0, 3);
    const fe = entradaFe(f);

    return `
      <header class="cabecera"><div><h1>${saludo()}</h1><div class="sub">${fechaLarga(f)}</div></div></header>

      ${atrasadas.length ? `<a class="aviso" href="#calendario">⚠️ Tienes ${atrasadas.length} tarea${atrasadas.length > 1 ? 's' : ''} atrasada${atrasadas.length > 1 ? 's' : ''}</a>` : ''}

      <section class="tarjeta">
        <div class="fila-espaciada"><h3>Mi rutina</h3><span class="sub">${c.hechos}/${c.total}</span></div>
        ${c.total ? barra(c.pct) : ''}
        ${checklistHabitos(f)}
      </section>

      <section class="tarjeta">
        <div class="fila-espaciada"><h3>Agenda de hoy</h3>
          <button class="enlace" data-act="nuevaTarea" data-fecha="${f}">+ Agregar</button></div>
        ${ts.map(itemTarea).join('') || '<p class="vacio">Sin tareas para hoy.</p>'}
      </section>

      <section class="tarjeta">
        <div class="fila-espaciada"><h3>Fe</h3><a class="enlace" href="#fe">Abrir</a></div>
        <div class="sub">
          ${fe.leyo ? '📖 Palabra ✓' : '📖 Palabra pendiente'} · ${fe.oro ? '🙏 Oración ✓' : '🙏 Oración pendiente'}
        </div>
      </section>

      <section class="tarjeta">
        <div class="fila-espaciada"><h3>Finanzas · ${MESES[parseFecha(f).getMonth()]}</h3><a class="enlace" href="#finanzas">Abrir</a></div>
        <div class="trio">
          <div><span class="sub">Ingresos</span><strong class="pos">${dinero(bal.ingresos)}</strong></div>
          <div><span class="sub">Gastos</span><strong class="neg">${dinero(bal.gastos)}</strong></div>
          <div><span class="sub">Saldo</span><strong>${dinero(bal.saldo)}</strong></div>
        </div>
      </section>

      ${metas.length ? `<section class="tarjeta">
        <div class="fila-espaciada"><h3>Metas en curso</h3><a class="enlace" href="#metas">Ver todas</a></div>
        ${metas.map(m => `<div class="meta-mini"><span>${ICONO_AREA[m.area] || '🎯'} ${esc(m.titulo)}</span>${barra(progresoMeta(m))}</div>`).join('')}
      </section>` : ''}`;
  }
};
