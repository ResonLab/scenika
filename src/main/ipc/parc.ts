import { ipcMain } from 'electron'
import {
  ajouterMateriel,
  listerMateriel,
  modifierMateriel,
  resumeParc,
  supprimerMateriel
} from '../domaines/parc'
import type { Materiel } from '../../partage/types'

/**
 * Branchement du parc sur la fenêtre. **Aucune logique ici** : elle vit dans
 * `../domaines/parc.ts`, où le serveur multi-postes ira la chercher.
 */
export function enregistrerHandlersParc(): void {
  ipcMain.handle('parc:lister', () => listerMateriel())

  ipcMain.handle('parc:ajouter', (_e, materiel: Omit<Materiel, 'id'>) => ajouterMateriel(materiel))

  ipcMain.handle('parc:modifier', (_e, materiel: Materiel) => modifierMateriel(materiel))

  ipcMain.handle('parc:supprimer', (_e, id: number) => supprimerMateriel(id))

  ipcMain.handle('parc:resume', () => resumeParc())
}
