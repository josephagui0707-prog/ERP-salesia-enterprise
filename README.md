# SalesIA Enterprise — React + TypeScript + Vite + Supabase

SalesIA organiza la gestión comercial y los análisis estadísticos en nueve módulos. La interfaz conserva su motor de vistas heredado por compatibilidad, mientras el punto de entrada y el marco de la aplicación utilizan React + TypeScript.

## Requisitos

- Node.js 20.19+ o 22.12+.
- npm.
- Proyecto Supabase (se puede comenzar con el plan Free).

## Preparar Supabase

Sigue paso a paso [`docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md). En resumen:

1. Ejecuta una sola vez `supabase/migrations/001_salesia_enterprise.sql` en Supabase → SQL Editor.
2. Desactiva **Allow new users to sign up** en la configuración del proveedor Email.
3. Crea la primera cuenta desde Authentication → Users. Inicia sesión con ella para configurar la empresa y convertirla en administradora.
4. Despliega la función `admin-create-user` para que el administrador pueda añadir cuentas de forma segura.
5. Copia `.env.example` a `.env` y configura la URL del proyecto y la clave pública `anon`/`publishable`.

**Nunca** coloques `service_role` o claves secretas en variables `VITE_*` ni en el código cliente.

## Iniciar en Windows

Desde la raíz de la carpeta del proyecto:

```bash
npm install
npm run dev
```

Abre la URL local mostrada por Vite. Para detenerlo, pulsa `Ctrl + C`.

## Comandos

- `npm run dev`: servidor de desarrollo.
- `npm run build`: comprobación TypeScript y compilación de producción.
- `npm run preview`: vista previa de la compilación.
- `npm run test:legacy`: pruebas del motor de vistas y de las operaciones locales de demostración.

## Organización del código

```text
src/
├── auth/                   # Login, configuración inicial y alta administrativa
├── components/             # Sidebar, Topbar, modales y pie de página
├── lib/supabase.ts         # Cliente Supabase y tipos de perfil
├── legacy/app.js           # Vistas y comportamiento heredados
├── App.tsx                 # Flujo de autenticación y shell de la aplicación
└── styles.css
supabase/
├── migrations/             # Esquema relacional, RLS y funciones transaccionales
└── functions/admin-create-user/ # Edge Function de alta administrativa

docs/
├── MODULOS.md
└── SUPABASE_SETUP.md
```

## Alcance real de esta entrega

Esta versión incorpora el esquema SQL y una primera integración de autenticación: login, configuración de la primera empresa, perfil/rol, bloqueo de usuarios inactivos, cambio obligatorio de contraseña temporal y alta de cuentas por un administrador. La migración SQL también deja preparadas las tablas y funciones transaccionales de ventas, pagos, pedidos e inventario.

**Los formularios y registros comerciales de las vistas heredadas todavía usan `localStorage` y datos ficticios.** No todos los botones del sistema están conectados a Supabase en esta fase. La siguiente etapa necesaria es migrar los formularios, listados, filtros, informes e historiales de cada módulo a las tablas y funciones SQL, y luego probar permisos por rol y las operaciones con datos reales antes del despliegue.
