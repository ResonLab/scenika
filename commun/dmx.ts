/**
 * Le calcul DMX — **le seul endroit où il vit**.
 *
 * Il est décidé (voir `../CONTEXTE.md` et `../../LISEZ-MOI.md`) qu'il existera
 * deux calculateurs : une page web gratuite qui calcule sans rien retenir, et
 * un module complet dans l'application, relié au parc matériel réel. **Les deux
 * appellent ce fichier.** C'est exactement le genre de code qui diverge si on
 * le duplique, et un patch faux fait perdre une soirée à un technicien.
 *
 * Ce fichier ne dépend de rien : ni interface, ni base de données, ni Electron.
 * Node 24 l'exécute tel quel, sans compilation — d'où des tests sans outillage.
 *
 * Vocabulaire : un **univers** DMX porte 512 **canaux**. Un appareil occupe
 * autant de canaux consécutifs que son **mode** en demande, à partir de son
 * **adresse**.
 */

/** Un univers DMX contient 512 canaux. Ni plus, ni moins. */
export const CANAUX_PAR_UNIVERS = 512

export interface Appareil {
  /** Identifiant libre, affiché tel quel dans les messages. */
  nom: string
  /**
   * Nombre de canaux occupés. Il dépend du **mode** choisi, pas seulement du
   * modèle : un même projecteur existe en 8, 16 ou 32 canaux. C'est pour cela
   * qu'on le stocke par appareil et non par modèle.
   */
  canaux: number
  /** Premier canal occupé, de 1 à 512. */
  adresse: number
  /** Univers, à partir de 1. Un seul univers si l'installation est petite. */
  univers: number
}

/** Plage de canaux réellement occupée par un appareil. */
export interface Plage {
  premier: number
  dernier: number
}

export type GraviteProbleme = 'erreur' | 'avertissement'

export interface Probleme {
  gravite: GraviteProbleme
  /** Message en français, destiné au technicien, pas au développeur. */
  message: string
  /** Noms des appareils concernés, pour les surligner à l'écran. */
  appareils: string[]
}

/**
 * Les canaux occupés par un appareil.
 *
 * Un appareil en mode 16 canaux adressé en 001 occupe 001 à **016**, pas 017 :
 * l'adresse est le premier canal, pas le canal précédent. Cette erreur d'un
 * rang est la source classique des chevauchements.
 */
export function plageOccupee(appareil: Appareil): Plage {
  return { premier: appareil.adresse, dernier: appareil.adresse + appareil.canaux - 1 }
}

/** Deux plages se recouvrent-elles ? */
function seChevauchent(a: Plage, b: Plage): boolean {
  return a.premier <= b.dernier && b.premier <= a.dernier
}

/**
 * Contrôle un patch complet.
 *
 * Renvoie **tous** les problèmes trouvés, pas seulement le premier : un
 * technicien qui corrige son patch veut la liste, pas un aller-retour par
 * erreur. L'ordre est celui de la lecture, appareil par appareil.
 */
export function verifierPatch(appareils: Appareil[]): Probleme[] {
  const problemes: Probleme[] = []

  for (const appareil of appareils) {
    if (!Number.isInteger(appareil.canaux) || appareil.canaux < 1) {
      problemes.push({
        gravite: 'erreur',
        message: `« ${appareil.nom} » : le nombre de canaux doit être un entier d'au moins 1.`,
        appareils: [appareil.nom]
      })
      continue
    }

    if (!Number.isInteger(appareil.adresse) || appareil.adresse < 1) {
      problemes.push({
        gravite: 'erreur',
        message: `« ${appareil.nom} » : l'adresse doit être un entier d'au moins 1.`,
        appareils: [appareil.nom]
      })
      continue
    }

    if (!Number.isInteger(appareil.univers) || appareil.univers < 1) {
      problemes.push({
        gravite: 'erreur',
        message: `« ${appareil.nom} » : l'univers doit être un entier d'au moins 1.`,
        appareils: [appareil.nom]
      })
      continue
    }

    // Un appareil qui déborde de l'univers ne fonctionnera pas sur ses derniers
    // canaux — et souvent, seuls les derniers effets manquent : le défaut est
    // difficile à comprendre sur place si personne ne l'a signalé ici.
    const plage = plageOccupee(appareil)
    if (plage.dernier > CANAUX_PAR_UNIVERS) {
      problemes.push({
        gravite: 'erreur',
        message:
          `« ${appareil.nom} » adressé en ${appareil.adresse} sur ${appareil.canaux} canaux ` +
          `dépasse la fin de l'univers ${appareil.univers} (${plage.dernier} > ${CANAUX_PAR_UNIVERS}). ` +
          `La dernière adresse possible pour cet appareil est ${CANAUX_PAR_UNIVERS - appareil.canaux + 1}.`,
        appareils: [appareil.nom]
      })
    }
  }

  // Chevauchements : comparés deux à deux, dans le même univers seulement.
  for (let i = 0; i < appareils.length; i += 1) {
    for (let j = i + 1; j < appareils.length; j += 1) {
      const premier = appareils[i]
      const second = appareils[j]
      if (premier.univers !== second.univers) continue
      if (premier.canaux < 1 || second.canaux < 1) continue

      const plagePremier = plageOccupee(premier)
      const plageSecond = plageOccupee(second)
      if (!seChevauchent(plagePremier, plageSecond)) continue

      problemes.push({
        gravite: 'erreur',
        message:
          `« ${premier.nom} » (${plagePremier.premier}–${plagePremier.dernier}) et ` +
          `« ${second.nom} » (${plageSecond.premier}–${plageSecond.dernier}) se chevauchent ` +
          `dans l'univers ${premier.univers}. Les deux appareils réagiront ensemble.`,
        appareils: [premier.nom, second.nom]
      })
    }
  }

  return problemes
}

/**
 * Propose un patch : chaque appareil reçoit la première adresse libre, dans
 * l'ordre donné, en passant à l'univers suivant quand il n'y a plus la place.
 *
 * On ne comble pas les trous laissés par un appareil trop grand : le patch
 * proposé reste lisible dans l'ordre de la liste, ce qui compte plus qu'un
 * remplissage optimal quand on cherche un appareil sur scène à minuit.
 */
export function proposerPatch(
  appareils: Pick<Appareil, 'nom' | 'canaux'>[],
  premierUnivers = 1
): Appareil[] {
  const proposition: Appareil[] = []
  let univers = premierUnivers
  let prochaine = 1

  for (const appareil of appareils) {
    if (!Number.isInteger(appareil.canaux) || appareil.canaux < 1) {
      throw new Error(`« ${appareil.nom} » : le nombre de canaux doit être un entier d'au moins 1.`)
    }
    if (appareil.canaux > CANAUX_PAR_UNIVERS) {
      throw new Error(
        `« ${appareil.nom} » demande ${appareil.canaux} canaux : c'est plus qu'un univers entier ` +
          `(${CANAUX_PAR_UNIVERS}). Vérifiez le mode choisi.`
      )
    }

    if (prochaine + appareil.canaux - 1 > CANAUX_PAR_UNIVERS) {
      univers += 1
      prochaine = 1
    }

    proposition.push({
      nom: appareil.nom,
      canaux: appareil.canaux,
      adresse: prochaine,
      univers
    })
    prochaine += appareil.canaux
  }

  return proposition
}

/**
 * Ce qu'il reste de libre dans un univers, en plages continues.
 * Sert à répondre à « où puis-je encore mettre un appareil de 16 canaux ? ».
 */
export function plagesLibres(appareils: Appareil[], univers: number): Plage[] {
  const occupees = appareils
    .filter((a) => a.univers === univers && a.canaux >= 1 && a.adresse >= 1)
    .map(plageOccupee)
    .sort((a, b) => a.premier - b.premier)

  const libres: Plage[] = []
  let curseur = 1

  for (const plage of occupees) {
    if (plage.premier > curseur) libres.push({ premier: curseur, dernier: plage.premier - 1 })
    curseur = Math.max(curseur, plage.dernier + 1)
  }
  if (curseur <= CANAUX_PAR_UNIVERS) {
    libres.push({ premier: curseur, dernier: CANAUX_PAR_UNIVERS })
  }

  return libres
}
