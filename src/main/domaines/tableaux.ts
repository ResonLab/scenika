import { getDb, dansUneTransaction } from '../db/database'
import type { CleErreur, PriseTableau, TableauElectrique } from '../../partage/types'

/**
 * Les tableaux électriques — logique métier, **sans Electron**.
 *
 * Ce fichier range et relit des tableaux. **Il ne calcule rien** : la
 * répartition vit dans `commun/tableaux.js`, avec ses vérifications, parce
 * qu'elle doit aussi tourner dans les tests et un jour dans une page web. Une
 * formule recopiée ici divergerait au premier correctif.
 */

interface LigneTableau {
  id: number
  nom: string
  calibre_general_a: number
  notes: string
}

interface LignePrise {
  id: number
  tableau_id: number
  numero: number
  calibre_a: number
}

/**
 * Vérifie un tableau et rend **une clé**, pas une phrase — le processus
 * principal ne sait pas quelle langue la fenêtre affiche.
 */
function valider(tableau: Omit<TableauElectrique, 'id'>): CleErreur | null {
  if (!tableau.nom.trim()) return 'tableauNomVide'
  if (tableau.prises.length === 0) return 'tableauSansPrise'
  if (tableau.prises.some((prise) => !(prise.calibreA > 0))) return 'calibreInvalide'
  if (tableau.calibreGeneralA < 0) return 'generalNegatif'
  return null
}

function lirePrises(tableauId: number): PriseTableau[] {
  const lignes = getDb()
    .prepare('SELECT * FROM tableau_prise WHERE tableau_id = ? ORDER BY numero')
    .all(tableauId) as unknown as LignePrise[]
  return lignes.map((ligne) => ({
    id: ligne.id,
    numero: ligne.numero,
    calibreA: ligne.calibre_a
  }))
}

export function listerTableaux(): TableauElectrique[] {
  const lignes = getDb()
    .prepare('SELECT * FROM tableau ORDER BY nom')
    .all() as unknown as LigneTableau[]

  return lignes.map((ligne) => ({
    id: ligne.id,
    nom: ligne.nom,
    calibreGeneralA: ligne.calibre_general_a,
    notes: ligne.notes,
    prises: lirePrises(ligne.id)
  }))
}

/**
 * Enregistre les prises d'un tableau.
 *
 * **On réécrit toutes les prises plutôt que de les rapiécer.** Un tableau a
 * quelques prises, pas des milliers, et une mise à jour incrémentale
 * laisserait des numéros en trous dès qu'on retire une prise du milieu.
 */
function ecrirePrises(tableauId: number, prises: Omit<PriseTableau, 'id'>[]): void {
  getDb().prepare('DELETE FROM tableau_prise WHERE tableau_id = ?').run(tableauId)
  const inserer = getDb().prepare(
    'INSERT INTO tableau_prise (tableau_id, numero, calibre_a) VALUES (?, ?, ?)'
  )
  prises.forEach((prise, index) => {
    // Les numéros sont renumérotés à la suite : un trou dans la numérotation
    // ne correspondrait à rien sur le tableau réel, où les prises se suivent.
    inserer.run(tableauId, index + 1, prise.calibreA)
  })
}

export function ajouterTableau(tableau: Omit<TableauElectrique, 'id'>): TableauElectrique {
  const erreur = valider(tableau)
  if (erreur) throw new Error(erreur)

  // Le tableau et ses prises forment un tout : un tableau enregistré sans ses
  // prises serait un tableau sur lequel on ne peut rien brancher.
  return dansUneTransaction(() => {
    const resultat = getDb()
      .prepare('INSERT INTO tableau (nom, calibre_general_a, notes) VALUES (?, ?, ?)')
      .run(tableau.nom.trim(), tableau.calibreGeneralA, tableau.notes)

    const id = Number(resultat.lastInsertRowid)
    ecrirePrises(id, tableau.prises)
    return { ...tableau, nom: tableau.nom.trim(), id, prises: lirePrises(id) }
  })
}

export function modifierTableau(tableau: TableauElectrique): TableauElectrique {
  const erreur = valider(tableau)
  if (erreur) throw new Error(erreur)

  return dansUneTransaction(() => {
    const existe = getDb().prepare('SELECT 1 FROM tableau WHERE id = ?').get(tableau.id)
    if (!existe) throw new Error('tableauIntrouvable')

    getDb()
      .prepare('UPDATE tableau SET nom = ?, calibre_general_a = ?, notes = ? WHERE id = ?')
      .run(tableau.nom.trim(), tableau.calibreGeneralA, tableau.notes, tableau.id)

    ecrirePrises(tableau.id, tableau.prises)
    return { ...tableau, nom: tableau.nom.trim(), prises: lirePrises(tableau.id) }
  })
}

export function supprimerTableau(id: number): void {
  // ON DELETE CASCADE emporte les prises.
  getDb().prepare('DELETE FROM tableau WHERE id = ?').run(id)
}
