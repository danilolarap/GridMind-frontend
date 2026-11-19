# GridMind Frontend

Aplicación de gestión energética con React, TypeScript y Vite. Incluye autenticación, dispositivos y relés, consumo diario y semanal, lecturas STOMP, facturas, alertas y reportes PDF.

## Requisitos

- Node.js 22.23.5 (`.nvmrc`) y npm 10.9.9 (`packageManager`). El mínimo compatible sigue siendo Node 22.18.
- Backend GridMind accesible por HTTP/HTTPS y WebSocket.

## Desarrollo

```sh
nvm use # si utilizas nvm
node --version # v22.23.5
npm --version  # 10.9.9
npm ci
cp .env.example .env
npm run dev
```

En PowerShell usa `Copy-Item .env.example .env` para copiar la configuración.
Configura `VITE_API_URL` con la URL del backend (por defecto en el ejemplo: `http://localhost:8080`). Si no se define, se utiliza `https://gridmind-backend-production.up.railway.app`.
El backend debe permitir el origen del frontend por CORS y servir STOMP en `/api/v1/ws`.
Las contraseñas conservan el contrato SHA-256 del código original; el backend debe admitir ese formato. Usa HTTPS en producción.

## Comprobaciones

```sh
npm run lint
npm test
npm run build
npm run preview
```

Las pruebas cubren la normalización de datos, la agrupación semanal, el JWT, las respuestas 401/403 y el contrato de contraseña. No sustituyen las pruebas con el backend y un ESP32 real.

## Despliegue

Configura `VITE_API_URL` en el servicio de hosting antes de compilar. Las variables `VITE_` son públicas y se incorporan al build; no contienen secretos.
Publica el directorio `dist` generado con `npm run build`. `vercel.json` incluye la reescritura necesaria para abrir rutas internas directamente.
No se incluyen `.env`, dependencias ni archivos compilados en Git.

## Docker

```powershell
docker build --build-arg VITE_API_URL=http://localhost:8080 -t gridmind-frontend .
docker run --rm -p 5173:80 gridmind-frontend
```

La imagen compila con `npm ci` y sirve `dist` con nginx (con la misma reescritura de rutas que `vercel.json`).
Para levantar el esqueleto completo, usa `compose.yaml` del repo GridMind-backend.

El lockfile publicado en `e114384` incluye las dependencias WASM opcionales de Rolldown. La instalación reproducible usa `npm ci` sin regenerarlo durante Docker. El Dockerfile y el Compose revisado de `GridMind-backend` fijan por digest Node 22.23.5 / npm 10.9.9.

### Codespaces y proxy del backend

En el despliegue integrado, `VITE_API_URL` debe ser el **origen HTTPS del frontend**, sin `/api` al final, por ejemplo `https://<codespace>-5173.app.github.dev`. Se incorpora al compilar: reconstruye la imagen si cambia el origen. El cliente usa ese mismo origen para HTTP `/api/v1/...` y WSS `/api/v1/ws`.

El repositorio backend gestiona el proxy mediante `docker/frontend.conf`, montado en nginx del frontend por Compose. El `nginx.conf` de esta imagen solo sirve la SPA; para usar la imagen sin ese montaje, configura una URL de backend accesible desde el navegador y su CORS, como en el ejemplo Docker anterior.

Consulta [la guía de navegador del backend](../GridMind-backend/docs/codespaces-navegador.md) y [su informe de validación](../GridMind-backend/docs/validacion-ia-caida.md). Conserva el nombre de proyecto, los volúmenes y los ajustes existentes del Codespace antes de integrar Compose u overrides. El cierre local, sus verificaciones y las dos incidencias abiertas del dashboard se documentan en [docs/validacion-docker-codespaces.md](docs/validacion-docker-codespaces.md).
