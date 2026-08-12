/**
 * Point d'entrée du test du plan de scène : il réunit ce que la suite exerce.
 *
 * Il existe pour une seule raison : esbuild a besoin d'un fichier à compiler,
 * et on veut compiler **le vrai code du projet**, pas une réécriture. Rien
 * d'autre ne doit vivre ici — surtout aucune règle de gestion.
 */
export { definirContexte } from '../src/main/contexte'
export { ouvrirBaseDeDonnees, fermerBaseDeDonnees } from '../src/main/db/database'
export { ajouterMateriel } from '../src/main/domaines/parc'
export { modesDisponibles } from '../src/partage/types'
export {
  deplacerAppareil,
  listerScene,
  poserAppareil,
  retirerAppareil,
  viderScene
} from '../src/main/domaines/scene'
