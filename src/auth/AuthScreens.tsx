import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Profile } from '../lib/supabase';

type Props = {
  mode: 'login' | 'setup' | 'password';
  busy: boolean;
  error: string;
  profile?: Profile | null;
  onLogin: (email: string, password: string) => Promise<void>;
  onSetup: (data: { company: string; fullName: string; taxId: string; email: string; address: string }) => Promise<void>;
  onChangePassword: (password: string) => Promise<void>;
};

export default function AuthScreens({ mode, busy, error, profile, onLogin, onSetup, onChangePassword }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('');
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [taxId, setTaxId] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [address, setAddress] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLocalError('');
    if (mode === 'login') return onLogin(email.trim(), password);
    if (mode === 'setup') {
      if (taxId && !/^\d{11}$/.test(taxId)) return setLocalError('El RUC debe contener 11 dígitos.');
      return onSetup({ company: company.trim(), fullName: fullName.trim(), taxId, email: businessEmail.trim(), address: address.trim() });
    }
    if (newPassword.length < 12 || !/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) return setLocalError('Usa al menos 12 caracteres e incluye letras y números.');
    if (newPassword !== confirmPassword) return setLocalError('Las contraseñas no coinciden.');
    await onChangePassword(newPassword);
  }

  const titles = {
    login: ['SalesIA Enterprise', 'Accede a tu espacio de trabajo'],
    setup: ['Configura tu empresa', 'Registro inicial del administrador'],
    password: ['Protege tu cuenta', 'Cambia la contraseña temporal para continuar'],
  } as const;

  return (
    <main className="auth-screen">
      <section className="auth-card">
        <div className="auth-brand"><span className="brand-symbol">S<span>↗</span></span><div>Sales<span>IA</span><small>ENTERPRISE</small></div></div>
        <div className="auth-kicker">GESTIÓN COMERCIAL Y ANALÍTICA</div>
        <h1>{titles[mode][0]}</h1>
        <p className="auth-description">{titles[mode][1]}</p>
        {mode === 'login' && <p className="auth-notice">Sistema de acceso privado. Las cuentas son creadas por el administrador; no hay registro público.</p>}
        {mode === 'setup' && <p className="auth-notice">Esta pantalla solo aparece al configurar la primera cuenta creada desde el panel de Supabase.</p>}
        {mode === 'password' && <p className="auth-notice">Por seguridad, debes reemplazar la contraseña temporal antes de ingresar al sistema.</p>}
        <form onSubmit={submit} className="auth-form">
          {mode === 'login' && <>
            <label className="field">Correo corporativo<input type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} placeholder="nombre@empresa.com" /></label>
            <label className="field">Contraseña<input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Ingresa tu contraseña" /></label>
          </>}
          {mode === 'setup' && <>
            <label className="field">Razón social<input required minLength={2} maxLength={120} value={company} onChange={e => setCompany(e.target.value)} placeholder="Nombre de la empresa" /></label>
            <label className="field">Nombre completo del administrador<input required minLength={2} maxLength={120} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Nombre y apellidos" /></label>
            <div className="auth-two-col">
              <label className="field">RUC (opcional)<input inputMode="numeric" maxLength={11} value={taxId} onChange={e => setTaxId(e.target.value.replace(/\D/g, ''))} placeholder="11 dígitos" /></label>
              <label className="field">Correo comercial<input type="email" value={businessEmail} onChange={e => setBusinessEmail(e.target.value)} placeholder="contacto@empresa.com" /></label>
            </div>
            <label className="field">Dirección (opcional)<input maxLength={200} value={address} onChange={e => setAddress(e.target.value)} placeholder="Dirección fiscal o comercial" /></label>
          </>}
          {mode === 'password' && <>
            <label className="field">Nueva contraseña<input type="password" autoComplete="new-password" minLength={12} required value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mínimo 12 caracteres" /></label>
            <label className="field">Confirmar nueva contraseña<input type="password" autoComplete="new-password" minLength={12} required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repite la nueva contraseña" /></label>
          </>}
          {(localError || error) && <p className="auth-error" role="alert">{localError || error}</p>}
          <button className="btn primary auth-submit" disabled={busy} type="submit">{busy ? 'Procesando…' : mode === 'login' ? 'Iniciar sesión' : mode === 'setup' ? 'Configurar empresa' : 'Actualizar contraseña'}</button>
        </form>
        <div className="auth-footer"><span className="auth-dot" /> Acceso protegido · SalesIA Enterprise</div>
      </section>
    </main>
  );
}
