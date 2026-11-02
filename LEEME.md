# ROANG — Sitio web corporativo

Tres vistas, un solo dominio y sin tarifas públicas:

- `https://roang.cl/` — marca corporativa ROANG y 8 servicios.
- `https://roang.cl/angel` — edición de videos, AI Films y seis reels reales recuperados del proyecto original.
- `https://roang.cl/roselin` — páginas web, aplicaciones, UX/UI y apps.

## Qué incluye

`index.html`, `angel/index.html`, `roselin/index.html`, estilos y JavaScript compartidos en `/assets`, videos MP4 con sus posters en `/assets/reels`, favicon, metadatos SEO, sitemap y robots. No utiliza base de datos ni necesita un backend para mostrar las páginas. La solicitud de cotización prepara un mensaje de WhatsApp que la persona debe confirmar y enviar.

## Identidad visual

Las tres páginas públicas mantienen los logos y colores oficiales de ROANG y usan una tipografía nativa: `-apple-system`, `BlinkMacSystemFont`, Segoe UI, Helvetica Neue y Arial. En Apple se utiliza la fuente del sistema; no se distribuyen archivos de San Francisco. Las fuentes del área privada son independientes.

- `assets/styles.css`: sistema visual público, claro/oscuro, responsive y motion graphics CSS.
- `assets/app.js`: menú con gestión de foco, preferencia de tema/movimiento, formulario de WhatsApp y coordinación de reproducción de videos.
- `assets/brand/`: logos oficiales. No se redibujaron.
- Los videos usan controles nativos, sonido a elección del visitante y `preload="none"`. No hay autoplay.
- El botón de pausa del encabezado detiene las animaciones. Se respeta `prefers-reduced-motion`.
- `ag-theme` conserva la compatibilidad con la preferencia del portafolio; `roang-motion` guarda la preferencia de movimiento.
- `angel/priv/` y `middleware.js` conservan su contenido y protección existentes.
- El formulario solo exige servicio e idea; nombre y correo son opcionales. No almacena ni envía datos a un backend. Prepara un enlace y requiere que la persona envíe el mensaje en WhatsApp; ofrece un enlace de reapertura si se bloquea la ventana.
- Las demos de Roselin están identificadas como conceptos, no como trabajos entregados.
- Las rutas canónicas de los perfiles son `/angel` y `/roselin`.

## Configuración del contacto (importante)

El teléfono **56920019066** es el canal de contacto de las tres vistas: ROANG, Ángel y Roselin (confirmado por Ángel en noviembre de 2026). Para cambiarlo, revisa los enlaces HTML y el destino de WhatsApp en `assets/app.js`.

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
