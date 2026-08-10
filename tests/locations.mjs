import { mkdtempSync, rmSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

/**
 * Les locations, sur une vraie base.
 *
 * **Ce qu'on éprouve ici n'est pas du SQL, c'est une règle de gestion** : le
 * parc dit ce qu'on possède, et ce qui est dehors se calcule. On pourrait
 * décrémenter les quantités à la sortie ; ce serait plus simple et faux, parce
 * qu'une location oubliée laisserait un stock faux que rien ne rattrape, et on
 * ne saurait plus si l'écart vient d'un vol, d'une casse ou d'une erreur.
 *
 * **Le vrai module est compilé et exécuté, pas réécrit.** Un premier jet
 * retirait les types à coups d'expressions régulières : ça marchait, et ça
 * n'éprouvait plus le code du projet mais une copie approximative. La couche
 * métier n'importe pas Electron — c'est précisément ce qui rend ceci possible,
 * et c'est aussi ce qui permettra à Nexika de l'exposer par le réseau.
 */
const PROJET = join(dirname(fileURLToPath(import.meta.url)), '..')
const DOSSIER = mkdtempSync(join(tmpdir(), 'scenika-locations-'))

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

/* ── Le module, compilé comme il le sera en vrai ──────────────────────────── */

// `db/database.ts` importe le schéma par `./schema.sql?raw`, une syntaxe de
// Vite qu'esbuild ne connaît pas : on la résout à la main, comme le fait le
// script de construction du serveur d'Ohmnia.
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
  entryPoints: [join(PROJET, 'tests/entree-locations.ts')],
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

metier.definirContexte({ dossierDonnees: DOSSIER, version: '0.0.0-test' })
const base = metier.ouvrirBaseDeDonnees()

const {
  changerEtat,
  creerLocation,
  disponibilites,
  enregistrerRetour,
  lignesDeFacture,
  listerLocations,
  supprimerLocation,
  ajouterMateriel
} = metier

/* ── Le parc de départ ────────────────────────────────────────────────────── */

const lyre = ajouterMateriel({
  reference: 'LYRE-01',
  designation: 'Lyre wash',
  categorie: 'lumiere',
  marque: '',
  modele: '',
  quantite: 8,
  puissanceW: 250,
  canauxDmx: 16,
  emplacement: '',
  etat: 'bon',
  notes: ''
})
const enceinte = ajouterMateriel({
  reference: 'ENC-01',
  designation: 'Enceinte 12 pouces',
  categorie: 'son',
  marque: '',
  modele: '',
  quantite: 4,
  puissanceW: 400,
  canauxDmx: 0,
  emplacement: '',
  etat: 'bon',
  notes: ''
})

console.log('=== Création ===')

const location = creerLocation(
  {
    client: 'Salle des fêtes',
    reference: 'LOC-001',
    etat: 'prevue',
    dateDepart: '2026-09-01',
    dateRetour: '2026-09-03',
    notes: ''
  },
  [
    { materielId: lyre.id, quantite: 4, prixUnitaire: 25 },
    { materielId: enceinte.id, quantite: 2, prixUnitaire: 40 }
  ]
)

verifier('la location est créée avec ses lignes', location.lignes.length === 2)
verifier(
  'les lignes portent la référence et la désignation du parc',
  location.lignes[0].reference === 'LYRE-01' && location.lignes[0].designation === 'Lyre wash',
  JSON.stringify(location.lignes[0])
)

const brouillon = {
  client: 'X',
  reference: '',
  etat: 'prevue',
  dateDepart: '2026-09-01',
  dateRetour: '2026-09-02',
  notes: ''
}
const uneLigne = [{ materielId: lyre.id, quantite: 1, prixUnitaire: 0 }]

refuseAvec(
  'un client vide est refusé',
  () => creerLocation({ ...brouillon, client: '  ' }, uneLigne),
  'clientVide'
)
refuseAvec(
  'un retour avant le départ est refusé',
  () => creerLocation({ ...brouillon, dateDepart: '2026-09-05' }, uneLigne),
  'retourAvantDepart'
)
refuseAvec(
  'une location sans matériel est refusée',
  () => creerLocation(brouillon, []),
  'locationSansMateriel'
)

console.log('\n=== Disponibilité ===')

const lyreAvant = disponibilites().find((d) => d.reference === 'LYRE-01')
verifier(
  'une location prévue ne retient rien',
  lyreAvant.sorti === 0 && lyreAvant.disponible === 8,
  JSON.stringify(lyreAvant)
)

changerEtat(location.id, 'sortie')
const pendant = disponibilites().find((d) => d.reference === 'LYRE-01')
verifier(
  'une location sortie retient le matériel',
  pendant.sorti === 4 && pendant.disponible === 4,
  JSON.stringify(pendant)
)
verifier('le parc lui-même n’a pas bougé', pendant.possede === 8, String(pendant.possede))

console.log('\n=== Retour ===')

// Trois lyres sur quatre reviennent : ce qui manque doit rester visible.
const ligneLyre = listerLocations().find((l) => l.id === location.id).lignes[0]
enregistrerRetour(ligneLyre.id, 3)
const manquant = disponibilites().find((d) => d.reference === 'LYRE-01')
verifier(
  'ce qui n’est pas revenu reste compté comme sorti',
  manquant.sorti === 1 && manquant.disponible === 7,
  JSON.stringify(manquant)
)

refuseAvec(
  'rendre plus que ce qui est parti est refusé',
  () => enregistrerRetour(ligneLyre.id, 9),
  'rentrePlusQueSorti'
)
refuseAvec(
  'une quantité négative est refusée',
  () => enregistrerRetour(ligneLyre.id, -1),
  'quantiteNegative'
)
refuseAvec('une ligne inconnue est signalée', () => enregistrerRetour(9999, 1), 'ligneIntrouvable')

changerEtat(location.id, 'rentree')
const apres = disponibilites().find((d) => d.reference === 'LYRE-01')
verifier(
  'une location rentrée ne retient plus rien',
  apres.sorti === 0 && apres.disponible === 8,
  JSON.stringify(apres)
)

console.log('\n=== Lignes de facture pour Ohmnia ===')

const facture = lignesDeFacture(location.id)
verifier('une ligne par matériel loué', facture.length === 2)
verifier(
  'le total est la quantité fois le prix',
  facture[0].total === 100 && facture[1].total === 80,
  JSON.stringify(facture.map((f) => f.total))
)
verifier(
  'la référence du parc voyage avec la ligne',
  facture[0].referenceInventaire === 'LYRE-01'
)
refuseAvec(
  'une location inconnue est signalée',
  () => lignesDeFacture(9999),
  'locationIntrouvable'
)

console.log('\n=== Suppression ===')

supprimerLocation(location.id)
verifier('la location disparaît', listerLocations().length === 0)
verifier(
  'ses lignes disparaissent avec elle',
  base.prepare('SELECT COUNT(*) AS n FROM location_ligne').get().n === 0
)

metier.fermerBaseDeDonnees()
try {
  rmSync(DOSSIER, { recursive: true, force: true })
} catch {
  // Un dossier temporaire oublié est sans conséquence ; un faux échec en a une.
}

console.log(echecs === 0 ? '\nLOCATIONS : TOUS LES TESTS PASSENT' : `\n${echecs} TEST(S) EN ECHEC`)
process.exitCode = echecs === 0 ? 0 : 1
