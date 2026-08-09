# CONTEXTE — Scenika

> **À lire en premier si tu reprends ce projet, IA ou humain.**
> La vue d'ensemble des trois applications est dans [../LISEZ-MOI.md](../LISEZ-MOI.md).
> Ce fichier-ci ne concerne que Scenika.

**État : le calcul DMX est écrit et éprouvé. Rien d'autre.** La coquille de
l'application attend une décision (section 3). Ce document décrit ce qui a été
décidé, ce qui ne l'est pas, et les pièges connus d'avance.

```bash
cd Scenika && npm test      # aucune installation nécessaire
```

`commun/dmx.ts` ne dépend de rien — ni interface, ni base, ni Electron. **Node 24
exécute le TypeScript tel quel**, donc pas de `npm install`, pas d'outil de
compilation : un test qu'on peut lancer sans rien installer reste lançable dans
six mois. C'est ce qui a permis de commencer par le calcul sans attendre le
choix desktop ou web.

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

## 5. Pièges connus d'avance

**Un projecteur occupe plusieurs canaux.** Un appareil en mode 16 canaux adressé
en 001 occupe 001 à 016 : le suivant ne peut pas commencer avant 017. Le
chevauchement d'adresses est *l'*erreur classique, et c'est la première chose que
le calculateur doit détecter.

**Un univers DMX contient 512 canaux.** Au-delà, il faut un second univers. Le
calcul doit le dire au lieu de produire un patch impossible.

**Le même modèle de projecteur existe en plusieurs modes.** Le nombre de canaux
dépend du mode choisi, pas seulement du modèle. Le stocker par appareil.

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
