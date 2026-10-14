import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const isSupabaseConfigured = Boolean(
  url && key && !url.includes('YOUR_PROJECT_ID') && !key.includes('YOUR_SUPABASE')
);

export const supabase = createClient(
  url || 'https://missing-project.supabase.co',
  key || 'missing-anon-key',
  {
    auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
  }
);

export type Profile = {
  id: string;
  organization_id: string | null;
  full_name: string;
  email: string;
  role_key: 'administrador' | 'gerente' | 'vendedor' | 'analista' | 'almacen' | 'pendiente';
  status: 'activo' | 'inactivo';
  must_change_password: boolean;
};

export type AccountProfile = Pick<Profile, 'id' | 'full_name' | 'role_key' | 'status' | 'must_change_password'> & {
  email: string;
};
