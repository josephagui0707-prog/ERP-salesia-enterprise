# Módulos y submódulos de SalesIA Enterprise

El alcance académico agrupa nueve módulos funcionales. La navegación técnica actual contiene diez entradas, porque Ventas y Pedidos están separados en el menú (pero siguen formando un mismo bloque funcional). El acceso visible depende del rol de la cuenta autenticada; las políticas RLS de PostgreSQL serán la barrera real de protección de datos.

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

El esquema existente integra datos comerciales, ventas, pedidos e inventario mediante PostgreSQL y RPC de Supabase. Las mejoras de Personas 2, 4 y 5 incorporan resultados analíticos e historiales en las tablas de Supabase, siempre que el rol tenga el permiso RLS correspondiente. Persisten utilidades explícitamente locales de demostración en Administración, separadas de los datos empresariales. Las estadísticas se limitan a los 300 registros comerciales recientes cargados, no a todo el histórico. Consulta `docs/MEJORAS_PERSONAS_2_4_5.md` para límites, APIs públicas y pruebas.
