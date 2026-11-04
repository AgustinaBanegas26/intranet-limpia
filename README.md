# Intranet

Portal interno para empleados y administradores. El repositorio contiene una
aplicación web React, una API Express y los archivos SQL de referencia para
Supabase.

## Componentes

- `IntraNet/frontend`: SPA con React, TypeScript, Vite y PWA.
- `IntraNet/backend`: API REST con Express, autenticación JWT y servicios de
  persistencia.
- `supabase`: esquema de referencia y migraciones SQL.
- `DOCUMENTACION_TECNICA.md`: arquitectura, módulos, flujos y configuración.

## Requisitos

- Node.js compatible con las dependencias del proyecto.
- Acceso a un proyecto Supabase configurado con el esquema requerido.
- npm.

## Desarrollo local

1. Instalar dependencias y preparar la configuración del backend:

   ```sh
   cd IntraNet/backend
   npm install
   cp .env.example .env
   ```

   Completar `.env` con credenciales privadas de Supabase, un `JWT_SECRET` y
   los orígenes permitidos en `CORS_ORIGINS`. No compartir ni subir el archivo
   `.env`.

2. En una terminal, iniciar la API:

   ```sh
   cd IntraNet/backend
   npm run dev
   ```

3. En otra terminal, preparar e iniciar el frontend:

   ```sh
   cd IntraNet/frontend
   npm install
   ```

   Crear `.env.local` con `VITE_BACKEND_URL=http://localhost:4000` y luego:

   ```sh
   npm run dev
   ```

4. Abrir la URL que informa Vite. La API ofrece `GET /health` para comprobar
   su disponibilidad y conexión con Supabase.

Las variables `VITE_*` se incorporan al bundle del navegador: no guardar claves
privilegiadas, tokens ni contraseñas en ellas. La clave `SUPABASE_SERVICE_KEY`
se configura únicamente en el backend.

## Verificación

Desde `IntraNet/backend`:

```sh
npm test
npm run check:env
```

Desde `IntraNet/frontend`:

```sh
npm run lint
npm run build
```

El build del frontend genera los iconos PWA antes de compilar TypeScript y
crear el bundle de producción.

## Documentación relacionada

- [Documentación técnica integral](./DOCUMENTACION_TECNICA.md)
- [Requerimientos funcionales](./IntraNet/frontend/REQUIREMENTS.md)
- [Esquema de datos](./IntraNet/backend/SCHEMA.md)
- [Sincronización entre frontend, backend y Supabase](./IntraNet/backend/SYNC.md)

## Autores

Banegas Agustina — agustinabanegas26@gmail.com

Willers Lohr Sara — sara.willers23@gmail.com
