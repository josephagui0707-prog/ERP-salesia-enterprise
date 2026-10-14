// Configuración de la URL base del Backend en Python
const PYTHON_API_URL =
  import.meta.env.VITE_PYTHON_BACKEND_URL ||
  "https://erp-salesia-backend.onrender.com";

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
 * Envía datos numéricos al backend de Python para obtener un resumen estadístico.
 */
export async function getStatisticalSummary(data: number[]): Promise<SummaryStats | null> {
  try {
    const response = await fetch(`${PYTHON_API_URL}/api/statistics/summarize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data }),
    });

    if (!response.ok) {
      throw new Error(`Error en el servidor de analítica: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error consultando el backend de Python (summarize):", error);
    return null;
  }
}

/**
 * Envía datos de inferencia Bayesiana al backend de Python.
 */
export async function getBayesianInference(
  prior: { alpha: number; beta: number },
  observations: number[]
): Promise<BayesResult | null> {
  try {
    const response = await fetch(`${PYTHON_API_URL}/api/statistics/bayes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prior, observations }),
    });

    if (!response.ok) {
      throw new Error(`Error en el servidor de analítica: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error consultando el backend de Python (bayes):", error);
    return null;
  }
}

/**
 * Factoría para crear los servicios analíticos.
 * Acepta cualquier argumento opcional para adaptarse a lo que pase App.tsx
 */
export function createAnalyticalServices(..._args: any[]) {
  return {
    getSummary: getStatisticalSummary,
    getBayes: getBayesianInference,
  };
}

/**
 * Factoría para crear servicios de datos públicos.
 * Acepta cualquier argumento opcional para adaptarse a lo que pase App.tsx
 */
export function createPublicDataServices(..._args: any[]) {
  return {
    apiUrl: PYTHON_API_URL,
    isOnline: async () => {
      try {
        const res = await fetch(`${PYTHON_API_URL}/`);
        return res.ok;
      } catch {
        return false;
      }
    },
  };
}