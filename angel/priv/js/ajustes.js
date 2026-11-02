// Ajustes: perfil, categorías y respaldo de datos.
'use strict';

Formularios.ajustes = d => {
  Store.state.config.nombre = d.nombre.trim();
  Store.state.config.moneda = d.moneda.trim() || '$';
  Store.guardar();
  toast('Ajustes guardados');
  refrescar();
};

Formularios.categoria = d => {
  const lista = d.tipo === 'gasto' ? Store.state.fin.catGasto : Store.state.fin.catIngreso;
  const nombre = d.nombre.trim();
  if (nombre && !lista.includes(nombre)) lista.push(nombre);
  Store.guardar();
  refrescar();
};

Acciones.quitarCategoria = el => {
  const { tipo, nombre } = el.dataset;
  const f = Store.state.fin;
  if (tipo === 'gasto') f.catGasto = f.catGasto.filter(c => c !== nombre);
  else f.catIngreso = f.catIngreso.filter(c => c !== nombre);
  Store.guardar();
  refrescar();
};

Acciones.exportar = () => {
  const s = Store.state;
  s.config.ultimoRespaldo = hoyStr();
  Store.guardar();
  const blob = new Blob([JSON.stringify(s, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `mivida-respaldo-${hoyStr()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  refrescar();
};

Acciones.borrarTodo = () => {
  if (!confirmar('Esto borra TODOS tus datos de este navegador. ¿Seguro?')) return;
  if (!confirmar('Última confirmación: no se puede deshacer salvo que tengas un respaldo.')) return;
  localStorage.removeItem(Store.clave);
  Store.cargar();
  irA('hoy');
};

document.addEventListener('change', e => {
  if (e.target.id !== 'importar' || !e.target.files[0]) return;
  const lector = new FileReader();
  lector.onload = () => {
    try {
      const datos = JSON.parse(lector.result);
      if (!datos || typeof datos !== 'object' || !Array.isArray(datos.habitos) || !datos.fin) throw new Error('formato');
      if (!confirmar('Se reemplazarán los datos actuales por los del respaldo. ¿Continuar?')) return;
      Store.reemplazar(datos);
      irA('hoy');
      toast('Respaldo restaurado ✓');
    } catch (err) {
      toast('Ese archivo no es un respaldo válido');
    }
  };
  lector.readAsText(e.target.files[0]);
  e.target.value = '';
});

Vistas.ajustes = {
  titulo: 'Ajustes', icono: '⚙️',
  render() {
    const { config, fin } = Store.state;
    const dias = config.ultimoRespaldo ? diasEntre(config.ultimoRespaldo, hoyStr()) : null;
    const estado = dias === null ? '⚠️ Aún no has hecho un respaldo'
      : dias > 14 ? `⚠️ Último respaldo hace ${dias} días`
      : `Último respaldo: ${dias === 0 ? 'hoy' : `hace ${dias} días`}`;
    const chips = (lista, tipo) => lista.map(c =>
      `<span class="etiqueta-borrable">${esc(c)}<button type="button" data-act="quitarCategoria" data-tipo="${tipo}" data-nombre="${esc(c)}" aria-label="Quitar ${esc(c)}">✕</button></span>`).join('');

    return `
      <header class="cabecera"><h1>Ajustes</h1></header>
      <section class="tarjeta">
        <h3>Perfil</h3>
        <form data-form="ajustes" autocomplete="off">
          <div class="fila">
            ${campo('Tu nombre', `<input name="nombre" maxlength="40" value="${esc(config.nombre)}">`)}
            ${campo('Símbolo de moneda', `<input name="moneda" maxlength="5" value="${esc(config.moneda)}">`)}
          </div>
          <div class="acciones-form"><button class="primario">Guardar</button></div>
        </form>
      </section>
      ${seccionPin()}
      <section class="tarjeta">
        <h3>Categorías de finanzas</h3>
        <h4 class="momento">Gastos</h4><div class="etiquetas">${chips(fin.catGasto, 'gasto')}</div>
        <h4 class="momento">Ingresos</h4><div class="etiquetas">${chips(fin.catIngreso, 'ingreso')}</div>
        <form data-form="categoria" class="fila-agregar" autocomplete="off">
          <select name="tipo"><option value="gasto">Gasto</option><option value="ingreso">Ingreso</option></select>
          <input name="nombre" placeholder="Nueva categoría" maxlength="30" required>
          <button class="primario">Agregar</button>
        </form>
      </section>
      <section class="tarjeta">
        <h3>Respaldo de datos</h3>
        <p class="sub">Tus datos viven solo en este navegador. Descarga un respaldo cada tanto (y guárdalo en OneDrive).</p>
        <p class="sub"><strong>${estado}</strong></p>
        <div class="acciones-form">
          <label class="boton" for="importar">Restaurar respaldo</label>
          <input type="file" id="importar" accept="application/json,.json" hidden>
          <button class="primario" data-act="exportar">Descargar respaldo</button>
        </div>
      </section>
      <section class="tarjeta">
        <h3>Zona de peligro</h3>
        <button class="peligro" data-act="borrarTodo">Borrar todos los datos</button>
      </section>`;
  }
};
