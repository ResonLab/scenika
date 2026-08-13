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
 *
 * **Écrit en JavaScript, avec les types en commentaires JSDoc.** Il doit tourner
 * à trois endroits : la page web gratuite (dans un navigateur), les tests (dans
 * Node) et plus tard l'application (Electron). En TypeScript, il faudrait le
 * compiler pour l'envoyer au navigateur — et une formule qui a besoin d'un
 * outil pour arriver quelque part est une formule qui finira dupliquée le jour
 * où l'outil gêne. Ici, les trois chargent le **même fichier**.
 *
 * Vocabulaire : un **univers** DMX porte 512 **canaux**. Un appareil occupe
 * autant de canaux consécutifs que son **mode** en demande, à partir de son
 * **adresse**.
 */

/** Un univers DMX contient 512 canaux. Ni plus, ni moins. */
export const CANAUX_PAR_UNIVERS = 512

/**
 * @typedef {object} Appareil
 * @property {string} nom Identifiant libre, affiché tel quel dans les messages.
 * @property {number} canaux Nombre de canaux occupés. Il dépend du **mode**
 *   choisi, pas seulement du modèle : un même projecteur existe en 8, 16 ou 32
 *   canaux. C'est pour cela qu'on le stocke par appareil et non par modèle.
 * @property {number} adresse Premier canal occupé, de 1 à 512.
 * @property {number} univers Univers, à partir de 1.
 */

/**
 * Plage de canaux réellement occupée par un appareil.
 * @typedef {object} Plage
 * @property {number} premier
 * @property {number} dernier
 */

/**
 * @typedef {object} Probleme
 * @property {'erreur' | 'avertissement'} gravite
 * @property {string} message En français, destiné au technicien.
 * @property {'canauxInvalides'|'adresseInvalide'|'universInvalide'|'depassement'|'chevauchement'} code
 *   Ce qui ne va pas, indépendamment de la langue.
 * @property {Record<string, string|number>} donnees Les valeurs citées par le message.
 * @property {string[]} appareils Noms concernés, pour les surligner à l'écran.
 *
 * Pourquoi un `code` **et** un `message` : le message français vit ici, à un
 * seul endroit, et sert de repli partout. Le code et ses données permettent à
 * une interface traduite de reformuler le même problème dans sa langue, sans
 * recopier la règle ni analyser une chaîne de caractères — une traduction qui
 * découpe un message finit toujours par se tromper.
 */

/**
 * Les canaux occupés par un appareil.
 *
 * Un appareil en mode 16 canaux adressé en 001 occupe 001 à **016**, pas 017 :
 * l'adresse est le premier canal, pas le canal précédent. Cette erreur d'un
 * rang est la source classique des chevauchements.
 */
/**
 * @param {Appareil} appareil
 * @returns {Plage}
 */
export function plageOccupee(appareil) {
  return { premier: appareil.adresse, dernier: appareil.adresse + appareil.canaux - 1 }
}

/** Deux plages se recouvrent-elles ? */
function seChevauchent(/** @type {Plage} */ a, /** @type {Plage} */ b) {
  return a.premier <= b.dernier && b.premier <= a.dernier
}

/**
 * Contrôle un patch complet.
 *
 * Renvoie **tous** les problèmes trouvés, pas seulement le premier : un
 * technicien qui corrige son patch veut la liste, pas un aller-retour par
 * erreur. L'ordre est celui de la lecture, appareil par appareil.
 */
/**
 * @param {Appareil[]} appareils
 * @returns {Probleme[]}
 */
export function verifierPatch(appareils) {
  /** @type {Probleme[]} */
  const problemes = []

  for (const appareil of appareils) {
    if (!Number.isInteger(appareil.canaux) || appareil.canaux < 1) {
      problemes.push({
        gravite: 'erreur',
        message: `« ${appareil.nom} » : le nombre de canaux doit être un entier d'au moins 1.`,
        code: 'canauxInvalides',
        donnees: { nom: appareil.nom },
        appareils: [appareil.nom]
      })
      continue
    }

    if (!Number.isInteger(appareil.adresse) || appareil.adresse < 1) {
      problemes.push({
        gravite: 'erreur',
        message: `« ${appareil.nom} » : l'adresse doit être un entier d'au moins 1.`,
        code: 'adresseInvalide',
        donnees: { nom: appareil.nom },
        appareils: [appareil.nom]
      })
      continue
    }

    if (!Number.isInteger(appareil.univers) || appareil.univers < 1) {
      problemes.push({
        gravite: 'erreur',
        message: `« ${appareil.nom} » : l'univers doit être un entier d'au moins 1.`,
        code: 'universInvalide',
        donnees: { nom: appareil.nom },
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
        code: 'depassement',
        donnees: {
          nom: appareil.nom,
          adresse: appareil.adresse,
          canaux: appareil.canaux,
          univers: appareil.univers,
          dernier: plage.dernier,
          limite: CANAUX_PAR_UNIVERS,
          derniereAdressePossible: CANAUX_PAR_UNIVERS - appareil.canaux + 1
        },
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
        code: 'chevauchement',
        donnees: {
          premier: premier.nom,
          premierDebut: plagePremier.premier,
          premierFin: plagePremier.dernier,
          second: second.nom,
          secondDebut: plageSecond.premier,
          secondFin: plageSecond.dernier,
          univers: premier.univers
        },
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
/**
 * **L'adresse de départ et l'univers imposé.**
 *
 * `premiereAdresse` sert au cas courant qu'on ne peut pas contourner : les
 * premiers canaux d'un univers sont souvent déjà pris par du matériel absent de
 * la liste — un bloc de gradateurs, une machine à fumée câblée en dur, un
 * pupitre. Sans elle, il fallait inventer un faux appareil pour réserver la
 * place, et ce faux appareil se retrouvait sur la feuille de patch.
 *
 * Un appareil peut porter un `univers` : il y est alors **placé de force** et ne
 * participe pas au débordement automatique. C'est ce qui permet de dire « les
 * lyres sur l'univers 2, quoi qu'il arrive » — une décision de câblage, que le
 * calcul n'a pas à défaire.
 *
 * Chaque univers garde son propre curseur. Sans cela, épingler un appareil sur
 * l'univers 2 puis revenir au 1 réécrirait par-dessus ce qu'on venait d'y poser.
 */
/**
 * @param {{ nom: string, canaux: number, univers?: number }[]} appareils
 * @param {number} [premierUnivers]
 * @param {number} [premiereAdresse]
 * @returns {Appareil[]}
 */
export function proposerPatch(appareils, premierUnivers = 1, premiereAdresse = 1) {
  if (!Number.isInteger(premiereAdresse) || premiereAdresse < 1) {
    throw new Error(`L'adresse de départ doit être un entier d'au moins 1.`)
  }
  if (premiereAdresse > CANAUX_PAR_UNIVERS) {
    throw new Error(
      `L'adresse de départ ${premiereAdresse} dépasse l'univers : il n'y a que ` +
        `${CANAUX_PAR_UNIVERS} canaux.`
    )
  }

  /** @type {Appareil[]} */
  const proposition = []
  /** La prochaine adresse libre, univers par univers. @type {Map<number, number>} */
  const curseurs = new Map()
  const curseur = (univers) =>
    curseurs.get(univers) ?? (univers === premierUnivers ? premiereAdresse : 1)

  let universCourant = premierUnivers

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

    const impose = Number.isInteger(appareil.univers) && Number(appareil.univers) >= 1
    let univers = impose ? Number(appareil.univers) : universCourant
    let prochaine = curseur(univers)

    if (prochaine + appareil.canaux - 1 > CANAUX_PAR_UNIVERS) {
      if (impose) {
        // Un univers imposé et plein : on le dit, on ne déplace pas l'appareil
        // ailleurs en silence. Le technicien a demandé cet univers-là, et le
        // déplacer sans rien dire donnerait un patch juste sur le papier et faux
        // au bout du câble.
        throw new Error(
          `« ${appareil.nom} » ne tient plus dans l'univers ${univers} : il n'y reste pas ` +
            `${appareil.canaux} canaux d'affilée à partir de ${prochaine}.`
        )
      }
      universCourant += 1
      univers = universCourant
      prochaine = curseur(univers)
    }

    proposition.push({
      nom: appareil.nom,
      canaux: appareil.canaux,
      adresse: prochaine,
      univers
    })
    curseurs.set(univers, prochaine + appareil.canaux)
  }

  return proposition
}

/**
 * L'écart entre les adresses successives d'un patch, univers par univers.
 *
 * **C'est ce qu'on tape dans une console.** La plupart proposent un patch en
 * série : « N appareils, première adresse A, pas P ». Si l'écart est constant,
 * la saisie tient en une ligne ; s'il ne l'est pas, il faut adresser appareil
 * par appareil — et mieux vaut le savoir avant d'être en haut de l'échelle.
 *
 * **L'écart n'est pas toujours le nombre de canaux.** Deux appareils collés ont
 * un écart égal à leur mode, mais un trou laissé en fin d'univers, une adresse
 * de départ décalée ou des modes différents le rompent. C'est précisément ce
 * qu'on ne peut pas deviner en lisant la liste.
 */
/**
 * @typedef {object} EcartUnivers
 * @property {number} univers
 * @property {number[]} adresses Les adresses, dans l'ordre croissant.
 * @property {number[]} ecarts Les écarts successifs ; il y en a un de moins.
 * @property {number | null} pas L'écart s'il est constant, sinon `null`.
 */

/**
 * @param {Appareil[]} appareils
 * @returns {EcartUnivers[]}
 */
export function ecartsAdresses(appareils) {
  /** @type {Map<number, number[]>} */
  const parUnivers = new Map()
  for (const appareil of appareils) {
    if (!(appareil.canaux >= 1) || !(appareil.adresse >= 1)) continue
    const liste = parUnivers.get(appareil.univers) ?? []
    liste.push(appareil.adresse)
    parUnivers.set(appareil.univers, liste)
  }

  /** @type {EcartUnivers[]} */
  const resultat = []
  for (const [univers, brutes] of [...parUnivers].sort((a, b) => a[0] - b[0])) {
    const adresses = [...brutes].sort((a, b) => a - b)
    const ecarts = adresses.slice(1).map((adresse, index) => adresse - adresses[index])
    // Un seul appareil n'a pas d'écart, et n'en a pas besoin : `pas` reste nul
    // plutôt que d'annoncer un pas inventé à partir de rien.
    const pas = ecarts.length > 0 && ecarts.every((e) => e === ecarts[0]) ? ecarts[0] : null
    resultat.push({ univers, adresses, ecarts, pas })
  }

  return resultat
}

/**
 * Ce qu'il reste de libre dans un univers, en plages continues.
 * Sert à répondre à « où puis-je encore mettre un appareil de 16 canaux ? ».
 */
/**
 * @param {Appareil[]} appareils
 * @param {number} univers
 * @returns {Plage[]}
 */
export function plagesLibres(appareils, univers) {
  const occupees = appareils
    .filter((a) => a.univers === univers && a.canaux >= 1 && a.adresse >= 1)
    .map(plageOccupee)
    .sort((a, b) => a.premier - b.premier)

  /** @type {Plage[]} */
  const libres = []
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

/**
 * L'état de chacun des 512 canaux d'un univers.
 *
 * C'est ce qui permet de **voir** un univers d'un coup d'œil au lieu de le
 * lire ligne à ligne : les trous, les blocs occupés, et surtout les
 * chevauchements, qui sont l'erreur classique du patch.
 *
 * **Le calcul vit ici, avec `verifierPatch` et `plagesLibres`**, parce que la
 * page web gratuite doit pouvoir l'afficher aussi. Recompté dans l'interface,
 * il finirait par contredire la liste des problèmes affichée juste à côté —
 * et on ne saurait plus laquelle croire.
 *
 * Trois états seulement, et le troisième est celui qui compte :
 * `libre` · `occupe` · `chevauchement`.
 *
 * Un appareil qui déborde la fin de l'univers n'est compté que sur les canaux
 * qui existent. Le dépassement lui-même est déjà signalé par `verifierPatch` :
 * l'inventer une seconde fois ici donnerait deux messages pour une faute.
 */
/**
 * @typedef {object} CanalOccupe
 * @property {number} canal Numéro du canal, de 1 à 512.
 * @property {'libre' | 'occupe' | 'chevauchement'} etat
 * @property {string[]} appareils Les noms qui occupent ce canal.
 */

/**
 * @param {Appareil[]} appareils
 * @param {number} univers
 * @returns {CanalOccupe[]}
 */
export function occupationUnivers(appareils, univers) {
  /** @type {CanalOccupe[]} */
  const canaux = Array.from({ length: CANAUX_PAR_UNIVERS }, (rien, index) => ({
    canal: index + 1,
    etat: 'libre',
    appareils: []
  }))

  for (const appareil of appareils) {
    if (appareil.univers !== univers) continue
    if (!(appareil.canaux >= 1) || !(appareil.adresse >= 1)) continue

    const plage = plageOccupee(appareil)
    const dernier = Math.min(plage.dernier, CANAUX_PAR_UNIVERS)

    for (let canal = plage.premier; canal <= dernier; canal += 1) {
      const case_ = canaux[canal - 1]
      case_.appareils.push(appareil.nom)
      // Deux appareils sur le même canal : c'est un chevauchement, et il ne
      // redevient jamais un simple « occupé ».
      case_.etat = case_.appareils.length > 1 ? 'chevauchement' : 'occupe'
    }
  }

  return canaux
}
