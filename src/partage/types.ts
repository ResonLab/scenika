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
  | 'clientVide'
  | 'dateDepartVide'
  | 'dateRetourVide'
  | 'retourAvantDepart'
  | 'locationSansMateriel'
  | 'ligneIntrouvable'
  | 'rentrePlusQueSorti'
  | 'locationIntrouvable'
  | 'tableauNomVide'
  | 'tableauSansPrise'
  | 'calibreInvalide'
  | 'generalNegatif'
  | 'tableauIntrouvable'
  | 'materielIntrouvable'
  | 'positionHorsPlan'
  | 'adresseInvalide'

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

/* ── Les locations ────────────────────────────────────────────────────────── */

/**
 * L'état d'une location.
 *
 * `prevue` — réservée, rien n'est parti. `sortie` — le matériel est dehors.
 * `rentree` — tout est revenu, ou ce qui manque est constaté. `annulee` — elle
 * n'a pas eu lieu, et son matériel n'a jamais été indisponible.
 */
export type EtatLocation = 'prevue' | 'sortie' | 'rentree' | 'annulee'

export const ETATS_LOCATION: EtatLocation[] = ['prevue', 'sortie', 'rentree', 'annulee']

export interface LigneLocation {
  id: number
  materielId: number
  /** Rempli à la lecture, pour l'affichage. */
  reference: string
  designation: string
  quantite: number
  quantiteRentree: number
  prixUnitaire: number
}

export interface Location {
  id: number
  client: string
  reference: string
  etat: EtatLocation
  dateDepart: string
  dateRetour: string
  notes: string
  lignes: LigneLocation[]
}

/**
 * Ce qui est dehors, article par article.
 *
 * Le parc ne bouge pas quand du matériel part : décrémenter les quantités
 * ferait perdre la trace de ce qu'on possède. La disponibilité se **calcule**,
 * à partir de ce qui est sorti et non encore rentré.
 */
export interface Disponibilite {
  materielId: number
  reference: string
  designation: string
  possede: number
  sorti: number
  disponible: number
}

/** Une prise d'un tableau électrique, avec son propre calibre. */
export interface PriseTableau {
  id: number
  numero: number
  calibreA: number
}

/**
 * Un tableau électrique réel, tel qu'on l'a sur le lieu.
 *
 * `calibreGeneralA` à 0 signifie **non déclaré**, pas « aucune limite
 * connue » : le calcul n'invente alors aucune contrainte de tête plutôt que
 * d'en supposer une fausse.
 */
export interface TableauElectrique {
  id: number
  nom: string
  calibreGeneralA: number
  notes: string
  prises: PriseTableau[]
}

/**
 * Un appareil posé sur le plan de scène.
 *
 * `x` et `y` sont des **fractions du plan**, entre 0 et 1 : le plan se
 * redimensionne avec la fenêtre, et des pixels feraient dériver tous les
 * projecteurs dès qu'on change d'écran.
 *
 * `adresseDmx` à 0 veut dire « pas encore adressé ».
 */
export interface AppareilScene {
  id: number
  materielId: number
  etiquette: string
  x: number
  y: number
  univers: number
  adresseDmx: number
  /* Repris du parc pour l'affichage : désignation, puissance et canaux. */
  designation: string
  puissanceW: number
  canauxDmx: number
}

/** Une ligne prête à être facturée par Ohmnia. */
export interface LigneFacture {
  designation: string
  quantite: number
  prixUnitaire: number
  total: number
  referenceInventaire: string
}
