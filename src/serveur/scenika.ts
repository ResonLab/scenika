import { demarrerServeur, type ApplicationServie, type OptionsServeur } from 'nexika'
import { definirContexte } from '../main/contexte'
import { fermerBaseDeDonnees, ouvrirBaseDeDonnees } from '../main/db/database'
import { REGISTRE } from './registre'
import { roleExige } from './droits'
import { PAGE_MOBILE } from './pageMobile'

/**
 * Scenika, telle que le serveur commun la voit.
 *
 * Tout ce qui n'est pas propre à Scenika — transport, comptes, sessions,
 * certificat, ligne de commande — vit dans Nexika, **le même serveur que celui
 * d'Ohmnia**. Une entreprise qui facture et qui loue du matériel n'installe pas
 * deux serveurs de comptes : deux serveurs de comptes qui divergent valent
 * moins que pas de serveur du tout.
 *
 * Ne sont déclarés ici que les canaux de Scenika, leurs droits, et sa base.
 */
export const APPLICATION_SCENIKA: ApplicationServie = {
  nom: 'Scenika',
  registre: REGISTRE,
  roleExige,
  ouvrirBase: (dossierDonnees, version) => {
    definirContexte({ dossierDonnees, version })
    ouvrirBaseDeDonnees()
  },
  fermerBase: fermerBaseDeDonnees,
  /**
   * La consultation mobile, servie sur la racine du serveur.
   *
   * Elle n'ouvre aucun accès : c'est un document statique qui passe par
   * `session:ouvrir` et par les mêmes canaux que n'importe quel poste. Voir
   * `pageMobile.ts` pour ce qu'elle fait et ce qu'elle refuse de faire.
   */
  pageMobile: PAGE_MOBILE
}

export function demarrerServeurScenika(
  options: Omit<OptionsServeur, 'application'>
): ReturnType<typeof demarrerServeur> {
  return demarrerServeur({ ...options, application: APPLICATION_SCENIKA })
}
