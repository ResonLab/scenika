import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Où vivent les données, et quelle version tourne.
 *
 * Renseigné une fois au démarrage par la couche Electron. **Le reste du code
 * n'importe jamais Electron** : c'est ce qui permettra au serveur multi-postes
 * de réutiliser la même couche métier, comme il le fait déjà pour Ohmnia.
 */
interface Contexte {
  dossierDonnees: string
  version: string
}

let contexte: Contexte | null = null

export function definirContexte(valeurs: Contexte): void {
  contexte = valeurs
}

function lireContexte(): Contexte {
  if (!contexte) {
    throw new Error(
      "Le contexte d'exécution n'a pas été défini. " +
        'Appelez definirContexte() avant toute lecture de la base.'
    )
  }
  return contexte
}

export function dossierDonnees(): string {
  const dossier = lireContexte().dossierDonnees
  if (!existsSync(dossier)) mkdirSync(dossier, { recursive: true })
  return dossier
}

export function versionApplication(): string {
  return lireContexte().version
}

/** Fichier de la base. Un seul endroit décide de son nom. */
export function cheminBase(): string {
  return join(dossierDonnees(), 'scenika.sqlite')
}
