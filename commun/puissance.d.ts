export interface AppareilPuissance {
  nom: string
  puissanceW: number
}

export interface Circuit {
  numero: number
  appareils: AppareilPuissance[]
  chargeW: number
  tauxCharge: number
}

export interface Repartition {
  circuits: Circuit[]
  calibreA: number
  puissanceTotaleW: number
  puissanceMaxParCircuitW: number
  refuses: AppareilPuissance[]
}

export const TENSION_V: number
export const CALIBRES: number[]
export const TAUX_CHARGE_MAX: number

export function puissanceTheorique(calibreA: number, tensionV?: number): number
export function puissanceTenable(
  calibreA: number,
  tauxCharge?: number,
  tensionV?: number
): number
export function repartirSurCircuits(
  appareils: AppareilPuissance[],
  calibreA?: number,
  tauxCharge?: number
): Repartition
