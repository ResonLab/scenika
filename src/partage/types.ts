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
  | 'modeInvalide'
  | 'modeDebordeUnivers'
  | 'modesMalEcrits'

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
  /** Canaux du mode habituel. 0 si l'appareil n'est pas piloté. */
  canauxDmx: number
  /**
   * Les autres modes du même appareil, en canaux séparés par des virgules :
   * « 8,12,16 ». Un même projecteur existe en plusieurs modes, et le nombre de
   * canaux dépend du mode choisi, pas du modèle. Vide = un seul mode.
   */
  modesDmx: string
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

/**
 * Les modes d'un appareil, du plus petit au plus grand, sans doublon.
 *
 * Le mode habituel en fait toujours partie : une liste qui ne contiendrait pas
 * le mode réglé par défaut proposerait de choisir tout sauf ce qui est en
 * place.
 */
export function modesDisponibles(materiel: Pick<Materiel, 'canauxDmx' | 'modesDmx'>): number[] {
  const declares = materiel.modesDmx
    .split(',')
    .map((morceau) => Number(morceau.trim()))
    .filter((canaux) => Number.isInteger(canaux) && canaux > 0)

  const tous = new Set(declares)
  if (materiel.canauxDmx > 0) tous.add(materiel.canauxDmx)
  return [...tous].sort((a, b) => a - b)
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
  /**
   * Le mode réglé sur **cet** appareil-ci, en canaux. Deux projecteurs du même
   * modèle peuvent tourner en 8 et en 16 dans le même spectacle, et c'est le
   * mode réglé sur la machine qui décide de la place qu'elle occupe.
   */
  canauxDmx: number
  /* Repris du parc pour l'affichage. */
  designation: string
  puissanceW: number
  /** Les modes que la référence propose, pour changer celui-ci. */
  modesDmx: string
}

/** Une ligne prête à être facturée par Ohmnia. */
export interface LigneFacture {
  designation: string
  quantite: number
  prixUnitaire: number
  total: number
  referenceInventaire: string
}
