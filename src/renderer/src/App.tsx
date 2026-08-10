import { useState } from 'react'
import Parc from './pages/Parc'
import CalculateurDmx from './pages/CalculateurDmx'
import { definirLangue, LANGUES, t, type Langue } from '../../partage/i18n'

const MODULES = [
  { id: 'parc', cle: 'menu.parc', icone: '📦' },
  { id: 'dmx', cle: 'menu.dmx', icone: '🎛️' }
] as const

type ModuleId = (typeof MODULES)[number]['id']

/**
 * La langue est propre au poste, pas au parc.
 *
 * Elle vit donc dans le navigateur et non en base : le jour où plusieurs postes
 * partageront le même parc par Nexika, interdire à un collègue de lire en
 * anglais parce qu'un autre a choisi le français n'aurait aucun sens. C'est la
 * même décision que dans Ohmnia pour le thème et la langue.
 */
const CLE_LANGUE = 'scenika-langue'

function langueInitiale(): Langue {
  try {
    const memorisee = localStorage.getItem(CLE_LANGUE)
    if (memorisee === 'fr' || memorisee === 'en') return memorisee
  } catch {
    // Navigation privée ou stockage refusé : on part du français.
  }
  return 'fr'
}

export default function App(): React.JSX.Element {
  const [moduleActif, setModuleActif] = useState<ModuleId>('parc')
  const [langueActive, setLangueActive] = useState<Langue>(langueInitiale)

  // Avant le premier rendu des enfants : sans cela, ils s'afficheraient une
  // fois dans la langue précédente.
  definirLangue(langueActive)

  function changerLangue(nouvelle: Langue): void {
    definirLangue(nouvelle)
    setLangueActive(nouvelle)
    try {
      localStorage.setItem(CLE_LANGUE, nouvelle)
    } catch {
      // Le choix ne survivra pas à la fermeture, mais l'écran suit quand même.
    }
  }

  return (
    <div className="app">
      <aside className="menu">
        <div className="menu-entete">
          <span className="pastille" />
          <div>
            <strong>Scenika</strong>
            <span className="discret">{t('menu.sousTitre')}</span>
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
              {t(module.cle)}
            </button>
          ))}
        </nav>

        <div className="menu-pied">
          <label className="discret" htmlFor="langue">
            {t('param.langue')}
          </label>
          <select
            id="langue"
            value={langueActive}
            onChange={(e) => changerLangue(e.target.value as Langue)}
          >
            {LANGUES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.nom}
              </option>
            ))}
          </select>
        </div>
      </aside>

      <main className="contenu">
        {moduleActif === 'parc' && <Parc />}
        {moduleActif === 'dmx' && <CalculateurDmx />}
      </main>
    </div>
  )
}
