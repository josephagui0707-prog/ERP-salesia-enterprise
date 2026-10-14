# SalesIA Enterprise — mejoras Personas 2, 4 y 5

## Qué cambia y qué NO cambia

- Se preserva React + TypeScript + Supabase/PostgreSQL + Render Static Site.
- No se ha modificado `supabase/migrations/001_salesia_enterprise.sql`, ni hay nuevas tablas requeridas. Se incluye una **migración opcional de tres permisos**, `supabase/migrations/OPTIONAL_002_report_export_history_permissions.sql`, para permitir que gerente/analista/almacén registren exportaciones. No la ejecutes sin aprobación del compañero.
- **Persona 2:** se añade un cálculo de reposición sugerida de inventario según el stock mínimo configurado. Es orientativo, no genera órdenes de compra ni modifica datos.
- **Persona 4:** estadísticas calculadas con ventas cargadas de Supabase, variables estadísticas, frecuencias y probabilidades empíricas. Los registros de análisis y Bayes pasan a `analytics_runs` y `probability_runs`.
- **Persona 5:** hallazgos deterministas con evidencia almacenada en `insights`. Los CSV se generan desde datos reales; el historial de exportaciones se conserva en `report_exports` cuando el rol tiene permiso.
- Se conserva el esquema de autenticación y RLS existente: un usuario sin permiso recibirá un error descriptivo al intentar escribir.
- La navegación muestra **Gestión comercial** sin cambiar la ruta interna `#mantenimiento/...`.
- Se aprovecha un fondo gráfico real de la plantilla comercial aportada y se adaptan acentos y microinteracciones al ERP. No se incluyen archivos de fuentes ni el código PHP/Bootstrap viejo de la plantilla.

## APIs de terceros gratuitas, sin cuenta ni clave

1. **Nager.Date Community API v4:** `https://nagerholidays.com/api/v4/Holidays/PE/2026`. Solo se consulta al pulsar **Analítica → Conjuntos de datos → Consultar feriados**; permite mostrar la facturación registrada en fechas de feriados del Perú. No afirma que los feriados causen aumentos/disminuciones de ventas.
2. **fawazahmed0/exchange-api:** `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/pen.min.json`, con respaldo en `https://latest.currency-api.pages.dev/v1/currencies/pen.min.json`. Solo se consulta desde **Reportes → Consultar divisas**, con fecha del proveedor y conversión referencial PEN→USD/EUR. Los registros oficiales siguen en soles.
3. **Pyodide:** intérprete Python ejecutado en el navegador bajo demanda desde `https://cdn.jsdelivr.net/pyodide/v0.28.3/full/`, sin registro ni servidor Python. No es una API de datos: es un runtime que ejecuta `public/python/salesia_stats.py` y permite verificar la media y la mediana de la muestra.

Estas consultas opcionales no tienen acceso a Supabase ni incluyen datos personales. Ante falta de conexión, la operación comercial principal continúa funcionando.

## Backend académico en Python

El directorio `backend/` incluye motor estadístico Python puro y ejemplo FastAPI con endpoints `/statistics/summary` y `/probability/bayes`, junto con pruebas unitarias. **No se publica automáticamente en Render Static Site.** Si el docente exige una API Python remota, se requerirá desplegarla como servicio separado y agregar control de acceso antes de utilizar información de la empresa. El front publicado usa Python en el navegador (Pyodide) bajo demanda para una verificación adicional de estadísticas.

No se añade C# ni R porque no resuelven una necesidad que no esté cubierta y requerirían nuevas dependencias o más servicios para publicarse. El lenguaje extra funcional es Python.

## Restricciones importantes

- **Muestra limitada:** la consulta inicial de operaciones carga las **300 ventas más recientes** y los **150 pedidos más recientes**, no un histórico ilimitado. Las estadísticas e insights son válidos únicamente para la muestra cargada y los filtros aplicados; la interfaz indica este límite. Para reportes de producción masivos habría que preparar paginación o funciones de agregación SQL tras aprobación del equipo.
- El historial consulta como máximo 60 análisis, 60 ejecuciones de probabilidad, 80 insights y 60 exportaciones.
- Ninguna fuente externa valida RUC/DNI ni se envían datos comerciales a terceros.
- El cálculo de Bayes se presenta con **probabilidades introducidas por el usuario**, no como inferencia automática con los datos de clientes.
- Los hallazgos usan reglas verificables (stock mínimo, media/mediana, cobros pendientes). No son salidas de un modelo predictivo.
- Un CSV puede descargarse aunque la escritura del registro de exportación falle por permisos; en ese caso se informa expresamente. El historial solo se guarda para gerente/analista/almacén si se aprobó y aplicó la migración opcional de permisos. Vendedor mantiene acceso de solo lectura.
- El histórico local de demostración que se mantiene en el motor heredado no se usa como historial empresarial de Analítica, Insights ni Reportes. Administración aún incluye herramientas de respaldo local de demostración, diferenciadas de Supabase.

## Ejecución local (Windows, VS Code)

```powershell
cd ERP-salesia-enterprise-main
npm ci
copy .env.example .env
# edita .env con URL y clave pública de Supabase (no secret ni service_role)
npm run dev
```

Para pruebas, en otras terminales:

```powershell
npm run test:legacy
npm run test:analytics
python -m unittest discover -s backend/tests -v
npm run build
```

Para comprobar la API Python de muestra **por separado** (opcional):

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Luego abre `http://127.0.0.1:8000/docs`. Esta API local no es necesaria para la web Render Static Site y no utiliza Supabase.

## Subir a tu rama

Abre el repositorio Git real (clonado, no solo un ZIP). Copia los archivos modificados a tu rama después de hacer las pruebas. `git status` antes de agregar, y **comprueba que `.env` no aparezca**:

```powershell
git switch -c mejoras-personas-2-4-5
git status
git add .
git commit -m "Integra analítica e insights con Supabase y APIs públicas"
git push -u origin mejoras-personas-2-4-5
```

Cualquier despliegue, migración o cambio de secretos de Render/Supabase debe coordinarse con el responsable del proyecto.

## Validación en este entorno

- `node --check src/legacy/app.js` ✅
- `node tests/smoke.cjs` ✅ (10 entradas de navegación, 32 vistas)
- `node tests/analytics-bridge.cjs` ✅ (integración simulada de persistencia)
- `python -m unittest discover -s backend/tests -v` ✅ (5 pruebas matemáticas)
- Revisión de sintaxis de nuevos TS y TSX con TypeScript: ✅
- **Compilación Vite completa y conexión real:** no verificadas en este entorno, porque aquí no está permitido descargar las dependencias de npm ni se incluyeron credenciales de Supabase. Ejecuta `npm ci && npm run build` en tu PC antes de fusionar la rama.

## Segunda versión de prueba — Cambios posteriores a la revisión visual

La segunda versión se desarrolló después de comprobar en las capturas del usuario:
- Inventario: existencias de 23 unidades, dos movimientos (+25 y −2) y formulario transaccional.
- Analítica: Python en navegador y guardado/lectura de media, mediana y Bayes desde Supabase.
- Insights: guardado y lectura de un hallazgo con evidencia.
- Reportes: exportación CSV y registro del historial.

**Inventario:** `movementForm` incluye un panel interactivo de previsualización. Una entrada/salida muestra cantidad y saldo previsto; el ajuste muestra el saldo físico nuevo. Es una **simulación de interfaz**: al guardar se conserva la RPC `register_inventory_movement` y sus comprobaciones de stock/rol.

**Analítica:** `Variables y distribuciones` añade una distribución discreta por unidades vendidas, tabla de frecuencias y barras proporcionales. Se advierte explícitamente sobre muestras pequeñas. No se realiza ninguna consulta externa adicional.

**Insights:** se conserva la regla estadística existente y se incorporan dos reglas opcionales de concentración de ventas por producto/cliente para muestras de al menos cinco ventas, con varias entidades y umbral del 50%. Se guarda el denominador y el tamaño de muestra en evidencia. No son predicciones de IA. Los hallazgos solo se guardan cuando el usuario pulsa el botón, respetando permisos de Supabase.

**Reportes:** las cinco categorías tienen vista previa y filtro textual, exportación CSV y `.xlsx` generado localmente mediante un archivo OOXML ZIP válido (sin dependencias de pago), y vista de impresión preparada para **Guardar como PDF** desde el navegador. Cuando el usuario aplica un filtro, afecta tanto a la vista previa como a la exportación. El selector de periodo afecta a Ventas, Vendedores y Estadísticos, mientras las fichas de Clientes y Productos reflejan el maestro/stock actual, según explica la interfaz. La API de divisas solo aparece en reportes monetarios.

**Integridad:** no se han tocado funciones de venta, pago, registros SQL iniciales, políticas RLS, ni métodos de autenticación. El archivo `OPTIONAL_002_report_export_history_permissions.sql` procede de la primera versión, sigue siendo opcional y **no se ejecutó**. `report_exports.format` ya permite `xlsx` en el esquema SQL original.

**Validación técnica realizada:** `node --check`, pruebas de 32 vistas, pruebas simuladas de análisis, pruebas nuevas de filtros/XLSX/insights/stock y cinco pruebas unitarias Python. Se verificó que un `.xlsx` de prueba creado por el nuevo generador se abre correctamente con `openpyxl`. Se revisó la sintaxis de TS/TSX; `npm run build` completo requiere `npm ci` en el PC porque en este entorno no se pudieron descargar las dependencias npm.
