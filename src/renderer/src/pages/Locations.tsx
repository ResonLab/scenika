import { useEffect, useState } from 'react'
import {
  ETATS_LOCATION,
  type Disponibilite,
  type EtatLocation,
  type Location,
  type Materiel
} from '../../../partage/types'
import { t, type CleTraduction } from '../../../partage/i18n'

/**
 * Les locations : qui a quoi, depuis quand, jusqu'à quand.
 *
 * L'écran montre deux choses côte à côte, et c'est délibéré : **les locations**
 * et **ce qui reste disponible**. Séparer les deux obligerait à faire des
 * allers-retours pour savoir si on peut accepter une demande, et on finirait
 * par accepter sans regarder.
 */

/** Le processus principal ne renvoie qu'une clé : il ignore la langue affichée. */
function traduireErreur(brut: string): string {
  let cle = brut
  let valeurs: Record<string, string> | undefined

  if (brut.startsWith('{')) {
    try {
      const decode = JSON.parse(brut) as { cle: string } & Record<string, string>
      cle = decode.cle
      valeurs = decode
    } catch {
      // Ce n'était pas du JSON : on affichera le texte brut.
    }
  }

  const complete = `erreur.${cle}` as CleTraduction
  const traduit = t(complete, valeurs)
  return traduit === complete ? brut : traduit
}

const VIDE = {
  client: '',
  reference: '',
  etat: 'prevue' as EtatLocation,
  dateDepart: new Date().toISOString().slice(0, 10),
  dateRetour: new Date().toISOString().slice(0, 10),
  notes: ''
}

interface LigneBrouillon {
  materielId: number
  quantite: number
  prixUnitaire: number
}

export default function Locations(): React.JSX.Element {
  const [locations, setLocations] = useState<Location[]>([])
  const [dispos, setDispos] = useState<Disponibilite[]>([])
  const [parc, setParc] = useState<Materiel[]>([])
  const [nouvelle, setNouvelle] = useState<typeof VIDE | null>(null)
  const [lignes, setLignes] = useState<LigneBrouillon[]>([])
  const [erreur, setErreur] = useState('')
  const [message, setMessage] = useState('')

  async function recharger(): Promise<void> {
    setLocations(await window.api.locations.lister())
    setDispos(await window.api.locations.disponibilites())
    setParc(await window.api.parc.lister())
  }

  useEffect(() => {
    recharger()
  }, [])

  async function enregistrer(): Promise<void> {
    if (!nouvelle) return
    setErreur('')
    try {
      await window.api.locations.creer(nouvelle, lignes)
      setNouvelle(null)
      setLignes([])
      await recharger()
    } catch (e) {
      setErreur(traduireErreur((e as Error).message))
    }
  }

  async function changerEtat(id: number, etat: EtatLocation): Promise<void> {
    setErreur('')
    try {
      await window.api.locations.changerEtat(id, etat)
      await recharger()
    } catch (e) {
      setErreur(traduireErreur((e as Error).message))
    }
  }

  async function retour(ligneId: number, quantite: number): Promise<void> {
    setErreur('')
    try {
      await window.api.locations.enregistrerRetour(ligneId, quantite)
      await recharger()
    } catch (e) {
      setErreur(traduireErreur((e as Error).message))
    }
  }

  /**
   * Prépare les lignes pour Ohmnia et les met dans le presse-papiers.
   *
   * **Scenika ne facture pas.** Elle prépare ce qu'Ohmnia sait faire. Refaire
   * un module de facturation ici voudrait dire tenir deux fois les règles de
   * TVA, de remise et de numérotation — elles finiraient par diverger.
   */
  async function exporter(id: number): Promise<void> {
    setErreur('')
    setMessage('')
    try {
      const facture = await window.api.locations.lignesDeFacture(id)
      await navigator.clipboard.writeText(JSON.stringify(facture, null, 2))
      setMessage(t('loc.exporteVers'))
    } catch (e) {
      setErreur(traduireErreur((e as Error).message))
    }
  }

  return (
    <>
      <h1>{t('loc.titre')}</h1>

      {erreur && <p className="erreur">{erreur}</p>}
      {message && <p className="succes">{message}</p>}

      <div className="carte">
        <h2>{t('dispo.titre')}</h2>
        <p className="discret">{t('dispo.explication')}</p>
        <table>
          <thead>
            <tr>
              <th>{t('parc.reference')}</th>
              <th>{t('parc.designation')}</th>
              <th>{t('dispo.possede')}</th>
              <th>{t('dispo.sorti')}</th>
              <th>{t('dispo.disponible')}</th>
            </tr>
          </thead>
          <tbody>
            {dispos.map((d) => (
              <tr key={d.materielId} className={d.disponible < 0 ? 'alerte' : ''}>
                <td>{d.reference}</td>
                <td>{d.designation}</td>
                <td>{d.possede}</td>
                <td>{d.sorti}</td>
                <td>
                  <strong>{d.disponible}</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {dispos.some((d) => d.disponible < 0) && (
          <p className="avertissement">{t('dispo.negatif')}</p>
        )}
      </div>

      <div className="carte">
        {!nouvelle && (
          <button
            onClick={() => {
              setNouvelle({ ...VIDE })
              setLignes([])
            }}
          >
            {t('loc.nouvelle')}
          </button>
        )}

        {nouvelle && (
          <div className="formulaire">
            <label>
              {t('loc.client')}
              <input
                value={nouvelle.client}
                onChange={(e) => setNouvelle({ ...nouvelle, client: e.target.value })}
                autoFocus
              />
            </label>
            <label>
              {t('loc.reference')}
              <input
                value={nouvelle.reference}
                onChange={(e) => setNouvelle({ ...nouvelle, reference: e.target.value })}
              />
            </label>
            <label>
              {t('loc.depart')}
              <input
                type="date"
                value={nouvelle.dateDepart}
                onChange={(e) => setNouvelle({ ...nouvelle, dateDepart: e.target.value })}
              />
            </label>
            <label>
              {t('loc.retour')}
              <input
                type="date"
                value={nouvelle.dateRetour}
                onChange={(e) => setNouvelle({ ...nouvelle, dateRetour: e.target.value })}
              />
            </label>
            <label>
              {t('loc.notes')}
              <input
                value={nouvelle.notes}
                onChange={(e) => setNouvelle({ ...nouvelle, notes: e.target.value })}
              />
            </label>

            <table>
              <thead>
                <tr>
                  <th>{t('loc.materiel')}</th>
                  <th>{t('parc.quantite')}</th>
                  <th>{t('loc.prixUnitaire')}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {lignes.map((ligne, index) => (
                  <tr key={index}>
                    <td>
                      <select
                        value={ligne.materielId}
                        onChange={(e) =>
                          setLignes(
                            lignes.map((l, i) =>
                              i === index ? { ...l, materielId: Number(e.target.value) } : l
                            )
                          )
                        }
                      >
                        {parc.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.reference} — {m.designation}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        value={ligne.quantite}
                        onChange={(e) =>
                          setLignes(
                            lignes.map((l, i) =>
                              i === index ? { ...l, quantite: Number(e.target.value) } : l
                            )
                          )
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="0.05"
                        value={ligne.prixUnitaire}
                        onChange={(e) =>
                          setLignes(
                            lignes.map((l, i) =>
                              i === index ? { ...l, prixUnitaire: Number(e.target.value) } : l
                            )
                          )
                        }
                      />
                    </td>
                    <td>
                      <button
                        className="discret"
                        onClick={() => setLignes(lignes.filter((_, i) => i !== index))}
                      >
                        {t('action.supprimer')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button
              className="discret"
              disabled={parc.length === 0}
              onClick={() =>
                setLignes([
                  ...lignes,
                  { materielId: parc[0]?.id ?? 0, quantite: 1, prixUnitaire: 0 }
                ])
              }
            >
              {t('loc.ajouterLigne')}
            </button>

            <div className="barre-boutons">
              <button onClick={enregistrer}>{t('action.enregistrer')}</button>
              <button className="discret" onClick={() => setNouvelle(null)}>
                {t('action.annuler')}
              </button>
            </div>
          </div>
        )}
      </div>

      {locations.length === 0 && <p className="discret">{t('loc.aucune')}</p>}

      {locations.map((location) => (
        <div key={location.id} className="carte">
          <h2>
            {location.client} {location.reference && `— ${location.reference}`}
          </h2>
          <p className="discret">
            {t(`etatLoc.${location.etat}`)} · {location.dateDepart} → {location.dateRetour}
          </p>
          {location.notes && <p>{location.notes}</p>}

          <table>
            <thead>
              <tr>
                <th>{t('loc.materiel')}</th>
                <th>{t('parc.quantite')}</th>
                <th>{t('loc.rentre')}</th>
                <th>{t('loc.prixUnitaire')}</th>
              </tr>
            </thead>
            <tbody>
              {location.lignes.map((ligne) => {
                const manque = ligne.quantite - ligne.quantiteRentree
                return (
                  <tr key={ligne.id} className={manque > 0 && location.etat === 'rentree' ? 'alerte' : ''}>
                    <td>
                      {ligne.reference} — {ligne.designation}
                    </td>
                    <td>{ligne.quantite}</td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        max={ligne.quantite}
                        value={ligne.quantiteRentree}
                        onChange={(e) => retour(ligne.id, Number(e.target.value))}
                      />
                      {manque > 0 && location.etat === 'rentree' && (
                        <span className="badge-alerte">{t('loc.manquant', { nombre: manque })}</span>
                      )}
                    </td>
                    <td>{ligne.prixUnitaire}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <div className="barre-boutons">
            {ETATS_LOCATION.filter((e) => e !== location.etat).map((etat) => (
              <button key={etat} className="discret" onClick={() => changerEtat(location.id, etat)}>
                {t(`etatLoc.${etat}`)}
              </button>
            ))}
            <button onClick={() => exporter(location.id)}>{t('loc.exporter')}</button>
            <button
              className="discret"
              onClick={async () => {
                await window.api.locations.supprimer(location.id)
                await recharger()
              }}
            >
              {t('action.supprimer')}
            </button>
          </div>
        </div>
      ))}
    </>
  )
}
