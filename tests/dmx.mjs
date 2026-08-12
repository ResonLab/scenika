// Le calcul DMX, éprouvé sur les cas qui font perdre une soirée.
//
// Aucun outillage : le module est du JavaScript avec les types en JSDoc, donc
// le navigateur, Node et l'application chargent le même fichier. Un test qu'on
// peut lancer sans `npm install` reste lançable dans six mois.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import {
  CANAUX_PAR_UNIVERS,
  occupationUnivers,
  plageOccupee,
  plagesLibres,
  proposerPatch,
  verifierPatch
} from '../commun/dmx.js'

let echecs = 0
function verifier(intitule, condition, detail = '') {
  if (!condition) echecs += 1
  console.log(`  ${condition ? 'OK  ' : 'ECHEC'} ${intitule}`)
  if (!condition && detail) console.log(`        ${detail}`)
}

const appareil = (nom, adresse, canaux, univers = 1) => ({ nom, adresse, canaux, univers })

console.log('\n=== Canaux occupés ===')

// L'erreur d'un rang : un 16 canaux en 001 finit en 016, pas 017.
const plage = plageOccupee(appareil('Lyre', 1, 16))
verifier(
  'un appareil 16 canaux adressé en 001 occupe 001 à 016',
  plage.premier === 1 && plage.dernier === 16,
  `${plage.premier}–${plage.dernier}`
)

const plageUn = plageOccupee(appareil('Par', 7, 1))
verifier(
  'un appareil à 1 canal occupe une seule adresse',
  plageUn.premier === 7 && plageUn.dernier === 7
)

console.log('\n=== Chevauchements ===')

// Le cas classique : on adresse le suivant à 016 au lieu de 017.
const chevauchement = verifierPatch([appareil('Lyre 1', 1, 16), appareil('Lyre 2', 16, 16)])
verifier(
  'deux appareils qui se recouvrent d’un seul canal sont détectés',
  chevauchement.length === 1 && chevauchement[0].gravite === 'erreur',
  JSON.stringify(chevauchement)
)
verifier(
  'le message nomme les deux appareils concernés',
  chevauchement[0]?.appareils.join(',') === 'Lyre 1,Lyre 2'
)

const bonPatch = verifierPatch([appareil('Lyre 1', 1, 16), appareil('Lyre 2', 17, 16)])
verifier('adressé en 017, le suivant ne chevauche plus', bonPatch.length === 0, JSON.stringify(bonPatch))

// Deux appareils identiques dans des univers différents ne se gênent pas.
const deuxUnivers = verifierPatch([appareil('Lyre 1', 1, 16, 1), appareil('Lyre 2', 1, 16, 2)])
verifier('la même adresse dans deux univers ne pose pas de problème', deuxUnivers.length === 0)

// Un appareil entièrement contenu dans un autre doit aussi être vu.
const inclusion = verifierPatch([appareil('Grande', 10, 32), appareil('Petite', 20, 4)])
verifier('un appareil contenu dans un autre est détecté', inclusion.length === 1)

console.log('\n=== Fin d’univers ===')

const debordement = verifierPatch([appareil('Lyre', 500, 16)])
verifier(
  'un appareil qui dépasse 512 est refusé',
  debordement.length === 1 && debordement[0].message.includes('512'),
  JSON.stringify(debordement)
)
verifier(
  'le message donne la dernière adresse possible',
  debordement[0]?.message.includes('497'),
  debordement[0]?.message
)

const pileALaFin = verifierPatch([appareil('Lyre', 497, 16)])
verifier('adressé en 497, un 16 canaux tient pile dans l’univers', pileALaFin.length === 0)

console.log('\n=== Valeurs aberrantes ===')

verifier('une adresse à zéro est refusée', verifierPatch([appareil('X', 0, 4)]).length === 1)
verifier('un nombre de canaux nul est refusé', verifierPatch([appareil('X', 1, 0)]).length === 1)
verifier('une adresse décimale est refusée', verifierPatch([appareil('X', 1.5, 4)]).length === 1)
verifier('un univers à zéro est refusé', verifierPatch([appareil('X', 1, 4, 0)]).length === 1)

console.log('\n=== Patch proposé ===')

const propose = proposerPatch([
  { nom: 'Lyre 1', canaux: 16 },
  { nom: 'Lyre 2', canaux: 16 },
  { nom: 'Par', canaux: 4 }
])
verifier(
  'les appareils se suivent sans trou ni chevauchement',
  propose[0].adresse === 1 && propose[1].adresse === 17 && propose[2].adresse === 33,
  propose.map((a) => `${a.nom}:${a.adresse}`).join(' ')
)
verifier('un patch proposé ne contient aucun problème', verifierPatch(propose).length === 0)

// Le passage à l'univers suivant : 32 appareils de 16 canaux remplissent
// exactement 512 canaux, le 33e doit basculer.
const beaucoup = Array.from({ length: 33 }, (_, i) => ({ nom: `Lyre ${i + 1}`, canaux: 16 }))
const patchLong = proposerPatch(beaucoup)
verifier(
  'le 32e appareil finit exactement sur le canal 512',
  patchLong[31].univers === 1 && plageOccupee(patchLong[31]).dernier === CANAUX_PAR_UNIVERS,
  JSON.stringify(patchLong[31])
)
verifier(
  'le 33e appareil passe à l’univers 2, adresse 1',
  patchLong[32].univers === 2 && patchLong[32].adresse === 1,
  JSON.stringify(patchLong[32])
)
verifier('un patch de 33 appareils reste sans problème', verifierPatch(patchLong).length === 0)

// Un appareil qui ne tient pas dans un univers entier : le dire, plutôt que de
// produire un patch impossible.
let refus = null
try {
  proposerPatch([{ nom: 'Impossible', canaux: 600 }])
} catch (erreur) {
  refus = erreur.message
}
verifier(
  'un appareil plus grand qu’un univers est refusé, en français',
  refus !== null && refus.includes('univers entier'),
  refus ?? 'aucune erreur'
)

console.log('\n=== Places libres ===')

const libres = plagesLibres([appareil('Lyre 1', 1, 16), appareil('Lyre 2', 33, 16)], 1)
verifier(
  'le trou entre deux appareils est signalé',
  libres[0].premier === 17 && libres[0].dernier === 32,
  JSON.stringify(libres)
)
verifier(
  'la fin de l’univers est signalée libre',
  libres[libres.length - 1].premier === 49 && libres[libres.length - 1].dernier === 512
)
verifier(
  'un univers vide est libre en entier',
  plagesLibres([], 1).length === 1 && plagesLibres([], 1)[0].dernier === 512
)

console.log('\n=== La page publique ne recopie pas la formule ===')

// Il est décidé qu'il existe deux calculateurs — la page gratuite et le module
// de l'application — et **une seule formule**. Une page qui referait le calcul
// « juste pour être autonome » divergerait au premier correctif, et personne ne
// s'en apercevrait avant qu'un patch faux gâche une soirée.
const PROJET = join(dirname(fileURLToPath(import.meta.url)), '..')
const page = readFileSync(join(PROJET, 'docs/calculateur-dmx.html'), 'utf-8')

// L'import vise `./commun/dmx.js` et non `../commun/dmx.js` : GitHub Pages ne
// sert que `docs/`, et remonter au-dessus de la racine servie tuerait le
// calculateur en ligne sans rien casser en local. `npm run site:preparer` y
// dépose une copie, jamais commitée — la formule reste à un seul endroit.
verifier('la page charge le module partagé', page.includes("from './commun/dmx.js'"))

// La page anglaise doit obéir aux mêmes règles : elle vit un cran plus bas,
// donc son import remonte d'un niveau. Sans ce contrôle, elle pourrait
// recopier la formule pour « être autonome » sans que rien ne le signale.
const pageEn = readFileSync(join(PROJET, 'docs/en/calculateur-dmx.html'), 'utf-8')
verifier(
  'la page anglaise charge le même module partagé',
  pageEn.includes("from '../commun/dmx.js'")
)
verifier(
  'la page anglaise ne redéfinit aucune fonction du module',
  !['function proposerPatch', 'function verifierPatch', 'function plageOccupee'].some((nom) =>
    pageEn.includes(nom)
  )
)
// Elle traduit les problèmes en repartant du `code`, jamais en découpant la
// phrase française : une traduction qui analyse un message se trompe au premier
// changement de formulation.
verifier(
  'la page anglaise traduit les problèmes par leur code',
  pageEn.includes('probleme.code') && !pageEn.includes("probleme.message.replace")
)

const recopies = ['function proposerPatch', 'function verifierPatch', 'function plageOccupee'].filter(
  (nom) => page.includes(nom)
)
verifier('la page ne redéfinit aucune fonction du module', recopies.length === 0, recopies.join(', '))

verifier('la page ne réécrit pas la limite de 512 canaux', !/=\s*512/.test(page))

/* ── La carte d occupation des 512 canaux ─────────────────────────────────
   Elle sert a voir un univers d un coup d oeil. Elle doit donc dire la meme
   chose que verifierPatch : deux affichages du meme patch qui se contredisent,
   c est pire qu un seul. */

const deuxAppareils = [
  { nom: 'A', canaux: 8, adresse: 1, univers: 1 },
  { nom: 'B', canaux: 8, adresse: 5, univers: 1 }
]
const carte = occupationUnivers(deuxAppareils, 1)

verifier('la carte compte exactement 512 canaux', carte.length === CANAUX_PAR_UNIVERS)
verifier('le premier canal porte le numero 1', carte[0].canal === 1)
verifier('le dernier canal porte le numero 512', carte[511].canal === 512)

verifier('un canal pris par un seul appareil est « occupe »', carte[0].etat === 'occupe')
verifier('et il nomme cet appareil', carte[0].appareils.join() === 'A')

// A occupe 1 a 8, B occupe 5 a 12 : le recouvrement va de 5 a 8.
verifier('un canal pris par deux appareils est « chevauchement »', carte[4].etat === 'chevauchement')
verifier('et il nomme les deux', carte[4].appareils.join() === 'A,B', carte[4].appareils.join())
verifier('le canal 8 chevauche encore', carte[7].etat === 'chevauchement')
verifier('le canal 9 n appartient plus qu a B', carte[8].etat === 'occupe')
verifier('le canal 13 est libre', carte[12].etat === 'libre')
verifier('un canal libre ne nomme personne', carte[12].appareils.length === 0)

// Un chevauchement ne doit jamais redevenir un simple « occupe » : si le
// dernier appareil pose ecrasait l etat, la faute disparaitrait de la carte
// tout en restant dans la liste des problemes.
const troisSurUn = occupationUnivers(
  [
    { nom: 'A', canaux: 4, adresse: 1, univers: 1 },
    { nom: 'B', canaux: 4, adresse: 1, univers: 1 },
    { nom: 'C', canaux: 1, adresse: 1, univers: 1 }
  ],
  1
)
verifier('trois appareils sur un canal restent un chevauchement', troisSurUn[0].etat === 'chevauchement')
verifier('et les trois sont nommes', troisSurUn[0].appareils.length === 3)

// **Un appareil pose mais pas encore adresse n occupe rien.** C est l etat
// normal d un projecteur qu on vient de poser sur le plan de scene, avant
// l adressage automatique. Sans ce refus, il se rangerait au canal 0 ou
// ailleurs, et la carte annoncerait un chevauchement imaginaire — ou pire,
// masquerait un canal reellement libre.
const nonAdresse = occupationUnivers(
  [
    { nom: 'PoseSansAdresse', canaux: 8, adresse: 0, univers: 1 },
    { nom: 'Adresse', canaux: 4, adresse: 1, univers: 1 }
  ],
  1
)
verifier(
  'un appareil sans adresse n occupe aucun canal',
  nonAdresse.every((c) => !c.appareils.includes('PoseSansAdresse')),
  nonAdresse.filter((c) => c.appareils.includes('PoseSansAdresse')).length + ' canaux occupes'
)
verifier(
  'et il ne fabrique pas de chevauchement imaginaire',
  nonAdresse.every((c) => c.etat !== 'chevauchement')
)
verifier(
  'un appareil sans canal declare n occupe rien non plus',
  occupationUnivers([{ nom: 'NonPilote', canaux: 0, adresse: 12, univers: 1 }], 1).every(
    (c) => c.etat === 'libre'
  )
)

verifier(
  'un appareil d un autre univers n apparait pas',
  occupationUnivers([{ nom: 'A', canaux: 8, adresse: 1, univers: 2 }], 1).every(
    (c) => c.etat === 'libre'
  )
)

// Le depassement de fin d univers est deja signale par verifierPatch : la
// carte n en montre que la partie qui existe, sans inventer un 513e canal.
const deborde = occupationUnivers([{ nom: 'A', canaux: 16, adresse: 505, univers: 1 }], 1)
verifier('un appareil qui deborde occupe jusqu au canal 512', deborde[511].etat === 'occupe')
verifier('et la carte ne depasse pas 512 cases', deborde.length === CANAUX_PAR_UNIVERS)

// La carte et la liste des problemes doivent s accorder.
const patchSain = proposerPatch([
  { nom: 'A', canaux: 8 },
  { nom: 'B', canaux: 16 }
])
verifier(
  'un patch sans probleme ne montre aucun chevauchement sur la carte',
  verifierPatch(patchSain).length === 0 &&
    occupationUnivers(patchSain, 1).every((c) => c.etat !== 'chevauchement')
)
verifier(
  'un patch qui chevauche le montre aussi sur la carte',
  verifierPatch(deuxAppareils).some((p) => p.code === 'chevauchement') &&
    occupationUnivers(deuxAppareils, 1).some((c) => c.etat === 'chevauchement')
)

// La carte et plagesLibres comptent le meme vide.
const libresSelonPlages = plagesLibres(deuxAppareils, 1).reduce(
  (total, plage) => total + (plage.dernier - plage.premier + 1),
  0
)
verifier(
  'la carte et plagesLibres comptent le meme nombre de canaux libres',
  carte.filter((c) => c.etat === 'libre').length === libresSelonPlages,
  `${carte.filter((c) => c.etat === 'libre').length} contre ${libresSelonPlages}`
)

console.log(echecs === 0 ? '\nCALCUL DMX : TOUS LES TESTS PASSENT' : `\n${echecs} TEST(S) EN ECHEC`)
process.exitCode = echecs === 0 ? 0 : 1
