# Módulos y submódulos de SalesIA Enterprise

El menú principal queda organizado en nueve módulos funcionales. El acceso visible depende del rol de la cuenta autenticada; las políticas RLS de PostgreSQL serán la barrera real de protección de datos.

| Módulo | Submódulos | Función principal |
|---|---|---|
| Inicio | Resumen ejecutivo | Mostrar indicadores generales, gráficos y accesos rápidos. |
| Gestión comercial | Clientes; Productos; Categorías; Vendedores | Administrar la información necesaria para realizar ventas. |
| Ventas y pedidos | Nueva venta; Pedidos; Historial de ventas; Pagos | Registrar operaciones, consultar detalles y controlar estados y pagos. |
| Inventario | Existencias; Entradas y salidas; Historial de movimientos | Controlar el stock y actualizarlo con las operaciones comerciales. |
| Analítica estadística | Resumen analítico; Conjuntos de datos; Variables y distribuciones; Media y mediana; Historial de análisis | Analizar datos comerciales y desarrollar los cálculos estadísticos solicitados. |
| Probabilidad y Bayes | Eventos y probabilidades; Teorema de Bayes; Variables aleatorias | Definir eventos y variables, calcular probabilidades e interpretar resultados. |
| Insights | Hallazgos comerciales; Detalle y evidencia; Historial de hallazgos | Presentar observaciones explicables e identificar los datos que las originan. |
| Reportes | Ventas; Productos; Clientes; Vendedores; Estadísticos | Consultar, filtrar, imprimir y exportar información. |
| Administración | Usuarios; Roles y permisos; Configuración comercial; Auditoría | Configurar accesos, parámetros y seguimiento de acciones críticas. |

## Roles iniciales

- **Administrador:** acceso completo y creación de cuentas desde Administración.
- **Gerente:** operación comercial, inventario, analítica, insights y reportes.
- **Vendedor:** gestión comercial, ventas y pedidos, consulta de inventario y reportes.
- **Analista:** consulta de datos comerciales, estadística, probabilidad y Bayes, insights y reportes.
- **Almacén:** consulta de catálogo, inventario y reportes pertinentes.

La matriz SQL `role_permissions` es el punto de partida de los permisos. Antes de poner el sistema en producción se deben verificar con pruebas los permisos de cada rol desde el frontend y directamente contra las políticas RLS.

## Estado de la integración

La primera fase incluye el esquema relacional, separación por empresa mediante `organization_id`, RLS, login por Supabase Auth, configuración inicial y creación administrativa de cuentas mediante una Edge Function. Los formularios de operación heredados todavía guardan registros en `localStorage`; la migración de cada pantalla y acción a consultas/RPC de Supabase debe realizarse como una siguiente fase, módulo por módulo. No utilizar esta fase para datos empresariales reales.
