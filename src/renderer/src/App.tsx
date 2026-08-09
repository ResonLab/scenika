import { useState } from 'react'
import Parc from './pages/Parc'
import CalculateurDmx from './pages/CalculateurDmx'

const MODULES = [
  { id: 'parc', libelle: 'Parc matériel', icone: '📦' },
  { id: 'dmx', libelle: 'Calculateur DMX', icone: '🎛️' }
] as const

type ModuleId = (typeof MODULES)[number]['id']

export default function App(): React.JSX.Element {
  const [moduleActif, setModuleActif] = useState<ModuleId>('parc')

  return (
    <div className="app">
      <aside className="menu">
        <div className="menu-entete">
          <span className="pastille" />
          <div>
            <strong>Scenika</strong>
            <span className="discret">Son &amp; lumière</span>
          </div>
        </div>
        <nav>
          {MODULES.map((module) => (
            <button
              key={module.id}
              className={module.id === moduleActif ? 'actif' : ''}
              onClick={() => setModuleActif(module.id)}
            >
              <span className="icone">{module.icone}</span>
              {module.libelle}
            </button>
          ))}
        </nav>
      </aside>

      <main className="contenu">
        {moduleActif === 'parc' && <Parc />}
        {moduleActif === 'dmx' && <CalculateurDmx />}
      </main>
    </div>
  )
}
