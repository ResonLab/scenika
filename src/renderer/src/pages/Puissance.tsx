import { useEffect, useMemo, useState } from 'react'
import {
  CALIBRES,
  TAUX_CHARGE_MAX,
  TENSION_V,
  puissanceTheorique,
  repartirSurCircuits
} from '../../../../commun/puissance.js'
import type { Materiel } from '../../../partage/types'
import { t } from '../../../partage/i18n'

/**
 * La répartition de puissance, à partir du parc réel.
 *
 * Le calculateur DMX donne déjà la puissance **totale** d'une sélection. Ce
 * qu'il ne dit pas, et qui décide du branchement : **comment la répartir**.
 * Trois lyres sur un circuit et douze sur un autre, c'est un total juste et
 * une soirée dans le noir.
 *
 * Le calcul vit dans `commun/puissance.js`, avec ses vérifications — cet écran
 * ne fait que le montrer.
 */
export default function Puissance(): React.JSX.Element {
  const [parc, setParc] = useState<Materiel[]>([])
  const [quantites, setQuantites] = useState<Record<number, number>>({})
  const [calibre, setCalibre] = useState(16)

  useEffect(() => {
    window.api.parc.lister().then((liste) => setParc(liste.filter((m) => m.puissanceW > 0)))
  }, [])

  const selection = useMemo(
    () =>
      parc
        .filter((m) => (quantites[m.id] ?? 0) > 0)
        .flatMap((m) =>
          Array.from({ length: quantites[m.id] }, (_, i) => ({
            nom: `${m.designation} ${i + 1}`,
            puissanceW: m.puissanceW
          }))
        ),
    [parc, quantites]
  )

  const repartition = useMemo(
    () => (selection.length === 0 ? null : repartirSurCircuits(selection, calibre)),
    [selection, calibre]
  )

  return (
    <>
      <h1>{t('pui.titre')}</h1>

      {parc.length === 0 && <p className="avertissement">{t('pui.aucunAppareil')}</p>}

      {parc.length > 0 && (
        <div className="carte">
          <h2>{t('pui.combien')}</h2>

          <label>
            {t('pui.calibre')}
            <select value={calibre} onChange={(e) => setCalibre(Number(e.target.value))}>
              {CALIBRES.map((c) => (
                <option key={c} value={c}>
                  {c} A
                </option>
              ))}
            </select>
          </label>

          <table>
            <thead>
              <tr>
                <th>{t('dmx.appareil')}</th>
                <th>{t('parc.puissanceCourt')}</th>
                <th>{t('dmx.enStock')}</th>
                <th>{t('parc.quantite')}</th>
              </tr>
            </thead>
            <tbody>
              {parc.map((m) => (
                <tr key={m.id}>
                  <td>{m.designation}</td>
                  <td>{m.puissanceW} W</td>
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
                          // On ne branche pas plus d'appareils qu'on n'en possède.
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

      {repartition && (
        <>
          <div className="chiffres">
            <div className="chiffre">
              <strong>{repartition.circuits.length}</strong>
              <span>{t('pui.circuits')}</span>
            </div>
            <div className="chiffre">
              <strong>{(repartition.puissanceTotaleW / 1000).toFixed(2)} kW</strong>
              <span>{t('pui.totale')}</span>
            </div>
            <div className="chiffre">
              <strong>{Math.round(repartition.puissanceMaxParCircuitW)} W</strong>
              <span>{t('pui.parCircuit')}</span>
            </div>
          </div>

          <p className="avertissement">
            {t('pui.marge', {
              calibre,
              tension: TENSION_V,
              theorique: puissanceTheorique(calibre),
              marge: Math.round((1 - TAUX_CHARGE_MAX) * 100)
            })}
          </p>

          {repartition.refuses.length > 0 && (
            <div className="carte">
              <h2>{t('pui.refuses')}</h2>
              <ul>
                {repartition.refuses.map((appareil, index) => (
                  <li key={index} className="texte-alerte">
                    {t('pui.refuseLigne', {
                      nom: appareil.nom,
                      puissance: appareil.puissanceW,
                      maximum: Math.round(repartition.puissanceMaxParCircuitW)
                    })}
                  </li>
                ))}
              </ul>
              <p>{t('pui.refuseQuoiFaire')}</p>
            </div>
          )}

          <div className="carte defilable">
            {repartition.circuits.map((circuit) => (
              <div key={circuit.numero} className="circuit">
                <h3>{t('pui.circuitNumero', { numero: circuit.numero })}</h3>
                <p className={circuit.tauxCharge > 0.95 ? 'texte-alerte' : 'discret'}>
                  {t('pui.chargeDe', {
                    charge: Math.round(circuit.chargeW),
                    taux: Math.round(circuit.tauxCharge * 100)
                  })}
                </p>
                <ul>
                  {circuit.appareils.map((appareil, index) => (
                    <li key={index}>
                      {appareil.nom} — {appareil.puissanceW} W
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="discret">{t('pui.regle')}</p>
          <p className="avertissement">{t('pui.reserve')}</p>
        </>
      )}
    </>
  )
}
