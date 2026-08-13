/**
 * Déclarations de types pour `dmx.js`.
 *
 * Le calcul est écrit en JavaScript pour qu'un navigateur, Node et
 * l'application chargent le **même fichier**, sans compilation. Ce fichier-ci
 * n'en décrit que les types : il ne contient aucune logique, il ne peut donc
 * pas diverger du calcul.
 */
export const CANAUX_PAR_UNIVERS: number

export interface Appareil {
  nom: string
  canaux: number
  adresse: number
  univers: number
}

export interface Plage {
  premier: number
  dernier: number
}

/** Ce qui ne va pas dans un patch, indépendamment de la langue d'affichage. */
export type CodeProbleme =
  | 'canauxInvalides'
  | 'adresseInvalide'
  | 'universInvalide'
  | 'depassement'
  | 'chevauchement'

export interface Probleme {
  gravite: 'erreur' | 'avertissement'
  /** En français : le texte vit avec la règle qu'il décrit, à un seul endroit. */
  message: string
  code: CodeProbleme
  /** Les valeurs citées par le message, pour qu'une interface traduite le reformule. */
  donnees: Record<string, string | number>
  appareils: string[]
}

export function plageOccupee(appareil: Appareil): Plage
export function verifierPatch(appareils: Appareil[]): Probleme[]
export function proposerPatch(
  appareils: { nom: string; canaux: number; univers?: number }[],
  premierUnivers?: number,
  premiereAdresse?: number
): Appareil[]
export function plagesLibres(appareils: Appareil[], univers: number): Plage[]

export interface EcartUnivers {
  univers: number
  /** Les adresses, dans l'ordre croissant. */
  adresses: number[]
  /** Les écarts successifs ; il y en a un de moins que d'adresses. */
  ecarts: number[]
  /** L'écart s'il est constant, sinon `null` — c'est le « pas » d'une console. */
  pas: number | null
}

export function ecartsAdresses(appareils: Appareil[]): EcartUnivers[]

/** `chevauchement` est le seul des trois qui soit une faute. */
export type EtatCanal = 'libre' | 'occupe' | 'chevauchement'

export interface CanalOccupe {
  /** De 1 à 512. */
  canal: number
  etat: EtatCanal
  /** Les noms qui occupent ce canal. Plus d'un : c'est le chevauchement. */
  appareils: string[]
}

export function occupationUnivers(appareils: Appareil[], univers: number): CanalOccupe[]
