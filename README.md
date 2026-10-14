> **Versión 2 para pruebas de Personas 2, 4 y 5:** lee `LEEME_VERSION_2.txt` antes de iniciar. Cambios de inventario, distribuciones, insights y reportes Excel/CSV/PDF sin nuevas migraciones obligatorias.

# SalesIA Enterprise — React + TypeScript + Supabase

Sistema web empresarial que conecta Gestión comercial, Ventas, Pedidos e Inventario con un módulo de Estadística/Probabilidad, Insights y Reportes mediante PostgreSQL de Supabase.

**Para ejecutar y conocer todas las mejoras:** consulta `LEEME_PRIMERO.txt` y [`docs/MEJORAS_PERSONAS_2_4_5.md`](docs/MEJORAS_PERSONAS_2_4_5.md).

## Requisitos

- Node.js 20.19+ o 22.12+, npm y VS Code.
- URL y clave **pública** de un proyecto Supabase con la migración inicial instalada y una cuenta autorizada.
- `npm ci`, copia `.env.example` a `.env`, configura los dos valores públicos y ejecuta `npm run dev`.

```bash
npm ci
cp .env.example .env
npm run dev
npm run build
npm run test:legacy
npm run test:analytics
```

En Windows usa `copy .env.example .env` en lugar de `cp`.

El esquema SQL inicial está en `supabase/migrations/001_salesia_enterprise.sql`, **pero no es necesario volver a ejecutarlo si tu compañero ya tiene las tablas**. No agregues secretos de Supabase al frontend. Render se mantiene como **Static Site** y no ejecuta los archivos FastAPI del directorio `backend/`.

Las vistas heredadas de Administración conservan herramientas explícitamente locales de demostración, independientes de los registros empresariales. Los cálculos del proyecto se obtienen de la muestra cargada de Supabase y los historiales analíticos se escriben en tablas reales conforme a permisos RLS.
