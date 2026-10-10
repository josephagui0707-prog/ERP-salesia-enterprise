import { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import PageFooter from './components/PageFooter';
import ModalRoot from './components/ModalRoot';
import './styles.css';

export default function App() {
  const [engineError, setEngineError] = useState(false);

  useEffect(() => {
    // Puente temporal para conservar las 33 vistas y operaciones de la versión original.
    // El motor se carga después de montar el shell para que existan todos sus puntos de anclaje.
    import('./legacy/app.js').catch((error: unknown) => {
      console.error('No se pudo iniciar el motor de SalesIA:', error);
      setEngineError(true);
    });
  }, []);

  return (
    <>
      <a className="skip" href="#content">Saltar al contenido</a>
      <Sidebar />
      <div className="shell">
        <Topbar />
        <main id="content" tabIndex={-1}>
          {engineError && (
            <section className="panel" role="alert">
              <div className="panel-body">
                <h2>No se pudo iniciar SalesIA</h2>
                <p className="description">Actualiza la página. Si el problema continúa, revisa la consola del navegador.</p>
              </div>
            </section>
          )}
        </main>
        <PageFooter />
      </div>
      <ModalRoot />
      <div id="toast" role="status" aria-live="polite" />
    </>
  );
}
