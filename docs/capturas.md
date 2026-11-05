# Capturas de pantalla pendientes

Tomar las capturas manualmente con datos de demostración y sin exponer información personal o credenciales. Las rutas se refieren a la aplicación frontend después de iniciar sesión, salvo que se indique otra cosa.

| Hecho | Pantalla | Ruta de la app | Referencia del código |
|---|---|---|---|
| [ ] | Login | `/` (pantalla pública predeterminada) | `src/pages/auth/LoginPage.tsx` |
| [ ] | Cambio de contraseña | `/` inmediatamente después de ingresar con una cuenta que lo requiera, o acceso desde perfil | `src/pages/auth/ChangePasswordPage.tsx`, `src/pages/ChangePassword.tsx` |
| [ ] | Panel del empleado | `/` | `src/pages/dashboard/EmployeeDashboard.tsx` |
| [ ] | Rendición de gastos | `/viaticos` y abrir una rendición habilitada | `src/pages/requests/ViaticosPage.tsx`, `src/components/requests/RendicionesPanel.tsx` |
| [ ] | Vacaciones | `/vacaciones` | `src/pages/vacations/VacationsPage.tsx` |
| [ ] | Muro de novedades | `/novedades` | `src/pages/news/NewsPage.tsx` |
| [ ] | Panel administrativo | `/` con usuario `admin` | `src/pages/dashboard/AdminDashboard.tsx` |
| [ ] | Calendario | `/calendario` con usuario `admin` | `src/pages/calendar/CalendarPage.tsx` |

El cambio obligatorio puede mostrarse como paso intermedio del ingreso, no necesariamente como una ruta navegable independiente. La captura de rendición requiere una rendición disponible para el empleado de demostración.
