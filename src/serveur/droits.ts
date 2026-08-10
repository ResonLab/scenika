import type { Role } from 'nexika'

/**
 * Qui a le droit de quoi — **toute la politique tient dans ce fichier**.
 *
 * Écrite à la main, opération par opération, jamais déduite du nom du canal.
 * Une règle du genre « `lister` = lecture, le reste = écriture » paraît
 * séduisante et se trompe en silence : il suffit d'une opération mal nommée
 * pour qu'elle passe du mauvais côté. Ici, **une opération sans droit déclaré
 * est refusée**, et `npm test` la signale.
 *
 * Les trois rôles, du moins au plus étendu :
 *
 * - **lecture** — consulter le parc, voir ce qui est dehors. Un technicien qui
 *   prépare son camion, un client qui vérifie sa commande.
 * - **ecriture** — le travail courant : saisir du matériel, créer une location,
 *   constater un retour.
 * - **administration** — ce qui efface. Supprimer une référence du parc ou une
 *   location fait disparaître un historique que personne ne pourra reconstituer.
 *
 * Le doute se tranche vers le haut.
 */
export const DROITS: Record<string, Role> = {
  /* Parc matériel */
  'parc:lister': 'lecture',
  'parc:resume': 'lecture',
  'parc:ajouter': 'ecriture',
  'parc:modifier': 'ecriture',
  'parc:supprimer': 'administration',

  /* Locations */
  'locations:lister': 'lecture',
  'locations:disponibilites': 'lecture',
  'locations:lignesDeFacture': 'lecture',
  'locations:creer': 'ecriture',
  'locations:changerEtat': 'ecriture',
  'locations:enregistrerRetour': 'ecriture',
  'locations:supprimer': 'administration'
}

/** Le rôle exigé par un canal, ou `null` s'il n'en a pas de déclaré. */
export function roleExige(canal: string): Role | null {
  return DROITS[canal] ?? null
}
