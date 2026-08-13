import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'

/**
 * Vérifie que le site de Scenika reste servable et que ses deux langues
 * restent alignées.
 *
 * Le piège que cette suite empêche : traduire une page, puis modifier la
 * française seule. Les deux divergent en silence, et la moitié des lecteurs
 * voit une version périmée sans que rien ne le signale.
 *
 * On ne peut pas comparer une traduction mot à mot — on compare la structure :
 * autant de sections, autant de cartes, autant de titres. Une section ajoutée
 * d'un seul côté se voit immédiatement.
 *
 * Elle contrôle aussi ce qui casse un site statique sans prévenir : un lien
 * mort, une image absente, une ressource chargée depuis un autre serveur.
 */
const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DOCS = join(RACINE, 'docs')

let echecs = 0
const echec = (message) => {
  console.log(`  ÉCHEC : ${message}`)
  echecs += 1
}

/* ── 1. Les deux langues ont la même structure ───────────────────────────── */

const fr = readFileSync(join(DOCS, 'index.html'), 'utf-8')
const cheminEn = join(DOCS, 'en/index.html')

if (!existsSync(cheminEn)) {
  echec('docs/en/index.html est absent')
} else {
  const en = readFileSync(cheminEn, 'utf-8')

  const compter = (html, motif) => (html.match(motif) ?? []).length
  const structures = [
    ['sections', /<section\b/g],
    ['cartes', /class="card reveal/g],
    ['titres de section', /<h2 class="titre/g],
    ['titres de carte', /<h3>/g],
    ['boutons', /class="btn\b/g]
  ]
  for (const [nom, motif] of structures) {
    const a = compter(fr, motif)
    const b = compter(en, motif)
    if (a !== b) echec(`${nom} : ${a} en français, ${b} en anglais`)
  }

  // Les badges d'état doivent dire la même chose dans les deux langues.
  //
  // **C'est un trou trouvé en le cherchant**, le 12 août 2026 : on a pu remettre
  // « À VENIR » sur une carte française pendant que l'anglaise disait
  // « WRITTEN », et cette suite affichait OK. Compter les cartes ne dit rien de
  // ce qu'elles annoncent. Or c'est exactement par là que trois badges ont
  // périmé : ils annonçaient comme à venir des modules téléchargeables.
  //
  // Les autres badges sont des libellés libres (« LA RÈGLE », « 01 ») et ne sont
  // pas comparés — mais un libellé libre d'un côté face à un badge d'état de
  // l'autre est signalé, sinon la correspondance se perdrait en silence.
  const ETATS = { ÉCRIT: 'WRITTEN', 'À VENIR': 'COMING' }
  const badges = (html) =>
    [...html.matchAll(/<span class="num">([^<]*)<\/span>/g)].map((m) => m[1].trim())

  const badgesFr = badges(fr)
  const badgesEn = badges(en)
  if (badgesFr.length !== badgesEn.length) {
    echec(`badges : ${badgesFr.length} en français, ${badgesEn.length} en anglais`)
  } else {
    badgesFr.forEach((badgeFr, i) => {
      const badgeEn = badgesEn[i]
      const attenduEn = ETATS[badgeFr]
      const enEstUnEtat = Object.values(ETATS).includes(badgeEn)
      if (attenduEn && badgeEn !== attenduEn) {
        echec(`badge ${i + 1} : « ${badgeFr} » en français, « ${badgeEn} » en anglais`)
      } else if (!attenduEn && enEstUnEtat) {
        echec(`badge ${i + 1} : « ${badgeFr} » en français face à l'état « ${badgeEn} » en anglais`)
      }
    })
  }

  // Le CSS et le JavaScript doivent rester identiques : la version anglaise
  // est fabriquée par substitution de texte, elle n'a aucune raison d'avoir
  // sa propre mise en forme. Si les deux divergent, c'est qu'on a édité la
  // page traduite à la main — et la prochaine génération l'écrasera.
  const style = (html) => html.slice(html.indexOf('<style>'), html.indexOf('</style>'))
  if (style(fr) !== style(en)) {
    echec("le CSS des deux langues diffère — la page anglaise a été éditée à la main")
  }

  if (!/<html lang="en">/.test(en)) echec('docs/en/index.html ne déclare pas lang="en"')

  // Un mot français resté dans la page anglaise est le symptôme le plus
  // fréquent d'une substitution oubliée. On ne cherche pas tous les mots :
  // quelques-uns, très fréquents, suffisent à révéler l'oubli.
  const corps = en.slice(en.indexOf('<body'))
  const sansCommentaires = corps.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
  for (const mot of [' Ce qu', ' Nos principes', 'Logiciel libre', 'gratuit', 'Votre parc,']) {
    if (sansCommentaires.includes(mot)) {
      echec(`texte français resté dans la page anglaise : « ${mot.trim()} »`)
    }
  }
}

/* ── 1 bis. Le calculateur aussi a deux langues ──────────────────────────── */

/**
 * **La comparaison des deux langues ne regardait que la page d'accueil.**
 *
 * Trou trouvé le 13 août 2026 en ajoutant la carte des 512 canaux : rien
 * n'obligeait la page anglaise du calculateur à suivre. Une section entière
 * pouvait exister d'un seul côté, et cette suite affichait « deux langues
 * alignées » — elle disait vrai, mais d'une seule page sur quatre.
 *
 * C'est la même famille que les badges d'état : *une vérification dont on a
 * étendu la confiance au-delà de ce qu'elle regarde*. Le symptôme est
 * identique — on ne cherche plus à la main ce qu'on croit couvert.
 *
 * Le calculateur est comparé plus sévèrement que l'accueil, et c'est
 * justifié : il porte du **code**. Une page traduite dont le script diverge
 * n'est pas une page mal traduite, c'est un calculateur qui donne un autre
 * résultat selon la langue du lecteur.
 */
const cheminDmxFr = join(DOCS, 'calculateur-dmx.html')
const cheminDmxEn = join(DOCS, 'en/calculateur-dmx.html')

/**
 * **Chaque identifiant visé par le script doit exister comme balise.**
 *
 * Dans les deux langues, et d'abord dans la française — c'est elle qu'on
 * modifie. Une coquille dans un `$('premiereAdrese')` rend `null`, la page se
 * charge, s'affiche parfaitement, et le champ ne pilote plus rien. Rien dans le
 * typecheck ni dans les suites du calcul ne peut le voir : le calcul est juste,
 * c'est le fil entre l'écran et lui qui est coupé.
 *
 * C'est la même leçon que Scenika bloquée par un CSS manquant : **un mécanisme
 * peut exister dans le code et rester inatteignable à l'écran.**
 */
for (const [nom, chemin] of [
  ['calculateur-dmx.html', cheminDmxFr],
  ['en/calculateur-dmx.html', cheminDmxEn]
]) {
  if (!existsSync(chemin)) continue
  const html = readFileSync(chemin, 'utf-8')
  for (const id of new Set([...html.matchAll(/\$\('([\w-]+)'\)/g)].map((m) => m[1]))) {
    if (!html.includes(`id="${id}"`)) {
      echec(`${nom} : le script vise « ${id} », qui n'existe dans aucune balise`)
    }
  }
}

if (!existsSync(cheminDmxEn)) {
  echec('docs/en/calculateur-dmx.html est absent')
} else {
  const dmxFr = readFileSync(cheminDmxFr, 'utf-8').replaceAll('\r\n', '\n')
  const dmxEn = readFileSync(cheminDmxEn, 'utf-8').replaceAll('\r\n', '\n')

  const compter = (html, motif) => (html.match(motif) ?? []).length
  for (const [nom, motif] of [
    ['sections', /<section\b/g],
    ['titres de section', /<h2>/g],
    ['champs de saisie', /<input\b/g],
    ['boutons', /<button\b/g],
    ['pastilles de légende', /class="pastille"/g]
  ]) {
    const a = compter(dmxFr, motif)
    const b = compter(dmxEn, motif)
    if (a !== b) echec(`calculateur, ${nom} : ${a} en français, ${b} en anglais`)
  }

  // Le CSS est identique par construction : seule la palette de la maison le
  // décide, et une page traduite n'a aucune raison d'avoir sa mise en forme.
  const style = (html) => html.slice(html.indexOf('<style>'), html.indexOf('</style>'))
  if (style(dmxFr) !== style(dmxEn)) {
    echec('le CSS des deux calculateurs diffère — la page anglaise a été éditée à la main')
  }

  /**
   * **Les identifiants pilotés par le script doivent exister des deux côtés.**
   *
   * Comparer le script entier serait un faux échec permanent : il contient des
   * chaînes visibles, et elles sont traduites — c'est le but. On compare donc
   * ce qui doit être identique par nécessité : les `id` que le script cherche.
   * Un `id` présent d'un seul côté, et la moitié des lecteurs a une page qui
   * s'affiche et ne calcule rien.
   */
  const identifiants = (html) =>
    [...html.matchAll(/\$\('([\w-]+)'\)/g)].map((m) => m[1])
  const manquants = [...new Set(identifiants(dmxFr))].filter(
    (id) => !dmxEn.includes(`id="${id}"`)
  )
  for (const id of manquants) {
    echec(`calculateur anglais : le script vise « ${id} », qui n'existe dans aucune balise`)
  }

  // Les fonctions du module partagé doivent être importées des deux côtés :
  // c'est ce qui garantit que les deux pages font vraiment le même calcul.
  const importees = (html) =>
    (html.match(/import \{([\s\S]*?)\} from/)?.[1] ?? '')
      .split(',')
      .map((n) => n.trim())
      .filter(Boolean)
      .sort()
  const a = importees(dmxFr).join(', ')
  const b = importees(dmxEn).join(', ')
  if (a !== b) {
    echec(`calculateur : imports différents — français « ${a} », anglais « ${b} »`)
  }
}

/* ── 2. Le calculateur trouve sa formule une fois le site préparé ────────── */

// GitHub Pages ne sert que `docs/`. Le calcul DMX, lui, vit dans `commun/`,
// **hors de `docs/`** — parce qu'il tourne aussi dans l'application et dans les
// tests. Un import `../commun/dmx.js` remonterait au-dessus de la racine
// servie : la page s'afficherait et le calculateur serait mort, sans erreur
// visible avant la mise en ligne.
//
// D'où `npm run site:preparer`, qui en dépose une copie dans `docs/commun/`.
// La copie n'est jamais commitée : la formule vit à un seul endroit.
const pageDmx = readFileSync(join(DOCS, 'calculateur-dmx.html'), 'utf-8')
if (!pageDmx.includes("from './commun/dmx.js'")) {
  echec("calculateur-dmx.html n'importe plus './commun/dmx.js' — le site publié ne trouverait pas le calcul")
}
if (existsSync(join(RACINE, 'docs/commun/dmx.js'))) {
  const copie = readFileSync(join(RACINE, 'docs/commun/dmx.js'), 'utf-8')
  const source = readFileSync(join(RACINE, 'commun/dmx.js'), 'utf-8')
  if (copie !== source) {
    echec('docs/commun/dmx.js a dérivé de commun/dmx.js — relancer `npm run site:preparer`')
  }
}

/* ── 3. Aucun lien mort, aucune ressource externe ────────────────────────── */

const pages = [
  ...readdirSync(DOCS).filter((f) => f.endsWith('.html')).map((f) => ['.', f]),
  ...(existsSync(join(DOCS, 'en'))
    ? readdirSync(join(DOCS, 'en')).filter((f) => f.endsWith('.html')).map((f) => ['en', f])
    : [])
]

for (const [dossier, fichier] of pages) {
  const html = readFileSync(join(DOCS, dossier, fichier), 'utf-8')
  const etiquette = `${dossier === '.' ? '' : dossier + '/'}${fichier}`

  for (const [, cible] of html.matchAll(/href="([^"#:]+\.html)"/g)) {
    if (!existsSync(resolve(DOCS, dossier, cible))) echec(`lien mort dans ${etiquette} → ${cible}`)
  }
  for (const [, cible] of html.matchAll(/src="([^"]+\.(?:png|jpg|svg))"/g)) {
    if (!existsSync(resolve(DOCS, dossier, cible))) echec(`image absente dans ${etiquette} → ${cible}`)
  }
  for (const [, ancre] of html.matchAll(/href="#([^"]+)"/g)) {
    if (!html.includes(`id="${ancre}"`)) echec(`ancre morte dans ${etiquette} → #${ancre}`)
  }

  // GitHub Pages doit pouvoir servir ces fichiers seuls : rien ne doit être
  // chargé depuis un autre serveur, ni police, ni script, ni feuille de style.
  if (/<script[^>]+src=/.test(html)) echec(`${etiquette} charge un script externe`)
  if (/<link[^>]*rel="stylesheet"/.test(html)) echec(`${etiquette} charge une feuille de style externe`)
  for (const [, url] of html.matchAll(/(?:src|href)="(https?:[^"]+)"/g)) {
    const permis = url.startsWith('https://github.com/ResonLab') ||
                   url.startsWith('https://resonlab.github.io')
    if (!permis) echec(`${etiquette} référence une ressource externe : ${url}`)
  }
}

console.log(
  echecs === 0
    ? `SITE COHÉRENT (${pages.length} pages, deux langues alignées)`
    : `${echecs} PROBLÈME(S) SUR LE SITE`
)
process.exit(echecs === 0 ? 0 : 1)
