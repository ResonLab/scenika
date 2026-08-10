import { readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'

/**
 * Les garde-fous du mode multi-postes de Scenika.
 *
 * Ils reprennent ceux d'Ohmnia, et pour les mêmes raisons — chacun protège
 * contre une erreur qui ne se verrait qu'au moment de publier, ou pire, en
 * production chez un client.
 */
const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const lire = (relatif) => readFileSync(join(RACINE, relatif), 'utf-8').replace(/\r\n/g, '\n')

let echecs = 0
function verifier(intitule, condition, detail = '') {
  if (!condition) echecs += 1
  console.log(`  ${condition ? 'OK  ' : 'ECHEC'} ${intitule}`)
  if (!condition && detail) console.log(`        ${detail}`)
}

function fichiersTs(dossier) {
  const resultats = []
  for (const nom of readdirSync(dossier)) {
    const chemin = join(dossier, nom)
    if (statSync(chemin).isDirectory()) resultats.push(...fichiersTs(chemin))
    else if (/\.tsx?$/.test(chemin)) resultats.push(chemin)
  }
  return resultats
}

console.log('=== Le registre et l’IPC ne peuvent pas diverger ===')

const registre = lire('src/serveur/registre.ts')
const canauxRegistre = [...registre.matchAll(/^  '([\w:]+)':/gm)].map((m) => m[1])

verifier('le registre expose des opérations', canauxRegistre.length >= 12, `${canauxRegistre.length}`)

// Le nom du canal doit tenir sur la même ligne qu'`ipcMain.handle(` : le
// contrôle cherche la chaîne d'un seul tenant. Piège déjà payé sur Ohmnia.
const ipc = fichiersTs(join(RACINE, 'src/main/ipc'))
  .map((f) => readFileSync(f, 'utf-8'))
  .join('\n')
const canauxIpc = new Set([...ipc.matchAll(/ipcMain\.handle\('([\w:]+)'/g)].map((m) => m[1]))

const orphelins = canauxRegistre.filter((canal) => !canauxIpc.has(canal))
verifier(
  'chaque opération du registre existe comme canal IPC',
  orphelins.length === 0,
  orphelins.join(', ')
)

console.log('\n=== Chaque opération a un droit déclaré ===')

// Une opération sans droit est refusée à l'exécution. Mieux vaut le savoir
// ici qu'au moment où un utilisateur bute dessus.
const droits = lire('src/serveur/droits.ts')
const sansDroit = canauxRegistre.filter((canal) => !droits.includes(`'${canal}'`))
verifier('aucune opération sans droit déclaré', sansDroit.length === 0, sansDroit.join(', '))

// Les droits ne sont jamais déduits du nom : une règle « lister = lecture » se
// tromperait en silence. On vérifie donc qu'ils sont bien écrits à la main, et
// que ce qui efface est réservé à l'administration.
for (const canal of ['parc:supprimer', 'locations:supprimer']) {
  const bloc = droits.slice(droits.indexOf(`'${canal}'`))
  verifier(
    `${canal} est réservé à l'administration`,
    bloc.startsWith(`'${canal}': 'administration'`),
    bloc.split('\n')[0]
  )
}

console.log('\n=== La couche métier reste utilisable par le réseau ===')

for (const fichier of ['src/main/domaines/parc.ts', 'src/main/domaines/locations.ts']) {
  verifier(`${fichier} n'importe pas Electron`, !/from 'electron'/.test(lire(fichier)))
}

console.log('\n=== La fenêtre ne dépend jamais de Nexika ===')

// L'application Electron ne parle au serveur que par le réseau. Sans cela, son
// installateur embarquerait le code du serveur — et on ne s'en apercevrait
// qu'au moment de publier.
//
// **On cherche la provenance de l'import, pas une chaîne de caractères.**
// Un contrôle qui viserait un chemin cesserait de regarder le jour où le
// chemin change, tout en continuant de dire oui.
const importsInterdits = []
for (const dossier of ['main', 'renderer', 'preload']) {
  for (const fichier of fichiersTs(join(RACINE, 'src', dossier))) {
    for (const ligne of readFileSync(fichier, 'utf-8').split('\n')) {
      const provenance = ligne.match(/(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/)?.[1]
      if (!provenance) continue
      if (provenance !== 'nexika' && !provenance.startsWith('nexika/')) continue
      // Un import de type disparaît à la compilation.
      if (ligne.trimStart().startsWith('import type')) continue
      importsInterdits.push(`${fichier.replace(RACINE, '')} : ${ligne.trim()}`)
    }
  }
}
verifier(
  "l'application Electron n'importe rien de Nexika",
  importsInterdits.length === 0,
  importsInterdits.join(' | ')
)

console.log('\n=== La version du serveur suit celle du projet ===')

// Le serveur compilé n'a pas de package.json à côté de lui : sa version est
// écrite en dur, et rien ne l'empêcherait de dériver.
const version = JSON.parse(lire('package.json')).version
const versionServeur = lire('src/serveur/version.ts').match(/VERSION_SERVEUR = '([^']+)'/)?.[1]
verifier(
  'la version du serveur est celle du projet',
  versionServeur === version,
  `projet ${version} · serveur ${versionServeur}`
)

console.log(
  echecs === 0 ? '\nSERVEUR : TOUS LES GARDE-FOUS TIENNENT' : `\n${echecs} GARDE-FOU(S) EN ECHEC`
)
process.exitCode = echecs === 0 ? 0 : 1
