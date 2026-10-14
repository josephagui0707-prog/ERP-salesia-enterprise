# SalesIA Enterprise — instalación de Supabase

## Qué incorpora esta fase

- Base de datos relacional para empresa, perfiles/roles, clientes, categorías, productos, vendedores, ventas y sus líneas, pedidos, pagos, movimientos de inventario, conjuntos de datos, ejecuciones estadísticas, eventos y cálculos de probabilidad, insights, reportes y auditoría.
- Row Level Security (RLS) en las tablas, separación por `organization_id` y permisos base por rol.
- Inicio de sesión con email y contraseña. No se incluye registro público.
- Configuración inicial de la empresa por la primera cuenta creada manualmente en Supabase.
- Alta de usuarios por un administrador mediante Edge Function; roles permitidos en el formulario: Gerente, Vendedor, Analista y Almacén. La primera sesión exige cambio de contraseña.
- El menú principal se reorganiza en los nueve módulos solicitados.

**Importante:** esta es la fase de esquema y autenticación. Los módulos de operación que existían antes del cambio aún emplean `localStorage` para los datos comerciales; el acceso y los perfiles sí usan Supabase. No introduzcas datos empresariales reales hasta completar la migración de cada formulario y operación a las tablas/RPC de PostgreSQL.

## 1. Crear el proyecto gratuito

1. Entra a [Supabase](https://supabase.com/) y crea un proyecto nuevo.
2. Guarda la contraseña de la base de datos en un gestor de contraseñas.
3. Cuando el proyecto termine de inicializar, abre **Project Settings → API** (o **Connect**, según la interfaz) y copia la URL del proyecto y la clave pública `anon`/`publishable`.

## 2. Ejecutar el esquema SQL

1. Abre **SQL Editor → New query**.
2. Copia todo el contenido de `supabase/migrations/001_salesia_enterprise.sql`.
3. Ejecuta la consulta y comprueba que termine sin errores.

La migración activa RLS. No desactives las políticas para solucionar errores de permisos.

## 3. Desactivar el registro público

En **Authentication → Sign In / Providers → Email** desactiva **Allow new users to sign up**. Mantén habilitada la autenticación por contraseña. No crees una pantalla de registro en el frontend.

## 4. Crear el primer administrador

1. En **Authentication → Users**, crea manualmente el primer usuario con el correo corporativo del administrador y una contraseña segura. Confirma/verifica el correo si la configuración del proveedor lo requiere.
2. Inicia la aplicación e ingresa con esa cuenta.
3. Como aún no existe una empresa, aparecerá el formulario de configuración inicial. Completa razón social y nombre del administrador. El backend le asigna el rol `administrador`.

El formulario de configuración inicial solo funciona mientras no exista ninguna empresa en esa base de datos. No uses cuentas creadas por usuarios externos para inicializar el sistema.

## 5. Desplegar la función segura para crear cuentas

Se necesita Supabase CLI instalado y autenticado. Desde la raíz del proyecto:

```bash
supabase login
supabase link --project-ref TU_PROJECT_REF
supabase functions deploy admin-create-user
```

Supabase proporciona a las Edge Functions sus secretos de proyecto. Verifica en **Edge Functions → Secrets** que están disponibles `SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY`. La clave de servicio se usa **solo en el servidor**; nunca la pongas en `.env` del frontend, en Git o en archivos `VITE_*`.

Una vez desplegada, entra como administrador en **Administración → Usuarios → Añadir nueva cuenta**. Elige un rol no administrador y define una contraseña temporal de al menos 12 caracteres, con letras y números. Comunica esa contraseña al nuevo usuario por un canal seguro.

## 6. Conectar el frontend

1. Copia `.env.example` como `.env` en la raíz.
2. Completa `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` con la URL y clave pública de tu proyecto.
3. Ejecuta:

```bash
npm install
npm run dev
```

No agregues la clave `service_role` ni una clave `secret` al frontend. La clave pública es segura para usar en el navegador únicamente porque las tablas tienen RLS correctamente aplicada.

## Roles iniciales

| Rol | Acceso previsto |
|---|---|
| Administrador | Todos los módulos y administración de cuentas/permisos |
| Gerente | Operación, inventario, analítica, insights y reportes |
| Vendedor | Gestión comercial, ventas/pedidos, consulta de inventario y reportes |
| Analista | Consulta comercial y de ventas, analítica, Bayes, insights y reportes |
| Almacén | Productos, inventario y reportes relacionados |

La base contiene `role_permissions` como matriz inicial. Las operaciones que se migren deben consultar los permisos y respetar las políticas RLS; esconder una opción de menú por sí solo no es seguridad.

## Tablas principales

- **Empresa y seguridad:** `organizations`, `profiles`, `role_permissions`, `business_settings`, `audit_logs`.
- **Gestión comercial:** `customers`, `categories`, `products`, `sellers`.
- **Ventas y pedidos:** `sales`, `sale_items`, `orders`, `order_items`, `payments`.
- **Inventario:** `inventory_movements`.
- **Estadística y probabilidad:** `datasets`, `analytics_runs`, `probability_events`, `probability_runs`.
- **Insights e informes:** `insights`, `report_exports`, vista `v_sales_summary`.

Los montos usan `numeric` para evitar errores de precisión de coma flotante; fechas usan `date`/`timestamptz`; referencias entre tablas usan claves foráneas y hay restricciones para estados, cantidades y precios.

## Límites del plan gratuito

El plan Free incluye actualmente 500 MB de base de datos por proyecto, 5 GB de transferencia de salida y 1 GB de almacenamiento de archivos. Los proyectos con poca actividad pueden pausarse tras siete días de inactividad. Para esta etapa académica/de validación debería bastar un esquema compacto, pero vigila el uso, descarga respaldos externos y no lo trates como una garantía de disponibilidad para una operación empresarial crítica. Revisa los límites vigentes en la [documentación oficial de Supabase](https://supabase.com/docs/guides/platform/billing-on-supabase) y [la política de pausa](https://supabase.com/docs/guides/platform/free-project-pausing).
