# Cierre de Docker/Codespaces del frontend

Fecha: 18 de noviembre de 2026, America/Bogota.

## Comparación y alcance

- No existe AGENTS.md en este repositorio ni en sus directorios ascendentes.
  Se revisaron status y diffs staged/unstaged antes de editar; no había staged.
- Base local inicial: `d29b89f`. Se actualizó origin mediante fetch: main remoto
  estaba en `e114384`, también base del Codespace. `origin/docker` apunta al
  mismo commit. Se avanzó main por fast-forward, conservando los cambios locales
  en un stash de respaldo durante la integración.
- `e114384` ya aporta Dockerfile, nginx.conf, .dockerignore, sección Docker del
  README y el lock corregido. El lock local coincide exactamente con el publicado;
  no se vuelve a generar ni se incluye otra corrección en los nuevos commits.
- Se conservaron las instrucciones Docker publicadas y los ajustes locales de
  README, .nvmrc y packageManager. .dockerignore conserva la excepción publicada
  para .env.example y añade la exclusión local de logs.
- Se incorporó el FROM usado en Codespaces:
  `node:22-alpine@sha256:1314fb30ec37592d5845e5a160d522c0e680972aa534549940b8d73bde88481a`.
  Coincide con el Compose local del backend y devuelve Node 22.23.5 / npm 10.9.9.
- Se leyó `GridMind-backend/docs/validacion-ia-caida.md` y su guía de navegador,
  y se contrastaron Compose, proxy nginx y fuentes del backend. El informe
  describe los ajustes del Codespace, pero no contiene su diff/status final:
  esa comparación completa sigue pendiente. No hubo acceso directo al Codespace.
- Solo se modifican configuración y documentación del frontend. Se conservan
  las fuentes, pruebas, dependencias, compilados locales y repositorios hermanos.

## Verificaciones de esta ejecución

Docker Desktop: motor Linux 28.1.1. El host tiene Node 24.14.0; por eso las
comprobaciones se ejecutaron con la imagen fijada, no con el Node del PATH.
Se copió el código montado en solo lectura a /app de un contenedor desechable,
sin node_modules ni dist del host. Cada instalación empezó sin dependencias.

| Comprobación | Resultado |
|---|---|
| Versiones del contenedor | Node 22.23.5, npm 10.9.9 |
| `npm ci --no-audit --no-fund`, contenedor limpio | 273 paquetes; 12 s en la ejecución final |
| Lock antes/después de instalación, pruebas y build | SHA-256 idéntico, indicado abajo |
| `npm test` | 10 pruebas correctas, 0 fallos/omitidas |
| `npm run lint` | Correcto |
| `npm run build` | TypeScript y Vite correctos |
| `docker build --no-cache --progress plain --build-arg VITE_API_URL=https://gridmind-validation.invalid -t gridmind-frontend:integration-validation .` | Correcto; instalación exclusivamente con `RUN npm ci`, 0 vulnerabilidades notificadas por npm |
| Imagen final: `nginx -t` | Correcto |
| Imagen final: GET `/` y `/devices` | HTTP 200; mismo HTML, fallback SPA correcto |
| Origen de prueba en assets compilados | Presente; se incorporó el build arg |
| Imagen final: dependencias y .env en directorio público | Ausentes |

SHA-256 de package-lock.json, también idéntico al checkout publicado:
`f44a5ca8d0d4186a646416932bca4dae1f125c73039e02ac3fa067c5d5ab2732`.

Un primer arnés completó instalación, pruebas, lint y build, pero su última
comprobación de hash falló por un CR añadido al transportar el script desde
PowerShell. Se repitió el arnés completo mediante un archivo LF: terminó con
salida 0 y ambos checksums correctos. No fue un fallo del lock ni del producto.

Permanece el aviso de Vite sobre chunks mayores de 500 kB (bundle principal
aproximadamente 739 kB). El origen `.invalid` solo valida la compilación: no es
un destino de despliegue. Se usaron contenedores temporales sin puertos publicados;
no se recrearon los servicios existentes ni se alteraron sus datos o volúmenes.

## Contrato de despliegue

El backend mantiene el proxy HTTP `/api/` y el upgrade WebSocket en
`docker/frontend.conf`, montado sobre la configuración nginx del frontend.
`VITE_API_URL` apunta al origen HTTPS del frontend en Codespaces, sin sufijo
`/api`; el cliente añade `/api/v1/...` y convierte HTTPS en WSS para STOMP.
El nginx.conf publicado en este repositorio mantiene su función de servir la SPA.
No se copia aquí la configuración de proxy gestionada en el backend.

## Incidencias investigadas, todavía abiertas

La evidencia de navegador procede del recorrido del usuario descrito en el
informe del backend: historial con 120, 132 y 144 W; forecast HTTP 200; monitor
a 144 W y mensajes energy/forecast tras abrir una conexión nueva. Esta ejecución
no repitió ese recorrido ni la caída de IA, y no acredita estabilidad prolongada.

### Falta de actualización inicial

`DashboardPage.tsx` inicializa liveReadings vacío. Su carga HTTP inicial consulta
analítica diaria, dispositivos, forecast y comparación; no carga lecturas del
historial para el monitor. Solo un MESSAGE de `/topic/energy` válido añade una
lectura, y `normalizeLiveReading` exige esp32Id y consumption numérico. El backend
publica esos campos. El cliente configura reconexión a 5 s y suscribe de nuevo
en onConnect; esto es inspección del código, no prueba de reconexión real.

Que el historial contenga lecturas no garantiza su aparición en ese monitor.
Esto explica el estado vacío si se abre después de los envíos, pero **no prueba**
la causa de los 120/132 W ausentes en la sesión observada. Faltan frames completos,
secuencia de suscripción/envío, navegación y errores de la conexión original.
También debe comprobarse la carrera entre la carga HTTP inicial y los mensajes:
setChartData del HTTP puede reemplazar un agregado en vivo recibido antes.

Pendiente: repetir 120 → 132 → 144 W después de CONNECTED/SUBSCRIBE sin navegar,
registrar MESSAGE y estado visual, y repetir tras desconexión/inactividad para
verificar reconexión automática. No se declara resuelta esta incidencia.

### Dos días para timestamps del mismo día

El histórico diario del backend agrupa CAST(timestamp AS LocalDate), con
timestamps LocalDateTime sin offset. La publicación WebSocket también usa
LocalDateTime.now(). DashboardPage agrega consumption usando **new Date() del
navegador**, ignorando reading.timestamp para elegir el día.

Se reprodujo el criterio actual en Node con `TZ=America/Bogota`: para el instante
`2026-11-19T03:45:05Z`, getFullYear/getMonth/getDate producen `2026-11-18`;
el timestamp backend `2026-11-19T03:45:05` agrupa en `2026-11-19`. Al combinar
histórico y lectura en vivo aparecen dos claves, 18 y 19. Una aserción del arnés
confirmó dos días. Esto demuestra el defecto de criterio con zonas distintas,
pero no mide la zona efectiva del navegador del recorrido original.

Pendiente: acordar la zona/contrato temporal entre backend y frontend, unificar
la agrupación de histórico y mensajes, y verificar con pruebas de cruce de día,
lecturas retrasadas, carga concurrente y navegador real. La integración Docker
no modifica esta lógica ni declara resuelta la discrepancia.
