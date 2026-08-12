import {
  contrainteDuGeneral,
  creerTableau,
  repartirSurTableaux,
  TAUX_CHARGE_MAX
} from '../commun/tableaux.js'
import { puissanceTenable } from '../commun/puissance.js'

/**
 * La répartition sur des tableaux réels, vérifiée contre des valeurs connues.
 *
 * Une erreur ici fait tomber un tableau pendant un spectacle. On vérifie donc
 * les chiffres qu'un technicien connaît de tête, et surtout **les refus** :
 * ce que le calcul dit ne pas pouvoir faire, et pourquoi.
 */
let echecs = 0
function verifier(intitule, condition, detail = '') {
  if (!condition) echecs += 1
  console.log(`  ${condition ? 'OK  ' : 'ECHEC'} ${intitule}`)
  if (!condition && detail) console.log(`        ${detail}`)
}

function refuseAvec(intitule, action, extrait) {
  let message = null
  try {
    action()
  } catch (erreur) {
    message = erreur.message
  }
  verifier(
    intitule,
    message !== null && message.includes(extrait),
    message === null ? 'aucune erreur levée' : `message reçu : ${message}`
  )
}

const appareils = (...watts) =>
  watts.map((puissanceW, index) => ({ nom: `A${index + 1}`, puissanceW }))

console.log('\n=== Créer un tableau ===')

const bloc = creerTableau('Bloc jardin', 6, 16, 32)
verifier('six prises numérotées de 1 à 6', bloc.prises.length === 6 && bloc.prises[5].numero === 6)
verifier('toutes les prises au calibre demandé', bloc.prises.every((p) => p.calibreA === 16))
verifier('le général est retenu', bloc.calibreGeneralA === 32)

refuseAvec('un tableau sans prise est refusé', () => creerTableau('Vide', 0, 16), 'au moins une prise')
refuseAvec(
  'un calibre de prise nul est refusé',
  () => creerTableau('Faux', 4, 0),
  'supérieur à zéro'
)

console.log('\n=== Le général est la vraie limite ===')

// Six prises de 16 A font 96 A additionnées, derrière un général de 32 A.
const contrainte = contrainteDuGeneral(bloc)
verifier('la somme des prises est bien 96 A', contrainte.sommeDesPrisesA === 96)
verifier('le général est signalé comme limitant', contrainte.generalEstLimitant)

const sansGeneral = creerTableau('Sans general', 4, 16, 0)
verifier(
  'un tableau sans général déclaré ne prétend pas être limité',
  contrainteDuGeneral(sansGeneral).generalEstLimitant === false
)

console.log('\n=== Répartition simple, vérifiable de tête ===')

// Une prise 16 A à 80 % tient 16 × 230 × 0,8 = 2 944 W.
const maxPrise16 = puissanceTenable(16, TAUX_CHARGE_MAX)
verifier('une prise 16 A tient 2 944 W', Math.round(maxPrise16) === 2944)

// Quatre appareils de 1 000 W sur des prises 16 A sans général : deux par
// prise (2 000 W <= 2 944), donc deux prises occupées.
const quatreKw = repartirSurTableaux(appareils(1000, 1000, 1000, 1000), [
  creerTableau('T', 4, 16, 0)
])
const occupees = quatreKw.tableaux[0].prises.filter((p) => p.appareils.length > 0)
verifier('quatre appareils de 1 kW tiennent sur deux prises', occupees.length === 2)
verifier('rien n est refusé', quatreKw.refuses.length === 0)
verifier('tout est placé', quatreKw.puissancePlaceeW === 4000)

console.log('\n=== Le général bloque avant les prises ===')

// Général 16 A : 2 944 W pour tout le tableau, alors que les quatre prises
// 16 A pourraient porter 11 776 W à elles quatre. Seuls deux appareils de
// 1 000 W passent, le troisième porterait le tableau à 3 000 W.
const bride = repartirSurTableaux(appareils(1000, 1000, 1000), [creerTableau('Bride', 4, 16, 16)])
verifier(
  'le général limite à deux appareils de 1 kW, pas trois',
  bride.puissancePlaceeW === 2000,
  `placé : ${bride.puissancePlaceeW} W`
)
verifier('le troisième est refusé faute de place', bride.refuses.length === 1)
verifier(
  'et le motif est « plus de place », pas « trop gourmand »',
  bride.refuses[0]?.raison === 'plus_de_place',
  `motif reçu : ${bride.refuses[0]?.raison}`
)

// Le même matériel, le même nombre de prises, mais un général plus large :
// tout passe. C'est la preuve que c'est bien le général qui bloquait.
const large = repartirSurTableaux(appareils(1000, 1000, 1000), [creerTableau('Large', 4, 16, 32)])
verifier('avec un général de 32 A, les trois passent', large.refuses.length === 0)

console.log('\n=== Rien n est casé de force ===')

// 5 000 W ne rentre dans aucune prise 16 A (2 944 W).
const tropGros = repartirSurTableaux(
  [{ nom: 'Projecteur enorme', puissanceW: 5000 }],
  [creerTableau('T', 6, 16, 63)]
)
verifier('un appareil plus gourmand que la plus grosse prise est refusé', tropGros.refuses.length === 1)
verifier(
  'et le motif est « trop gourmand »',
  tropGros.refuses[0]?.raison === 'trop_gourmand',
  `motif reçu : ${tropGros.refuses[0]?.raison}`
)
verifier('il n est compté nulle part comme placé', tropGros.puissancePlaceeW === 0)

// Le même appareil sur une prise 32 A (5 888 W) passe.
const surTrente = repartirSurTableaux(
  [{ nom: 'Projecteur enorme', puissanceW: 5000 }],
  [creerTableau('T32', 2, 32, 63)]
)
verifier('le même appareil passe sur une prise 32 A', surTrente.refuses.length === 0)

console.log('\n=== Plusieurs tableaux, dans l ordre ===')

const deux = repartirSurTableaux(appareils(2000, 2000, 2000), [
  creerTableau('Premier', 1, 16, 0),
  creerTableau('Second', 2, 16, 0)
])
verifier(
  'le premier tableau est rempli avant le second',
  deux.tableaux[0].prises[0].appareils.length === 1 &&
    deux.tableaux[1].prises[0].appareils.length === 1,
  JSON.stringify(deux.tableaux.map((t) => t.prises.map((p) => p.appareils.length)))
)
verifier('les trois trouvent place', deux.refuses.length === 0)

console.log('\n=== Le plus gourmand d abord ===')

// La règle annoncée est « le plus gourmand d'abord ». On la vérifie donc
// directement : le premier appareil posé sur la première prise doit être le
// plus gros, quel que soit l'ordre de saisie.
//
// Un premier jet comparait deux ordres de saisie et attendait le même
// résultat. Il passait AUSSI sans tri, par accident de valeurs : le contrôle
// ne pouvait pas échouer, tout en affichant OK. Trouvé en cassant le tri.
const melange = repartirSurTableaux(
  [
    { nom: 'Petit', puissanceW: 500 },
    { nom: 'Gros', puissanceW: 2000 },
    { nom: 'Moyen', puissanceW: 800 }
  ],
  [creerTableau('T', 3, 16, 0)]
)
verifier(
  'le plus gourmand est pose en premier sur la premiere prise',
  melange.tableaux[0].prises[0].appareils[0]?.nom === 'Gros',
  `pose en premier : ${melange.tableaux[0].prises[0].appareils[0]?.nom}`
)
verifier(
  'et les suivants viennent par puissance decroissante',
  melange.tableaux[0].prises[0].appareils.map((a) => a.nom).join('>') === 'Gros>Moyen',
  melange.tableaux[0].prises[0].appareils.map((a) => a.nom).join('>')
)

console.log('\n=== Refus de saisies absurdes ===')

refuseAvec(
  'une puissance négative est refusée et l appareil nommé',
  () => repartirSurTableaux([{ nom: 'Bizarre', puissanceW: -5 }], [creerTableau('T', 2, 16)]),
  'Bizarre'
)
refuseAvec(
  'répartir sans aucun tableau est refusé',
  () => repartirSurTableaux(appareils(100), []),
  'au moins un tableau'
)

console.log('\n=== Cas limites ===')

const rien = repartirSurTableaux([], [creerTableau('T', 2, 16, 32)])
verifier(
  'aucun appareil : aucune charge, aucun refus',
  rien.puissancePlaceeW === 0 && rien.refuses.length === 0
)

const zeroWatt = repartirSurTableaux([{ nom: 'Passif', puissanceW: 0 }], [creerTableau('T', 1, 16)])
verifier('un appareil de 0 W est placé, pas refusé', zeroWatt.refuses.length === 0)

// Le taux de charge est celui de puissance.js, pas une seconde marge.
const pleinPot = repartirSurTableaux(appareils(3500), [creerTableau('T', 1, 16, 0)], 1)
verifier(
  'a 100 % de charge, 3 500 W passent sur une 16 A (3 680 W theoriques)',
  pleinPot.refuses.length === 0
)
const avecMarge = repartirSurTableaux(appareils(3500), [creerTableau('T', 1, 16, 0)])
verifier('avec la marge par defaut, les memes 3 500 W sont refuses', avecMarge.refuses.length === 1)

console.log(
  echecs === 0 ? '\nTABLEAUX : TOUS LES TESTS PASSENT' : `\nTABLEAUX : ${echecs} ECHEC(S)`
)
process.exit(echecs === 0 ? 0 : 1)
