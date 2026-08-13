import { useState } from 'react'
import Parc from './pages/Parc'
import CalculateurDmx from './pages/CalculateurDmx'
import Locations from './pages/Locations'
import Puissance from './pages/Puissance'
import Scene from './pages/Scene'
import Tableaux from './pages/Tableaux'
import { definirLangue, LANGUES, t, type Langue } from '../../partage/i18n'
import ConditionsUtilisation from './components/ConditionsUtilisation'
import LogoScenika from './components/LogoScenika'
import { VERSION_CONDITIONS } from '../../partage/conditions'

const MODULES = [
  { id: 'parc', cle: 'menu.parc', icone: '📦' },
  { id: 'locations', cle: 'menu.locations', icone: '🚚' },
  { id: 'scene', cle: 'menu.scene', icone: '🎭' },
  { id: 'tableaux', cle: 'menu.tableaux', icone: '🔌' },
  { id: 'puissance', cle: 'menu.puissance', icone: '⚡' },
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

/**
 * La version des conditions acceptée par ce poste.
 *
 * Elle vit dans le navigateur, comme la langue : c'est **cette personne, sur
 * cette machine**, qui accepte. Un accord rangé dans la base commune vaudrait
 * pour tout le monde, y compris pour un collègue qui n'a rien lu.
 *
 * Incrémenter `VERSION_CONDITIONS` fait donc réapparaître l'écran : on ne
 * modifie pas des conditions dans le dos de quelqu'un qui les a acceptées.
 */
const CLE_CONDITIONS = 'scenika-conditions-acceptees'

function conditionsDejaAcceptees(): boolean {
  try {
    return localStorage.getItem(CLE_CONDITIONS) === VERSION_CONDITIONS
  } catch {
    // Stockage refusé : l'écran réapparaîtra à chaque lancement. C'est
    // désagréable et honnête ; le contraire serait commode et faux.
    return false
  }
}

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
  const [conditionsAcceptees, setConditionsAcceptees] = useState(conditionsDejaAcceptees)

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

  // L'écran des conditions passe avant tout le reste : des conditions qu'on
  // peut contourner d'un clic ne sont pas des conditions.
  if (!conditionsAcceptees) {
    return (
      <ConditionsUtilisation
        onAccepter={() => {
          try {
            localStorage.setItem(CLE_CONDITIONS, VERSION_CONDITIONS)
          } catch {
            // Le choix ne survivra pas à la fermeture, mais l'écran s'ouvre.
          }
          setConditionsAcceptees(true)
        }}
      />
    )
  }

  return (
    <div className="app">
      <aside className="menu">
        <div className="menu-entete">
          <LogoScenika taille={30} />
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
        {moduleActif === 'locations' && <Locations />}
        {moduleActif === 'scene' && <Scene />}
        {moduleActif === 'tableaux' && <Tableaux />}
        {moduleActif === 'puissance' && <Puissance />}
        {moduleActif === 'dmx' && <CalculateurDmx />}
      </main>
    </div>
  )
}
