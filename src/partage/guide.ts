/**
 * Le guide de prise en main — **comment on s'en sert**.
 *
 * Le site dit ce que fait Scenika et ce qu'elle ne fait pas. Il ne dit nulle
 * part par où l'on commence. Quelqu'un qui télécharge se retrouve devant une
 * application vide sans savoir quoi cliquer, et **c'est là qu'on perd les
 * gens**, pas à la page d'accueil.
 *
 * Le texte vit ici, dans les deux langues, et **nulle part ailleurs** :
 * `scripts/publier-guide.mjs` en déduit les deux pages, `scripts/guide-pdf.mjs`
 * en tire le PDF joint aux releases.
 *
 * **L'ordre des étapes n'est pas décoratif.** On ne loue pas ce qui n'est pas
 * au parc, on ne répartit pas la puissance d'un matériel sans watts, on
 * n'adresse pas un projecteur sans son nombre de canaux. Le guide suit l'ordre
 * où l'application refuse — le seul qui ne mène pas à un message d'erreur.
 */

export interface EtapeGuide {
  titre: { fr: string; en: string }
  texte: { fr: string; en: string }
  /** Ce qui coince à cette étape, et qu'on ne devine pas. */
  piege?: { fr: string; en: string }
}

export interface SectionGuide {
  titre: { fr: string; en: string }
  intro: { fr: string; en: string }
  etapes: EtapeGuide[]
}

export const GUIDE: SectionGuide[] = [
  {
    titre: { fr: '1. Remplir le parc', en: '1. Fill the inventory' },
    intro: {
      fr: 'On commence toujours par là. Tout le reste s’y rattache : une location sort du matériel du parc, un calcul de puissance additionne ses watts, un patch DMX lit ses nombres de canaux.',
      en: 'Always start here. Everything else hangs off it: a rental takes gear out of the inventory, a power calculation adds up its watts, a DMX patch reads its channel counts.'
    },
    etapes: [
      {
        titre: { fr: 'Saisir le matériel', en: 'Enter the equipment' },
        texte: {
          fr: 'Onglet Parc. Pour chaque référence : sa désignation, sa quantité, son état, son emplacement. Pour ce qui consomme, sa puissance en watts. Pour un projecteur DMX, son nombre de canaux et ses modes.',
          en: 'Inventory tab. For each item: name, quantity, condition, location. For anything that draws power, its wattage. For a DMX fixture, its channel count and its modes.'
        },
        piege: {
          fr: 'Le matériel loué à un confrère n’est pas le matériel possédé. Un parc contient les deux, et les mélanger fausse les inventaires le jour où l’on rend le camion. Distinguez-les dès la saisie.',
          en: 'Gear hired in from a colleague is not gear you own. An inventory holds both, and mixing them falsifies your stock the day you return the truck. Separate them from the start.'
        }
      },
      {
        titre: { fr: 'Les modes d’un projecteur', en: 'A fixture’s modes' },
        texte: {
          fr: 'Le même modèle existe souvent en 8, 16 ou 32 canaux. Saisissez tous les modes disponibles : le patch choisira celui réglé sur l’appareil posé.',
          en: 'The same model often exists in 8, 16 or 32 channels. Enter every available mode: the patch will pick the one actually set on the unit.'
        },
        piege: {
          fr: 'Le nombre de canaux dépend du mode, pas seulement du modèle. Un appareil en 16 canaux adressé en 001 occupe 001 à 016 : le suivant ne peut pas commencer avant 017. Un mode mal renseigné donne un patch faux sans que rien ne le signale.',
          en: 'The channel count depends on the mode, not just on the model. A unit in 16-channel mode addressed at 001 occupies 001 to 016: the next cannot start before 017. A wrongly recorded mode produces a wrong patch with nothing to flag it.'
        }
      }
    ]
  },
  {
    titre: { fr: '2. Sortir et rentrer du matériel', en: '2. Take gear out and bring it back' },
    intro: {
      fr: 'Une location dit qui a quoi, depuis quand, jusqu’à quand. C’est aussi ce qui rend la disponibilité réelle, et non théorique.',
      en: 'A rental says who has what, since when, until when. It is also what makes availability real rather than theoretical.'
    },
    etapes: [
      {
        titre: { fr: 'Créer une location', en: 'Create a rental' },
        texte: {
          fr: 'Onglet Locations. Le client, les dates, les lignes de matériel. Une location commence en « prévue », puis passe en « sortie » au départ du camion, puis en « rentrée » au retour.',
          en: 'Rentals tab. The customer, the dates, the equipment lines. A rental starts as "planned", becomes "out" when the truck leaves, then "back" on return.'
        },
        piege: {
          fr: 'Seules les locations **sorties** retiennent du matériel. Compter les prévues rendrait le parc indisponible dès qu’on esquisse un devis — et on cesserait de saisir les devis, ce qui est exactement l’inverse du but.',
          en: 'Only rentals that are **out** hold gear. Counting planned ones would make the inventory unavailable as soon as you sketch a quote — and you would stop entering quotes, which defeats the purpose.'
        }
      },
      {
        titre: { fr: 'Enregistrer les retours', en: 'Record the returns' },
        texte: {
          fr: 'Au retour, saisissez ce qui rentre, ligne par ligne. Ce qui manque reste visible : l’écran vous dit ce qui n’est pas revenu, et de chez qui.',
          en: 'On return, enter what comes back, line by line. What is missing stays visible: the screen tells you what never came back, and from whom.'
        },
        piege: {
          fr: 'Le parc ne bouge jamais quand du matériel part. Il dit ce qu’on possède ; ce qui est dehors se calcule. Décrémenter les quantités à la sortie serait plus simple et faux — une location oubliée laisserait un stock que rien ne rattrape, et on ne saurait plus si l’écart vient d’un vol, d’une casse ou d’une erreur de saisie.',
          en: 'The inventory never moves when gear leaves. It says what you own; what is out is calculated. Decrementing on the way out would be simpler and wrong — one forgotten rental would leave a stock figure nothing puts right, and you could no longer tell theft from breakage from a typing mistake.'
        }
      }
    ]
  },
  {
    titre: { fr: '3. Préparer la puissance', en: '3. Prepare the power' },
    intro: {
      fr: 'À faire avant le montage, pas pendant. C’est l’écran qui évite de faire sauter un disjoncteur en pleine représentation.',
      en: 'Do this before the rig, not during. This is the screen that keeps a breaker from tripping mid-show.'
    },
    etapes: [
      {
        titre: { fr: 'Déclarer les tableaux', en: 'Declare the boards' },
        texte: {
          fr: 'Onglet Tableaux. Chaque tableau porte un nombre de circuits et leur intensité. Un 16 A en 230 V tient environ 3 600 W en théorie, moins en pratique.',
          en: 'Boards tab. Each board has a number of circuits and their rating. A 16 A circuit at 230 V holds about 3,600 W in theory, less in practice.'
        }
      },
      {
        titre: { fr: 'Laisser Scenika répartir', en: 'Let Scenika allocate' },
        texte: {
          fr: 'Onglet Puissance. Le plus gourmand d’abord, puis dans le premier circuit qui l’accepte. La règle est simple exprès : un technicien doit pouvoir la refaire de tête sur le terrain, parce que c’est à la main qu’il branche.',
          en: 'Power tab. Hungriest first, then into the first circuit that takes it. The rule is simple on purpose: a technician must be able to redo it in their head on site, because it is by hand that they plug in.'
        },
        piege: {
          fr: 'Un appareil plus gourmand qu’un circuit entier est refusé et nommé, jamais casé de force. Et ce calcul n’est pas un contrôle électrique : il ignore la longueur et la section des câbles, l’état du tableau, la simultanéité réelle et les appels de courant à l’allumage — une lampe à décharge peut tirer plusieurs fois sa puissance nominale en amorçant, et c’est souvent là qu’un disjoncteur déclenche.',
          en: 'A unit hungrier than a whole circuit is refused and named, never forced in. And this calculation is not an electrical inspection: it ignores cable length and section, the state of the board, real simultaneity and inrush current — a discharge lamp can draw several times its rated power while striking, and that is often when a breaker trips.'
        }
      }
    ]
  },
  {
    titre: { fr: '4. Adresser le DMX', en: '4. Address the DMX' },
    intro: {
      fr: 'Le patch relié au parc réel : les chevauchements se voient avant le montage, pas pendant.',
      en: 'The patch tied to the real inventory: overlaps show before the rig, not during.'
    },
    etapes: [
      {
        titre: { fr: 'Poser les appareils', en: 'Place the fixtures' },
        texte: {
          fr: 'Onglet Calculateur DMX. Choisissez le matériel, son mode, son adresse. La carte des 512 canaux montre l’univers d’un coup d’œil : ce qui est pris, ce qui reste.',
          en: 'DMX calculator tab. Pick the item, its mode, its address. The 512-channel map shows the universe at a glance: what is taken, what is left.'
        },
        piege: {
          fr: 'Un univers DMX contient 512 canaux, ni 511 ni 513. Au-delà, il faut un second univers — Scenika le dit au lieu de produire un patch impossible, et propose la dernière adresse utilisable.',
          en: 'A DMX universe holds 512 channels, not 511 and not 513. Beyond that you need a second universe — Scenika says so instead of producing an impossible patch, and offers the last usable address.'
        }
      },
      {
        titre: { fr: 'La version gratuite', en: 'The free version' },
        texte: {
          fr: 'Le même calcul existe en page web publique, sans inscription, sur le site de Scenika. La formule vit à un seul endroit : les deux ne peuvent pas diverger.',
          en: 'The same calculation exists as a public web page, no sign-up, on the Scenika site. The formula lives in one place: the two cannot diverge.'
        }
      }
    ]
  },
  {
    titre: { fr: '5. Facturer, et travailler à plusieurs', en: '5. Invoice, and work as a team' },
    intro: {
      fr: 'Deux choses que Scenika ne fait pas seule, et c’est délibéré.',
      en: 'Two things Scenika does not do alone, and that is deliberate.'
    },
    etapes: [
      {
        titre: { fr: 'Exporter vers Ohmnia', en: 'Export to Ohmnia' },
        texte: {
          fr: 'Depuis une location, Scenika prépare des lignes de facture — désignation, quantité, prix, référence d’inventaire — qu’Ohmnia importe.',
          en: 'From a rental, Scenika prepares invoice lines — description, quantity, price, inventory reference — for Ohmnia to import.'
        },
        piege: {
          fr: 'Scenika ne facture pas, et ne facturera pas. Refaire un module de facturation ici voudrait dire tenir deux fois les règles de TVA et de numérotation, dans deux logiciels qui finiraient par ne plus dire la même chose.',
          en: 'Scenika does not invoice, and will not. Building a second invoicing module here would mean maintaining VAT and numbering rules twice, in two programs that would eventually disagree.'
        }
      },
      {
        titre: { fr: 'Le mode multi-postes', en: 'Multi-workstation mode' },
        texte: {
          fr: 'Une société de location a plusieurs personnes qui touchent au même parc. Paramètres → Mode multi-postes : les postes parlent alors à un serveur Nexika que vous installez vous-même, sur votre réseau.',
          en: 'A rental company has several people touching the same inventory. Settings → Multi-workstation mode: the machines then talk to a Nexika server you install yourself, on your network.'
        },
        piege: {
          fr: 'Le mode local reste le défaut. Sans choix explicite de votre part, rien ne change et tout fonctionne hors ligne. Et le serveur refuse d’écouter sur le réseau tant qu’aucun administrateur n’existe et sans chiffrement — sinon le premier venu créerait son compte et prendrait le parc.',
          en: 'Local mode stays the default. Without an explicit choice from you, nothing changes and everything works offline. And the server refuses to listen on the network until an administrator exists and encryption is on — otherwise the first passer-by would create their own account and take the inventory.'
        }
      }
    ]
  }
]

/** Ce qu'on retient, en tête du guide. */
export const RESUME_GUIDE = {
  fr: 'Parc, locations, puissance, DMX, puis la facturation et le travail à plusieurs. Cet ordre-là, et pas un autre : c’est celui dans lequel l’application ne refuse rien.',
  en: 'Inventory, rentals, power, DMX, then invoicing and teamwork. That order and no other: it is the one in which the application refuses nothing.'
}
