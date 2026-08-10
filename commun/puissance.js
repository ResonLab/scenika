/**
 * La répartition de puissance sur les circuits.
 *
 * **Écrit en JavaScript, types en JSDoc**, comme le calcul DMX et pour la même
 * raison : ce fichier doit tourner dans l'application, dans les tests, et un
 * jour dans une page web. Les trois chargent le même fichier, sans compilation.
 *
 * **Ce calcul ne remplace pas un électricien.** Il additionne des watts déclarés
 * et les répartit ; il ne connaît ni la longueur des câbles, ni la section des
 * conducteurs, ni l'état de l'installation, ni les appels de courant à
 * l'allumage — une lampe à décharge peut tirer plusieurs fois sa puissance
 * nominale pendant l'amorçage. L'interface doit le dire, et le dit.
 */

/** Tension du réseau, en volts. Europe continentale. */
export const TENSION_V = 230

/**
 * Les calibres courants, avec la puissance qu'ils tiennent en théorie.
 * P = U × I : un 16 A en 230 V tient 3 680 W.
 */
export const CALIBRES = [10, 16, 32]

/**
 * La part d'un circuit qu'on accepte de charger.
 *
 * **On ne remplit jamais un circuit à 100 %.** Un disjoncteur qui tient
 * exactement sa charge nominale déclenche au premier appel de courant, et il
 * déclenche pendant le spectacle, pas pendant les essais. 80 % est la marge
 * usuelle ; elle est affichée pour qu'on sache qu'elle existe.
 */
export const TAUX_CHARGE_MAX = 0.8

/**
 * @typedef {object} AppareilPuissance
 * @property {string} nom
 * @property {number} puissanceW Puissance déclarée d'un appareil.
 */

/**
 * @typedef {object} Circuit
 * @property {number} numero
 * @property {AppareilPuissance[]} appareils
 * @property {number} chargeW Somme des puissances du circuit.
 * @property {number} tauxCharge Part du maximum tenable, entre 0 et 1.
 */

/**
 * @typedef {object} Repartition
 * @property {Circuit[]} circuits
 * @property {number} calibreA
 * @property {number} puissanceTotaleW
 * @property {number} puissanceMaxParCircuitW Ce qu'on s'autorise par circuit.
 * @property {AppareilPuissance[]} refuses Appareils qu'aucun circuit ne peut porter.
 */

/** La puissance qu'un calibre tient en théorie, avant marge. */
export function puissanceTheorique(calibreA, tensionV = TENSION_V) {
  if (calibreA <= 0) throw new Error('Le calibre doit être supérieur à zéro.')
  return calibreA * tensionV
}

/** Ce qu'on s'autorise réellement sur un circuit, marge comprise. */
export function puissanceTenable(calibreA, tauxCharge = TAUX_CHARGE_MAX, tensionV = TENSION_V) {
  if (tauxCharge <= 0 || tauxCharge > 1) {
    throw new Error('Le taux de charge doit être compris entre 0 et 1.')
  }
  return puissanceTheorique(calibreA, tensionV) * tauxCharge
}

/**
 * Répartit des appareils sur le moins de circuits possible.
 *
 * **Le plus gros d'abord, puis dans le premier circuit qui l'accepte.** C'est
 * une règle simple, et c'est délibéré : un technicien doit pouvoir refaire la
 * répartition de tête sur le terrain et retrouver la même. Un algorithme plus
 * fin gagnerait parfois un circuit et deviendrait impossible à vérifier à la
 * main — or c'est à la main qu'on branche.
 *
 * **Un appareil plus gourmand qu'un circuit entier n'est pas réparti**, il est
 * refusé et signalé. Le glisser quelque part donnerait une répartition qui a
 * l'air juste et qui fait sauter le disjoncteur.
 *
 * @param {AppareilPuissance[]} appareils
 * @param {number} [calibreA]
 * @param {number} [tauxCharge]
 * @returns {Repartition}
 */
export function repartirSurCircuits(
  appareils,
  calibreA = 16,
  tauxCharge = TAUX_CHARGE_MAX
) {
  const maximum = puissanceTenable(calibreA, tauxCharge)

  for (const appareil of appareils) {
    if (!Number.isFinite(appareil.puissanceW) || appareil.puissanceW < 0) {
      throw new Error(
        `« ${appareil.nom} » : la puissance doit être un nombre positif ou nul.`
      )
    }
  }

  const aPlacer = [...appareils].sort((a, b) => b.puissanceW - a.puissanceW)
  const circuits = []
  const refuses = []

  for (const appareil of aPlacer) {
    if (appareil.puissanceW > maximum) {
      refuses.push(appareil)
      continue
    }
    // Le premier circuit qui l'accepte, pas le moins chargé : c'est ce qu'on
    // fait en vrai en remplissant un bloc de prises.
    let circuit = circuits.find((c) => c.chargeW + appareil.puissanceW <= maximum)
    if (!circuit) {
      circuit = { numero: circuits.length + 1, appareils: [], chargeW: 0, tauxCharge: 0 }
      circuits.push(circuit)
    }
    circuit.appareils.push(appareil)
    circuit.chargeW += appareil.puissanceW
    circuit.tauxCharge = maximum > 0 ? circuit.chargeW / maximum : 0
  }

  return {
    circuits,
    calibreA,
    puissanceTotaleW: appareils.reduce((total, a) => total + a.puissanceW, 0),
    puissanceMaxParCircuitW: maximum,
    refuses
  }
}
