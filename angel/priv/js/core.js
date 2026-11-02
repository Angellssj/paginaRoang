// Núcleo: datos, fechas, utilidades de interfaz y enrutador.
'use strict';

/* ---------- Utilidades ---------- */
const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DIAS_CORTO = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = (sel, raiz = document) => raiz.querySelector(sel);
const $$ = (sel, raiz = document) => [...raiz.querySelectorAll(sel)];

const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parseFecha = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const hoyStr = () => ymd(new Date());
const addDias = (s, n) => { const d = parseFecha(s); d.setDate(d.getDate() + n); return ymd(d); };
const diaSemana = s => parseFecha(s).getDay();
const mesDe = s => s.slice(0, 7);
const fechaLarga = s => { const d = parseFecha(s); return `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()].toLowerCase()}`; };
const fechaCorta = s => { const d = parseFecha(s); return `${d.getDate()} ${MESES[d.getMonth()].slice(0, 3).toLowerCase()}`; };
const nombreMes = m => { const [y, mm] = m.split('-').map(Number); return `${MESES[mm - 1]} ${y}`; };
const addMeses = (m, n) => { const [y, mm] = m.split('-').map(Number); const d = new Date(y, mm - 1 + n, 1); return ymd(d).slice(0, 7); };
const diasEntre = (a, b) => Math.round((parseFecha(b) - parseFecha(a)) / 86400000);

const dinero = n => {
  const signo = n < 0 ? '-' : '';
  return signo + Store.state.config.moneda + Math.abs(Math.round(n)).toLocaleString('es-CL');
};
const pct = (a, b) => (b > 0 ? Math.max(0, Math.min(100, Math.round((a / b) * 100))) : 0);
const barra = (valor, clase = '') => `<div class="barra ${clase}"><i style="width:${valor}%"></i></div>`;

/* ---------- Datos ---------- */
const POR_DEFECTO = () => ({
  v: 1,
  config: { nombre: '', moneda: '$', ultimoRespaldo: null },
  habitos: [],
  registroHabitos: {},
  tareas: [],
  metas: [],
  fe: { dias: {}, peticiones: [] },
  fin: {
    movs: [],
    presupuestos: {},
    deudas: [],
    ahorros: [],
    catGasto: ['Vivienda', 'Comida', 'Transporte', 'Salud', 'Educación', 'Ocio', 'Suscripciones', 'Ropa', 'Diezmo y ofrendas', 'Deudas', 'Otros'],
    catIngreso: ['Sueldo', 'Extra', 'Ventas', 'Regalo', 'Otros']
  }
});

const Store = {
  clave: 'mivida.v1',
  state: null,
  cargar() {
    const base = POR_DEFECTO();
    let guardado = {};
    try { guardado = JSON.parse(localStorage.getItem(this.clave)) || {}; } catch (e) { console.warn('Datos ilegibles', e); }
    this.state = { ...base, ...guardado };
    this.state.config = { ...base.config, ...guardado.config };
    this.state.fe = { ...base.fe, ...guardado.fe };
    this.state.fin = { ...base.fin, ...guardado.fin };
  },
  guardar() {
    try { localStorage.setItem(this.clave, JSON.stringify(this.state)); }
    catch (e) { toast('No se pudo guardar: almacenamiento lleno o bloqueado'); }
  },
  reemplazar(datos) {
    localStorage.setItem(this.clave, JSON.stringify(datos));
    this.cargar();
  }
};

/* ---------- Interfaz ---------- */
const Acciones = {};     // data-act="nombre"  -> (elemento, evento)
const Formularios = {};  // data-form="nombre" -> (datos, formulario)
const Vistas = {};       // clave -> { titulo, icono, render() }
const UI = { vista: 'hoy', fecha: hoyStr(), mes: mesDe(hoyStr()), finTab: 'resumen' };

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => (t.hidden = true), 2600);
}

function abrirModal(titulo, cuerpo, formulario) {
  const m = $('#modal');
  m.innerHTML = `
    <div class="modal-caja" role="dialog" aria-modal="true" aria-label="${esc(titulo)}">
      <header><h3>${esc(titulo)}</h3><button type="button" class="icono" data-act="cerrar" aria-label="Cerrar">✕</button></header>
      <form ${formulario ? `data-form="${formulario}"` : ''} autocomplete="off">${cuerpo}</form>
    </div>`;
  m.hidden = false;
  const primero = $('input:not([type=hidden]), textarea, select', m);
  if (primero) primero.focus();
}
const cerrarModal = () => { const m = $('#modal'); m.hidden = true; m.innerHTML = ''; };

function confirmar(msg) { return window.confirm(msg); }

const campo = (etiqueta, html) => `<label class="campo"><span>${etiqueta}</span>${html}</label>`;
const opciones = (lista, actual) => lista.map(o => {
  const [v, t] = Array.isArray(o) ? o : [o, o];
  return `<option value="${esc(v)}" ${v === actual ? 'selected' : ''}>${esc(t)}</option>`;
}).join('');

function render() {
  const vista = Vistas[UI.vista] || Vistas.hoy;
  $('#app').innerHTML = vista.render();
  $$('#nav a').forEach(a => a.classList.toggle('activo', a.dataset.vista === UI.vista));
  window.scrollTo(0, 0);
}
// Redibuja sin saltar al inicio de la página.
function refrescar() {
  const y = window.scrollY;
  const vista = Vistas[UI.vista] || Vistas.hoy;
  $('#app').innerHTML = vista.render();
  window.scrollTo(0, y);
}

function irA(vista) {
  UI.vista = Vistas[vista] ? vista : 'hoy';
  if (location.hash !== '#' + UI.vista) history.replaceState(null, '', '#' + UI.vista);
  render();
}

/* ---------- Eventos globales ---------- */
document.addEventListener('click', e => {
  // Con <base> activo, un enlace "#x" recargaría la página; se resuelve aquí sin navegar.
  const enlace = e.target.closest('a[href^="#"]');
  if (enlace && !e.defaultPrevented && !e.metaKey && !e.ctrlKey) {
    e.preventDefault();
    if (!Bloqueo.requerido()) irA(enlace.getAttribute('href').slice(1));
    return;
  }
  const el = e.target.closest('[data-act]');
  if (el) {
    const fn = Acciones[el.dataset.act];
    if (fn) fn(el, e);
    return;
  }
  if (e.target.id === 'modal') cerrarModal();
});

document.addEventListener('submit', e => {
  const f = e.target.closest('form[data-form]');
  if (!f) return;
  e.preventDefault();
  const fn = Formularios[f.dataset.form];
  if (fn) fn(Object.fromEntries(new FormData(f)), f);
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !$('#modal').hidden) cerrarModal();
});

Acciones.cerrar = cerrarModal;
Acciones.ir = el => irA(el.dataset.vista);
