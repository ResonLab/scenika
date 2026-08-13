import { useEffect, useMemo, useState } from 'react'
import {
  ecartsAdresses,
  plageOccupee,
  plagesLibres,
  proposerPatch,
  verifierPatch
} from '../../../../commun/dmx.js'
import type { Materiel } from '../../../partage/types'
import { t, type CleTraduction } from '../../../partage/i18n'
import CarteDmx from '../components/CarteDmx'

/**
 * Le calculateur DMX de l'application.
 *
 * Il utilise **exactement la même formule** que la page web gratuite
 * (`commun/dmx.js`). Ce qu'il ajoute, et qui justifie l'application : le patch
 * part du **parc réel**, pas d'une saisie à la main, et il annonce la puissance
 * appelée — parce qu'un patch juste sur un circuit trop chargé fait quand même
 * sauter le disjoncteur.
 */

/** Un circuit 16 A en 230 V tient 3 680 W en théorie, moins en pratique. */
const PUISSANCE_CIRCUIT_16A = 3680
/** Marge de sécurité : on n'annonce jamais 100 % d'un circuit comme tenable. */
const TAUX_CHARGE_MAX = 0.8

/**
 * Reformule un problème de patch dans la langue de l'interface.
 *
 * `commun/dmx.js` rend un `code` et ses `donnees` en plus de son message
 * français. On repart du code plutôt que de découper le message : une
 * traduction qui analyse une phrase se trompe au premier changement de
 * formulation, et personne ne s'en aperçoit avant qu'un patch faux gâche une
 * soirée. En français, on affiche le message du module — il y vit à un seul
 * endroit, avec la règle qu'il décrit.
 */
function decrireProbleme(probleme: {
  code: string
  message: string
  donnees: Record<string, string | number>
}): string {
  const cle = `probleme.${probleme.code}` as CleTraduction
  const traduit = t(cle, probleme.donnees)
  return traduit === cle || traduit === '' ? probleme.message : traduit
}

export default function CalculateurDmx(): React.JSX.Element {
  const [parc, setParc] = useState<Materiel[]>([])
  const [quantites, setQuantites] = useState<Record<number, number>>({})
  const [premierUnivers, setPremierUnivers] = useState(1)
  const [premiereAdresse, setPremiereAdresse] = useState(1)
  const [nombreUnivers, setNombreUnivers] = useState(1)
  /** L'univers imposé, matériel par matériel. Vide = laisser le calcul décider. */
  const [universImpose, setUniversImpose] = useState<Record<number, number | ''>>({})

  useEffect(() => {
    window.api.parc.lister().then((liste) => setParc(liste.filter((m) => m.canauxDmx > 0)))
  }, [])

  const selection = useMemo(
    () =>
      parc
        .filter((m) => (quantites[m.id] ?? 0) > 0)
        .flatMap((m) =>
          Array.from({ length: quantites[m.id] }, (_, i) => ({
            nom: `${m.designation} ${i + 1}`,
            canaux: m.canauxDmx,
            puissanceW: m.puissanceW,
            // `undefined` et non `null` : le module teste un entier, et un
            // univers absent doit se comporter comme s'il n'avait pas été écrit.
            univers: typeof universImpose[m.id] === 'number' ? (universImpose[m.id] as number) : undefined
          }))
        ),
    [parc, quantites, universImpose]
  )

  const resultat = useMemo(() => {
    if (selection.length === 0) return null
    try {
      const patch = proposerPatch(selection, premierUnivers, premiereAdresse)
      return { patch, problemes: verifierPatch(patch), erreur: null as string | null }
    } catch (e) {
      // Un univers imposé et plein, une adresse de départ hors univers : le
      // module refuse et nomme la cause. On la montre telle quelle plutôt que
      // de replier sur un patch approchant, qui serait faux au bout du câble.
      return { patch: [], problemes: [], erreur: (e as Error).message }
    }
  }, [selection, premierUnivers, premiereAdresse])

  const puissanceTotale = selection.reduce((total, a) => total + a.puissanceW, 0)
  const circuits = Math.ceil(puissanceTotale / (PUISSANCE_CIRCUIT_16A * TAUX_CHARGE_MAX))

  return (
    <>
      <h1>{t('dmx.titre')}</h1>

      {parc.length === 0 && (
        <p className="avertissement">{t('dmx.aucunAppareil')}</p>
      )}

      {parc.length > 0 && (
        <div className="carte">
          <h2>{t('dmx.combien')}</h2>
          <table>
            <thead>
              <tr>
                <th>{t('dmx.appareil')}</th>
                <th>{t('dmx.canaux')}</th>
                <th>{t('parc.puissanceCourt')}</th>
                <th>{t('dmx.enStock')}</th>
                <th>{t('parc.quantite')}</th>
                <th>{t('dmx.univers')}</th>
              </tr>
            </thead>
            <tbody>
              {parc.map((m) => (
                <tr key={m.id}>
                  <td>{m.designation}</td>
                  <td>{m.canauxDmx}</td>
                  <td>{m.puissanceW > 0 ? `${m.puissanceW} W` : '—'}</td>
                  <td>{m.quantite}</td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      max={m.quantite}
                      value={quantites[m.id] ?? 0}
                      onChange={(e) =>
                        setQuantites((p) => ({
                          ...p,
                          // On ne patche pas plus d'appareils qu'on n'en possède.
                          [m.id]: Math.min(Number(e.target.value), m.quantite)
                        }))
                      }
                    />
                  </td>
                  <td>
                    <select
                      value={universImpose[m.id] ?? ''}
                      onChange={(e) =>
                        setUniversImpose((p) => ({
                          ...p,
                          [m.id]: e.target.value === '' ? '' : Number(e.target.value)
                        }))
                      }
                    >
                      <option value="">{t('dmx.universAuto')}</option>
                      {Array.from({ length: nombreUnivers }, (_, i) => premierUnivers + i).map(
                        (n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        )
                      )}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2>{t('dmx.reglages')}</h2>
          <div className="ligne-formulaire">
            <label>
              {t('dmx.premierUnivers')}
              <input
                type="number"
                min="1"
                max="64"
                value={premierUnivers}
                onChange={(e) => setPremierUnivers(Math.max(1, Number(e.target.value) || 1))}
              />
            </label>
            <label>
              {t('dmx.premiereAdresse')}
              <input
                type="number"
                min="1"
                max="512"
                value={premiereAdresse}
                onChange={(e) => setPremiereAdresse(Math.max(1, Number(e.target.value) || 1))}
              />
            </label>
            <label>
              {t('dmx.nombreUnivers')}
              <input
                type="number"
                min="1"
                max="64"
                value={nombreUnivers}
                onChange={(e) => setNombreUnivers(Math.max(1, Number(e.target.value) || 1))}
              />
            </label>
          </div>
          <p className="avertissement">{t('dmx.aideDepart')}</p>
        </div>
      )}

      {resultat?.erreur && <p className="erreur">{resultat.erreur}</p>}

      {resultat && !resultat.erreur && resultat.patch.length > 0 && (
        <>
          <div className="chiffres">
            <div className="chiffre">
              <strong>{resultat.patch.length}</strong>
              <span>{t('parc.appareils')}</span>
            </div>
            <div className="chiffre">
              <strong>{new Set(resultat.patch.map((a) => a.univers)).size}</strong>
              <span>{t('dmx.universPluriel')}</span>
            </div>
            <div className="chiffre">
              <strong>{(puissanceTotale / 1000).toFixed(2)} kW</strong>
              <span>{t('dmx.puissanceAppelee')}</span>
            </div>
            <div className="chiffre">
              <strong>{circuits}</strong>
              <span>{t('dmx.circuitsMin')}</span>
            </div>
          </div>

          <p className="avertissement">
            {t('dmx.avertissementCircuit')}
            <strong>{t('dmx.avertissementCertitude')}</strong>
            {t('dmx.avertissementSuite')}
          </p>

          {resultat.problemes.length === 0 ? (
            <p className="succes">{t('dmx.patchCoherent')}</p>
          ) : (
            resultat.problemes.map((probleme, index) => (
              <p key={index} className="erreur">
                {decrireProbleme(probleme)}
              </p>
            ))
          )}

          <div className="carte defilable">
            <table>
              <thead>
                <tr>
                  <th>{t('dmx.appareil')}</th>
                  <th>{t('dmx.canaux')}</th>
                  <th>{t('dmx.univers')}</th>
                  <th>{t('dmx.adresse')}</th>
                  <th>{t('dmx.occupe')}</th>
                </tr>
              </thead>
              <tbody>
                {resultat.patch.map((appareil) => {
                  const plage = plageOccupee(appareil)
                  return (
                    <tr key={`${appareil.univers}-${appareil.adresse}-${appareil.nom}`}>
                      <td>{appareil.nom}</td>
                      <td>{appareil.canaux}</td>
                      <td>{appareil.univers}</td>
                      <td>{String(appareil.adresse).padStart(3, '0')}</td>
                      <td>
                        {String(plage.premier).padStart(3, '0')} –{' '}
                        {String(plage.dernier).padStart(3, '0')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="carte">
            <h2>{t('dmx.ecartsTitre')}</h2>
            <p className="avertissement">{t('dmx.ecartsAide')}</p>
            {/* Le calcul vient de `ecartsAdresses`, dans le module partagé.
                Le refaire ici donnerait un pas pouvant contredire la carte
                affichée juste en dessous. */}
            {ecartsAdresses(resultat.patch).map((groupe) => (
              <div key={groupe.univers}>
                <p>
                  {t('dmx.univers')} {groupe.univers} :{' '}
                  {groupe.pas !== null
                    ? t('dmx.pasConstant', {
                        nombre: groupe.adresses.length,
                        debut: String(groupe.adresses[0]).padStart(3, '0'),
                        pas: groupe.pas
                      })
                    : groupe.adresses.length < 2
                      ? t('dmx.pasUnique', {
                          debut: String(groupe.adresses[0]).padStart(3, '0')
                        })
                      : t('dmx.pasRompu')}
                </p>
                {groupe.ecarts.length > 0 && (
                  <p className="suite-ecarts">
                    {groupe.ecarts.map((ecart, index) => (
                      <span
                        key={index}
                        className={ecart === groupe.ecarts[0] ? '' : 'rompu'}
                        title={`${String(groupe.adresses[index]).padStart(3, '0')} → ${String(
                          groupe.adresses[index + 1]
                        ).padStart(3, '0')}`}
                      >
                        +{ecart}
                      </span>
                    ))}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="carte">
            <h2>{t('dmx.resteLibre')}</h2>
            {[...new Set(resultat.patch.map((a) => a.univers))].map((univers) => (
              <div key={univers}>
                <p>
                  {t('dmx.univers')} {univers} :{' '}
                  {plagesLibres(resultat.patch, univers)
                    .map(
                      (plage) =>
                        `${String(plage.premier).padStart(3, '0')}–${String(plage.dernier).padStart(3, '0')}`
                    )
                    .join(', ') || t('dmx.complet')}
                </p>
                {/* Les plages en toutes lettres disent où il reste de la
                    place ; la carte montre la forme du trou. Les deux sortent
                    du même module, elles ne peuvent pas se contredire. */}
                <CarteDmx appareils={resultat.patch} univers={univers} />
              </div>
            ))}
          </div>
        </>
      )}
    </>
  )
}
