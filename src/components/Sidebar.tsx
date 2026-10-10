export default function Sidebar() {
  return (
    <aside id="sidebar" aria-label="Barra lateral">
      <a className="brand" href="#inicio/resumen" aria-label="SalesIA Enterprise, ir al inicio">
        <span className="brand-symbol">S<span>↗</span></span>
        <span>Sales<span className="brand-ia">IA</span><small>ENTERPRISE</small></span>
      </a>
      <div className="workspace">
        <span className="workspace-icon">CE</span>
        <div>Comercial Enterprise<small>Espacio de demostración</small></div>
        <span className="dot" />
      </div>
      <nav id="nav" aria-label="Navegación principal" />
      <div className="side-footer">
        <div className="status-line"><span className="dot" /> Demo local · Sin conexión</div>
        <small>Datos guardados en este navegador</small>
        <button className="side-link" data-action="help">Ayuda y guía de uso ↗</button>
      </div>
    </aside>
  );
}
