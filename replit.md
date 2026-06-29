# Instituto Escolar

Sistema de gestión académica chileno para institutos educacionales, con 5 frontends diferenciados por rol.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — API server (puerto 8080, accesible en `/api`)
- `pnpm --filter @workspace/school run dev` — Frontend React+Vite (preview en `/`)
- `pnpm run typecheck` — typecheck completo en todos los paquetes
- `pnpm run build` — typecheck + build
- `pnpm --filter @workspace/api-spec run codegen` — regenerar hooks y schemas Zod desde el OpenAPI spec
- `pnpm --filter @workspace/db run push` — aplicar cambios de schema a la DB (solo dev)
- Env requerida: `DATABASE_URL` — cadena de conexión PostgreSQL

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + Drizzle ORM + PostgreSQL
- Frontend: React + Vite + Tailwind CSS v4 + shadcn/ui
- Validación: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (desde OpenAPI spec)
- Build: esbuild (CJS bundle)
- Font: Plus Jakarta Sans

## Where things live

- `lib/api-spec/openapi.yaml` — Contrato OpenAPI (fuente de verdad)
- `lib/db/src/schema/` — Schemas Drizzle ORM (usuarios, cursos, horario, notas, asistencia, anotaciones, reuniones, anuncios)
- `lib/api-client-react/src/generated/` — Hooks React Query generados automáticamente por Orval
- `artifacts/api-server/src/routes/` — Routes Express (auth, users, courses, schedule, grades, attendance, annotations, meetings, announcements, dashboard)
- `artifacts/school/src/pages/` — Páginas del frontend por rol (alumno/, apoderado/, profesor/, inspector/, admin/)
- `artifacts/school/src/contexts/AuthContext.tsx` — Auth via localStorage (no token persistido en servidor)
- `artifacts/school/src/components/AppSidebar.tsx` — Layout compartido con sidebar por rol

## Architecture decisions

- **Auth sin JWT real**: El token es `token_{userId}`, se persiste en localStorage. En producción usar sesiones reales.
- **Re-exportaciones de páginas**: Las páginas de Apoderado/Inspector re-exportan páginas de Alumno/Profesor cuando la UI es idéntica.
- **Sin `useDeleteScheduleEntry`**: El OpenAPI spec no definió DELETE en `/schedule/{id}`, por lo que la página de horarios de Admin solo crea entradas, no las elimina.
- **Acceso rápido demo**: La página de login lista todos los usuarios del sistema con `useListUsers()` para facilitar la demo sin contraseña.
- **Sidebar por rol**: `AppSidebar.tsx` usa un mapa `navByRole` para construir el menú según el rol del usuario autenticado.

## Product

5 roles con acceso a sus propias vistas:
- **Alumno**: Dashboard (promedio por ramo), horario semanal (→ notas por ramo), anuncios
- **Apoderado**: Igual que alumno + reuniones (agendar con profesores/inspectores/admin)
- **Profesor**: Dashboard (alumnos, cursos, reuniones), cursos, asistencia diaria, notas CRUD, reuniones (confirmar/cancelar)
- **Inspector**: Dashboard (estadísticas anotaciones), anotaciones CRUD, reuniones
- **Admin**: Panel completo — usuarios CRUD, todas las notas, todas las anotaciones, todas las reuniones, horarios, anuncios CRUD

## Demo users (password: `password123`)

| RUT | Nombre | Rol |
|-----|--------|-----|
| 12345678-9 | Carlos Mendoza | Alumno |
| 23456789-0 | Sofia Vargas | Alumno |
| 34567890-1 | Diego Torres | Apoderado |
| 45678901-2 | Laura Jimenez | Profesora |
| 56789012-3 | Marco Rios | Profesor |
| 67890123-4 | Patricia Soto | Inspector |
| 78901234-5 | Roberto Alvarado | Admin |

## User preferences

_Populate as you build._

## Gotchas

- El API server necesita un rebuild completo al agregar nuevas rutas (reiniciar el workflow)
- El `@import url(...)` de Google Fonts debe ser la primera línea en `index.css` (antes de Tailwind)
- Las mutaciones generadas por Orval esperan `{ data: {...} }` como argumento
- Los hooks de update/delete con path params esperan `{ id: number, data: {...} }`
- La query key de `getGetGradeAverageQueryKey` requiere ambos argumentos: `(studentId, courseId)`

## Pointers

- Ver skill `pnpm-workspace` para estructura del workspace, TypeScript y detalles de paquetes
