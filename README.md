# Scenika

Gestion pour l'événementiel : **parc matériel son et lumière**, location, calcul
de puissance, adressage DMX.

Application desktop (Electron), 100 % locale. Une application de la maison
[ResonLab](https://github.com/ResonLab).

## Ce qui fonctionne aujourd'hui

- **Parc matériel** : références, catégories, quantités, puissance, canaux DMX,
  emplacements.
- **Calculateur DMX** relié au parc réel : patch proposé, chevauchements
  détectés, bascule d'univers, puissance appelée et nombre de circuits 16 A.
- **Calculateur DMX public**, une page web gratuite qui calcule sans rien
  retenir (`site/calculateur-dmx.html`).

## Une seule formule, trois endroits

`commun/dmx.js` est **le seul endroit** où vit le calcul DMX. La page web,
l'application et les tests chargent le même fichier.

Il est écrit en JavaScript avec les types en JSDoc, délibérément : en
TypeScript il faudrait le compiler pour l'envoyer au navigateur, et une formule
qui a besoin d'un outil pour arriver quelque part finit dupliquée le jour où
l'outil gêne. Une vérification refuse que la page web redéfinisse une fonction
du module ou réécrive la limite de 512 canaux.

## Ce que le calculateur attrape

- **L'erreur d'un rang** : un appareil 16 canaux adressé en 001 occupe 001 à
  016, pas 017. C'est le chevauchement classique.
- **La fin d'univers** : un appareil qui déborde des 512 canaux, avec la
  dernière adresse possible dans le message.
- **Le mode** : le nombre de canaux dépend du mode choisi, pas du modèle. Il est
  stocké par appareil.

## Démarrer

```bash
npm install
npm run verifier   # typecheck + tests
npm run dev
```

## Licence

MIT.
