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

// --- CONECTOR ANALÍTICO PARA APP.JS / HISTORIAL DE DESCARGAS ---
(window as any).salesiaAnalyticalApi = {
  // Carga las descargas de Supabase para la tabla de la interfaz
  history: async () => {
    try {
      const { data: analyses } = await supabase.from('analytics_runs').select('*').order('created_at', { ascending: false }).limit(60);
      const { data: probabilities } = await supabase.from('probability_runs').select('*').order('created_at', { ascending: false }).limit(60);
      const { data: findings } = await supabase.from('insights').select('*').order('created_at', { ascending: false }).limit(60);
      
      // Consultamos la tabla report_exports
      const { data: rawExports, error } = await supabase.from('report_exports').select('*').order('created_at', { ascending: false }).limit(60);

      if (error) {
        console.error("Error al consultar report_exports en Supabase:", error);
      }

      // Mapeo riguroso para asegurar la estructura exacta que lee app.js
      const exports = (rawExports || []).map((item: any) => {
        let parsedFilters = item.filters;
        if (typeof item.filters === 'string') {
          try {
            parsedFilters = JSON.parse(item.filters);
          } catch (e) {
            parsedFilters = {};
          }
        }

        return {
          id: item.id,
          created_at: item.created_at || new Date().toISOString(),
          report_type: item.report_type || item.type || 'sales',
          file_name: item.file_name || item.filename || 'Reporte.pdf',
          filters: parsedFilters || { period: '30' }
        };
      });

      return {
        analyses: analyses || [],
        probabilities: probabilities || [],
        findings: findings || [],
        exports
      };
    } catch (e) {
      console.error("Excepción en history:", e);
      return { analyses: [], probabilities: [], findings: [], exports: [] };
    }
  },

  // Inserta el registro usando las columnas de la tabla report_exports
  recordExport: async ({ type, filename, period, records, format = 'csv' }: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      let organizationId = null;
      if (user?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', user.id)
          .single();
        organizationId = profile?.organization_id || null;
      }

      const payload: any = {
        organization_id: organizationId,
        report_type: type,
        file_name: filename,
        filters: { period: String(period), records: Number(records) },
        format: format,
        created_by: user?.id || null,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase.from('report_exports').insert([payload]);

      if (error) {
        console.error("Error al registrar en report_exports:", error);
      }
    } catch (err) {
      console.error("Excepción en recordExport:", err);
    }
  }
};