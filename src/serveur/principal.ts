import { demarrerDepuisLaLigneDeCommande } from 'nexika'
import { APPLICATION_SCENIKA } from './scenika'
import { VERSION_SERVEUR } from './version'

/**
 * Point d'entrée du serveur de Scenika, compilé en
 * `out/serveur/scenika-serveur.mjs`.
 *
 * Il ne fait que brancher Scenika sur le serveur commun : tout ce qui est
 * vérifiable vit ailleurs.
 */
demarrerDepuisLaLigneDeCommande(
  APPLICATION_SCENIKA,
  process.argv.slice(2),
  VERSION_SERVEUR,
  'scenika-serveur.mjs'
)
