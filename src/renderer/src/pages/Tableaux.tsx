import { useCallback, useEffect, useMemo, useState } from 'react'
import { contrainteDuGeneral, repartirSurTableaux } from '../../../../commun/tableaux.js'
import { CALIBRES } from '../../../../commun/puissance.js'
import type { AppareilScene, TableauElectrique } from '../../../partage/types'
import { t, traduireErreur } from '../../../partage/i18n'

/**
 * Les tableaux électriques réels, et la répartition automatique dessus.
 *
 * **La différence avec l'écran Puissance** : celui-ci répond à « de combien de
 * circuits ai-je besoin ? », en inventant autant de circuits identiques qu'il
 * en faut. Cet écran-ci répond à l'autre question, celle du terrain : « avec
 * les tableaux que j'ai devant moi, est-ce que ça rentre ? »
 *
 * **Le calcul vit dans `commun/tableaux.js`**, avec ses vérifications, et il
 * réutilise la marge de charge de `commun/puissance.js`. Deux marges
 * différentes dans la maison donneraient deux réponses à la même question.
 */
export default function Tableaux(): React.JSX.Element {
  const [tableaux, setTableaux] = useState<TableauElectrique[]>([])
  const [poses, setPoses] = useState<AppareilScene[]>([])
  const [message, setMessage] = useState('')

  /**
   * Le tableau en cours de correction : son identifiant et ce qu'on retouche.
   *
   * **`tableaux:modifier` existait de bout en bout sans qu'aucun bouton ne
   * l'appelle** — trouvé par `tests/atteignable.mjs`. On ne pouvait ni corriger
   * le nom d'un tableau, ni son disjoncteur de tête, alors que c'est
   * précisément le chiffre qu'on saisit de travers.
   *
   * **Les prises ne sont pas touchées.** Le domaine les réécrit toutes, et le
   * formulaire d'ajout ne sait produire qu'un calibre uniforme : les rendre
   * modifiables ici écraserait en silence un tableau de chantier dont une prise
   * est en 32 A à côté de ses 16 A. Un tableau dont les prises changent est un
   * autre tableau — on le supprime et on le recrée.
   */
  const [correction, setCorrection] = useState<{
    id: number
    nom: string
    calibreGeneralA: number
  } | null>(null)

  const [nom, setNom] = useState('')
  const [nombreDePrises, setNombreDePrises] = useState(6)
  const [calibrePrise, setCalibrePrise] = useState(16)
  const [calibreGeneral, setCalibreGeneral] = useState(0)

  const recharger = useCallback(async () => {
    setTableaux(await window.api.tableaux.lister())
    setPoses(await window.api.scene.lister())
  }, [])

  useEffect(() => {
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

  function ajouter(): void {
    agir(async () => {
      await window.api.tableaux.ajouter({
        nom,
        calibreGeneralA: calibreGeneral,
        notes: '',
        prises: Array.from({ length: nombreDePrises }, (_, index) => ({
          id: 0,
          numero: index + 1,
          calibreA: calibrePrise
        }))
      })
      setNom('')
    })
  }

  /**
   * La répartition des appareils du plan de scène sur les tableaux réels.
   *
   * Les appareils sans puissance déclarée sont écartés : les compter pour zéro
   * remplirait la liste de lignes qui ne pèsent rien et masquerait ce qui
   * compte.
   */
  const repartition = useMemo(() => {
    const aPlacer = poses
      .filter((appareil) => appareil.puissanceW > 0)
      .map((appareil) => ({
        nom: appareil.etiquette || appareil.designation,
        puissanceW: appareil.puissanceW
      }))
    if (tableaux.length === 0 || aPlacer.length === 0) return null

    return repartirSurTableaux(
      aPlacer,
      tableaux.map((tableau) => ({
        nom: tableau.nom,
        calibreGeneralA: tableau.calibreGeneralA,
        prises: tableau.prises.map((prise) => ({
          numero: prise.numero,
          calibreA: prise.calibreA
        }))
      }))
    )
  }, [poses, tableaux])

  return (
    <>
      <h1>{t('tab.titre')}</h1>
      <p className="discret">{t('tab.explication')}</p>

      {message && <p className="erreur">{message}</p>}

      <div className="carte">
        <h2>{t('tab.nouveau')}</h2>
        <div className="ligne-champs">
          <label>
            {t('tab.nom')}
            <input value={nom} onChange={(e) => setNom(e.target.value)} />
          </label>
          <label>
            {t('tab.nombreDePrises')}
            <input
              type="number"
              min="1"
              value={nombreDePrises}
              onChange={(e) => setNombreDePrises(Number(e.target.value))}
            />
          </label>
          <label>
            {t('tab.calibrePrise')}
            <select value={calibrePrise} onChange={(e) => setCalibrePrise(Number(e.target.value))}>
              {CALIBRES.map((calibre) => (
                <option key={calibre} value={calibre}>
                  {calibre} A
                </option>
              ))}
            </select>
          </label>
          <label>
            {t('tab.calibreGeneral')}
            <select
              value={calibreGeneral}
              onChange={(e) => setCalibreGeneral(Number(e.target.value))}
            >
              <option value={0}>{t('tab.generalNonDeclare')}</option>
              {[16, 32, 63, 125].map((calibre) => (
                <option key={calibre} value={calibre}>
                  {calibre} A
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="discret">{t('tab.generalExplication')}</p>
        <div className="barre-boutons">
          <button onClick={ajouter} disabled={!nom.trim()}>
            {t('tab.ajouter')}
          </button>
        </div>
      </div>

      {tableaux.length === 0 && <p className="avertissement">{t('tab.aucun')}</p>}

      {tableaux.map((tableau) => {
        const contrainte = contrainteDuGeneral({
          nom: tableau.nom,
          calibreGeneralA: tableau.calibreGeneralA,
          prises: tableau.prises.map((p) => ({ numero: p.numero, calibreA: p.calibreA }))
        })
        const enCorrection = correction?.id === tableau.id
        return (
          <div key={tableau.id} className="carte">
            {enCorrection ? (
              <div className="ligne-champs">
                <label>
                  {t('tab.nom')}
                  <input
                    value={correction.nom}
                    onChange={(e) => setCorrection({ ...correction, nom: e.target.value })}
                    autoFocus
                  />
                </label>
                <label>
                  {t('tab.calibreGeneral')}
                  <select
                    value={correction.calibreGeneralA}
                    onChange={(e) =>
                      setCorrection({ ...correction, calibreGeneralA: Number(e.target.value) })
                    }
                  >
                    <option value={0}>{t('tab.generalNonDeclare')}</option>
                    {[16, 32, 63, 125].map((calibre) => (
                      <option key={calibre} value={calibre}>
                        {calibre} A
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ) : (
              <h2>{tableau.nom}</h2>
            )}
            <p className="discret">
              {t('tab.prises', { nombre: tableau.prises.length })} ·{' '}
              {t('tab.calibreGeneral')} :{' '}
              {tableau.calibreGeneralA > 0
                ? `${tableau.calibreGeneralA} A`
                : t('tab.generalNonDeclare')}
            </p>

            {contrainte.generalEstLimitant && (
              <p className="avertissement">
                {t('tab.generalLimitant', {
                  somme: contrainte.sommeDesPrisesA,
                  general: contrainte.generalA
                })}
              </p>
            )}

            <div className="barre-boutons">
              {enCorrection ? (
                <>
                  <button
                    onClick={() =>
                      agir(async () => {
                        await window.api.tableaux.modifier({ ...tableau, ...correction })
                        setCorrection(null)
                      })
                    }
                    disabled={!correction.nom.trim()}
                  >
                    {t('action.enregistrer')}
                  </button>
                  <button className="discret" onClick={() => setCorrection(null)}>
                    {t('action.annuler')}
                  </button>
                </>
              ) : (
                <button
                  className="discret"
                  onClick={() =>
                    setCorrection({
                      id: tableau.id,
                      nom: tableau.nom,
                      calibreGeneralA: tableau.calibreGeneralA
                    })
                  }
                >
                  {t('action.modifier')}
                </button>
              )}
              <button
                className="discret"
                onClick={() => {
                  if (confirm(t('tab.supprimerConfirme'))) {
                    agir(() => window.api.tableaux.supprimer(tableau.id))
                  }
                }}
              >
                {t('tab.supprimer')}
              </button>
            </div>
          </div>
        )
      })}

      {tableaux.length > 0 && (
        <>
          <h2>{t('tab.repartition')}</h2>
          <p className="discret">{t('tab.repartitionExplication')}</p>

          {!repartition && <p className="avertissement">{t('tab.rienAPlacer')}</p>}

          {repartition && (
            <>
              <div className="chiffres">
                <div className="chiffre">
                  <strong>{(repartition.puissanceTotaleW / 1000).toFixed(2)} kW</strong>
                  <span>{t('pui.totale')}</span>
                </div>
                <div className="chiffre">
                  <strong>{(repartition.puissancePlaceeW / 1000).toFixed(2)} kW</strong>
                  <span>{t('tab.placee')}</span>
                </div>
              </div>

              {repartition.refuses.length > 0 && (
                <div className="carte">
                  <h3>{t('tab.refuses')}</h3>
                  <ul>
                    {repartition.refuses.map((refus, index) => (
                      <li key={index} className="texte-alerte">
                        {refus.raison === 'trop_gourmand'
                          ? t('tab.refusTropGourmand', {
                              nom: refus.appareil.nom,
                              puissance: refus.appareil.puissanceW
                            })
                          : t('tab.refusPlusDePlace', {
                              nom: refus.appareil.nom,
                              puissance: refus.appareil.puissanceW
                            })}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {repartition.tableaux.map((tableau) => (
                <div key={tableau.nom} className="carte defilable">
                  <h3>{tableau.nom}</h3>
                  {tableau.maximumGeneralW > 0 && (
                    <p className={tableau.tauxChargeGeneral > 0.95 ? 'texte-alerte' : 'discret'}>
                      {t('tab.chargeTableau', {
                        charge: Math.round(tableau.chargeW),
                        taux: Math.round(tableau.tauxChargeGeneral * 100)
                      })}
                    </p>
                  )}
                  {tableau.prises.map((prise) => (
                    <div key={prise.numero} className="circuit">
                      <h4>
                        {t('tab.priseNumero', { numero: prise.numero })} — {prise.calibreA} A
                      </h4>
                      {prise.appareils.length === 0 ? (
                        <p className="discret">{t('tab.priseLibre')}</p>
                      ) : (
                        <>
                          <p className={prise.tauxCharge > 0.95 ? 'texte-alerte' : 'discret'}>
                            {t('tab.chargeDe', {
                              charge: Math.round(prise.chargeW),
                              taux: Math.round(prise.tauxCharge * 100)
                            })}
                          </p>
                          <ul>
                            {prise.appareils.map((appareil, index) => (
                              <li key={index}>
                                {appareil.nom} — {appareil.puissanceW} W
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </>
          )}
        </>
      )}

      <p className="avertissement">{t('tab.reserve')}</p>
    </>
  )
}
