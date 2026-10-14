type Props = { companyName?: string };
export default function Sidebar({ companyName = 'Empresa conectada' }: Props) {
  return (
    <aside id="sidebar" aria-label="Barra lateral">
      <a className="brand" href="#inicio/resumen" aria-label="SalesIA Enterprise, ir al inicio">
        <span className="brand-symbol">S<span>↗</span></span>
        <span>Sales<span className="brand-ia">IA</span><small>ENTERPRISE</small></span>
      </a>
      <div className="workspace">
        <span className="workspace-icon">SE</span>
        <div>{companyName}<small>Espacio de trabajo protegido</small></div>
        <span className="dot" />
      </div>  
      <nav id="nav" aria-label="Navegación principal" />
      <div className="side-footer">
        <div className="status-line"><span className="dot" /> Sesión autenticada</div>
        <small>Acceso con Supabase Auth</small>
        <button className="side-link" data-action="help">Ayuda y guía de uso ↗</button>
      </div>
    </aside>
  );
}
