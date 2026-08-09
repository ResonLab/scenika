import { useEffect, useState } from 'react'
import { CATEGORIES, type Materiel, type ResumeParc } from '../../../partage/types'

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
      setErreur((e as Error).message)
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
      <h1>Parc matériel</h1>

      {resume && (
        <div className="chiffres">
          <div className="chiffre">
            <strong>{resume.nbReferences}</strong>
            <span>références</span>
          </div>
          <div className="chiffre">
            <strong>{resume.nbAppareils}</strong>
            <span>appareils</span>
          </div>
          <div className="chiffre">
            <strong>{(resume.puissanceTotaleW / 1000).toFixed(1)} kW</strong>
            <span>si tout est allumé</span>
          </div>
          <div className="chiffre">
            <strong>{resume.nbPilotesDmx}</strong>
            <span>pilotés en DMX</span>
          </div>
        </div>
      )}

      <div className="carte">
        {!nouveau && <button onClick={() => setNouveau({ ...VIDE })}>+ Ajouter du matériel</button>}

        {nouveau && (
          <div className="formulaire">
            <label>
              Référence
              <input
                value={nouveau.reference}
                onChange={(e) => champ('reference', e.target.value)}
                autoFocus
              />
            </label>
            <label>
              Désignation
              <input
                value={nouveau.designation}
                onChange={(e) => champ('designation', e.target.value)}
              />
            </label>
            <label>
              Catégorie
              <select
                value={nouveau.categorie}
                onChange={(e) => champ('categorie', e.target.value as Materiel['categorie'])}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.valeur} value={c.valeur}>
                    {c.libelle}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Quantité
              <input
                type="number"
                min="0"
                value={nouveau.quantite}
                onChange={(e) => champ('quantite', Number(e.target.value))}
              />
            </label>
            <label>
              Puissance (W)
              <input
                type="number"
                min="0"
                value={nouveau.puissanceW}
                onChange={(e) => champ('puissanceW', Number(e.target.value))}
              />
            </label>
            <label>
              Canaux DMX
              <input
                type="number"
                min="0"
                max="512"
                value={nouveau.canauxDmx}
                onChange={(e) => champ('canauxDmx', Number(e.target.value))}
              />
            </label>
            <label>
              Emplacement
              <input
                value={nouveau.emplacement}
                onChange={(e) => champ('emplacement', e.target.value)}
              />
            </label>

            {erreur && <p className="erreur">{erreur}</p>}

            <div className="barre-boutons">
              <button onClick={enregistrer}>Enregistrer</button>
              <button className="discret" onClick={() => setNouveau(null)}>
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="carte defilable">
        <table>
          <thead>
            <tr>
              <th>Référence</th>
              <th>Désignation</th>
              <th>Catégorie</th>
              <th>Qté</th>
              <th>Puissance</th>
              <th>DMX</th>
              <th>Emplacement</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {materiel.map((m) => (
              <tr key={m.id}>
                <td>{m.reference}</td>
                <td>{m.designation}</td>
                <td>{CATEGORIES.find((c) => c.valeur === m.categorie)?.libelle ?? m.categorie}</td>
                <td>{m.quantite}</td>
                <td>{m.puissanceW > 0 ? `${m.puissanceW} W` : '—'}</td>
                <td>{m.canauxDmx > 0 ? `${m.canauxDmx} canaux` : '—'}</td>
                <td>{m.emplacement || '—'}</td>
                <td>
                  <button className="discret" onClick={() => supprimer(m.id)}>
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
            {materiel.length === 0 && (
              <tr>
                <td colSpan={8} className="discret">
                  Le parc est vide.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
