/**
 * La répartition sur des tableaux électriques réels.
 *
 * **La différence avec `puissance.js`, et c'est toute la raison de ce
 * fichier** : `repartirSurCircuits()` invente autant de circuits identiques
 * qu'il en faut. C'est la bonne réponse à la question « de combien de circuits
 * ai-je besoin ? ». Ce module répond à l'autre question, celle du terrain :
 * « avec les tableaux que j'ai devant moi, est-ce que ça rentre ? »
 *
 * Un tableau réel a un nombre de prises fini et un disjoncteur de tête. Les
 * deux limitent, et **le second est celui qu'on oublie** : six prises de 16 A
 * sur un tableau alimenté en 32 A ne donnent pas 96 A. Une prise libre sur un
 * tableau saturé n'est pas une prise utilisable, et c'est exactement le genre
 * d'erreur qui a l'air juste sur le papier.
 *
 * **Écrit en JavaScript, types en JSDoc**, comme `dmx.js` et `puissance.js` et
 * pour la même raison : le fichier doit tourner dans l'application, dans les
 * tests et un jour dans une page web, sans compilation.
 *
 * **Ce calcul ne remplace pas un électricien.** Il additionne des watts
 * déclarés et les répartit ; il ignore la longueur et la section des câbles,
 * l'état de l'installation, la simultanéité réelle et les appels de courant à
 * l'allumage.
 */

import { TENSION_V, TAUX_CHARGE_MAX, puissanceTenable } from './puissance.js'

export { TENSION_V, TAUX_CHARGE_MAX }

/**
 * @typedef {object} Prise
 * @property {number} numero
 * @property {number} calibreA Calibre du disjoncteur de cette prise.
 */

/**
 * @typedef {object} Tableau
 * @property {string} nom
 * @property {number} calibreGeneralA Disjoncteur de tête. 0 = non déclaré.
 * @property {Prise[]} prises
 */

/**
 * @typedef {object} AppareilPuissance
 * @property {string} nom
 * @property {number} puissanceW
 */

/**
 * @typedef {object} PriseChargee
 * @property {number} numero
 * @property {number} calibreA
 * @property {number} maximumW Ce qu'on s'autorise sur cette prise, marge comprise.
 * @property {AppareilPuissance[]} appareils
 * @property {number} chargeW
 * @property {number} tauxCharge Part du maximum de la prise, entre 0 et 1.
 */

/**
 * @typedef {object} TableauCharge
 * @property {string} nom
 * @property {number} calibreGeneralA
 * @property {number} maximumGeneralW 0 si aucun général n'est déclaré.
 * @property {PriseChargee[]} prises
 * @property {number} chargeW
 * @property {number} tauxChargeGeneral Part du maximum du général, entre 0 et 1.
 */

/**
 * @typedef {object} RefusTableaux
 * @property {AppareilPuissance} appareil
 * @property {'trop_gourmand' | 'plus_de_place'} raison
 */

/**
 * @typedef {object} RepartitionTableaux
 * @property {TableauCharge[]} tableaux
 * @property {number} puissanceTotaleW Somme des appareils présentés.
 * @property {number} puissancePlaceeW Somme de ce qui a effectivement trouvé place.
 * @property {RefusTableaux[]} refuses
 */

/**
 * Crée un tableau dont toutes les prises ont le même calibre.
 *
 * C'est le cas courant — un bloc de prises se vend ainsi — et c'est ce qui
 * évite de saisir douze fois « 16 A ». Les calibres restent modifiables prise
 * par prise ensuite : un tableau de chantier a souvent une 32 A à côté de ses
 * 16 A, et l'y forcer obligerait à mentir sur l'installation.
 *
 * @param {string} nom
 * @param {number} nombreDePrises
 * @param {number} calibrePriseA
 * @param {number} [calibreGeneralA]
 * @returns {Tableau}
 */
export function creerTableau(nom, nombreDePrises, calibrePriseA, calibreGeneralA = 0) {
  if (!Number.isInteger(nombreDePrises) || nombreDePrises <= 0) {
    throw new Error('Un tableau doit avoir au moins une prise.')
  }
  if (!(calibrePriseA > 0)) {
    throw new Error('Le calibre des prises doit être supérieur à zéro.')
  }
  if (calibreGeneralA < 0) {
    throw new Error('Le calibre du disjoncteur général ne peut pas être négatif.')
  }

  return {
    nom,
    calibreGeneralA,
    prises: Array.from({ length: nombreDePrises }, (_, index) => ({
      numero: index + 1,
      calibreA: calibrePriseA
    }))
  }
}

/**
 * Ce que la somme des prises appelle si tout tire à fond, comparé au général.
 *
 * **Un tableau peut être parfaitement légal et se retrouver ici.** Additionner
 * les calibres des prises dépasse presque toujours le général, et c'est normal :
 * on ne branche jamais tout à fond partout. Ce n'est donc pas une erreur, c'est
 * une information — elle dit que le général est la vraie limite, et que les
 * prises ne se remplissent pas indépendamment.
 *
 * @param {Tableau} tableau
 * @returns {{ sommeDesPrisesA: number, generalA: number, generalEstLimitant: boolean }}
 */
export function contrainteDuGeneral(tableau) {
  const sommeDesPrisesA = tableau.prises.reduce((total, prise) => total + prise.calibreA, 0)
  return {
    sommeDesPrisesA,
    generalA: tableau.calibreGeneralA,
    generalEstLimitant: tableau.calibreGeneralA > 0 && tableau.calibreGeneralA < sommeDesPrisesA
  }
}

/**
 * Répartit des appareils sur des tableaux réels.
 *
 * **Le plus gourmand d'abord, la première prise qui l'accepte**, tableau après
 * tableau dans l'ordre donné. C'est exactement la règle de `puissance.js`, et
 * c'est délibéré : un technicien doit pouvoir refaire la répartition de tête
 * sur le terrain et retrouver la même. Un algorithme plus fin gagnerait
 * parfois une prise et deviendrait invérifiable — or c'est à la main qu'on
 * branche.
 *
 * **Deux limites, pas une.** Une prise accepte un appareil si sa propre charge
 * le permet *et* si le disjoncteur général du tableau le permet encore. Sans la
 * seconde, on remplirait consciencieusement douze prises de 16 A derrière un
 * général de 32 A, et le tableau entier tomberait au premier noir.
 *
 * **Rien n'est casé de force.** Un appareil plus gourmand que la plus grosse
 * prise est refusé pour cette raison ; un appareil qui rentrerait mais dont
 * plus aucune place n'est libre est refusé pour l'autre. Les deux motifs sont
 * distingués parce qu'ils appellent des gestes différents : changer de matériel
 * dans un cas, ajouter un tableau dans l'autre.
 *
 * @param {AppareilPuissance[]} appareils
 * @param {Tableau[]} tableaux
 * @param {number} [tauxCharge]
 * @returns {RepartitionTableaux}
 */
export function repartirSurTableaux(appareils, tableaux, tauxCharge = TAUX_CHARGE_MAX) {
  for (const appareil of appareils) {
    if (!Number.isFinite(appareil.puissanceW) || appareil.puissanceW < 0) {
      throw new Error(`« ${appareil.nom} » : la puissance doit être un nombre positif ou nul.`)
    }
  }
  if (tableaux.length === 0) {
    throw new Error('Il faut au moins un tableau électrique pour répartir.')
  }

  /** @type {TableauCharge[]} */
  const charges = tableaux.map((tableau) => {
    if (tableau.prises.length === 0) {
      throw new Error(`Le tableau « ${tableau.nom} » n'a aucune prise.`)
    }
    return {
      nom: tableau.nom,
      calibreGeneralA: tableau.calibreGeneralA,
      // Le général reçoit la même marge que les prises : un disjoncteur de tête
      // ne se traite pas autrement qu'un autre disjoncteur.
      maximumGeneralW:
        tableau.calibreGeneralA > 0 ? puissanceTenable(tableau.calibreGeneralA, tauxCharge) : 0,
      prises: tableau.prises.map((prise) => ({
        numero: prise.numero,
        calibreA: prise.calibreA,
        maximumW: puissanceTenable(prise.calibreA, tauxCharge),
        appareils: [],
        chargeW: 0,
        tauxCharge: 0
      })),
      chargeW: 0,
      tauxChargeGeneral: 0
    }
  })

  const plusGrossePriseW = Math.max(
    ...charges.flatMap((tableau) => tableau.prises.map((prise) => prise.maximumW))
  )

  const aPlacer = [...appareils].sort((a, b) => b.puissanceW - a.puissanceW)
  /** @type {RefusTableaux[]} */
  const refuses = []

  for (const appareil of aPlacer) {
    // Distinguer les deux motifs avant de chercher : « aucune prise assez
    // grosse » et « plus de place » demandent des gestes différents.
    if (appareil.puissanceW > plusGrossePriseW) {
      refuses.push({ appareil, raison: 'trop_gourmand' })
      continue
    }

    let place = false
    for (const tableau of charges) {
      // Le général d'abord : inutile de chercher une prise sur un tableau qui
      // ne peut de toute façon plus rien porter.
      if (
        tableau.maximumGeneralW > 0 &&
        tableau.chargeW + appareil.puissanceW > tableau.maximumGeneralW
      ) {
        continue
      }
      const prise = tableau.prises.find(
        (p) => p.chargeW + appareil.puissanceW <= p.maximumW
      )
      if (!prise) continue

      prise.appareils.push(appareil)
      prise.chargeW += appareil.puissanceW
      prise.tauxCharge = prise.maximumW > 0 ? prise.chargeW / prise.maximumW : 0
      tableau.chargeW += appareil.puissanceW
      tableau.tauxChargeGeneral =
        tableau.maximumGeneralW > 0 ? tableau.chargeW / tableau.maximumGeneralW : 0
      place = true
      break
    }

    if (!place) refuses.push({ appareil, raison: 'plus_de_place' })
  }

  const puissanceTotaleW = appareils.reduce((total, a) => total + a.puissanceW, 0)
  const puissancePlaceeW = charges.reduce((total, tableau) => total + tableau.chargeW, 0)

  return { tableaux: charges, puissanceTotaleW, puissancePlaceeW, refuses }
}
