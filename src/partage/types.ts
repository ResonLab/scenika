/** Types partagés entre les trois couches : main, preload, renderer. */

export type CategorieMateriel = 'son' | 'lumiere' | 'structure' | 'cable' | 'autre'

export const CATEGORIES: { valeur: CategorieMateriel; libelle: string }[] = [
  { valeur: 'son', libelle: 'Son' },
  { valeur: 'lumiere', libelle: 'Lumière' },
  { valeur: 'structure', libelle: 'Structure' },
  { valeur: 'cable', libelle: 'Câblage' },
  { valeur: 'autre', libelle: 'Autre' }
]

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
