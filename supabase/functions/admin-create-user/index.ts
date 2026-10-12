import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Método no permitido.' }, 405);
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Sesión requerida.' }, 401);

  const url = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const caller = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
  const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: userData, error: userError } = await caller.auth.getUser();
  if (userError || !userData.user) return json({ error: 'Sesión inválida.' }, 401);

  const { data: actor, error: actorError } = await admin.from('profiles')
    .select('organization_id,role_key,status').eq('id', userData.user.id).maybeSingle();
  if (actorError || !actor || actor.status !== 'activo' || actor.role_key !== 'administrador' || !actor.organization_id) {
    return json({ error: 'Solo un administrador activo puede crear cuentas.' }, 403);
  }

  let body: { name?: string; email?: string; password?: string; role?: string };
  try { body = await req.json(); } catch { return json({ error: 'Solicitud inválida.' }, 400); }
  const name = String(body.name ?? '').trim();
  const email = String(body.email ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');
  const allowedRoles = ['gerente', 'vendedor', 'analista', 'almacen'];
  const role = String(body.role ?? 'vendedor');
  if (name.length < 2 || name.length > 120) return json({ error: 'El nombre debe tener entre 2 y 120 caracteres.' }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'Correo electrónico no válido.' }, 400);
  if (password.length < 12 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return json({ error: 'La contraseña temporal debe tener al menos 12 caracteres e incluir letras y números.' }, 400);
  }
  if (!allowedRoles.includes(role)) return json({ error: 'Rol no permitido para esta operación.' }, 400);

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { full_name: name },
  });
  if (createError || !created.user) return json({ error: createError?.message ?? 'No se pudo crear la cuenta.' }, 400);

  const { error: profileError } = await admin.from('profiles').upsert({
    id: created.user.id, organization_id: actor.organization_id, full_name: name, email,
    role_key: role, status: 'activo', must_change_password: true,
  });
  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return json({ error: 'No se pudo completar el perfil de la cuenta.' }, 500);
  }
  await admin.from('audit_logs').insert({
    organization_id: actor.organization_id, actor_id: userData.user.id,
    action: 'crear_cuenta', entity_table: 'profiles', entity_id: created.user.id,
    details: { email, role },
  });
  return json({ id: created.user.id, name, email, role, status: 'activo', must_change_password: true }, 201);
});
