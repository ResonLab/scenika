import { useEffect, useState } from 'react'
import { CATEGORIES, type Materiel, type ResumeParc } from '../../../partage/types'
import { t, traduireErreur } from '../../../partage/i18n'

const VIDE: Omit<Materiel, 'id'> = {
  reference: '',
  designation: '',
  categorie: 'lumiere',
  marque: '',
  modele: '',
  quantite: 1,
  puissanceW: 0,
  canauxDmx: 0,
  emplacement: '',
  etat: 'bon',
  notes: ''
}

export default function Parc(): React.JSX.Element {
  const [materiel, setMateriel] = useState<Materiel[]>([])
  const [resume, setResume] = useState<ResumeParc | null>(null)
  const [nouveau, setNouveau] = useState<Omit<Materiel, 'id'> | null>(null)
  const [erreur, setErreur] = useState('')

  async function recharger(): Promise<void> {
    setMateriel(await window.api.parc.lister())
    setResume(await window.api.parc.resume())
  }

  useEffect(() => {
    recharger()
  }, [])

  async function enregistrer(): Promise<void> {
    if (!nouveau) return
    setErreur('')
    try {
      await window.api.parc.ajouter(nouveau)
      setNouveau(null)
      await recharger()
    } catch (e) {
      setErreur(traduireErreur((e as Error).message))
    }
  }

  async function supprimer(id: number): Promise<void> {
    await window.api.parc.supprimer(id)
    await recharger()
  }

  function champ<K extends keyof Omit<Materiel, 'id'>>(
    cle: K,
    valeur: Omit<Materiel, 'id'>[K]
  ): void {
    setNouveau((precedent) => (precedent ? { ...precedent, [cle]: valeur } : precedent))
  }

  return (
    <>
      <h1>{t('parc.titre')}</h1>

      {resume && (
        <div className="chiffres">
          <div className="chiffre">
            <strong>{resume.nbReferences}</strong>
            <span>{t('parc.references')}</span>
          </div>
          <div className="chiffre">
            <strong>{resume.nbAppareils}</strong>
            <span>{t('parc.appareils')}</span>
          </div>
          <div className="chiffre">
            <strong>{(resume.puissanceTotaleW / 1000).toFixed(1)} kW</strong>
            <span>{t('parc.siToutAllume')}</span>
          </div>
          <div className="chiffre">
            <strong>{resume.nbPilotesDmx}</strong>
            <span>{t('parc.pilotesDmx')}</span>
          </div>
        </div>
      )}

      <div className="carte">
        {!nouveau && (
          <button onClick={() => setNouveau({ ...VIDE })}>{t('action.ajouterMateriel')}</button>
        )}

        {nouveau && (
          <div className="formulaire">
            <label>
              {t('parc.reference')}
              <input
                value={nouveau.reference}
                onChange={(e) => champ('reference', e.target.value)}
                autoFocus
              />
            </label>
            <label>
              {t('parc.designation')}
              <input
                value={nouveau.designation}
                onChange={(e) => champ('designation', e.target.value)}
              />
            </label>
            <label>
              {t('parc.categorie')}
              <select
                value={nouveau.categorie}
                onChange={(e) => champ('categorie', e.target.value as Materiel['categorie'])}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {t(`categorie.${c}`)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t('parc.quantite')}
              <input
                type="number"
                min="0"
                value={nouveau.quantite}
                onChange={(e) => champ('quantite', Number(e.target.value))}
              />
            </label>
            <label>
              {t('parc.puissance')}
              <input
                type="number"
                min="0"
                value={nouveau.puissanceW}
                onChange={(e) => champ('puissanceW', Number(e.target.value))}
              />
            </label>
            <label>
              {t('parc.canauxDmx')}
              <input
                type="number"
                min="0"
                max="512"
                value={nouveau.canauxDmx}
                onChange={(e) => champ('canauxDmx', Number(e.target.value))}
              />
            </label>
            <label>
              {t('parc.emplacement')}
              <input
                value={nouveau.emplacement}
                onChange={(e) => champ('emplacement', e.target.value)}
              />
            </label>

            {erreur && <p className="erreur">{erreur}</p>}

            <div className="barre-boutons">
              <button onClick={enregistrer}>{t('action.enregistrer')}</button>
              <button className="discret" onClick={() => setNouveau(null)}>
                {t('action.annuler')}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="carte defilable">
        <table>
          <thead>
            <tr>
              <th>{t('parc.reference')}</th>
              <th>{t('parc.designation')}</th>
              <th>{t('parc.categorie')}</th>
              <th>{t('parc.quantiteCourt')}</th>
              <th>{t('parc.puissanceCourt')}</th>
              <th>DMX</th>
              <th>{t('parc.emplacement')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {materiel.map((m) => (
              <tr key={m.id}>
                <td>{m.reference}</td>
                <td>{m.designation}</td>
                <td>{t(`categorie.${m.categorie}`)}</td>
                <td>{m.quantite}</td>
                <td>{m.puissanceW > 0 ? `${m.puissanceW} W` : '—'}</td>
                <td>{m.canauxDmx > 0 ? `${m.canauxDmx} ${t('parc.canaux')}` : '—'}</td>
                <td>{m.emplacement || '—'}</td>
                <td>
                  <button className="discret" onClick={() => supprimer(m.id)}>
                    {t('action.supprimer')}
                  </button>
                </td>
              </tr>
            ))}
            {materiel.length === 0 && (
              <tr>
                <td colSpan={8} className="discret">
                  {t('parc.vide')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
