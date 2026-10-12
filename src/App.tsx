import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import PageFooter from './components/PageFooter';
import ModalRoot from './components/ModalRoot';
import AuthScreens from './auth/AuthScreens';
import CreateAccountDialog, { type NewAccount } from './auth/CreateAccountDialog';
import { isSupabaseConfigured, supabase, type AccountProfile, type Profile } from './lib/supabase';
import './styles.css';

type Stage = 'checking' | 'login' | 'setup' | 'password' | 'ready' | 'error';
const roleLabels: Record<string, string> = {
  administrador: 'Administrador', gerente: 'Gerente', vendedor: 'Vendedor', analista: 'Analista', almacen: 'Almacén', pendiente: 'Pendiente',
};

function businessCode(prefix: string): string {
  const suffix = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().slice(0, 8).toUpperCase()
    : Math.random().toString(36).slice(2, 10).toUpperCase();
  return `${prefix}-${new Date().getFullYear()}-${suffix}`;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'string' && error.trim()) return error;
  if (error && typeof error === 'object') {
    const item = error as { message?: unknown; code?: unknown; details?: unknown; hint?: unknown };
    const parts: string[] = [];
    if (typeof item.message === 'string' && item.message.trim()) parts.push(item.message);
    if (typeof item.code === 'string' && item.code.trim()) parts.push(`Código: ${item.code}`);
    if (typeof item.details === 'string' && item.details.trim()) parts.push(`Detalle: ${item.details}`);
    if (typeof item.hint === 'string' && item.hint.trim()) parts.push(`Sugerencia: ${item.hint}`);
    if (parts.length) return parts.join(' · ');
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [stage, setStage] = useState<Stage>('checking');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [companyName, setCompanyName] = useState('Empresa conectada');
  const [accounts, setAccounts] = useState<AccountProfile[]>([]);
  const [busy, setBusy] = useState(false);
  const [authError, setAuthError] = useState('');
  const [engineError, setEngineError] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const isAdmin = profile?.role_key === 'administrador';

  const loadProfile = useCallback(async (userId: string) => {
    let data: Profile | null = null;
    let profileError: Error | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const result = await supabase.from('profiles')
        .select('id,organization_id,full_name,email,role_key,status,must_change_password')
        .eq('id', userId).maybeSingle();
      if (result.data) { data = result.data as Profile; break; }
      if (result.error) profileError = result.error;
      await new Promise(resolve => setTimeout(resolve, 350));
    }
    if (!data) throw new Error(profileError?.message || 'No se encontró el perfil del usuario. Ejecuta la migración SQL antes de iniciar sesión.');
    if (data.status !== 'activo') {
      await supabase.auth.signOut();
      throw new Error('Esta cuenta está desactivada. Contacta con el administrador.');
    }
    setProfile(data);
    setAuthError('');
    if (!data.organization_id) { setCompanyName('Configuración inicial'); setStage('setup'); return; }

    const { data: company } = await supabase.from('organizations').select('name').eq('id', data.organization_id).maybeSingle();
    setCompanyName(company?.name || 'Empresa conectada');
    if (data.must_change_password) { setStage('password'); return; }

    if (data.role_key === 'administrador') {
      const { data: rows, error: usersError } = await supabase.from('profiles')
        .select('id,full_name,email,role_key,status,must_change_password')
        .eq('organization_id', data.organization_id).order('created_at', { ascending: true });
      if (usersError) setAuthError(`No se pudo cargar el directorio de cuentas: ${usersError.message}`);
      else setAccounts((rows || []) as AccountProfile[]);
    } else setAccounts([]);
    setStage('ready');
  }, []);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthChecked(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthChecked(true);
    }).catch(() => setAuthChecked(true));
    return () => authListener.subscription.unsubscribe();
  }, []);

  // Solo revalidar el perfil cuando cambia el usuario autenticado.
  // Supabase puede emitir TOKEN_REFRESHED al volver a una pestaña inactiva.
  // La sesión recibe un objeto nuevo en ese evento, pero el usuario sigue siendo
  // el mismo; depender de `session` completa desmontaría la interfaz legacy y,
  // al volver, el import dinámico no la montaría de nuevo porque está en caché.
  const sessionUserId = session?.user.id;

  useEffect(() => {
    if (!authChecked) return;
    if (!sessionUserId) {
      setProfile(null); setAccounts([]); setAuthError(''); setStage('login');
      return;
    }
    setStage('checking');
    loadProfile(sessionUserId).catch((error: unknown) => {
      setAuthError(error instanceof Error ? error.message : 'No se pudo validar la cuenta.');
      setStage('error');
    });
  }, [authChecked, sessionUserId, loadProfile]);

  useEffect(() => {
    window.salesiaProfiles = accounts;
    window.salesiaRole = profile?.role_key;
    window.salesiaCurrentUser = {
      name: profile?.full_name || session?.user.email || 'Usuario',
      email: profile?.email || session?.user.email || '',
      role: roleLabels[profile?.role_key || ''] || 'Usuario',
      organization: companyName,
    };
    window.salesiaOpenCreateUser = isAdmin ? () => setAccountOpen(true) : undefined;
    const organizationId = profile?.organization_id;
    const actorId = profile?.id;
    const maintenanceApi = organizationId && actorId ? {
      async load() {
        const [categoryResult, customerResult, productResult, sellerResult] = await Promise.all([
          supabase.from('categories').select('id,code,name,description,is_active').eq('organization_id', organizationId).order('name', { ascending: true }),
          supabase.from('customers').select('id,code,name,email,phone,address,segment,status,notes').eq('organization_id', organizationId).order('name', { ascending: true }),
          supabase.from('products').select('id,code,name,category_id,description,unit,price,cost,stock_quantity,minimum_stock,status').eq('organization_id', organizationId).order('name', { ascending: true }),
          supabase.from('sellers').select('id,code,name,email,phone,monthly_goal,status,profile_id').eq('organization_id', organizationId).order('name', { ascending: true }),
        ]);
        if (categoryResult.error) throw categoryResult.error;
        if (customerResult.error) throw customerResult.error;
        if (productResult.error) throw productResult.error;
        if (sellerResult.error) throw sellerResult.error;
        return { categories: categoryResult.data || [], customers: customerResult.data || [], products: productResult.data || [], sellers: sellerResult.data || [] };
      },
      async saveCategory(id: string | null, input: { name: string; description: string; is_active: boolean }) {
        const values = {
          name: input.name.trim(),
          description: input.description.trim() || null,
          is_active: input.is_active,
        };
        if (id) {
          const { data, error } = await supabase.from('categories')
            .update(values).eq('organization_id', organizationId).eq('id', id).select('id').maybeSingle();
          if (error) throw error;
          if (!data) throw new Error('No se actualizó la categoría. Comprueba tus permisos y vuelve a intentarlo.');
        } else {
          const { error } = await supabase.from('categories').insert({
            organization_id: organizationId, code: businessCode('CAT'), ...values,
          });
          if (error) throw error;
        }
      },
      async saveCustomer(id: string | null, input: { name: string; email: string; phone: string; address: string; segment: string; status: string; notes: string }) {
        const values = {
          name: input.name.trim(), email: input.email.trim() || null,
          phone: input.phone.trim() || null, address: input.address.trim() || null,
          segment: input.segment.toLowerCase(), status: input.status.toLowerCase(),
          notes: input.notes.trim() || null,
        };
        if (id) {
          const { data, error } = await supabase.from('customers')
            .update(values).eq('organization_id', organizationId).eq('id', id).select('id').maybeSingle();
          if (error) throw error;
          if (!data) throw new Error('No se actualizó el cliente. Comprueba tus permisos y vuelve a intentarlo.');
        } else {
          const { error } = await supabase.from('customers').insert({
            organization_id: organizationId, code: businessCode('CLI'), created_by: actorId, ...values,
          });
          if (error) throw error;
        }
      },
      async saveProduct(id: string | null, input: { name: string; category_id: string | null; description: string; unit: string; price: number; cost: number; minimum_stock: number; status: string }) {
        const values = { name: input.name.trim(), category_id: input.category_id || null, description: input.description.trim() || null, unit: input.unit.trim() || 'unidad', price: Number(input.price), cost: Number(input.cost), minimum_stock: Number(input.minimum_stock), status: input.status.toLowerCase() };
        if (!(values.price >= 0) || !(values.cost >= 0) || !Number.isInteger(values.minimum_stock) || values.minimum_stock < 0) throw new Error('Revisa precio, costo y stock mínimo.');
        if (values.category_id) {
          const { data: category, error: categoryError } = await supabase.from('categories').select('id').eq('organization_id', organizationId).eq('id', values.category_id).maybeSingle();
          if (categoryError) throw categoryError;
          if (!category) throw new Error('La categoría seleccionada no pertenece a esta empresa.');
        }
        if (id) {
          const { data, error } = await supabase.from('products').update(values).eq('organization_id', organizationId).eq('id', id).select('id').maybeSingle();
          if (error) throw error;
          if (!data) throw new Error('No se actualizó el producto. Comprueba tus permisos.');
        } else {
          const { error } = await supabase.from('products').insert({ organization_id: organizationId, code: businessCode('PRD'), ...values, stock_quantity: 0 });
          if (error) throw error;
        }
      },
      async saveSeller(id: string | null, input: { name: string; email: string; phone: string; monthly_goal: number; status: string }) {
        const values = { name: input.name.trim(), email: input.email.trim() || null, phone: input.phone.trim() || null, monthly_goal: Number(input.monthly_goal), status: input.status.toLowerCase() };
        if (!(values.monthly_goal >= 0)) throw new Error('La meta comercial debe ser cero o mayor.');
        if (id) {
          const { data, error } = await supabase.from('sellers').update(values).eq('organization_id', organizationId).eq('id', id).select('id').maybeSingle();
          if (error) throw error;
          if (!data) throw new Error('No se actualizó el vendedor. Comprueba tus permisos.');
        } else {
          const { error } = await supabase.from('sellers').insert({ organization_id: organizationId, code: businessCode('VEN'), ...values });
          if (error) throw error;
        }
      },
    } : undefined;
    window.salesiaMaintenanceApi = maintenanceApi;
    return () => {
      window.salesiaOpenCreateUser = undefined;
      if (window.salesiaMaintenanceApi === maintenanceApi) window.salesiaMaintenanceApi = undefined;
    };
  }, [accounts, profile, session, companyName, isAdmin]);

  useEffect(() => {
    if (stage !== 'ready') return;
    import('./legacy/app.js').catch((error: unknown) => {
      console.error('No se pudo iniciar el motor de SalesIA:', error);
      setEngineError(true);
    });
  }, [stage]);

  async function signIn(email: string, password: string) {
    setBusy(true); setAuthError('');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setSession(data.session);
    } catch (error) { setAuthError(error instanceof Error ? error.message : 'No se pudo iniciar sesión.'); }
    finally { setBusy(false); }
  }

  async function initializeCompany(input: { company: string; fullName: string; taxId: string; email: string; address: string }) {
    if (!session) throw new Error('Inicia sesión para continuar.');
    setBusy(true); setAuthError('');
    try {
      const { error } = await supabase.rpc('bootstrap_first_admin', {
        p_company_name: input.company, p_full_name: input.fullName,
        p_tax_id: input.taxId || null, p_email: input.email || null, p_address: input.address || null,
      });
      if (error) throw error;
      await loadProfile(session.user.id);
    } catch (error) {
      console.error('Error al ejecutar bootstrap_first_admin en Supabase:', error);
      setAuthError(getErrorMessage(error, 'No se pudo configurar la empresa. Abre la consola del navegador para ver el error técnico.'));
    } finally { setBusy(false); }
  }

  async function changePassword(password: string) {
    if (!session) throw new Error('Sesión no disponible.');
    setBusy(true); setAuthError('');
    try {
      const { error: passwordError } = await supabase.auth.updateUser({ password });
      if (passwordError) throw passwordError;
      const { error: profileError } = await supabase.rpc('finish_initial_password_change');
      if (profileError) throw profileError;
      await loadProfile(session.user.id);
    } catch (error) { setAuthError(error instanceof Error ? error.message : 'No se pudo actualizar la contraseña.'); }
    finally { setBusy(false); }
  }

  async function createAccount(account: NewAccount) {
    const { data, error } = await supabase.functions.invoke('admin-create-user', { body: account });
    if (error) {
      let message = error.message;
      try {
        const response = (error as { context?: Response }).context;
        const detail = response ? await response.json() as { error?: string } : null;
        if (detail?.error) message = detail.error;
      } catch { /* Usa el mensaje original de la función. */ }
      throw new Error(message);
    }
    if (data?.error) throw new Error(String(data.error));
    if (profile?.organization_id) {
      const { data: rows, error: listError } = await supabase.from('profiles')
        .select('id,full_name,email,role_key,status,must_change_password')
        .eq('organization_id', profile.organization_id).order('created_at', { ascending: true });
      if (listError) throw listError;
      const nextAccounts = (rows || []) as AccountProfile[];
      window.salesiaProfiles = nextAccounts;
      setAccounts(nextAccounts);
      window.salesiaRender?.();
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.reload();
  }

  if (!isSupabaseConfigured) return <main className="auth-screen"><section className="auth-card">
    <div className="auth-brand"><span className="brand-symbol">S<span>↗</span></span><div>Sales<span>IA</span><small>ENTERPRISE</small></div></div>
    <h1>Configura la conexión</h1><p className="auth-description">Crea un archivo <code>.env</code> a partir de <code>.env.example</code> y añade la URL del proyecto Supabase y su clave pública (anon/publishable).</p>
    <p className="auth-notice">No coloques una clave service_role o secret en el frontend.</p>
  </section></main>;

  if (stage === 'checking' || !authChecked) return <main className="auth-screen"><section className="auth-card auth-loading"><div className="brand-symbol">S<span>↗</span></div><p>Validando sesión segura…</p></section></main>;
  if (stage === 'error') return <main className="auth-screen"><section className="auth-card">
    <h1>No se pudo validar el acceso</h1><p className="auth-error">{authError}</p><p className="auth-description">Comprueba que ejecutaste la migración SQL y que el usuario tiene un perfil válido en Supabase.</p><button className="btn primary auth-submit" onClick={signOut}>Volver al inicio de sesión</button>
  </section></main>;
  if (stage === 'login' || stage === 'setup' || stage === 'password') return <AuthScreens
    mode={stage} busy={busy} error={authError} profile={profile}
    onLogin={signIn} onSetup={initializeCompany} onChangePassword={changePassword}
  />;

  return <>
    <a className="skip" href="#content">Saltar al contenido</a>
    <Sidebar companyName={companyName} />
    <div className="shell">
      <Topbar name={profile?.full_name || session?.user.email || 'Usuario'} email={profile?.email || session?.user.email || ''} role={roleLabels[profile?.role_key || ''] || 'Usuario'} isAdmin={isAdmin} onLogout={signOut} />
      <div className="migration-note"><strong>Sesión protegida con Supabase.</strong> Mantenimiento consulta y guarda Categorías, Clientes, Productos y Vendedores en Supabase. Ventas, Pedidos, Inventario, Analítica, Insights y Reportes siguen pendientes de migración; no uses sus datos de demostración como operaciones reales.</div>
      <main id="content" tabIndex={-1}>
        {authError && <div className="callout" role="status">{authError}</div>}
        {engineError && <section className="panel" role="alert"><div className="panel-body"><h2>No se pudo iniciar SalesIA</h2><p className="description">Actualiza la página. Si el problema continúa, revisa la consola del navegador.</p></div></section>}
      </main>
      <PageFooter />
    </div>
    <ModalRoot />
    <div id="toast" role="status" aria-live="polite" />
    {accountOpen && isAdmin && <CreateAccountDialog onClose={() => setAccountOpen(false)} onCreate={createAccount} />}
  </>;
}
