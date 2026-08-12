/**
 * La version du serveur, écrite en dur.
 *
 * Le serveur est compilé en un seul fichier, sans `package.json` à côté de lui :
 * il ne peut donc pas lire la version du projet. `npm test` vérifie qu'elle
 * n'a pas dérivé — sinon on livrerait un serveur qui s'annonce sous un numéro
 * qui n'est plus le sien.
 */
export const VERSION_SERVEUR = '0.2.0'
