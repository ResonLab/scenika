/** Types partagés entre les trois couches : main, preload, renderer. */

export type CategorieMateriel = 'son' | 'lumiere' | 'structure' | 'cable' | 'autre'

/**
 * L'ordre d'affichage des catégories. Le libellé n'est plus ici : il vit dans
 * `i18n.ts` sous `categorie.<valeur>`, parce qu'il change avec la langue.
 */
export const CATEGORIES: CategorieMateriel[] = ['son', 'lumiere', 'structure', 'cable', 'autre']

/**
 * Ce qui peut être refusé à l'enregistrement d'une fiche de matériel.
 *
 * Ce sont des **clés**, pas des phrases : le processus principal ne sait pas
 * quelle langue la fenêtre affiche. Le texte des deux langues vit dans
 * `i18n.ts`, sous `erreur.<clé>`.
 */
export type CleErreur =
  | 'referenceVide'
  | 'designationVide'
  | 'quantiteNegative'
  | 'puissanceNegative'
  | 'canauxNegatifs'
  | 'canauxTropGrands'
  | 'referenceExiste'

export interface Materiel {
  id: number
  reference: string
  designation: string
  categorie: CategorieMateriel
  marque: string
  modele: string
  quantite: number
  /** Puissance électrique en watts, pour le calcul de charge des circuits. */
  puissanceW: number
  /** Canaux DMX du mode utilisé. 0 si l'appareil n'est pas piloté. */
  canauxDmx: number
  emplacement: string
  etat: string
  notes: string
}

export interface ResumeParc {
  nbReferences: number
  nbAppareils: number
  puissanceTotaleW: number
  nbPilotesDmx: number
}
