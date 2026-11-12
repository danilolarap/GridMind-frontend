# GridMind Frontend

Aplicación de gestión energética con React, TypeScript y Vite. Incluye autenticación, dispositivos y relés, consumo diario y semanal, lecturas STOMP, facturas, alertas y reportes PDF.

## Requisitos

- Node.js 22.18 o posterior y npm.
- Backend GridMind accesible por HTTP/HTTPS y WebSocket.

## Desarrollo

```sh
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
