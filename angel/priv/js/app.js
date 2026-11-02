// Arranque de la aplicación.
'use strict';

const ORDEN_NAV = ['hoy', 'rutinas', 'calendario', 'metas', 'fe', 'finanzas', 'ajustes'];

function construirNav() {
  $('#nav').innerHTML = ORDEN_NAV.map(k =>
    `<a href="#${k}" data-vista="${k}"><span class="ico">${Vistas[k].icono}</span><span class="lbl">${Vistas[k].titulo}</span></a>`).join('');
}

function arrancar() {
  UI.vista = Vistas[location.hash.slice(1)] ? location.hash.slice(1) : 'hoy';
  render();
}

Store.cargar();
construirNav();
Bloqueo.actualizarBoton();
if (Bloqueo.requerido()) Bloqueo.mostrar(arrancar); else arrancar();

window.addEventListener('hashchange', () => {
  const v = location.hash.slice(1);
  if (Bloqueo.requerido()) return;
  if (Vistas[v] && v !== UI.vista) { UI.vista = v; render(); }
});

// Si la pestaña queda abierta de un día para otro, "hoy" debe actualizarse.
let diaVisto = hoyStr();
document.addEventListener('visibilitychange', () => {
  if (document.hidden || hoyStr() === diaVisto || Bloqueo.requerido()) return;
  diaVisto = hoyStr();
  UI.fecha = diaVisto;
  UI.mes = UI.finMes = mesDe(diaVisto);
  refrescar();
});

// Pide al navegador no borrar los datos por falta de espacio.
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
