import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { proposerPatch, verifierPatch } from '../../../../commun/dmx.js'
import type { AppareilScene, Materiel } from '../../../partage/types'
import { t, traduireErreur } from '../../../partage/i18n'

/**
 * Le plan de scène.
 *
 * **Ce que le plan apporte et qu'une feuille de patch ne donne pas : où.** Un
 * tableau dit qu'un appareil est en 145 ; il ne dit pas qu'il est en face cour,
 * ni qu'il est le voisin de celui qui partage sa prise. C'est en voyant les
 * appareils côte à côte qu'on s'aperçoit qu'on a posé les deux plus gourmands
 * au même endroit.
 *
 * **Les positions sont des fractions du plan, pas des pixels.** Le plan se
 * redimensionne avec la fenêtre : en pixels, tous les projecteurs dériveraient
 * dès qu'on change d'écran.
 *
 * **Aucune adresse DMX n'est calculée ici.** `proposerPatch` et `verifierPatch`
 * viennent de `commun/dmx.js`, partagé avec la page web gratuite. Deux
 * calculateurs qui divergent, c'est un patch juste à l'écran et faux en salle.
 */
export default function Scene(): React.JSX.Element {
  const [parc, setParc] = useState<Materiel[]>([])
  const [poses, setPoses] = useState<AppareilScene[]>([])
  const [choisi, setChoisi] = useState<number | null>(null)
  const [aPoser, setAPoser] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const plan = useRef<HTMLDivElement>(null)
  // L'appareil en cours de glissement. Une référence et non un état : le
  // déplacement redessine à chaque pixel, et passer par setState à cette
  // cadence rendrait le glissement saccadé.
  const glisse = useRef<number | null>(null)

  const recharger = useCallback(async () => {
    setPoses(await window.api.scene.lister())
  }, [])

  useEffect(() => {
    window.api.parc.lister().then(setParc)
    recharger()
  }, [recharger])

  async function agir(action: () => Promise<unknown>): Promise<void> {
    setMessage('')
    try {
      await action()
      await recharger()
    } catch (e) {
      setMessage(traduireErreur((e as Error).message))
    }
  }

  /** Convertit un point de l'écran en fraction du plan, borné à [0, 1]. */
  function fractionDuPlan(evenement: { clientX: number; clientY: number }): { x: number; y: number } {
    const cadre = plan.current?.getBoundingClientRect()
    if (!cadre || cadre.width === 0 || cadre.height === 0) return { x: 0.5, y: 0.5 }
    const borner = (valeur: number): number => Math.min(1, Math.max(0, valeur))
    return {
      x: borner((evenement.clientX - cadre.left) / cadre.width),
      y: borner((evenement.clientY - cadre.top) / cadre.height)
    }
  }

  function poserSurLePlan(evenement: React.MouseEvent): void {
    if (aPoser === null) return
    const materiel = parc.find((m) => m.id === aPoser)
    if (!materiel) return
    const { x, y } = fractionDuPlan(evenement)

    agir(() =>
      window.api.scene.poser({
        materielId: materiel.id,
        etiquette: '',
        x,
        y,
        univers: 1,
        adresseDmx: 0
      })
    )
  }

  function terminerGlissement(evenement: React.MouseEvent): void {
    const id = glisse.current
    glisse.current = null
    if (id === null) return
    const appareil = poses.find((a) => a.id === id)
    if (!appareil) return
    const { x, y } = fractionDuPlan(evenement)

    agir(() =>
      window.api.scene.deplacer({
        id: appareil.id,
        etiquette: appareil.etiquette,
        x,
        y,
        univers: appareil.univers,
        adresseDmx: appareil.adresseDmx
      })
    )
  }

  /**
   * Adresse tous les appareils pilotés, dans l'ordre où ils sont posés.
   *
   * Les appareils sans canal DMX sont écartés : ils ne sont pas pilotés, ils se
   * branchent seulement. Leur donner une adresse laisserait croire qu'ils
   * répondent à la console.
   */
  async function adresserAutomatiquement(): Promise<void> {
    const pilotes = poses.filter((a) => a.canauxDmx > 0)
    if (pilotes.length === 0) return

    setMessage('')
    try {
      const patch = proposerPatch(
        pilotes.map((a) => ({ nom: String(a.id), canaux: a.canauxDmx }))
      )
      for (const propose of patch) {
        const appareil = pilotes.find((a) => String(a.id) === propose.nom)
        if (!appareil) continue
        await window.api.scene.deplacer({
          id: appareil.id,
          etiquette: appareil.etiquette,
          x: appareil.x,
          y: appareil.y,
          univers: propose.univers,
          adresseDmx: propose.adresse
        })
      }
      await recharger()
    } catch (e) {
      // `proposerPatch` refuse un mode impossible — plus de canaux qu'un
      // univers entier — avec un message français qui vit avec sa règle.
      setMessage((e as Error).message)
    }
  }

  const problemes = useMemo(
    () =>
      verifierPatch(
        poses
          .filter((a) => a.canauxDmx > 0 && a.adresseDmx > 0)
          .map((a) => ({
            nom: a.etiquette || a.designation,
            canaux: a.canauxDmx,
            adresse: a.adresseDmx,
            univers: a.univers
          }))
      ),
    [poses]
  )

  const puissanceTotale = poses.reduce((total, a) => total + a.puissanceW, 0)
  const selection = poses.find((a) => a.id === choisi) ?? null

  return (
    <>
      <h1>{t('scene.titre')}</h1>
      <p className="discret">{t('scene.explication')}</p>

      {message && <p className="erreur">{message}</p>}
      {parc.length === 0 && <p className="avertissement">{t('scene.aucunMateriel')}</p>}

      <div className="chiffres">
        <div className="chiffre">
          <strong>{poses.length}</strong>
          <span>{t('scene.poses')}</span>
        </div>
        <div className="chiffre">
          <strong>{(puissanceTotale / 1000).toFixed(2)} kW</strong>
          <span>{t('scene.puissancePlan')}</span>
        </div>
      </div>

      <div className="scene-agencement">
        <div className="carte scene-panneau">
          <h2>{t('scene.aPoser')}</h2>
          <ul className="scene-liste">
            {parc.map((materiel) => (
              <li key={materiel.id}>
                <button
                  className={materiel.id === aPoser ? 'actif' : 'discret'}
                  onClick={() => setAPoser(materiel.id === aPoser ? null : materiel.id)}
                >
                  {materiel.designation}
                </button>
                <span className="discret">
                  {materiel.puissanceW} W · {materiel.canauxDmx} ch.
                </span>
              </li>
            ))}
          </ul>

          <div className="barre-boutons">
            <button onClick={adresserAutomatiquement} disabled={poses.length === 0}>
              {t('scene.adresserAuto')}
            </button>
            <button
              className="discret"
              disabled={poses.length === 0}
              onClick={() => {
                if (confirm(t('scene.viderConfirme'))) agir(() => window.api.scene.vider())
              }}
            >
              {t('scene.vider')}
            </button>
          </div>
        </div>

        <div
          className="scene-plan"
          ref={plan}
          onClick={poserSurLePlan}
          onMouseUp={terminerGlissement}
        >
          {poses.length === 0 && <p className="scene-vide discret">{t('scene.vide')}</p>}

          {poses.map((appareil) => (
            <div
              key={appareil.id}
              className={`scene-appareil${appareil.id === choisi ? ' choisi' : ''}`}
              style={{ left: `${appareil.x * 100}%`, top: `${appareil.y * 100}%` }}
              onMouseDown={(e) => {
                e.stopPropagation()
                glisse.current = appareil.id
                setChoisi(appareil.id)
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <strong>{appareil.etiquette || appareil.designation}</strong>
              <span>
                {appareil.canauxDmx === 0
                  ? '—'
                  : appareil.adresseDmx === 0
                    ? t('scene.nonAdresse')
                    : `${t('scene.universCourt')} ${appareil.univers} · ${t('scene.adresseCourt')} ${appareil.adresseDmx}`}
              </span>
              <span>{appareil.puissanceW} W</span>
            </div>
          ))}
        </div>
      </div>

      {selection && (
        <div className="carte">
          <h2>{t('scene.selection')}</h2>
          <p>
            <strong>{selection.designation}</strong> — {selection.puissanceW} W
          </p>
          {selection.canauxDmx === 0 && <p className="discret">{t('scene.nonPilote')}</p>}

          <label>
            {t('scene.etiquette')}
            <input
              value={selection.etiquette}
              onChange={(e) =>
                agir(() =>
                  window.api.scene.deplacer({
                    id: selection.id,
                    etiquette: e.target.value,
                    x: selection.x,
                    y: selection.y,
                    univers: selection.univers,
                    adresseDmx: selection.adresseDmx
                  })
                )
              }
            />
          </label>

          {selection.canauxDmx > 0 && (
            <>
              <label>
                {t('scene.univers')}
                <input
                  type="number"
                  min="1"
                  value={selection.univers}
                  onChange={(e) =>
                    agir(() =>
                      window.api.scene.deplacer({
                        id: selection.id,
                        etiquette: selection.etiquette,
                        x: selection.x,
                        y: selection.y,
                        univers: Number(e.target.value),
                        adresseDmx: selection.adresseDmx
                      })
                    )
                  }
                />
              </label>
              <label>
                {t('scene.adresse')}
                <input
                  type="number"
                  min="0"
                  max="512"
                  value={selection.adresseDmx}
                  onChange={(e) =>
                    agir(() =>
                      window.api.scene.deplacer({
                        id: selection.id,
                        etiquette: selection.etiquette,
                        x: selection.x,
                        y: selection.y,
                        univers: selection.univers,
                        adresseDmx: Number(e.target.value)
                      })
                    )
                  }
                />
              </label>
            </>
          )}

          <div className="barre-boutons">
            <button
              className="discret"
              onClick={() => {
                setChoisi(null)
                agir(() => window.api.scene.retirer(selection.id))
              }}
            >
              {t('scene.retirer')}
            </button>
          </div>
        </div>
      )}

      {poses.some((a) => a.canauxDmx > 0 && a.adresseDmx > 0) && (
        <div className="carte">
          <h2>{t('scene.problemesPatch')}</h2>
          {problemes.length === 0 ? (
            <p className="succes">{t('scene.patchSain')}</p>
          ) : (
            <ul>
              {problemes.map((probleme, index) => (
                <li key={index} className={probleme.gravite === 'erreur' ? 'texte-alerte' : ''}>
                  {probleme.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <p className="avertissement">{t('scene.reserve')}</p>
    </>
  )
}
