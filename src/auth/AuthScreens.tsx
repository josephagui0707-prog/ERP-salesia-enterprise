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
  const [showPassword, setShowPassword] = useState(false);
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
    login: ['Bienvenido de nuevo.', 'Inicia sesión y continúa donde dejaste tus ventas, inventario y análisis.'],
    setup: ['Prepara tu espacio.', 'Configura los datos iniciales de tu empresa para comenzar.'],
    password: ['Un nuevo comienzo.', 'Actualiza la contraseña temporal para continuar.'],
  } as const;

  return (
    <main className="relay-auth salesia-auth" id="auth-main">
      <a className="relay-skip" href="#relay-form-heading">Saltar al formulario</a>
      <section className="relay-auth-shell" aria-label="Acceso a SalesIA Enterprise">
        <aside className="relay-auth-story">
          <div className="relay-story-brand" aria-label="SalesIA Enterprise">
            <span className="relay-brand-mark">S<span>↗</span></span>
            <span>Sales<span className="relay-brand-ia">IA</span><small>ENTERPRISE</small></span>
          </div>
          <div className="relay-story-copy">
            <p className="relay-eyebrow">TU NEGOCIO, BAJO CONTROL</p>
            <h2>Más claridad<br/>en cada<br/><em>decisión.</em></h2>
            <p>Conecta tus ventas, cuida el inventario<br/>y descubre lo que dicen tus datos.</p>
          </div>
          <div className="relay-business-illustration" aria-hidden="true">
            <div className="relay-orbit" />
            <div className="relay-commerce-note">
              <span className="relay-note-eyebrow">TU RESUMEN COMERCIAL</span>
              <strong>Todo suma.<br/>Todo cuenta.</strong>
              <span className="relay-note-bars"><i/><i/><i/><i/></span>
              <span className="relay-note-check">✓</span>
            </div>
            <div className="relay-floating-label"><span>↗</span> Mejores decisiones</div>
            <span className="relay-decoration">✳</span>
          </div>
          <footer className="relay-story-footer"><span>SalesIA · Gestión comercial inteligente</span><span aria-hidden="true">✳</span></footer>
        </aside>
        <section className="relay-auth-panel">
          <header className="relay-auth-header">
            <span className="relay-secure-badge">ACCESO PROTEGIDO</span>
            <span className="relay-auth-header-right">SalesIA / Workspace</span>
          </header>
          <div className="relay-auth-inner">
            <p className="relay-auth-step">{mode === 'login' ? '01 / INICIAR SESIÓN' : mode === 'setup' ? '02 / CONFIGURACIÓN' : '03 / SEGURIDAD'}</p>
            <h1 id="relay-form-heading">{titles[mode][0]}</h1>
            <p className="relay-auth-description">{titles[mode][1]}</p>
            {mode === 'login' && <p className="relay-auth-notice">Las cuentas se crean y administran desde SalesIA. No hay registro público.</p>}
            {mode === 'setup' && <p className="relay-auth-notice">Configuración inicial del administrador. Los datos se guardan en Supabase.</p>}
            {mode === 'password' && <p className="relay-auth-notice">Por seguridad, cambia tu contraseña temporal antes de continuar.</p>}
            <form onSubmit={submit} className="relay-auth-form" autoComplete="on">
              {mode === 'login' && <>
                <label className="relay-auth-field">Correo corporativo
                  <input type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} placeholder="usuario@empresa.com" />
                </label>
                <label className="relay-auth-field">Contraseña
                  <span className="relay-auth-password">
                    <input type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Ingresa tu contraseña" />
                    <button type="button" className="relay-auth-reveal" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={showPassword}>
                      {showPassword ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </span>
                </label>
              </>}
              {mode === 'setup' && <>
                <label className="relay-auth-field">Razón social<input required minLength={2} maxLength={120} value={company} onChange={e => setCompany(e.target.value)} placeholder="Nombre de la empresa" /></label>
                <label className="relay-auth-field">Nombre completo del administrador<input required minLength={2} maxLength={120} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Nombre y apellidos" /></label>
                <div className="relay-auth-columns">
                  <label className="relay-auth-field">RUC (opcional)<input inputMode="numeric" maxLength={11} value={taxId} onChange={e => setTaxId(e.target.value.replace(/\D/g, ''))} placeholder="11 dígitos" /></label>
                  <label className="relay-auth-field">Correo comercial<input type="email" value={businessEmail} onChange={e => setBusinessEmail(e.target.value)} placeholder="contacto@empresa.com" /></label>
                </div>
                <label className="relay-auth-field">Dirección (opcional)<input maxLength={200} value={address} onChange={e => setAddress(e.target.value)} placeholder="Dirección fiscal o comercial" /></label>
              </>}
              {mode === 'password' && <>
                <label className="relay-auth-field">Nueva contraseña<input type="password" autoComplete="new-password" minLength={12} required value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mínimo 12 caracteres" /></label>
                <label className="relay-auth-field">Confirmar contraseña<input type="password" autoComplete="new-password" minLength={12} required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repite tu contraseña" /></label>
              </>}
              {(localError || error) && <p className="relay-auth-error" role="alert">{localError || error}</p>}
              <button className="relay-auth-submit" disabled={busy} type="submit">
                {busy ? 'Procesando…' : mode === 'login' ? 'Ingresar al sistema' : mode === 'setup' ? 'Configurar empresa' : 'Actualizar contraseña'}
                <span aria-hidden="true">↗</span>
              </button>
            </form>
            <p className="relay-auth-privacy"><span className="relay-auth-status-dot" aria-hidden="true" /> Acceso privado mediante Supabase Auth</p>
          </div>
          <footer className="relay-auth-footer">
            <span>SalesIA Enterprise © 2026</span>
            <span>Interfaz adaptada de <a href="https://colorlib.com/" target="_blank" rel="noopener noreferrer">Colorlib</a> · <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noopener noreferrer">CC BY 3.0</a></span>
          </footer>
        </section>
      </section>
    </main>
  );
}
