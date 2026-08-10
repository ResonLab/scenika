import {
  ajouterMateriel,
  listerMateriel,
  modifierMateriel,
  resumeParc,
  supprimerMateriel
} from '../main/domaines/parc'
import {
  changerEtat,
  creerLocation,
  disponibilites,
  enregistrerRetour,
  lignesDeFacture,
  listerLocations,
  supprimerLocation
} from '../main/domaines/locations'

/**
 * Ce que Scenika expose par le réseau, canal par canal.
 *
 * **Les noms sont exactement ceux de l'IPC.** C'est la règle qui empêche les
 * deux modes de diverger : une opération se comporte pareil qu'elle passe par
 * la fenêtre ou par le réseau, puisque c'est la même fonction métier qui
 * tourne. Une faute de frappe ici fait échouer `npm test`.
 */
export type Operation = (...arguments_: unknown[]) => unknown

export const REGISTRE: Record<string, Operation> = {
  /* Parc matériel */
  'parc:lister': () => listerMateriel(),
  'parc:ajouter': (materiel) => ajouterMateriel(materiel as never),
  'parc:modifier': (materiel) => modifierMateriel(materiel as never),
  'parc:supprimer': (id) => supprimerMateriel(id as number),
  'parc:resume': () => resumeParc(),

  /* Locations */
  'locations:lister': () => listerLocations(),
  'locations:disponibilites': () => disponibilites(),
  'locations:creer': (location, lignes) => creerLocation(location as never, lignes as never),
  'locations:changerEtat': (id, etat) => changerEtat(id as number, etat as never),
  'locations:enregistrerRetour': (ligneId, quantite) =>
    enregistrerRetour(ligneId as number, quantite as number),
  'locations:supprimer': (id) => supprimerLocation(id as number),
  'locations:lignesDeFacture': (id) => lignesDeFacture(id as number)
}
