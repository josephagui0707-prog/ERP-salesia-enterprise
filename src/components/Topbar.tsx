type Props = { name?: string; email?: string; role?: string; isAdmin?: boolean; onLogout?: () => void };
export default function Topbar({ name = 'Usuario', email = '', role = 'Usuario', isAdmin = false, onLogout }: Props) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map(part => part[0] ?? '').join('').toUpperCase() || 'U';
  return (
    <header className="topbar">
      <button className="icon-button mobile-menu" data-action="menu" aria-label="Abrir menú">☰</button>
      <div className="crumb">SalesIA <span>/</span> <strong id="breadcrumb">Inicio</strong></div>
      <div className="top-actions">
        <button className="search-button" data-action="search" aria-label="Buscar un módulo">⌕ <span>Buscar un módulo…</span><kbd>/</kbd></button>
        <button className="icon-button notification" data-action="notifications" aria-label="Ver alertas">♧<i /></button>
        <span className="divider" />
        <div className="avatar" aria-hidden="true">{initials}</div>
        <div className="user-name">{name}<small>{role}{email ? ` · ${email}` : ''}</small></div>
        {isAdmin && <span className="admin-label">ADMIN</span>}
        <button className="logout-button" type="button" onClick={onLogout} title="Cerrar sesión">Salir ↗</button>
      </div>
    </header>
  );
}
