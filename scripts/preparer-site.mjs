// Prépare `docs/` pour être servi — en local comme sur GitHub Pages.
//
// Le problème qu'il résout : GitHub Pages ne sert que la racine du dépôt ou le
// dossier `docs/`. Or `calculateur-dmx.html` importe le calcul DMX, qui vit
// dans `commun/dmx.js`, **hors de `docs/`**. Un `../commun/dmx.js` remonte
// au-dessus de la racine servie : la page se chargerait, et le calculateur
// serait mort. En local, servi depuis la racine du dépôt, on ne le verrait pas.
//
// La réponse n'est pas de recopier le fichier dans le dépôt : la formule doit
// vivre à un seul endroit, c'est la règle numéro un de la maison. On en fait
// donc une copie **au moment de publier**, ignorée par git.
import { mkdirSync, copyFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const PROJET = join(dirname(fileURLToPath(import.meta.url)), '..')
const CIBLE = join(PROJET, 'docs/commun')

mkdirSync(CIBLE, { recursive: true })
copyFileSync(join(PROJET, 'commun/dmx.js'), join(CIBLE, 'dmx.js'))

console.log('Site prêt : docs/commun/dmx.js copié depuis commun/dmx.js')
