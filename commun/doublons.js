/**
 * Les doublons d'un plan de scène.
 *
 * **Pourquoi ce fichier existe.** Un défaut de l'interface posait un nouvel
 * appareil à chaque fin de glissement : presser sur un projecteur puis relâcher
 * ailleurs faisait remonter le clic jusqu'au plan, qui posait. Le défaut est
 * corrigé, mais **un correctif n'efface pas ce qu'il a laissé derrière lui** —
 * et retirer cinquante appareils empilés un par un n'est pas une réparation,
 * c'est une punition.
 *
 * **La règle est volontairement stricte : même référence *et* même endroit.**
 * Deux projecteurs du même modèle posés à deux endroits différents ne sont pas
 * des doublons, ce sont deux projecteurs — c'est même le cas normal d'un plan
 * de feu. Seul l'empilement au même point trahit l'accident.
 *
 * **On garde le premier, pas le dernier.** Le premier porte les réglages que
 * l'utilisateur a saisis — étiquette, univers, adresse, mode — et les copies
 * nées d'un clic accidentel sont vierges. Garder la dernière effacerait le
 * travail au lieu de le nettoyer.
 *
 * Écrit en JavaScript, types en JSDoc, sans aucune dépendance : il doit pouvoir
 * être éprouvé sans base ni fenêtre, comme `commun/dmx.js`.
 */

/**
 * Tolérance de position, en fraction du plan.
 *
 * Deux appareils posés par le même accident tombent au pixel près, mais un
 * glissement d'un cheveu suffirait à les faire échapper à une comparaison
 * exacte. Un millième de la largeur du plan — environ un pixel sur un plan de
 * mille — attrape l'accident sans jamais confondre deux positions voulues.
 */
export const TOLERANCE_POSITION = 0.001

/**
 * @typedef {object} AppareilPose
 * @property {number} id
 * @property {number} materielId
 * @property {number} x
 * @property {number} y
 */

/**
 * Les identifiants des appareils à retirer pour ne garder qu'un exemplaire de
 * chaque empilement.
 *
 * Rend un tableau vide s'il n'y a rien à nettoyer — jamais `null` : un appelant
 * qui oublierait de tester obtiendrait une boucle sur rien, pas une exception.
 *
 * @param {AppareilPose[]} poses
 * @param {number} [tolerance]
 * @returns {number[]}
 */
export function doublonsARetirer(poses, tolerance = TOLERANCE_POSITION) {
  /** Les appareils déjà retenus, dans l'ordre où ils ont été posés. */
  const gardes = []
  const aRetirer = []

  for (const pose of poses) {
    const memeEndroit = gardes.some(
      (garde) =>
        garde.materielId === pose.materielId &&
        Math.abs(garde.x - pose.x) <= tolerance &&
        Math.abs(garde.y - pose.y) <= tolerance
    )
    if (memeEndroit) aRetirer.push(pose.id)
    else gardes.push(pose)
  }

  return aRetirer
}
