import { mkdtempSync, rmSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

/**
 * Le plan de scène, sur une vraie base.
 *
 * **Ce qu'on éprouve ici n'est pas du SQL, c'est une règle** : le mode DMX
 * appartient à l'appareil posé, pas à la référence du parc. Deux projecteurs
 * du même modèle peuvent tourner en 8 et en 16 canaux dans le même spectacle,
 * et c'est le réglage de la machine qui décide de la place qu'elle occupe dans
 * l'univers. Ranger le mode sur la référence ferait bouger l'un en réglant
 * l'autre — et on ne s'en apercevrait qu'en salle.
 *
 * **Le vrai module est compilé et exécuté, pas réécrit**, comme pour les
 * locations : une réécriture n'éprouverait que la réécriture.
 */
const PROJET = join(dirname(fileURLToPath(import.meta.url)), '..')
const DOSSIER = mkdtempSync(join(tmpdir(), 'scenika-scene-'))

let echecs = 0
function verifier(intitule, condition, detail = '') {
  if (!condition) echecs += 1
  console.log(`  ${condition ? 'OK  ' : 'ECHEC'} ${intitule}`)
  if (!condition && detail) console.log(`        ${detail}`)
}

/** Les refus portent une **clé**, pas une phrase : la fenêtre la traduit. */
function refuseAvec(intitule, action, cle) {
  let message = null
  try {
    action()
  } catch (erreur) {
    message = erreur.message
  }
  verifier(intitule, message === cle, message ?? 'aucune erreur levée')
}

const chargerSqlBrut = {
  name: 'sql-brut',
  setup(constructeur) {
    constructeur.onResolve({ filter: /\.sql\?raw$/ }, (arg) => ({
      path: join(arg.resolveDir, arg.path.replace('?raw', '')),
      namespace: 'sql-brut'
    }))
    constructeur.onLoad({ filter: /.*/, namespace: 'sql-brut' }, (arg) => ({
      contents: `export default ${JSON.stringify(readFileSync(arg.path, 'utf-8'))}`,
      loader: 'js'
    }))
  }
}

const bundle = join(DOSSIER, 'domaine.mjs')
await build({
  entryPoints: [join(PROJET, 'tests/entree-scene.ts')],
  outfile: bundle,
  bundle: true,
  platform: 'node',
  target: 'node24',
  format: 'esm',
  external: ['node:*'],
  plugins: [chargerSqlBrut],
  logLevel: 'error'
})

const metier = await import(`file:///${bundle.replace(/\\/g, '/')}`)

console.log('\n=== Les modes disponibles ===')

const modes = (canauxDmx, modesDmx) => metier.modesDisponibles({ canauxDmx, modesDmx })

verifier(
  'le mode habituel figure toujours dans la liste',
  JSON.stringify(modes(8, '')) === '[8]',
  JSON.stringify(modes(8, ''))
)
verifier(
  'les autres modes sont repris et tries',
  JSON.stringify(modes(8, '16,12')) === '[8,12,16]',
  JSON.stringify(modes(8, '16,12'))
)
verifier(
  'le mode habituel n est pas double s il est aussi declare',
  JSON.stringify(modes(12, '8,12,16')) === '[8,12,16]',
  JSON.stringify(modes(12, '8,12,16'))
)
verifier(
  'les espaces autour des virgules sont tolerés',
  JSON.stringify(modes(8, ' 12 , 16 ')) === '[8,12,16]',
  JSON.stringify(modes(8, ' 12 , 16 '))
)
verifier(
  'un appareil non pilote n a aucun mode',
  JSON.stringify(modes(0, '')) === '[]',
  JSON.stringify(modes(0, ''))
)
verifier(
  'les morceaux illisibles sont ignorés, pas convertis en zero',
  JSON.stringify(modes(8, 'abc,,16')) === '[8,16]',
  JSON.stringify(modes(8, 'abc,,16'))
)

console.log('\n=== Le parc refuse une liste de modes mal ecrite ===')

metier.definirContexte({ dossierDonnees: DOSSIER, version: 'test' })
metier.ouvrirBaseDeDonnees()

const fiche = (extra) => ({
  reference: `R${Math.random().toString(36).slice(2, 8)}`,
  designation: 'PAR LED',
  categorie: 'lumiere',
  marque: '',
  modele: '',
  quantite: 4,
  puissanceW: 1000,
  canauxDmx: 8,
  modesDmx: '',
  emplacement: '',
  etat: 'bon',
  notes: '',
  ...extra
})

refuseAvec(
  'un mode a zero est refuse',
  () => metier.ajouterMateriel(fiche({ modesDmx: '8,0,16' })),
  'modesMalEcrits'
)
refuseAvec(
  'un mode negatif est refuse',
  () => metier.ajouterMateriel(fiche({ modesDmx: '8,-4' })),
  'modesMalEcrits'
)
refuseAvec(
  'un mode plus large qu un univers est refuse',
  () => metier.ajouterMateriel(fiche({ modesDmx: '8,600' })),
  'canauxTropGrands'
)

const projecteur = metier.ajouterMateriel(fiche({ modesDmx: '12,16' }))
verifier('une liste correcte est acceptee', projecteur.modesDmx === '12,16')

console.log('\n=== Le mode appartient a l appareil pose ===')

const pose = (extra = {}) =>
  metier.poserAppareil({
    materielId: projecteur.id,
    etiquette: '',
    x: 0.5,
    y: 0.5,
    univers: 1,
    adresseDmx: 0,
    canauxDmx: projecteur.canauxDmx,
    ...extra
  })

const premier = pose()
const second = pose({ canauxDmx: 16 })

verifier('le premier garde le mode habituel', premier.canauxDmx === 8, `${premier.canauxDmx}`)
verifier('le second tourne en 16 canaux', second.canauxDmx === 16, `${second.canauxDmx}`)
verifier(
  'changer le mode de l un ne touche pas l autre',
  metier.listerScene().find((a) => a.id === premier.id).canauxDmx === 8
)
verifier(
  'les modes de la reference suivent l appareil pose',
  metier.listerScene().every((a) => a.modesDmx === '12,16')
)

console.log('\n=== Ce que le plan refuse ===')

refuseAvec(
  'une position hors du plan est refusee',
  () => pose({ x: 1.4 }),
  'positionHorsPlan'
)
refuseAvec(
  'une adresse au-dela de 512 est refusee',
  () => pose({ adresseDmx: 513 }),
  'adresseInvalide'
)
refuseAvec(
  'un mode plus large qu un univers est refuse',
  () => pose({ canauxDmx: 600 }),
  'modeInvalide'
)
// 500 + 16 - 1 = 515 : l'appareil deborderait la fin de l'univers.
refuseAvec(
  'un mode qui deborde la fin de l univers a cette adresse est refuse',
  () => pose({ adresseDmx: 500, canauxDmx: 16 }),
  'modeDebordeUnivers'
)
// 497 + 16 - 1 = 512 : la derniere adresse possible, elle doit passer.
const limite = pose({ adresseDmx: 497, canauxDmx: 16 })
verifier('la derniere adresse possible est acceptee', limite.adresseDmx === 497)

refuseAvec(
  'poser un materiel inexistant est refuse',
  () => pose({ materielId: 99999 }),
  'materielIntrouvable'
)
refuseAvec(
  'deplacer un appareil inexistant est refuse',
  () =>
    metier.deplacerAppareil({
      id: 99999,
      etiquette: '',
      x: 0.5,
      y: 0.5,
      univers: 1,
      adresseDmx: 1,
      canauxDmx: 8
    }),
  'materielIntrouvable'
)

console.log('\n=== Vider le plan ne touche pas au parc ===')

metier.viderScene()
verifier('le plan est vide', metier.listerScene().length === 0)
verifier(
  'le materiel est toujours dans le parc',
  metier.ajouterMateriel(fiche({ reference: 'APRES' })) !== undefined
)

metier.fermerBaseDeDonnees()
rmSync(DOSSIER, { recursive: true, force: true })

console.log(echecs === 0 ? '\nSCENE : TOUS LES TESTS PASSENT' : `\nSCENE : ${echecs} ECHEC(S)`)
process.exit(echecs === 0 ? 0 : 1)
