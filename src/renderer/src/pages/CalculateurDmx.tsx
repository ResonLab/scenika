import { useEffect, useMemo, useState } from 'react'
import { plageOccupee, plagesLibres, proposerPatch, verifierPatch } from '../../../../commun/dmx.js'
import type { Materiel } from '../../../partage/types'

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

export default function CalculateurDmx(): React.JSX.Element {
  const [parc, setParc] = useState<Materiel[]>([])
  const [quantites, setQuantites] = useState<Record<number, number>>({})

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
            puissanceW: m.puissanceW
          }))
        ),
    [parc, quantites]
  )

  const resultat = useMemo(() => {
    if (selection.length === 0) return null
    try {
      const patch = proposerPatch(selection)
      return { patch, problemes: verifierPatch(patch), erreur: null as string | null }
    } catch (e) {
      return { patch: [], problemes: [], erreur: (e as Error).message }
    }
  }, [selection])

  const puissanceTotale = selection.reduce((total, a) => total + a.puissanceW, 0)
  const circuits = Math.ceil(puissanceTotale / (PUISSANCE_CIRCUIT_16A * TAUX_CHARGE_MAX))

  return (
    <>
      <h1>Calculateur DMX</h1>

      {parc.length === 0 && (
        <p className="avertissement">
          Aucun appareil piloté en DMX dans le parc. Ajoutez du matériel avec un nombre de canaux
          supérieur à zéro, et il apparaîtra ici.
        </p>
      )}

      {parc.length > 0 && (
        <div className="carte">
          <h2>Combien en emmenez-vous ?</h2>
          <table>
            <thead>
              <tr>
                <th>Appareil</th>
                <th>Canaux</th>
                <th>Puissance</th>
                <th>En stock</th>
                <th>Quantité</th>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {resultat?.erreur && <p className="erreur">{resultat.erreur}</p>}

      {resultat && !resultat.erreur && resultat.patch.length > 0 && (
        <>
          <div className="chiffres">
            <div className="chiffre">
              <strong>{resultat.patch.length}</strong>
              <span>appareils</span>
            </div>
            <div className="chiffre">
              <strong>{new Set(resultat.patch.map((a) => a.univers)).size}</strong>
              <span>univers</span>
            </div>
            <div className="chiffre">
              <strong>{(puissanceTotale / 1000).toFixed(2)} kW</strong>
              <span>puissance appelée</span>
            </div>
            <div className="chiffre">
              <strong>{circuits}</strong>
              <span>circuits 16 A minimum</span>
            </div>
          </div>

          <p className="avertissement">
            Un circuit 16 A en 230 V tient environ 3 680 W en théorie ; ce calcul en réserve 20 %.
            <strong> Ce n&apos;est pas une certitude électrique</strong> : la longueur des câbles,
            les appels de courant à l&apos;allumage et l&apos;état de l&apos;installation comptent
            aussi.
          </p>

          {resultat.problemes.length === 0 ? (
            <p className="succes">Patch cohérent : aucun chevauchement.</p>
          ) : (
            resultat.problemes.map((probleme, index) => (
              <p key={index} className="erreur">
                {probleme.message}
              </p>
            ))
          )}

          <div className="carte defilable">
            <table>
              <thead>
                <tr>
                  <th>Appareil</th>
                  <th>Canaux</th>
                  <th>Univers</th>
                  <th>Adresse</th>
                  <th>Occupe</th>
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
            <h2>Ce qu&apos;il reste de libre</h2>
            {[...new Set(resultat.patch.map((a) => a.univers))].map((univers) => (
              <p key={univers}>
                Univers {univers} :{' '}
                {plagesLibres(resultat.patch, univers)
                  .map(
                    (plage) =>
                      `${String(plage.premier).padStart(3, '0')}–${String(plage.dernier).padStart(3, '0')}`
                  )
                  .join(', ') || 'complet'}
              </p>
            ))}
          </div>
        </>
      )}
    </>
  )
}
