import { readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'

/**
 * Vérifie que l'interface est réellement traduisible.
 *
 * Le piège que cette suite empêche : traduire les écrans une fois, puis ajouter
 * un bouton en français en dur trois semaines plus tard. Rien ne casse, rien
 * n'échoue — l'application est simplement à moitié anglaise, et personne ne le
 * voit avant qu'un utilisateur anglophone le signale.
 *
 * Trois contrôles :
 *   1. aucune clé de `TEXTES` sans traduction anglaise ;
 *   2. aucune clé déclarée mais jamais employée — une clé morte laisse croire
 *      qu'un écran est traduit alors qu'il ne l'est plus ;
 *   3. aucun texte français visible en dur dans un composant.
 *
 * `npm run typecheck` couvre déjà le cas inverse — employer une clé qui
 * n'existe pas — parce que `t()` n'accepte que les clés de `TEXTES`.
 */
const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), '..')

let echecs = 0
const echec = (message) => {
  console.log(`  ÉCHEC : ${message}`)
  echecs += 1
}

const i18n = readFileSync(join(RACINE, 'src/partage/i18n.ts'), 'utf-8')

/* ── 1. Toute clé a une version anglaise ─────────────────────────────────── */

// On lit le bloc TEXTES seulement : le reste du fichier contient les fonctions.
const bloc = i18n.slice(i18n.indexOf('const TEXTES = {'), i18n.indexOf('} satisfies'))
const entrees = [...bloc.matchAll(/'([\w.]+)':\s*\{([\s\S]*?)\n?\s*\},?\n/g)]

if (entrees.length < 40) {
  echec(`seulement ${entrees.length} clés trouvées — le format de i18n.ts a changé`)
}

// Une famille de clés a un français vide **exprès** : celle des problèmes de
// patch, dont le texte français vit dans `commun/dmx.js`, avec la règle qu'il
// décrit. Partout ailleurs, un français vide est un oubli — et il sortirait à
// l'écran comme une chaîne vide, donc invisible, donc jamais signalé.
const FRANCAIS_AILLEURS = 'probleme.'

for (const [, cle, corps] of entrees) {
  const litteral = (nom) =>
    corps.match(new RegExp(`${nom}:\\s*(['"])((?:[^\\\\]|\\\\.)*?)\\1`))?.[2]

  const en = litteral('en')
  if (en === undefined) echec(`« ${cle} » n'a pas de version anglaise`)
  else if (en.trim() === '') echec(`« ${cle} » a une version anglaise vide`)

  const fr = litteral('fr')
  const francaisAilleurs = cle.startsWith(FRANCAIS_AILLEURS)
  if (fr === undefined) echec(`« ${cle} » n'a pas de version française`)
  else if (fr.trim() === '' && !francaisAilleurs) {
    echec(`« ${cle} » a une version française vide, et son texte ne vit pas ailleurs`)
  } else if (fr.trim() !== '' && francaisAilleurs) {
    echec(`« ${cle} » a un français ici alors qu'il vit déjà dans commun/dmx.js`)
  }
}

/* ── 2. Aucune clé déclarée et jamais employée ───────────────────────────── */

function fichiersTs(dossier) {
  const resultats = []
  for (const nom of readdirSync(dossier)) {
    const chemin = join(dossier, nom)
    if (statSync(chemin).isDirectory()) resultats.push(...fichiersTs(chemin))
    else if (/\.tsx?$/.test(chemin)) resultats.push(chemin)
  }
  return resultats
}

const sources = fichiersTs(join(RACINE, 'src'))
  .filter((f) => !f.endsWith('i18n.ts'))
  .map((f) => readFileSync(f, 'utf-8'))
  .join('\n')

// `i18n.ts` est écarté du relevé des littéraux — il les contient tous, et rien
// n'y paraîtrait jamais inutilisé. Mais c'est là que peuvent vivre des clés
// bâties dynamiquement : on y cherche donc les préfixes, et eux seuls.
const prefixesDynamiques = [...(sources + i18n).matchAll(/`(\w+)\.\$\{/g)].map((m) => `${m[1]}.`)

const inutilisees = []
for (const [, cle] of entrees) {
  // Une clé peut être écrite en toutes lettres — t('parc.titre') — ou bâtie à
  // partir d'un préfixe — t(`categorie.${c}`). On accepte les deux.
  if (sources.includes(`'${cle}'`)) continue
  if (prefixesDynamiques.some((prefixe) => cle.startsWith(prefixe))) continue
  inutilisees.push(cle)
}
if (inutilisees.length > 0) {
  echec(`clés déclarées mais jamais employées : ${inutilisees.join(', ')}`)
}

/* ── 3. Aucun texte français en dur dans un composant ────────────────────── */

// On ne cherche pas « du français » — indécidable. On cherche ce qui le trahit
// à coup sûr dans du code écrit en français : un mot accentué, hors chaîne
// technique, dans du texte que React affichera.
const ACCENTS = /[àâäéèêëîïôöùûüçÀÂÄÉÈÊËÎÏÔÖÙÛÜÇ]/

for (const chemin of fichiersTs(join(RACINE, 'src/renderer'))) {
  const contenu = readFileSync(chemin, 'utf-8')
  const etiquette = chemin.replace(RACINE, '').replace(/\\/g, '/')

  let dansCommentaire = false
  contenu.split('\n').forEach((ligne, index) => {
    const nue = ligne.trim()
    if (nue.startsWith('/*')) dansCommentaire = true
    if (dansCommentaire) {
      if (nue.includes('*/')) dansCommentaire = false
      return
    }
    if (nue.startsWith('//') || nue.startsWith('*')) return

    // Le texte entre balises : > Bonjour <
    const entreBalises = [...ligne.matchAll(/>\s*([^<>{}\n]{3,})\s*</g)].map((m) => m[1])
    for (const texte of entreBalises) {
      if (ACCENTS.test(texte)) {
        echec(`${etiquette}:${index + 1} — texte français en dur : « ${texte.trim()} »`)
      }
    }
  })
}

console.log(
  echecs === 0
    ? `TRADUCTIONS : ${entrees.length} clés, toutes traduites et employées`
    : `${echecs} PROBLÈME(S) DE TRADUCTION`
)
process.exit(echecs === 0 ? 0 : 1)
