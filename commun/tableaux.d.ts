import type { AppareilPuissance } from './puissance'

export interface Prise {
  numero: number
  calibreA: number
}

export interface Tableau {
  nom: string
  calibreGeneralA: number
  prises: Prise[]
}

export interface PriseChargee {
  numero: number
  calibreA: number
  maximumW: number
  appareils: AppareilPuissance[]
  chargeW: number
  tauxCharge: number
}

export interface TableauCharge {
  nom: string
  calibreGeneralA: number
  maximumGeneralW: number
  prises: PriseChargee[]
  chargeW: number
  tauxChargeGeneral: number
}

/**
 * `trop_gourmand` : aucune prise n'est assez grosse, il faut changer de
 * matériel. `plus_de_place` : l'appareil rentrerait, mais tout est occupé —
 * il faut ajouter un tableau. Les deux motifs appellent des gestes différents.
 */
export type RaisonRefus = 'trop_gourmand' | 'plus_de_place'

export interface RefusTableaux {
  appareil: AppareilPuissance
  raison: RaisonRefus
}

export interface RepartitionTableaux {
  tableaux: TableauCharge[]
  puissanceTotaleW: number
  puissancePlaceeW: number
  refuses: RefusTableaux[]
}

export const TENSION_V: number
export const TAUX_CHARGE_MAX: number

export function creerTableau(
  nom: string,
  nombreDePrises: number,
  calibrePriseA: number,
  calibreGeneralA?: number
): Tableau

export function contrainteDuGeneral(tableau: Tableau): {
  sommeDesPrisesA: number
  generalA: number
  generalEstLimitant: boolean
}

export function repartirSurTableaux(
  appareils: AppareilPuissance[],
  tableaux: Tableau[],
  tauxCharge?: number
): RepartitionTableaux
