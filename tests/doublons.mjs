import { doublonsARetirer, TOLERANCE_POSITION } from '../commun/doublons.js'

/**
 * Le reperage des doublons d'un plan de scene.
 *
 * **Les cas sont choisis pour discriminer.** Plusieurs existent uniquement pour
 * verifier qu'on ne retire PAS quelque chose de legitime : deux projecteurs du
 * meme modele a deux endroits differents sont le cas normal d'un plan de feu,
 * et une fonction de nettoyage qui les confondrait detruirait le travail
 * qu'elle pretend sauver.
 */
let echecs = 0
const verifier = (intitule, condition, detail = '') => {
  if (condition) {
    console.log(`  OK   ${intitule}`)
  } else {
    console.log(`  ECHEC ${intitule}${detail ? ` — ${detail}` : ''}`)
    echecs += 1
  }
}

const pose = (id, materielId, x, y) => ({ id, materielId, x, y })

console.log('\n=== Ce qui ne doit jamais etre retire ===')

verifier('un plan vide ne rend rien', doublonsARetirer([]).length === 0)

verifier(
  'un seul appareil n est jamais un doublon',
  doublonsARetirer([pose(1, 7, 0.5, 0.5)]).length === 0
)

// **Ce cas discrimine** : meme modele, endroits differents. Une regle qui ne
// comparerait que la reference les prendrait pour des doublons et supprimerait
// la moitie d'un plan de feu ordinaire.
verifier(
  'deux appareils du meme modele a deux endroits restent tous les deux',
  doublonsARetirer([pose(1, 7, 0.2, 0.3), pose(2, 7, 0.8, 0.3)]).length === 0
)

// **Celui-ci discrimine aussi** : meme endroit, modeles differents. Une regle
// qui ne comparerait que la position retirerait un projecteur legitime pose
// juste derriere un autre.
verifier(
  'deux modeles differents au meme endroit restent tous les deux',
  doublonsARetirer([pose(1, 7, 0.5, 0.5), pose(2, 9, 0.5, 0.5)]).length === 0
)

console.log('\n=== Ce qui doit etre retire ===')

const empiles = [pose(1, 7, 0.5, 0.5), pose(2, 7, 0.5, 0.5), pose(3, 7, 0.5, 0.5)]
const retires = doublonsARetirer(empiles)
verifier('trois exemplaires empiles en laissent un', retires.length === 2, JSON.stringify(retires))
verifier(
  'et c est le premier qui reste — il porte les reglages saisis',
  !retires.includes(1) && retires.includes(2) && retires.includes(3),
  JSON.stringify(retires)
)

// La tolerance attrape un glissement d'un cheveu, qui echapperait a une
// comparaison exacte.
verifier(
  'un ecart sous la tolerance compte comme le meme endroit',
  doublonsARetirer([
    pose(1, 7, 0.5, 0.5),
    pose(2, 7, 0.5 + TOLERANCE_POSITION / 2, 0.5)
  ]).length === 1
)

// **Et la borne dans l'autre sens** : sans ce cas, une tolerance enorme
// passerait tous les tests ci-dessus tout en devorant un plan entier.
verifier(
  'un ecart nettement au-dessus de la tolerance ne compte pas',
  doublonsARetirer([pose(1, 7, 0.5, 0.5), pose(2, 7, 0.5 + TOLERANCE_POSITION * 20, 0.5)])
    .length === 0
)

verifier(
  'la tolerance reste petite devant la taille du plan',
  TOLERANCE_POSITION > 0 && TOLERANCE_POSITION <= 0.005,
  String(TOLERANCE_POSITION)
)

console.log('\n=== Plusieurs empilements a la fois ===')

const melange = [
  pose(1, 7, 0.2, 0.2),
  pose(2, 7, 0.2, 0.2),
  pose(3, 9, 0.8, 0.8),
  pose(4, 9, 0.8, 0.8),
  pose(5, 9, 0.8, 0.8),
  pose(6, 7, 0.6, 0.4)
]
const nettoyage = doublonsARetirer(melange)
verifier(
  'chaque empilement garde son premier',
  nettoyage.sort((a, b) => a - b).join(',') === '2,4,5',
  nettoyage.join(',')
)

console.log(
  echecs === 0 ? '\nDOUBLONS : TOUS LES TESTS PASSENT' : `\n${echecs} TEST(S) EN ECHEC`
)
process.exitCode = echecs === 0 ? 0 : 1
