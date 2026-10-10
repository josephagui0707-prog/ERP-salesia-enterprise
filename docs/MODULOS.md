# Mapa de módulos y submódulos

El inicio del sistema presenta el resumen ejecutivo. Todos los módulos aparecen en la barra lateral; el módulo activo despliega sus submódulos, también accesibles mediante pestañas.

| N.º | Módulo | Submódulos | Cantidad |
|---|---|---|---:|
| 1 | Inicio | Resumen ejecutivo | 1 |
| 2 | Ventas y pedidos | Historial de ventas; Nueva venta; Pedidos; Pagos y métodos | 4 |
| 3 | Clientes | Directorio; Historial de compras; Segmentación | 3 |
| 4 | Productos | Catálogo; Categorías; Precios y estado | 3 |
| 5 | Inventario | Control de stock; Movimientos; Stock bajo | 3 |
| 6 | Vendedores | Equipo comercial; Rendimiento | 2 |
| 7 | Analytics | Resumen analítico; Media y mediana; Variables estadísticas; Datasets; Historial de análisis | 5 |
| 8 | Probabilidad | Eventos comerciales; Teorema de Bayes; Variables aleatorias | 3 |
| 9 | Insights | Hallazgos y evidencia; Historial de hallazgos | 2 |
| 10 | Reportes | Comerciales; Estadísticos; Exportaciones | 3 |
| 11 | Administración | Empresa; Usuarios; Roles y permisos; Auditoría | 4 |
| | **Total** | **11 módulos** | **33** |

## Correspondencia con el plan

Las áreas de gestión comercial se mantienen separadas para facilitar el uso y el desarrollo por dominio. Pedidos y pagos se integran en Ventas. Vendedores dispone de su propio módulo. Analytics centraliza datasets y estadística; Probabilidad conserva Bayes y las variables aleatorias. Los controles de seguridad propuestos se agrupan en Administración.

El motor estadístico utiliza datos de operaciones, no una calculadora independiente. El submódulo Bayes admite supuestos editables, como indica el plan. Los insights son reglas explicables, coherentes con el alcance inicial del documento.

## Distribución sugerida para cinco integrantes

| Integrante | Responsabilidad principal | Entregables futuros |
|---|---|---|
| Sandro | Inicio y Analytics | Dashboard, KPIs, datasets, media, mediana e historial |
| Jordy | Ventas y pedidos | Venta transaccional, detalle, estados y pagos |
| Josue | Clientes y Vendedores | Directorios, historial, segmentación y rendimiento |
| Marco | Productos e Inventario | Catálogo, categorías, precios, stock y movimientos |
| Victor | Probabilidad, Insights, Reportes y Administración | Bayes, reglas, exportación y pantallas administrativas |

Esta distribución es una sugerencia por pantallas, no una asignación definitiva. Autenticación, autorización, base de datos, pruebas e integración de producción deben repartirse transversalmente; el quinto grupo debe compartir esas tareas para equilibrar carga.
