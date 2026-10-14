/** Python real en Render Static Site: Pyodide solo se descarga si el usuario lo solicita. */
interface PythonRuntime {
  runPythonAsync: (code: string) => Promise<unknown>;
  globals: { set: (name: string, value: unknown) => void };
}
declare global { interface Window { loadPyodide?: (options: { indexURL: string }) => Promise<PythonRuntime> } }
const PYODIDE_URL = 'https://cdn.jsdelivr.net/pyodide/v0.28.3/full/';
let runtimePromise: Promise<PythonRuntime> | null = null;
let codePromise: Promise<string> | null = null;
async function runtime() {
  if (!runtimePromise) runtimePromise = (async () => {
    if (!window.loadPyodide) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = PYODIDE_URL + 'pyodide.js';
        script.crossOrigin = 'anonymous';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('No se pudo descargar Python desde el CDN.'));
        document.head.append(script);
      });
    }
    if (!window.loadPyodide) throw new Error('Runtime de Python no disponible.');
    return window.loadPyodide({ indexURL: PYODIDE_URL });
  })().catch(e => { runtimePromise = null; throw e; });
  return runtimePromise;
}
export async function pythonSummary(amounts: number[]) {
  if (!amounts.length || amounts.length > 300) throw new Error('Se requieren entre 1 y 300 ventas cargadas.');
  const python = await runtime();
  if (!codePromise) codePromise = fetch(`${import.meta.env.BASE_URL}python/salesia_stats.py`)
    .then(r => { if (!r.ok) throw new Error('Falta el módulo Python.'); return r.text(); })
    .catch(e => { codePromise = null; throw e; });
  await python.runPythonAsync(await codePromise);
  python.globals.set('sales_json', JSON.stringify(amounts));
  const output = await python.runPythonAsync('salesia_summary(sales_json)');
  const parsed = JSON.parse(String(output)) as { n: number; mean: number; median: number; minimum: number; maximum: number };
  if (!Number.isFinite(parsed.mean) || !Number.isFinite(parsed.median)) throw new Error('Python devolvió datos incorrectos.');
  return parsed;
}
