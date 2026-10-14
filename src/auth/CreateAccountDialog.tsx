import { useState } from 'react';
import type { FormEvent } from 'react';

export type NewAccount = { name: string; email: string; password: string; role: string };
type Props = { onClose: () => void; onCreate: (account: NewAccount) => Promise<void> };

export default function CreateAccountDialog({ onClose, onCreate }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('vendedor');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(e: FormEvent) {
    e.preventDefault(); setError(''); setBusy(true);
    try { await onCreate({ name: name.trim(), email: email.trim(), password, role }); onClose(); }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudo crear la cuenta.'); }
    finally { setBusy(false); }
  }
  return <div className="account-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget && !busy) onClose(); }}>
    <section className="account-dialog" role="dialog" aria-modal="true" aria-labelledby="account-title">
      <div className="modal-head"><div><div className="eyebrow">ADMINISTRACIÓN</div><h2 id="account-title">Añadir nueva cuenta</h2></div><button type="button" className="icon-button" aria-label="Cerrar" onClick={onClose}>×</button></div>
      <p className="description">La cuenta se vinculará a esta empresa y deberá cambiar la contraseña temporal al ingresar por primera vez.</p>
      <form className="auth-form" onSubmit={submit}>
        <label className="field">Nombre completo<input required minLength={2} maxLength={120} value={name} onChange={e => setName(e.target.value)} /></label>
        <label className="field">Correo de acceso<input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="persona@empresa.com" /></label>
        <label className="field">Rol de acceso<select value={role} onChange={e => setRole(e.target.value)}><option value="gerente">Gerente</option><option value="vendedor">Vendedor</option><option value="analista">Analista</option><option value="almacen">Almacén</option></select></label>
        <label className="field">Contraseña temporal<input type="password" required minLength={12} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 12 caracteres y números" /></label>
        <p className="auth-hint">El sistema no permite asignar el rol Administrador desde este formulario. Nunca compartas esta contraseña por un canal público.</p>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <div className="form-actions"><button className="btn" type="button" disabled={busy} onClick={onClose}>Cancelar</button><button className="btn primary" type="submit" disabled={busy}>{busy ? 'Creando cuenta…' : 'Crear cuenta'}</button></div>
      </form>
    </section>
  </div>;
}
