/**
 * Conditions d'utilisation de Scenika.
 *
 * **À incrémenter à chaque modification du texte** : l'écran d'acceptation
 * réapparaît alors, et l'utilisateur relit ce qu'il accepte. Sans ce numéro, on
 * changerait les conditions dans le dos de quelqu'un qui les a déjà acceptées.
 *
 * Le texte est ici, dans les deux langues, et **nulle part ailleurs** :
 * `tests/coherence-conditions.mjs` compare la page publique à ce fichier, et
 * `npm run verifier` échoue si l'un des deux bouge sans l'autre. Deux versions
 * d'un même engagement qui divergent, c'est pire que pas d'engagement.
 *
 * Ce que Scenika ajoute aux conditions générales de la maison :
 * <https://resonlab.github.io/conditions.html>
 */

export const VERSION_CONDITIONS = '1.0'

/** La page publique, ouverte par le bouton « Lire sur le site ». */
export const URL_CONDITIONS = 'https://resonlab.github.io/scenika/conditions.html'
export const URL_CONDITIONS_EN = 'https://resonlab.github.io/scenika/en/terms.html'

export interface SectionConditions {
  titre: { fr: string; en: string }
  paragraphes: { fr: string; en: string }[]
}

export const CONDITIONS_UTILISATION: SectionConditions[] = [
  {
    titre: { fr: "1. Ce qu'est Scenika", en: '1. What Scenika is' },
    paragraphes: [
      {
        fr: "Scenika gère le parc matériel son et lumière d'une société de location ou d'un technicien indépendant : ce qui est possédé, ce qui est sorti, la répartition de puissance sur les circuits et l'adressage DMX.",
        en: 'Scenika manages the audio and lighting inventory of a rental company or a freelance technician: what is owned, what is out, how power splits across circuits, and DMX addressing.'
      },
      {
        fr: "Vos données restent sur votre machine. Le mode multi-postes est un choix explicite de votre part : il fait parler vos postes à un serveur que vous installez vous-même, sur votre réseau, et rien n'en sort.",
        en: 'Your data stays on your machine. Multi-workstation mode is an explicit choice of yours: it makes your workstations talk to a server you install yourself, on your network, and nothing leaves it.'
      }
    ]
  },
  {
    titre: {
      fr: "2. Le calcul de puissance n'est pas un contrôle électrique",
      en: '2. The power calculation is not an electrical inspection'
    },
    paragraphes: [
      {
        fr: "C'est le point le plus important de ce document. Scenika additionne les puissances que vous avez saisies et les répartit sur des circuits. Elle ne vérifie rien de votre installation.",
        en: 'This is the most important point in this document. Scenika adds up the wattage you entered and splits it across circuits. It verifies nothing about your installation.'
      },
      {
        fr: "Elle ignore la longueur et la section des câbles, l'état du tableau, la qualité des connexions, la présence d'un différentiel, la température ambiante et la simultanéité réelle des appareils. Elle ignore aussi les appels de courant à l'allumage : une lampe à décharge peut tirer plusieurs fois sa puissance nominale pendant l'amorçage, et c'est souvent là qu'un disjoncteur déclenche.",
        en: 'It knows nothing of cable length or conductor section, the state of the board, the quality of the connections, whether a residual-current device is fitted, the ambient temperature, or how many units are really on at once. It also ignores inrush current: a discharge lamp can draw several times its rated power while striking, and that is often when a breaker trips.'
      },
      {
        fr: "La marge de 20 % appliquée par défaut est une pratique de terrain, pas une norme. Elle ne remplace pas le dimensionnement d'une installation par une personne qualifiée.",
        en: 'The 20% margin applied by default is common practice, not a standard. It does not replace the sizing of an installation by a qualified person.'
      },
      {
        fr: "Une erreur de branchement peut faire sauter un disjoncteur pendant un spectacle, endommager du matériel, provoquer un incendie ou blesser quelqu'un. Le raccordement électrique relève d'un électricien, et la responsabilité de votre installation reste entièrement la vôtre.",
        en: 'A wiring mistake can trip a breaker during a show, damage equipment, start a fire or injure someone. Electrical connection is the work of an electrician, and responsibility for your installation remains entirely yours.'
      }
    ]
  },
  {
    titre: {
      fr: '3. Le patch DMX est une aide à la préparation',
      en: '3. The DMX patch is a preparation aid'
    },
    paragraphes: [
      {
        fr: "Le calculateur détecte les chevauchements d'adresses et les dépassements de fin d'univers à partir des nombres de canaux que vous avez saisis. Un mode mal renseigné donne un patch faux sans que rien ne le signale.",
        en: 'The calculator catches address overlaps and universe overruns from the channel counts you entered. A wrongly recorded mode produces a wrong patch with nothing to flag it.'
      },
      {
        fr: "Vérifiez le patch sur le matériel avant la représentation. Un appareil qui répond à la mauvaise adresse se voit tout de suite en salle, et jamais dans un tableau.",
        en: 'Check the patch on the actual equipment before the show. A unit answering the wrong address is obvious in the room, and never in a table.'
      }
    ]
  },
  {
    titre: { fr: '4. Vos données et vos sauvegardes', en: '4. Your data and your backups' },
    paragraphes: [
      {
        fr: "Scenika n'effectue pas de sauvegarde automatique. Votre parc et vos locations vivent dans un fichier de base de données sur votre machine, ou sur celle qui héberge le serveur multi-postes.",
        en: 'Scenika performs no automatic backup. Your inventory and rentals live in a database file on your machine, or on the one hosting the multi-workstation server.'
      },
      {
        fr: "Une panne de disque, un vol ou une erreur de manipulation peuvent le détruire. Copiez-le régulièrement ailleurs, et vérifiez de temps en temps que la copie s'ouvre.",
        en: 'A disk failure, a theft or a slip of the hand can destroy it. Copy it elsewhere regularly, and check now and then that the copy opens.'
      }
    ]
  },
  {
    titre: { fr: '5. Absence de garantie', en: '5. No warranty' },
    paragraphes: [
      {
        fr: "Scenika est fournie telle quelle, sans garantie de fonctionnement ininterrompu ni d'absence d'erreur. Un logiciel peut contenir des défauts, y compris dans des calculs.",
        en: 'Scenika is provided as is, with no warranty of uninterrupted operation or freedom from error. Software can contain defects, including in calculations.'
      },
      {
        fr: "Ne vous reposez pas aveuglément sur un total affiché, ni sur une répartition de circuits, ni sur un patch.",
        en: 'Do not rely blindly on a displayed total, on a circuit split, or on a patch.'
      }
    ]
  },
  {
    titre: { fr: '6. Limitation de responsabilité', en: '6. Limitation of liability' },
    paragraphes: [
      {
        fr: "Dans les limites permises par la loi, l'éditeur ne répond pas des dommages découlant de l'utilisation de Scenika : perte de données, interruption d'un spectacle, matériel endommagé, dommage matériel ou corporel.",
        en: 'To the extent permitted by law, the publisher is not liable for damages arising from the use of Scenika: loss of data, interruption of a show, damaged equipment, or damage to property or persons.'
      },
      {
        fr: "Cette limitation ne s'applique pas en cas de faute grave ou intentionnelle, ni dans les situations où la loi impose une responsabilité qui ne peut être écartée. Selon votre pays, certaines de ces exclusions peuvent être sans effet à votre égard.",
        en: 'This limitation does not apply in cases of gross negligence or intent, nor where the law imposes liability that cannot be excluded. Depending on your country, some of these exclusions may have no effect on you.'
      }
    ]
  },
  {
    titre: { fr: '7. Acceptation', en: '7. Acceptance' },
    paragraphes: [
      {
        fr: "En utilisant Scenika, vous reconnaissez avoir lu ces conditions et accepté que la sécurité de votre installation électrique relève de votre seule responsabilité.",
        en: 'By using Scenika you acknowledge that you have read these terms and accepted that the safety of your electrical installation is your responsibility alone.'
      },
      {
        fr: "Si vous n'acceptez pas ces conditions, n'utilisez pas l'application.",
        en: 'If you do not accept these terms, do not use the application.'
      }
    ]
  }
]

/** Ce qu'on retient, affiché en pied de l'écran d'acceptation. */
export const RESUME_CONDITIONS = {
  fr: "En résumé : vos données restent chez vous, et le calcul de puissance est une aide à la préparation — jamais un contrôle électrique. Le raccordement relève d'un électricien.",
  en: 'In short: your data stays with you, and the power calculation is a preparation aid — never an electrical inspection. Wiring is the work of an electrician.'
}
