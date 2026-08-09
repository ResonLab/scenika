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

export interface Probleme {
  gravite: 'erreur' | 'avertissement'
  message: string
  appareils: string[]
}

export function plageOccupee(appareil: Appareil): Plage
export function verifierPatch(appareils: Appareil[]): Probleme[]
export function proposerPatch(
  appareils: { nom: string; canaux: number }[],
  premierUnivers?: number
): Appareil[]
export function plagesLibres(appareils: Appareil[], univers: number): Plage[]
