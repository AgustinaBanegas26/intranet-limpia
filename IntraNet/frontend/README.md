# Frontend de la intranet

Aplicación de una sola página desarrollada con React 18, TypeScript, Vite y
React Router. Incluye una interfaz adaptable e instalación como PWA.

## Módulos

- `src/App.tsx`: restaura la sesión, procesa el inicio/cierre de sesión y monta
  las rutas públicas.
- `src/routes/`: organiza las rutas autenticadas y aplica restricciones por rol.
- `src/pages/`: páginas de acceso, inicio, solicitudes, empleados, perfil,
  noticias, eventos, ausencias, beneficios y otros módulos.
- `src/components/`: componentes reutilizables, formularios, paneles de
  administración y elementos de navegación.
- `src/context/`: estado compartido de autenticación, tema e instalación PWA.
- `src/services/`: solicitudes a la API y acceso a los módulos de datos.
- `src/utils/`: validaciones, formato y funciones auxiliares.
- `src/pwa/`, `public/` y `scripts/`: registro de service worker, recursos PWA
  y generación de iconos.

La sesión JWT se conserva mediante el servicio de autenticación. `apiClient`
adjunta el token a las solicitudes protegidas y comunica a la aplicación los
errores de sesión o el cambio de contraseña obligatorio. Las reglas de acceso
del frontend son una ayuda de navegación; el backend vuelve a validar cada
permiso.

## Desarrollo

```sh
npm install
```

Configurar `VITE_BACKEND_URL` en `.env.local` con el origen del backend; por
ejemplo, `http://localhost:4000`. Luego ejecutar:

```sh
npm run dev
```

## Comandos

- `npm run lint`: analiza los archivos TypeScript y TSX.
- `npm run build`: genera iconos PWA, comprueba los tipos y crea el bundle.
- `npm run preview`: sirve localmente el bundle generado.
- `npm run pwa:icons`: genera los iconos que usa la configuración PWA.

Consulta la [guía del proyecto](../../README.md) y la
[documentación técnica](../../DOCUMENTACION_TECNICA.md) para el flujo completo
de desarrollo y la configuración del backend.
