/**
 * Point d'entrée du test des locations : il réunit ce que la suite exerce.
 *
 * Il existe pour une seule raison : esbuild a besoin d'un fichier à compiler,
 * et on veut compiler **le vrai code du projet**, pas une réécriture. Rien
 * d'autre ne doit vivre ici — surtout aucune règle de gestion.
 */
export { definirContexte } from '../src/main/contexte'
export { ouvrirBaseDeDonnees, fermerBaseDeDonnees } from '../src/main/db/database'
export { ajouterMateriel } from '../src/main/domaines/parc'
export {
  changerEtat,
  creerLocation,
  disponibilites,
  enregistrerRetour,
  lignesDeFacture,
  listerLocations,
  supprimerLocation
} from '../src/main/domaines/locations'
