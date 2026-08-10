import { getDb, dansUneTransaction } from '../db/database'
import type {
  CleErreur,
  Disponibilite,
  EtatLocation,
  LigneFacture,
  LigneLocation,
  Location
} from '../../partage/types'

/**
 * Les locations : qui a quoi, depuis quand, jusqu'à quand.
 *
 * **Aucun Electron ici.** Comme le parc, ce module doit pouvoir tourner
 * derrière Nexika : une société de location a plusieurs personnes qui touchent
 * au même matériel, et c'est le cas d'usage le plus évident du multi-postes.
 *
 * **Le parc ne bouge pas quand du matériel part.** On pourrait décrémenter les
 * quantités à la sortie et les remonter au retour ; ce serait plus simple et
 * faux. Le parc dit ce qu'on **possède** ; ce qui est dehors se calcule à
 * partir des locations sorties. Sinon, une location oubliée en cours de route
 * laisse un stock faux que rien ne rattrape, et on ne sait plus si l'écart
 * vient d'un vol, d'une casse ou d'une erreur de saisie.
 */

interface LigneLocationBase {
  id: number
  client: string
  reference: string
  etat: EtatLocation
  date_depart: string
  date_retour: string
  notes: string
}

interface LigneDetailBase {
  id: number
  location_id: number
  materiel_id: number
  reference: string
  designation: string
  quantite: number
  quantite_rentree: number
  prix_unitaire: number
}

function versLigne(ligne: LigneDetailBase): LigneLocation {
  return {
    id: ligne.id,
    materielId: ligne.materiel_id,
    reference: ligne.reference,
    designation: ligne.designation,
    quantite: ligne.quantite,
    quantiteRentree: ligne.quantite_rentree,
    prixUnitaire: ligne.prix_unitaire
  }
}

/**
 * Vérifie une location et rend **une clé**, pas une phrase : le processus
 * principal ne sait pas quelle langue la fenêtre affiche.
 */
function valider(location: Omit<Location, 'id' | 'lignes'>): CleErreur | null {
  if (!location.client.trim()) return 'clientVide'
  if (!location.dateDepart) return 'dateDepartVide'
  if (!location.dateRetour) return 'dateRetourVide'
  // Une location qui rentre avant de partir est une faute de frappe, pas une
  // intention : la refuser tout de suite évite un planning incompréhensible.
  if (location.dateRetour < location.dateDepart) return 'retourAvantDepart'
  return null
}

export function listerLocations(): Location[] {
  const base = getDb()
  const entetes = base
    .prepare('SELECT * FROM location ORDER BY date_depart DESC, id DESC')
    .all() as unknown as LigneLocationBase[]

  const details = base
    .prepare(
      `SELECT l.*, m.reference, m.designation
         FROM location_ligne l
         JOIN materiel m ON m.id = l.materiel_id
        ORDER BY l.id`
    )
    .all() as unknown as LigneDetailBase[]

  return entetes.map((entete) => ({
    id: entete.id,
    client: entete.client,
    reference: entete.reference,
    etat: entete.etat,
    dateDepart: entete.date_depart,
    dateRetour: entete.date_retour,
    notes: entete.notes,
    lignes: details.filter((d) => d.location_id === entete.id).map(versLigne)
  }))
}

/**
 * Ce qui est disponible, article par article.
 *
 * **Seules les locations `sortie` retiennent du matériel.** Une location
 * `prevue` ne l'a pas encore pris, une `rentree` l'a rendu, une `annulee` ne
 * l'a jamais eu. Compter les prévues rendrait le parc indisponible dès qu'on
 * esquisse un devis — et on cesserait alors de saisir les devis.
 */
export function disponibilites(): Disponibilite[] {
  const lignes = getDb()
    .prepare(
      `SELECT m.id AS materielId, m.reference, m.designation, m.quantite AS possede,
              COALESCE(SUM(
                CASE WHEN loc.etat = 'sortie'
                     THEN l.quantite - l.quantite_rentree
                     ELSE 0 END
              ), 0) AS sorti
         FROM materiel m
         LEFT JOIN location_ligne l ON l.materiel_id = m.id
         LEFT JOIN location loc ON loc.id = l.location_id
        GROUP BY m.id
        ORDER BY m.categorie, m.reference`
    )
    .all() as unknown as { materielId: number; reference: string; designation: string; possede: number; sorti: number }[]

  return lignes.map((l) => ({
    ...l,
    // Une disponibilité négative est possible et doit se voir : elle signale
    // qu'on a fait sortir plus que ce qu'on possède.
    disponible: l.possede - l.sorti
  }))
}

export function creerLocation(
  location: Omit<Location, 'id' | 'lignes'>,
  lignes: { materielId: number; quantite: number; prixUnitaire: number }[]
): Location {
  const erreur = valider(location)
  if (erreur) throw new Error(erreur)
  if (lignes.length === 0) throw new Error('locationSansMateriel' satisfies CleErreur)

  const id = dansUneTransaction(() => {
    const base = getDb()
    const resultat = base
      .prepare(
        `INSERT INTO location (client, reference, etat, date_depart, date_retour, notes)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(
        location.client.trim(),
        location.reference.trim(),
        location.etat,
        location.dateDepart,
        location.dateRetour,
        location.notes
      )

    const nouvelle = Number(resultat.lastInsertRowid)
    const insertion = base.prepare(
      `INSERT INTO location_ligne (location_id, materiel_id, quantite, prix_unitaire)
       VALUES (?, ?, ?, ?)`
    )
    for (const ligne of lignes) {
      insertion.run(nouvelle, ligne.materielId, ligne.quantite, ligne.prixUnitaire)
    }
    return nouvelle
  })

  return listerLocations().find((l) => l.id === id)!
}

/**
 * Change l'état d'une location.
 *
 * Passer à `rentree` marque tout comme revenu : c'est le cas courant, et
 * obliger à ressaisir chaque quantité pour dire « tout est là » ferait qu'on
 * ne clôturerait jamais les dossiers. Ce qui manque se corrige ensuite, ligne
 * par ligne, avec `enregistrerRetour`.
 */
export function changerEtat(id: number, etat: EtatLocation): void {
  dansUneTransaction(() => {
    const base = getDb()
    base.prepare('UPDATE location SET etat = ? WHERE id = ?').run(etat, id)
    if (etat === 'rentree') {
      base
        .prepare('UPDATE location_ligne SET quantite_rentree = quantite WHERE location_id = ?')
        .run(id)
    }
  })
}

/** Ce qui est réellement revenu sur une ligne. */
export function enregistrerRetour(ligneId: number, quantiteRentree: number): void {
  const ligne = getDb()
    .prepare('SELECT quantite FROM location_ligne WHERE id = ?')
    .get(ligneId) as unknown as { quantite: number } | undefined

  if (!ligne) throw new Error('ligneIntrouvable' satisfies CleErreur)
  if (!Number.isInteger(quantiteRentree) || quantiteRentree < 0) {
    throw new Error('quantiteNegative' satisfies CleErreur)
  }
  // Rendre plus que ce qui est parti n'a pas de sens et masquerait une erreur
  // de saisie ailleurs.
  if (quantiteRentree > ligne.quantite) throw new Error('rentrePlusQueSorti' satisfies CleErreur)

  getDb()
    .prepare('UPDATE location_ligne SET quantite_rentree = ? WHERE id = ?')
    .run(quantiteRentree, ligneId)
}

export function supprimerLocation(id: number): void {
  getDb().prepare('DELETE FROM location WHERE id = ?').run(id)
}

/**
 * Les lignes de facture d'une location, pour Ohmnia.
 *
 * **Scenika ne facture pas.** Elle prépare ce qu'Ohmnia sait faire : une
 * désignation, une quantité, un prix. Refaire un module de facturation ici
 * voudrait dire tenir deux fois les mêmes règles de TVA, de remise et de
 * numérotation — et elles finiraient par diverger.
 *
 * `referenceInventaire` reprend la référence du parc : c'est ce qui permettra
 * de retrouver l'article facturé, et Ohmnia n'exige pas qu'il existe chez elle.
 */
export function lignesDeFacture(id: number): LigneFacture[] {
  const location = listerLocations().find((l) => l.id === id)
  if (!location) throw new Error('locationIntrouvable' satisfies CleErreur)

  return location.lignes.map((ligne) => ({
    designation: ligne.designation,
    quantite: ligne.quantite,
    prixUnitaire: ligne.prixUnitaire,
    total: Math.round(ligne.quantite * ligne.prixUnitaire * 100) / 100,
    referenceInventaire: ligne.reference
  }))
}
