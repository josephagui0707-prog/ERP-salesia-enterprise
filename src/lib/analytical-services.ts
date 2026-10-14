export interface SummaryStats {
  count: number;
  mean: number;
  std_dev: number;
  min: number;
  max: number;
  median: number;
}

export interface BayesResult {
  posterior_a: number;
  posterior_b: number;
  mean_probability: number;
}

/**
 * Cálculo directo en JS (sin necesidad de servidor Python)
 */
export async function getStatisticalSummary(data: number[]): Promise<SummaryStats | null> {
  if (!data || data.length === 0) return null;

  const count = data.length;
  const mean = data.reduce((a, b) => a + b, 0) / count;

  const sorted = [...data].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  const mid = Math.floor(count / 2);
  const median = count % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

  const variance = data.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / count;
  const std_dev = Math.sqrt(variance);

  return { count, mean, std_dev, min, max, median };
}

/**
 * Inferencia Bayesiana Beta-Binomial directa en JS
 */
export async function getBayesianInference(
  prior: { alpha: number; beta: number },
  observations: number[]
): Promise<BayesResult | null> {
  const successes = observations.filter(x => x === 1).length;
  const failures = observations.length - successes;

  const posterior_a = (prior.alpha || 1) + successes;
  const posterior_b = (prior.beta || 1) + failures;
  const mean_probability = posterior_a / (posterior_a + posterior_b);

  return { posterior_a, posterior_b, mean_probability };
}

export function createAnalyticalServices(..._args: any[]) {
  return {
    getSummary: getStatisticalSummary,
    getBayes: getBayesianInference,
  };
}

export function createPublicDataServices(..._args: any[]) {
  return {
    apiUrl: 'local',
    isOnline: async () => true,
  };
}