import { supabase } from './supabase';

/**
 * Reutiliza las entidades analíticas existentes. No crea tablas ni usa service_role.
 * Cada petición se restringe a la empresa del usuario autenticado; RLS se aplica además en PostgreSQL.
 */
export function createAnalyticalServices(organizationId: string, userId: string) {
  const scope = { organization_id: organizationId, created_by: userId };
  const history = async () => {
    const [analyses, probabilities, findings, exports] = await Promise.all([
      supabase.from('analytics_runs').select('id,analysis_type,parameters,result,created_at').eq('organization_id', organizationId).order('created_at', { ascending: false }).limit(60),
      supabase.from('probability_runs').select('id,method,inputs,result,created_at').eq('organization_id', organizationId).order('created_at', { ascending: false }).limit(60),
      supabase.from('insights').select('id,title,finding,category,severity,evidence,status,created_at').eq('organization_id', organizationId).order('created_at', { ascending: false }).limit(80),
      supabase.from('report_exports').select('id,report_type,file_name,filters,format,created_at').eq('organization_id', organizationId).order('created_at', { ascending: false }).limit(60),
    ]);
    for (const response of [analyses, probabilities, findings, exports]) {
      if (response.error) throw response.error;
    }
    return { analyses: analyses.data || [], probabilities: probabilities.data || [], findings: findings.data || [], exports: exports.data || [] };
  };
  return {
    history,
    async saveAnalysis(input: { period: string; n: number; total: number; mean: number; median: number; min: number; max: number }) {
      if (!Number.isSafeInteger(input.n) || input.n < 1) throw new Error('No se puede guardar un análisis sin observaciones.');
      const { error } = await supabase.from('analytics_runs').insert({ ...scope, analysis_type: 'media_mediana', parameters: { period: input.period, variable: 'importe_venta', sample_size: input.n }, result: { n: input.n, total: input.total, mean: input.mean, median: input.median, min: input.min, max: input.max } });
      if (error) throw error;
    },
    async saveBayes(input: { prior: number; likelihood: number; falsePositive: number; evidence: number; posterior: number }) {
      const { error } = await supabase.from('probability_runs').insert({ ...scope, method: 'bayes', inputs: { prior: input.prior, likelihood: input.likelihood, falsePositive: input.falsePositive }, result: { evidence: input.evidence, posterior: input.posterior } });
      if (error) throw error;
    },
    async saveInsights(items: Array<{ title: string; text: string; tag: string; severity?: string; evidence?: Record<string, unknown> }>) {
      if (!items.length) throw new Error('No existen hallazgos verificables que guardar.');
      // Se limita la inserción intencionalmente para no generar historiales masivos en Supabase.
      const rows = items.slice(0, 8).map(item => ({ ...scope, title: item.title, finding: item.text, category: item.tag.toLowerCase(), severity: item.severity || 'informativo', evidence: item.evidence || {}, status: 'nuevo' }));
      const { error } = await supabase.from('insights').insert(rows);
      if (error) throw error;
    },
    async recordExport(input: { type: string; filename: string; period: string; records: number; format?: 'csv' | 'xlsx' }) {
      const { error } = await supabase.from('report_exports').insert({ ...scope, report_type: input.type, file_name: input.filename, format: input.format || 'csv', filters: { period: input.period, records: input.records } });
      if (error) throw error;
    },
  };
}

/** Datos públicos, sin token: se usan únicamente a solicitud del usuario. */
export function createPublicDataServices() {
  const holidayCache = new Map<number, Array<{ date: string; name: string }>>();
  let fxCache: { date: string; pen: number; usd: number; eur: number } | null = null;
  let fxFetchedAt = 0;
  return {
    async holidays(year: number) {
      if (!Number.isInteger(year) || year < 2020 || year > 2035) throw new Error('Año no admitido para feriados.');
      if (holidayCache.has(year)) return holidayCache.get(year)!;
      const response = await fetch(`https://nagerholidays.com/api/v4/Holidays/PE/${year}`, { signal: AbortSignal.timeout(9500) });
      if (!response.ok) throw new Error('El servicio de feriados no está disponible.');
      const raw: unknown = await response.json();
      if (!Array.isArray(raw)) throw new Error('Respuesta inesperada del servicio de feriados.');
      const holidays = raw.filter((h: unknown): h is { date: string; name: string } => !!h && typeof h === 'object' && 'date' in h && 'name' in h && typeof h.date === 'string' && typeof h.name === 'string')
        .filter(h => /^\d{4}-\d{2}-\d{2}$/.test(h.date)).slice(0, 50);
      holidayCache.set(year, holidays);
      return holidays;
    },
    async currency() {
      if (fxCache && Date.now() - fxFetchedAt < 4 * 60 * 60 * 1000) return fxCache;
      const urls = [
        'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/pen.min.json',
        'https://latest.currency-api.pages.dev/v1/currencies/pen.min.json',
      ];
      let lastError: unknown;
      for (const url of urls) {
        try {
          const response = await fetch(url, { signal: AbortSignal.timeout(9000) });
          if (!response.ok) throw new Error('Error HTTP al consultar tipo de cambio.');
          const payload: unknown = await response.json();
          if (!payload || typeof payload !== 'object' || !('pen' in payload) || !('date' in payload)) throw new Error('Formato no válido.');
          const raw = payload as { date: unknown; pen: { usd?: number; eur?: number } };
          const usd = Number(raw.pen?.usd), eur = Number(raw.pen?.eur);
          if (!(usd > 0 && eur > 0)) throw new Error('Tasas no válidas.');
          fxCache = { date: String(raw.date), pen: 1, usd, eur };
          fxFetchedAt = Date.now();
          return fxCache;
        } catch (e) { lastError = e; }
      }
      throw lastError instanceof Error ? lastError : new Error('Servicio de divisas no disponible.');
    },
  };
}
