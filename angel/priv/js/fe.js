// Fe: devocional diario, gratitud y peticiones de oración.
'use strict';

const entradaFe = fecha => Store.state.fe.dias[fecha] || {};
const diaConFe = e => e && (e.leyo || e.oro || e.reflexion || e.gratitud);

function rachaFe() {
  let f = hoyStr();
  if (!diaConFe(entradaFe(f))) f = addDias(f, -1);
  let n = 0;
  while (diaConFe(entradaFe(f)) && n < 1000) { n++; f = addDias(f, -1); }
  return n;
}

Formularios.fe = (d, form) => {
  Store.state.fe.dias[d.fecha] = {
    leyo: form.elements.leyo.checked,
    oro: form.elements.oro.checked,
    pasaje: d.pasaje.trim(),
    reflexion: d.reflexion.trim(),
    gratitud: d.gratitud.trim()
  };
  Store.guardar();
  toast('Guardado 🙏');
  refrescar();
};

Formularios.peticion = d => {
  Store.state.fe.peticiones.unshift({ id: uid(), texto: d.texto.trim(), fecha: hoyStr(), respondida: false });
  Store.guardar();
  refrescar();
};

Acciones.togglePeticion = el => {
  const p = Store.state.fe.peticiones.find(x => x.id === el.dataset.id);
  p.respondida = !p.respondida;
  p.fechaRespuesta = p.respondida ? hoyStr() : null;
  Store.guardar();
  refrescar();
  if (p.respondida) toast('¡Gloria a Dios! 🙌');
};
Acciones.borrarPeticion = el => {
  if (!confirmar('¿Quitar esta petición?')) return;
  Store.state.fe.peticiones = Store.state.fe.peticiones.filter(p => p.id !== el.dataset.id);
  Store.guardar();
  refrescar();
};

Vistas.fe = {
  titulo: 'Fe', icono: '🙏',
  render() {
    const f = hoyStr();
    const e = entradaFe(f);
    const racha = rachaFe();
    const pend = Store.state.fe.peticiones.filter(p => !p.respondida);
    const resp = Store.state.fe.peticiones.filter(p => p.respondida);
    const anteriores = Object.keys(Store.state.fe.dias)
      .filter(k => k !== f && (Store.state.fe.dias[k].reflexion || Store.state.fe.dias[k].gratitud))
      .sort().reverse().slice(0, 7);

    const fila = p => `<div class="check ${p.respondida ? 'hecho' : ''}">
      <button type="button" class="caja" data-act="togglePeticion" data-id="${p.id}" aria-label="Respondida">${p.respondida ? '✓' : ''}</button>
      <span class="texto">${esc(p.texto)}<span class="sub"> · ${fechaCorta(p.fecha)}${p.respondida ? ' → respondida ' + fechaCorta(p.fechaRespuesta || p.fecha) : ''}</span></span>
      <button type="button" class="icono chico" data-act="borrarPeticion" data-id="${p.id}" aria-label="Quitar">✕</button>
    </div>`;

    return `
      <header class="cabecera"><h1>Fe</h1><span class="racha-grande">🔥 ${racha} día${racha === 1 ? '' : 's'}</span></header>
      <section class="tarjeta">
        <h3>Tiempo con Dios · ${fechaLarga(f)}</h3>
        <form data-form="fe" autocomplete="off">
          <input type="hidden" name="fecha" value="${f}">
          <div class="chips">
            <label class="chip largo"><input type="checkbox" name="leyo" ${e.leyo ? 'checked' : ''}><span>📖 Leí la Palabra</span></label>
            <label class="chip largo"><input type="checkbox" name="oro" ${e.oro ? 'checked' : ''}><span>🙏 Oré</span></label>
          </div>
          ${campo('Pasaje de hoy', `<input name="pasaje" maxlength="80" value="${esc(e.pasaje || '')}" placeholder="Ej: Salmo 23">`)}
          ${campo('¿Qué me enseñó Dios hoy?', `<textarea name="reflexion" rows="3">${esc(e.reflexion || '')}</textarea>`)}
          ${campo('Estoy agradecido por…', `<textarea name="gratitud" rows="2">${esc(e.gratitud || '')}</textarea>`)}
          <div class="acciones-form"><button class="primario">Guardar</button></div>
        </form>
      </section>
      <section class="tarjeta">
        <h3>Peticiones de oración</h3>
        <form data-form="peticion" class="fila-agregar" autocomplete="off">
          <input name="texto" placeholder="Por qué estás orando" maxlength="160" required>
          <button class="primario">Agregar</button>
        </form>
        ${pend.map(fila).join('') || '<p class="vacio">Sin peticiones pendientes.</p>'}
        ${resp.length ? `<h4 class="momento">Respondidas (${resp.length})</h4>${resp.map(fila).join('')}` : ''}
      </section>
      ${anteriores.length ? `<section class="tarjeta"><h3>Días anteriores</h3>${anteriores.map(k => {
        const x = Store.state.fe.dias[k];
        return `<div class="diario"><strong>${fechaLarga(k)}</strong>${x.pasaje ? ` <span class="sub">· ${esc(x.pasaje)}</span>` : ''}
          ${x.reflexion ? `<p>${esc(x.reflexion)}</p>` : ''}${x.gratitud ? `<p class="sub">Gratitud: ${esc(x.gratitud)}</p>` : ''}</div>`;
      }).join('')}</section>` : ''}`;
  }
};
