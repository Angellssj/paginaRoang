// Protege /angel/priv con usuario y contraseña (HTTP Basic) antes de entregar cualquier archivo.
//
// Variables de entorno (Vercel → Project → Settings → Environment Variables):
//   PRIV_PASS  contraseña (obligatoria). Si falta, la ruta queda cerrada.
//   PRIV_USER  usuario (opcional, por defecto "angel").
import { next } from '@vercel/functions';

export const config = {
  matcher: ['/angel/priv', '/angel/priv/:path*'],
};

const CABECERAS_SEGURAS = {
  'Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
};

// Comparación en tiempo constante para no filtrar información por tiempos de respuesta.
function iguales(a, b) {
  const x = new TextEncoder().encode(a);
  const y = new TextEncoder().encode(b);
  let dif = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) dif |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return dif === 0;
}

function credenciales(request) {
  const cab = request.headers.get('authorization') || '';
  if (!cab.startsWith('Basic ')) return null;
  try {
    const bytes = Uint8Array.from(atob(cab.slice(6)), c => c.charCodeAt(0));
    const texto = new TextDecoder().decode(bytes);
    const i = texto.indexOf(':');
    return i < 0 ? null : { usuario: texto.slice(0, i), clave: texto.slice(i + 1) };
  } catch {
    return null;
  }
}

export default function middleware(request) {
  const clave = process.env.PRIV_PASS;
  if (!clave) {
    return new Response('Zona privada sin configurar.', { status: 503, headers: CABECERAS_SEGURAS });
  }

  const dadas = credenciales(request);
  const usuarioOk = dadas && iguales(dadas.usuario, process.env.PRIV_USER || 'angel');
  const claveOk = dadas && iguales(dadas.clave, clave);

  if (usuarioOk && claveOk) return next({ headers: CABECERAS_SEGURAS });

  return new Response('Acceso restringido.', {
    status: 401,
    headers: { ...CABECERAS_SEGURAS, 'WWW-Authenticate': 'Basic realm="Privado", charset="UTF-8"' },
  });
}
