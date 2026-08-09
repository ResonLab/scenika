import { getDb } from '../db/database'
import type { Materiel, ResumeParc } from '../../partage/types'

/**
 * Le parc matériel — logique métier, **sans Electron**.
 *
 * Même découpage que dans Ohmnia : ce fichier ne connaît ni fenêtre ni IPC, ce
 * qui permettra au serveur multi-postes de l'exposer par le réseau sans rien
 * réécrire. Une société de location a plusieurs personnes qui touchent au même
 * parc : c'est le cas d'usage le plus évident du mode multi-postes.
 */

interface LigneMateriel {
  id: number
  reference: string
  designation: string
  categorie: Materiel['categorie']
  marque: string
  modele: string
  quantite: number
  puissance_w: number
  canaux_dmx: number
  emplacement: string
  etat: string
  notes: string
}

function versMateriel(ligne: LigneMateriel): Materiel {
  return {
    id: ligne.id,
    reference: ligne.reference,
    designation: ligne.designation,
    categorie: ligne.categorie,
    marque: ligne.marque,
    modele: ligne.modele,
    quantite: ligne.quantite,
    puissanceW: ligne.puissance_w,
    canauxDmx: ligne.canaux_dmx,
    emplacement: ligne.emplacement,
    etat: ligne.etat,
    notes: ligne.notes
  }
}

function valider(materiel: Omit<Materiel, 'id'>): string | null {
  if (!materiel.reference.trim()) return 'La référence est obligatoire.'
  if (!materiel.designation.trim()) return 'La désignation est obligatoire.'
  if (!Number.isInteger(materiel.quantite) || materiel.quantite < 0) {
    return 'La quantité doit être un nombre entier positif.'
  }
  if (materiel.puissanceW < 0) return 'La puissance ne peut pas être négative.'
  if (!Number.isInteger(materiel.canauxDmx) || materiel.canauxDmx < 0) {
    return 'Le nombre de canaux DMX doit être un entier positif ou nul.'
  }
  // Un univers DMX porte 512 canaux : au-delà, l'appareil ne tiendrait dans aucun.
  if (materiel.canauxDmx > 512) {
    return "Un appareil ne peut pas occuper plus de 512 canaux : c'est un univers entier."
  }
  return null
}

export function listerMateriel(): Materiel[] {
  const lignes = getDb()
    .prepare('SELECT * FROM materiel ORDER BY categorie, reference')
    .all() as unknown as LigneMateriel[]
  return lignes.map(versMateriel)
}

export function ajouterMateriel(materiel: Omit<Materiel, 'id'>): Materiel {
  const erreur = valider(materiel)
  if (erreur) throw new Error(erreur)

  const existe = getDb()
    .prepare('SELECT 1 FROM materiel WHERE reference = ?')
    .get(materiel.reference.trim())
  if (existe) throw new Error(`La référence « ${materiel.reference.trim()} » existe déjà.`)

  const resultat = getDb()
    .prepare(
      `INSERT INTO materiel
        (reference, designation, categorie, marque, modele, quantite, puissance_w,
         canaux_dmx, emplacement, etat, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      materiel.reference.trim(),
      materiel.designation,
      materiel.categorie,
      materiel.marque,
      materiel.modele,
      materiel.quantite,
      materiel.puissanceW,
      materiel.canauxDmx,
      materiel.emplacement,
      materiel.etat,
      materiel.notes
    )

  return { ...materiel, reference: materiel.reference.trim(), id: Number(resultat.lastInsertRowid) }
}

export function modifierMateriel(materiel: Materiel): Materiel {
  const erreur = valider(materiel)
  if (erreur) throw new Error(erreur)

  getDb()
    .prepare(
      `UPDATE materiel SET
        reference = ?, designation = ?, categorie = ?, marque = ?, modele = ?,
        quantite = ?, puissance_w = ?, canaux_dmx = ?, emplacement = ?, etat = ?, notes = ?
       WHERE id = ?`
    )
    .run(
      materiel.reference.trim(),
      materiel.designation,
      materiel.categorie,
      materiel.marque,
      materiel.modele,
      materiel.quantite,
      materiel.puissanceW,
      materiel.canauxDmx,
      materiel.emplacement,
      materiel.etat,
      materiel.notes,
      materiel.id
    )
  return materiel
}

export function supprimerMateriel(id: number): void {
  getDb().prepare('DELETE FROM materiel WHERE id = ?').run(id)
}

export function resumeParc(): ResumeParc {
  const ligne = getDb()
    .prepare(
      `SELECT
        COUNT(*) AS nb_references,
        COALESCE(SUM(quantite), 0) AS nb_appareils,
        COALESCE(SUM(quantite * puissance_w), 0) AS puissance_totale,
        COALESCE(SUM(CASE WHEN canaux_dmx > 0 THEN quantite ELSE 0 END), 0) AS nb_pilotes
       FROM materiel`
    )
    .get() as {
    nb_references: number
    nb_appareils: number
    puissance_totale: number
    nb_pilotes: number
  }

  return {
    nbReferences: ligne.nb_references,
    nbAppareils: ligne.nb_appareils,
    puissanceTotaleW: ligne.puissance_totale,
    nbPilotesDmx: ligne.nb_pilotes
  }
}
