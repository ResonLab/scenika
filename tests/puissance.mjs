import {
  CALIBRES,
  TAUX_CHARGE_MAX,
  TENSION_V,
  puissanceTenable,
  puissanceTheorique,
  repartirSurCircuits
} from '../commun/puissance.js'

/**
 * La répartition de puissance, vérifiée contre des valeurs connues.
 *
 * Une erreur ici fait sauter un disjoncteur pendant un spectacle. On vérifie
 * donc les chiffres que tout technicien connaît, et surtout les refus : ce que
 * le calcul dit **ne pas** pouvoir faire.
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
    message ?? 'aucune erreur levée'
  )
}

const proche = (obtenu, attendu, tolerance = 0.01) => Math.abs(obtenu - attendu) <= tolerance

console.log('=== Ce qu’un calibre tient ===')

// P = U × I. Le chiffre que tout technicien connaît : 16 A en 230 V, 3 680 W.
verifier('16 A en 230 V tiennent 3 680 W', proche(puissanceTheorique(16), 3680))
verifier('10 A en 230 V tiennent 2 300 W', proche(puissanceTheorique(10), 2300))
verifier('32 A en 230 V tiennent 7 360 W', proche(puissanceTheorique(32), 7360))
verifier('la tension du réseau est 230 V', TENSION_V === 230)
verifier('les trois calibres courants sont proposés', CALIBRES.join(',') === '10,16,32')

// On ne remplit jamais un circuit à fond : il déclencherait au premier appel
// de courant, et il déclencherait pendant le spectacle.
verifier('la marge retenue est de 20 %', proche(TAUX_CHARGE_MAX, 0.8))
verifier('un 16 A ne porte que 2 944 W avec la marge', proche(puissanceTenable(16), 2944))

refuseAvec('un calibre nul est refusé', () => puissanceTheorique(0), 'supérieur à zéro')
refuseAvec('un taux de charge nul est refusé', () => puissanceTenable(16, 0), 'entre 0 et 1')
refuseAvec('un taux au-delà de 1 est refusé', () => puissanceTenable(16, 1.5), 'entre 0 et 1')

console.log('\n=== Répartition sur les circuits ===')

const lyre = (n) => ({ nom: `Lyre ${n}`, puissanceW: 250 })

// Onze lyres de 250 W : 2 750 W. Un circuit en tient 2 944, donc un seul suffit.
const onze = repartirSurCircuits(Array.from({ length: 11 }, (_, i) => lyre(i + 1)))
verifier(
  'onze lyres de 250 W tiennent sur un circuit',
  onze.circuits.length === 1,
  `${onze.circuits.length} circuit(s) pour ${onze.puissanceTotaleW} W`
)

// La douzième déborde : 3 000 W pour 2 944 tenables.
const douze = repartirSurCircuits(Array.from({ length: 12 }, (_, i) => lyre(i + 1)))
verifier(
  'la douzième impose un second circuit',
  douze.circuits.length === 2,
  `${douze.circuits.length} circuits`
)
verifier(
  'aucun circuit ne dépasse ce qu’il peut porter',
  douze.circuits.every((c) => c.chargeW <= douze.puissanceMaxParCircuitW),
  JSON.stringify(douze.circuits.map((c) => c.chargeW))
)
verifier(
  'le total est conservé',
  douze.puissanceTotaleW === 3000 &&
    douze.circuits.reduce((t, c) => t + c.chargeW, 0) === 3000
)
verifier(
  'chaque appareil est placé une fois et une seule',
  douze.circuits.reduce((t, c) => t + c.appareils.length, 0) === 12
)

// Le plus gros d'abord : c'est ce qui permet de refaire la répartition de tête.
const melange = repartirSurCircuits([
  { nom: 'Petit', puissanceW: 100 },
  { nom: 'Gros', puissanceW: 2000 },
  { nom: 'Moyen', puissanceW: 800 }
])
verifier(
  'le plus gourmand est placé en premier',
  melange.circuits[0].appareils[0].nom === 'Gros',
  melange.circuits[0].appareils.map((a) => a.nom).join(', ')
)

console.log('\n=== Ce que le calcul refuse ===')

// Un appareil plus gourmand qu'un circuit entier n'est pas réparti : le
// glisser quelque part donnerait une répartition qui a l'air juste.
const trop = repartirSurCircuits([
  { nom: 'Générateur de brouillard', puissanceW: 3500 },
  lyre(1)
])
verifier(
  'un appareil trop gourmand est refusé, pas casé de force',
  trop.refuses.length === 1 && trop.refuses[0].nom === 'Générateur de brouillard',
  JSON.stringify(trop.refuses)
)
verifier('le reste est réparti quand même', trop.circuits.length === 1)

// En 32 A, le même appareil passe.
const en32 = repartirSurCircuits([{ nom: 'Générateur de brouillard', puissanceW: 3500 }], 32)
verifier('en 32 A, il passe', en32.refuses.length === 0 && en32.circuits.length === 1)

refuseAvec(
  'une puissance négative est refusée, en français',
  () => repartirSurCircuits([{ nom: 'Douteux', puissanceW: -10 }]),
  'positif ou nul'
)

console.log('\n=== Cas limites ===')

const vide = repartirSurCircuits([])
verifier('aucun appareil donne aucun circuit', vide.circuits.length === 0 && vide.puissanceTotaleW === 0)

const gratuits = repartirSurCircuits([
  { nom: 'Câble', puissanceW: 0 },
  { nom: 'Pied', puissanceW: 0 }
])
verifier(
  'des appareils sans puissance tiennent sur un seul circuit',
  gratuits.circuits.length === 1 && gratuits.circuits[0].chargeW === 0
)

const pleinPile = repartirSurCircuits([{ nom: 'Pile', puissanceW: 2944 }])
verifier(
  'un appareil exactement à la limite passe',
  pleinPile.refuses.length === 0 && proche(pleinPile.circuits[0].tauxCharge, 1)
)

console.log(
  echecs === 0 ? '\nPUISSANCE : TOUS LES TESTS PASSENT' : `\n${echecs} TEST(S) EN ECHEC`
)
process.exitCode = echecs === 0 ? 0 : 1
