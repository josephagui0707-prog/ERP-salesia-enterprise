export default function Topbar() {
  return (
    <header className="topbar">
      <button className="icon-button mobile-menu" data-action="menu" aria-label="Abrir menú">☰</button>
      <div className="crumb">Workspace <span>/</span> <strong id="breadcrumb">Inicio</strong></div>
      <div className="top-actions">
        <button className="search-button" data-action="search" aria-label="Buscar un módulo">⌕ <span>Buscar un módulo…</span><kbd>/</kbd></button>
        <button className="icon-button notification" data-action="notifications" aria-label="Ver alertas">♧<i /></button>
        <span className="divider" />
        <div className="avatar" aria-hidden="true">ST</div>
        <div className="user-name">Sandro<small>Administrador · Demo</small></div>
      </div>
    </header>
  );
}
