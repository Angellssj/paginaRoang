# ROANG — Sitio web corporativo

Tres vistas, un solo dominio y sin tarifas públicas:

- `https://roang.cl/` — marca corporativa ROANG y 8 servicios.
- `https://roang.cl/angel` — edición de videos, AI Films y seis reels reales recuperados del proyecto original.
- `https://roang.cl/roselin` — páginas web, aplicaciones, UX/UI y apps.

## Qué incluye

`index.html`, `angel/index.html`, `roselin/index.html`, estilos y JavaScript compartidos en `/assets`, videos MP4 con sus posters en `/assets/reels`, favicon, metadatos SEO, sitemap y robots. No utiliza base de datos ni necesita un backend para mostrar las páginas. La solicitud de cotización prepara un mensaje de WhatsApp que la persona debe confirmar y enviar.

## Identidad visual

Las tres vistas usan el mismo sistema que el portafolio de Ángel (`Angellssj/portfolio-angel-roang`):

- `assets/styles.css`: tokens de marca (azul `#0057FF`, cian `#00E5E0`), tema oscuro y claro, y todos los componentes. Cambia colores y medidas en el bloque `:root` del inicio.
- `assets/fonts/`: Unbounded (titulares) y Jost (texto), autoalojadas con su licencia OFL.
- `assets/brand/`: logos oficiales de ROANG. No los redibujes.
- `favicon.ico` (raíz) y `assets/brand/favicon-32.png`, `favicon-192.png`, `apple-touch-icon.png`: favicon recortado de la «R» oficial para que se lea a 16 px.
- `assets/img/angel-hero.webp`: retrato de Ángel en `/angel`, el mismo recorte del portafolio.
- `assets/img/hero-bg.webp`: fondo de los héroes. `og-roang.jpg`: imagen para compartir en redes (1200×630), hecha con ese fondo y el logo oficial.
- El botón de tema guarda la preferencia en `localStorage` con la clave `ag-theme`, la misma del portafolio.
- `docs/branding/`: capturas de antes y después del rediseño. `.vercelignore` las deja fuera del sitio publicado.

## Configuración del contacto (importante)

El teléfono **56920019066** es el canal de contacto de las tres vistas: ROANG, Ángel y Roselin (confirmado por Ángel en noviembre de 2026). Para cambiarlo, edita `WHATSAPP_NUMBER` en `assets/app.js`.

El portafolio de Ángel conserva el enlace de Google Drive suministrado en su landing original.

No se muestran precios, clientes inventados ni resultados no comprobados. Las vistas de interfaces en Roselin son *conceptos visuales*, no se publican como proyectos realizados.

## Publicación

Puedes subir **todo el contenido de esta carpeta** a la raíz pública de un hosting estático que resuelva directorios con `index.html`.

- **Vercel:** importa el directorio como sitio estático. Incluye `vercel.json` para servir `/angel` y `/roselin` sin necesitar la barra final.
- **Netlify:** publica esta carpeta. Se incluye `_redirects`.
- **Hosting tradicional / cPanel:** sube el contenido a `public_html`. Los directorios `/angel/` y `/roselin/` abrirán sus respectivos `index.html`. Según la configuración, el servidor puede redirigir `/angel` a `/angel/`.

Después conecta el dominio `roang.cl` con el hosting desde su panel, configura DNS conforme al proveedor, activa HTTPS y comprueba las rutas. **Los archivos no cambian por sí mismos la configuración DNS del dominio.**

## Antes de lanzar

Confirmado (noviembre de 2026): el número de WhatsApp es el canal de las tres vistas, y los seis reels están autorizados para publicarse. La identidad definitiva (logos oficiales de ROANG) ya está aplicada.

1. Revisar textos, alcance real de cada servicio y responsabilidad de cada profesional.
2. Si corresponde, añadir redes y datos legales reales.
3. Confirmar que el contenido del Drive enlazado también está autorizado.
4. Reemplazar las vistas conceptuales de Roselin por capturas reales cuando existan.
