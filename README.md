# SalesIA Enterprise — React + TypeScript + Vite

Interfaz de gestión comercial y analítica reconstruida sobre una estructura de desarrollo moderna. Conserva el diseño original y las 11 áreas con sus 33 submódulos, así como la lógica de demostración, los formularios, las exportaciones CSV/JSON y el guardado local en el navegador.

## Requisitos

- Node.js 20.19+ o 22.12+.
- npm (incluido con Node.js).

## Iniciar en Windows

1. Extrae el ZIP.
2. Abre la carpeta `SalesIA-React-Vite` en Visual Studio Code.
3. En la terminal, ejecuta:

```bash
npm install
npm run dev
```

4. Abre la dirección local que muestre Vite (normalmente `http://127.0.0.1:5173`). Para detenerlo, pulsa `Ctrl + C` en la terminal.

## Comandos

- `npm run dev`: servidor de desarrollo con recarga en caliente.
- `npm run build`: comprueba TypeScript y genera la versión de producción en `dist/`.
- `npm run preview`: sirve localmente la versión compilada.
- `npm run test:legacy`: verifica las 33 vistas y pruebas básicas de operaciones.

## Estructura

```text
SalesIA-React-Vite/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── ModalRoot.tsx
│   │   ├── PageFooter.tsx
│   │   ├── Sidebar.tsx
│   │   └── Topbar.tsx
│   ├── legacy/
│   │   └── app.js
│   ├── App.tsx
│   ├── main.tsx
│   ├── styles.css
│   └── vite-env.d.ts
├── docs/MODULOS.md
├── tests/smoke.cjs
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Nota de migración

El punto de entrada, la estructura visual exterior y sus componentes están implementados en React + TypeScript. Para preservar fielmente las 33 vistas y no perder operaciones que ya funcionaban, `src/legacy/app.js` se carga como motor de compatibilidad y controla el contenido interno de cada vista. Por ello, **esta es una migración estructural funcional, no una reescritura completa de cada pantalla a JSX/TypeScript**. La siguiente fase sería migrar módulo por módulo a componentes React y extraer reglas de negocio a servicios tipados.

## Alcance de la demo

No se conecta a un backend ni a una base de datos remota. Los datos iniciales son ficticios y se guardan en `localStorage` del navegador. No incorpora autenticación real, permisos seguros, facturación fiscal, procesamiento de pagos ni IA generativa. No ingreses información sensible.

Para trasladar los cambios de un navegador a otro, utiliza Administración y las opciones de respaldo/restauración JSON.
