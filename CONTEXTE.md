# CONTEXTE — Scenika

> **À lire en premier si tu reprends ce projet, IA ou humain.**
> La vue d'ensemble des trois applications est dans [../LISEZ-MOI.md](../LISEZ-MOI.md).
> Ce fichier-ci ne concerne que Scenika.

**État au 10 août 2026 — quatre écrans, bilingue, multi-postes, publiée.**

| | |
|---|---|
| **Parc matériel** | écrit — avec les modes DMX multiples d'un même projecteur |
| **Locations** | écrit — avec la disponibilité calculée et ce qui n'est pas revenu |
| **Plan de scène** | écrit — on pose les projecteurs, on voit adresse et puissance |
| **Tableaux électriques** | écrit — prises réelles, disjoncteur de tête, répartition automatique |
| **Puissance** | écrit — répartition sur les circuits, à partir des watts du parc |
| **Calculateur DMX** | écrit, relié au parc ; carte des 512 canaux ; page publique gratuite bilingue |

**Français et anglais** dans toute l'application (188 clés). **Multi-postes** par
Nexika, éprouvé par le réseau. **Conditions d'utilisation** avec écran
d'acceptation, et **guide de prise en main** en page et en PDF.

**La 0.2.0 est publiée** pour Windows et Linux — `.exe`, AppImage et `.deb` — et
c'est elle que téléchargent les visiteurs. Elle apporte tout ce qui précède : la
0.1.0 n'avait ni Location, ni Puissance, ni multi-postes.

`npm run verifier` : typecheck + 10 suites.

**Un bug à ne jamais réintroduire, trouvé en lançant l'application et pas en la
relisant :** `.conditions-texte` n'avait aucune règle CSS. La zone n'était donc
pas une boîte à défilement, son `onScroll` ne se déclenchait jamais, la case
d'acceptation ne s'activait plus — et **l'application ne démarrait plus du
tout**. Le mécanisme existait dans le code et était inatteignable à l'écran.
`tests/coherence-conditions.mjs` exige désormais `max-height` et `overflow-y`,
et qu'un texte tenant sans défiler compte comme lu.

```bash
cd Scenika && npm install && npm run dev
cd Scenika && npm run verifier   # typecheck + tests
```

Structure calquée sur Ohmnia, et pour la même raison : la logique métier vit
dans `src/main/domaines/`, **sans Electron**, pour que le serveur multi-postes
puisse l'exposer par le réseau sans rien réécrire. Une société de location a
plusieurs personnes qui touchent au même parc — c'est le cas d'usage le plus
évident du mode multi-postes.

Ce qui est repris d'Ohmnia sans discuter : `node:sqlite` plutôt que
`better-sqlite3`, preload compilé en CommonJS, `app.setName()` explicite,
checkpoint WAL avant fermeture, `overflow-x` sur les tableaux larges. Chacun de
ces points est un bug déjà payé une fois.

```bash
cd Scenika && npm test      # aucune installation nécessaire
```

`commun/dmx.js` ne dépend de rien — ni interface, ni base, ni Electron.

**Écrit en JavaScript, types en JSDoc, et c'est délibéré.** Ce fichier doit
tourner à trois endroits : la page web gratuite (navigateur), les tests (Node)
et plus tard l'application (Electron). En TypeScript, il faudrait le compiler
pour l'envoyer au navigateur — et une formule qui a besoin d'un outil pour
arriver quelque part finit dupliquée le jour où l'outil gêne. Les trois
chargent **le même fichier**, sans `npm install` ni build.

`docs/calculateur-dmx.html` est la page gratuite : elle importe ce module et ne
recalcule rien. **Une vérification refuse qu'elle redéfinisse une fonction du
module ou réécrive la limite de 512** — c'est le seul moyen d'empêcher les deux
calculateurs de diverger. Testée pour de vrai dans un navigateur : ajout
d'appareils, bascule au second univers au bon canal, plages libres.

La page a besoin d'être servie en HTTP (les modules ES ne se chargent pas
depuis `file://`). En production, ce sera GitHub Pages.

Ce qu'il fait déjà : plage occupée par un appareil, détection des
chevauchements, dépassement de fin d'univers avec la dernière adresse possible,
patch proposé qui bascule d'univers tout seul, plages restées libres. Les trois
pièges de la section 5 ont chacun leur vérification.

---

## 1. Ce que c'est

Application de gestion pour l'événementiel : **le parc matériel son et lumière**
d'une société de location ou d'un technicien indépendant.

Elle remplace **StockR**, un prototype web abandonné
([github.com/Leimmingz/StockR](https://github.com/Leimmingz/StockR), JavaScript,
HTML, CSS, dernière mise à jour juillet 2026). Le nom change parce que « StockR »
sonne comme un outil générique de stock ; Scenika dit la scène.

**Aucun code de StockR n'est repris tel quel.** Avant d'écrire quoi que ce soit,
le relire : il contient forcément des idées d'écrans et des cas réels rencontrés
qui méritent d'être gardés, même si le code part.

### Les modules prévus

| Module | Ce qu'il fait |
|---|---|
| **Parc matériel** | Inventaire du matériel : enceintes, projecteurs, câbles, accessoires. États, quantités, emplacements. |
| **Location** | Qui a quoi, depuis quand, jusqu'à quand. Départs et retours. |
| **Puissance** | Calcul de la consommation d'une installation, par circuit, pour ne pas faire sauter un disjoncteur. |
| **Adressage DMX** | Patch des projecteurs : adresses, univers, chevauchements. Voir section 4. |

---

## 2. Décisions prises

- **Nom** : Scenika. **Dégradé** : `#FFC961` → `#F2751A` (ambre).
  Logo dans [../Identite/scenika.svg](../Identite/scenika.svg).
- **Les principes de la maison s'appliquent** : code simple à relire, aucune
  connexion, tout en français. Voir [../LISEZ-MOI.md](../LISEZ-MOI.md).
- **Le serveur multi-postes servira Scenika**, au même titre qu'Ohmnia. Une
  société de location a plusieurs personnes qui touchent au même parc : c'est
  même le cas d'usage le plus évident des deux.
- **Scenika exportera des lignes de facture qu'Ohmnia importera.** Une location
  se facture. Ne pas refaire un module de facturation ici.

---

## 3. Desktop, puis une page web — tranché

**Scenika est une application desktop, comme Ohmnia** (Electron). La
consultation mobile viendra plus tard, comme **page servie par le serveur
multi-postes**, sur le réseau local.

Pourquoi ce sens-là :

- Le serveur multi-postes est **déjà écrit et éprouvé** dans Ohmnia. Une
  application desktop s'y branche directement ; c'est le chemin le plus court
  vers quelque chose d'utilisable.
- Les habitudes et le code d'Ohmnia se réutilisent : couche métier sans
  Electron, comptes et droits, sauvegardes, migrations de schéma.
- Cohérent avec la promesse de la maison : les données restent chez vous, et
  ça fonctionne hors ligne par nature.

**L'argument mobile n'est pas écarté, il est reporté.** Un inventaire se
consulte debout dans un dépôt, un téléphone à la main : c'est un vrai besoin,
pas un confort. Mais il suppose un serveur qui tourne — donc il vient *après*,
pas à la place. La page web de consultation sera servie par le même serveur,
sur les mêmes données, sans seconde base ni seconde vérité.

**Conséquence à tenir dès la première ligne** : comme dans Ohmnia, la logique
métier ne doit jamais importer Electron. C'est ce qui permettra au serveur de
servir la page mobile plus tard sans rien réécrire.

---

## Ce qui reste à faire — au 9 août 2026

Par ordre de valeur. Les trois premiers points sont communs aux applications de
la maison : **regarder comment Ohmnia les a résolus avant de recommencer**.

### 1. Le site de l'application — **fait**

En ligne sur <https://resonlab.github.io/scenika/>, en français et en anglais
(`docs/en/`). Même direction artistique que `Site/index.html`, dégradé ambre.
La clé de thème `resonlab-theme` est **commune à tous les sites de la maison** :
un choix clair/sombre vaut pour l'ensemble.

**`site/` est devenu `docs/`** : GitHub Pages ne sert que la racine du dépôt ou
`docs/`, pas un dossier au nom libre.

**Le piège trouvé en déplaçant, à ne pas réintroduire.** La page du calculateur
importait `../commun/dmx.js`. Servie par Pages depuis `docs/`, elle remontait
au-dessus de la racine servie : la page se serait affichée normalement et le
calculateur aurait été mort. **En local, rien ne l'aurait montré**, puisque le
dossier y est servi depuis la racine du dépôt.

L'import vise maintenant `./commun/dmx.js`, et `npm run site:preparer` y dépose
une copie. **La copie est ignorée par git** — la formule vit à un seul endroit,
c'est la règle numéro un. `.github/workflows/site.yml` refait la copie à chaque
publication, après avoir passé `tests/coherence-site.mjs`.

**La page anglaise est fabriquée depuis la française par substitutions
explicites**, CSS et JavaScript inchangés. `tests/coherence-site.mjs` compare
les deux structures — sections, cartes, titres, boutons — et **refuse que le CSS
diverge** : s'il diffère, c'est que la page traduite a été éditée à la main, et
la prochaine génération l'écrasera. On ne peut pas comparer une traduction mot à
mot ; on peut constater qu'une section a été ajoutée d'un seul côté.

*Non vérifié : le calculateur n'a pas été exécuté dans un navigateur sur
l'adresse publique — le domaine est bloqué depuis l'outil de navigation. Ce qui
est vérifié, c'est que les pages répondent en 200 et que le module servi est
identique octet pour octet à `commun/dmx.js`.*

### 2. Français et anglais — **fait, site et application**

`src/partage/i18n.ts`, 115 clés, sélecteur de langue dans le menu. La langue est
**propre au poste** (localStorage) : le jour où plusieurs postes partagent le
parc par Nexika, interdire à un collègue de lire en anglais parce qu'un autre a
choisi le français n'aurait aucun sens.

**Deux endroits n'ont pas pu recevoir `t()` directement :**

· **Les refus du processus principal** étaient des phrases françaises. Il ne
  sait pas quelle langue la fenêtre affiche : `valider()` rend maintenant une
  **clé**, et les deux versions du texte vivent dans `i18n.ts`. Quand le message
  cite une valeur, clé et valeur voyagent **en JSON** — un premier jet employait
  un séparateur invisible, illisible à la relecture.

· **Les problèmes de patch** viennent de `commun/dmx.js`, partagé avec la page
  web. Le module rend un **`code` et ses `donnees`** en plus de son message
  français. On repart du code : une traduction qui découpe une phrase se trompe
  au premier changement de formulation.

**Piège trouvé en affichant vraiment les deux langues** : `t()` repliait le
français sur l'anglais. Les clés dont le français vit ailleurs ont un français
vide **exprès** — un francophone recevait donc le texte anglais. Le repli ne va
plus que de l'anglais vers le français.

`tests/traductions.mjs` refuse une clé sans anglais **ni** français, une clé
déclarée jamais employée, et tout texte français accentué en dur dans un
composant. Éprouvé en le cassant.

Le mécanisme est celui d'Ohmnia,
`APP/src/shared/i18n.ts` : un objet `TEXTES`, une clé préfixée par écran, et
`npm run typecheck` rejette les clés inconnues. **Reprendre ce mécanisme, pas en
inventer un autre.** Les messages d'erreur du main process devront aussi y
passer, ou être renvoyés sous forme de clé.

### 3. Empaquetage Windows et Linux

`.exe` (NSIS), AppImage et `.deb`. **Ohmnia a déjà tout** : `electron-builder.yml`
et `.github/workflows/construire.yml`, qui construit les deux systèmes et dépose
une release en brouillon sur une étiquette `v*`. Les recopier en changeant
`appId`, `productName`, l'icône et le mainteneur.

Deux pièges déjà payés sur Ohmnia :

- **electron-builder ne sait pas produire un paquet Linux depuis Windows.** Il
  faut GitHub Actions (ou WSL).
- **Le `.deb` exige `fakeroot`**, absent des runners Ubuntu 24.04 : le workflow
  l'installe explicitement, sinon la construction échoue en quelques secondes
  alors que l'AppImage passe.

L'icône doit être un PNG d'au moins 256×256 dans `build/icon.png`. Les PNG de la
maison sont dans `Identite/png/`.

### 4. Propre à Scenika — **presque tout est fait**

Au 10 août 2026, il ne reste que le dernier point.

**✔ Module Location.** Qui a quoi, depuis quand, jusqu'à quand, et ce qui n'est
pas revenu. La règle à ne jamais casser : **le parc ne bouge pas quand du
matériel part.** On pourrait décrémenter les quantités à la sortie et les
remonter au retour — ce serait plus simple et faux. Le parc dit ce qu'on
**possède** ; ce qui est dehors se **calcule** à partir des locations `sortie`.
Sinon une location oubliée laisse un stock faux que rien ne rattrape, et on ne
sait plus si l'écart vient d'un vol, d'une casse ou d'une erreur de saisie.

**Seules les locations `sortie` retiennent du matériel.** Compter les `prevue`
rendrait le parc indisponible dès qu'on esquisse un devis — et on cesserait de
saisir les devis.

**✔ Module Puissance** (`commun/puissance.js`). Le plus gourmand d'abord, puis
dans le premier circuit qui l'accepte. **La règle est simple exprès** : un
technicien doit pouvoir refaire la répartition de tête sur le terrain, parce que
c'est à la main qu'il branche. Un algorithme plus fin gagnerait parfois un
circuit et deviendrait invérifiable. Un appareil plus gourmand qu'un circuit
entier est **refusé et nommé**, jamais casé de force.

**✔ Export de lignes de facture vers Ohmnia.** `lignesDeFacture()` prépare
désignation, quantité, prix et référence d'inventaire. Scenika ne facture pas :
refaire un module de facturation voudrait dire tenir deux fois les règles de TVA
et de numérotation.

**✔ Branchement sur Nexika.** `src/serveur/` — registre, droits, `scenika.ts`,
`principal.ts`. `npm run serveur:build` produit `scenika-serveur.mjs`. Vérifié en
vrai : assistant de mise en service, HTTPS sur le réseau, session, ajout de
matériel et lecture des disponibilités **par le réseau**, 401 sans jeton.

**✔ Le plan de scène.** On pose les projecteurs du parc sur un plan, on les
déplace à la souris, et chacun montre son adresse DMX et sa puissance. **Ce que
le plan apporte et qu'une feuille de patch ne donne pas : où.** Un tableau dit
qu'un appareil est en 145 ; il ne dit pas qu'il est le voisin de celui qui
partage sa prise. Les positions sont des **fractions du plan**, jamais des
pixels : en pixels, tous les projecteurs dériveraient au changement d'écran.

**✔ Les tableaux électriques et leur répartition** (`commun/tableaux.js`). Un
tableau a des prises, chacune avec son calibre, **et un disjoncteur de tête**.
Les deux limitent, et c'est le second qu'on oublie : six prises de 16 A
derrière un général de 32 A ne donnent pas 96 A. Un général à 0 veut dire « non
déclaré » — le calcul n'invente alors aucune limite plutôt que d'en supposer
une fausse.

**La différence avec l'écran Puissance est le cœur du sujet** : celui-ci répond
à « de combien de circuits ai-je besoin ? » en inventant autant de circuits
identiques qu'il en faut ; celui-là répond à « avec les tableaux que j'ai devant
moi, est-ce que ça rentre ? ». Même règle que `puissance.js` — le plus gourmand
d'abord, la première prise qui l'accepte — et **la même marge de charge**, pas
une seconde. Rien n'est casé de force : « trop gourmand » et « plus de place »
sont distingués, parce qu'ils appellent des gestes différents.

**✔ Les modes DMX multiples.** C'était le piège annoncé au §5 et il est levé.
Le mode appartient à **l'appareil posé**, pas à la référence : deux projecteurs
du même modèle peuvent tourner en 8 et en 16 dans le même spectacle. Le ranger
sur la référence ferait bouger l'un en réglant l'autre.

**✔ La carte des 512 canaux** (`occupationUnivers` dans `commun/dmx.js`). Creux
pour libre, plein pour occupé, hachuré rouge pour chevauchement. **La couleur
ne porte jamais l'information seule** : vert et rouge sont indistinguables pour
près d'un homme sur douze, et un plan de feu se lit dans l'urgence. Un test
vérifie que la carte, `verifierPatch` et `plagesLibres` s'accordent — trois
affichages du même patch qui se contredisent, c'est pire qu'un seul.

**À faire : la page web de consultation mobile**, servie par Nexika sur le
réseau local. Elle était « décidée, reportée » faute de serveur ; **le serveur
tourne maintenant**, donc c'est du travail réel.

---


## Le guide de prise en main

**Le site disait ce que fait l'application et ce qu'elle ne fait pas. Il ne
disait nulle part par où commencer.** Quelqu'un qui télécharge se retrouve
devant une application vide sans savoir quoi cliquer, et c'est là qu'on perd
les gens — pas à la page d'accueil.

`src/partage/guide.ts` porte le texte dans les deux langues et **nulle part ailleurs** :
`scripts/publier-guide.mjs` en déduit `docs/guide.html` et `docs/en/guide.html`,
`scripts/guide-pdf.mjs` en tire les deux PDF joints aux releases. Un guide
recopié à la main divergerait au premier correctif — et c'est le document qu'on
emporte, donc celui qu'on croit.

**L'ordre des étapes n'est pas décoratif** : c'est celui dans lequel
l'application ne refuse rien. `tests/coherence-guide.mjs` le vérifie, en plus de
refuser qu'une page diverge de la source, qu'une traduction soit vide, ou qu'une
étape perde son **piège**. Les pièges sont la moitié de la valeur : ce sont les
choses qu'on ne devine pas et qui coûtent une soirée.

```bash
npm run guide:publier   # les deux pages
npm run guide:pdf       # les deux PDF, dans release/
```

**Trois défauts de ce mécanisme, trouvés en le portant d'une application à
l'autre**, et corrigés dans les quatre dépôts :

· un seuil de longueur prenait « Receipts » et « Backups » — des titres anglais
  parfaitement traduits — pour des traductions vides. On teste désormais le
  vide, pas la longueur. **Un faux échec use un contrôle aussi sûrement qu'un
  faux succès** ;
· le caractère `&` s'écrit `&amp;` en HTML : le contrôle annonçait un texte
  disparu alors que la page était juste ;
· une liste figée d'ancres à réécrire laissait des ancres mortes sur le guide,
  les sections d'une page d'accueil ne portant pas les mêmes noms d'une
  application à l'autre. Toutes les ancres renvoient maintenant à l'accueil.

**Le PDF a révélé un bug qui traînait dans la maison depuis des semaines** :
« `fabriquer-icones.mjs` échoue au-delà de la première image ». Ce n'est ni le
chemin ni le fichier temporaire — **créer une seconde `BrowserWindow` après
avoir travaillé dans la première fait échouer son chargement** sur `ERR_FAILED`.
Une seule fenêtre réutilisée, et les deux PDF sortent. *Une hypothèse a été
suivie puis abandonnée, et elle est notée dans le code : `loadFile` produit bien
sous Windows une adresse mêlant `file:///` et des antislashs. C'est vrai, c'est
corrigé, et ça n'a rien changé.*

---

## 4. Le calculateur DMX : deux versions, une seule formule

Décidé, et le détail est dans [../LISEZ-MOI.md](../LISEZ-MOI.md) :

- une **page web gratuite** sur le site de Scenika, qui fait un calcul,
  parfaitement, sans rien retenir ;
- un **module beaucoup plus complet** dans l'application, relié au parc réel :
  puissance des circuits, feuille de patch imprimable, patch mémorisé.

**Le calcul lui-même vit dans un seul fichier partagé par les deux.** C'est la
règle numéro un d'Ohmnia, et c'est exactement le genre de code qui diverge si on
le duplique.

**L'onglet public s'appelle « Calculateur DMX », pas « Adresso ».** Personne ne
cherche « Adresso » ; on tape « calculateur DMX ». Adresso reste le nom du
produit, affiché dans la page.

Référence utile, à regarder avant de concevoir l'écran :
<https://showtrak.co.uk/tools/lighting/dmx-calculator>

---

## 4 bis. Les conditions d'utilisation

`src/partage/conditions.ts` porte le texte **en français et en anglais**, et
**nulle part ailleurs** : `scripts/publier-conditions.mjs` en déduit
`docs/conditions.html` et `docs/en/terms.html`. Recopié à la main, il
divergerait — et deux versions d'un même engagement qui divergent, c'est pire
que pas d'engagement : on ne sait plus laquelle on a acceptée.

**Le point 2 est la raison d'être du texte** : le calcul de puissance n'est pas
un contrôle électrique. Il ignore la longueur et la section des câbles, l'état
du tableau, la simultanéité réelle, et les appels de courant à l'allumage.

**L'écran bloque l'application**, la case ne s'active qu'après défilement
complet, et l'acceptation est liée à `VERSION_CONDITIONS` : incrémenter la
version fait relire. L'accord vit dans le **navigateur du poste**, pas en base —
un accord rangé dans la base commune vaudrait pour un collègue qui n'a rien lu.

`tests/coherence-conditions.mjs` compare les deux, vérifie la version, et refuse
que les mises en garde disparaissent. **Un de ses contrôles n'a pas mordu au
premier essai** : les phrases de référence portaient une apostrophe droite, les
pages une apostrophe typographique. Il ne pouvait donc jamais échouer tout en
affichant OK. Les tournures surveillées évitent désormais toute apostrophe, et
un second contrôle vérifie qu'elles existent encore dans la source.

*Réserve : ce texte est clair et honnête, il n'est pas validé par un juriste.*

---

## 5. Pièges connus d'avance

**Un projecteur occupe plusieurs canaux.** Un appareil en mode 16 canaux adressé
en 001 occupe 001 à 016 : le suivant ne peut pas commencer avant 017. Le
chevauchement d'adresses est *l'*erreur classique, et c'est la première chose que
le calculateur doit détecter.

**Un univers DMX contient 512 canaux.** Au-delà, il faut un second univers. Le
calcul doit le dire au lieu de produire un patch impossible.

**Le même modèle de projecteur existe en plusieurs modes.** Le nombre de canaux
dépend du mode choisi, pas seulement du modèle. Le stocker par appareil.
**Fait** : `materiel.modes_dmx` porte les modes possibles, et
`scene_appareil.canaux_dmx` celui qui est réglé sur cette machine-ci.

**La puissance n'est pas qu'une addition.** Un circuit 16 A en 230 V tient environ
3 600 W en théorie, moins en pratique. Prévoir une marge et l'afficher. Ne jamais
laisser croire à une certitude électrique : une erreur ici fait sauter un
spectacle, ou pire.

**Le matériel loué n'est pas le matériel possédé.** Un parc contient les deux, et
les mélanger fausse les inventaires. Le distinguer dès le schéma de la base.

---

## 6. Règles héritées d'Ohmnia

Elles ont fait leurs preuves sur un projet publié. Les reprendre telles quelles.

1. **Une formule = un seul endroit.** Toute division protégée contre zéro.
2. **Tout en français** : code, commentaires, noms de colonnes SQL.
3. **Messages d'erreur en français, précis et compréhensibles** — jamais un
   message technique brut.
4. **Ne jamais supprimer la base pour appliquer un changement de schéma.**
   Migrations qui ajoutent, jamais qui détruisent.
5. **Opération sur plusieurs tables → une transaction.**
6. **Copier le fichier de base → vider le journal WAL d'abord.** Sans cela la
   copie est incomplète. Bug réel vécu sur Ohmnia, sauvegardes inutilisables.
7. **Une vérification automatique qui échoue** vaut mieux qu'une documentation
   qui ment. Voir `../APP/tests/` : la documentation d'Ohmnia se vérifie
   elle-même, y compris les compteurs cités dans ce genre de fichier.
8. **Vérifier avant de livrer**, et dire honnêtement ce qui n'a pas pu l'être.

---

## 7. Par où commencer

1. **Lire le code de StockR** et noter ce qui mérite d'être gardé — les idées,
   pas le code.
2. **Trancher desktop ou web** (section 3).
3. **Écrire le schéma de la base** avant toute interface. Le parc matériel est
   le cœur : tout le reste s'y rattache.
4. **Commencer par le module Parc**, seul. Location, puissance et DMX viennent
   après, et dépendent tous de lui.
