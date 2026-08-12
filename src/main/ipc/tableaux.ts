import { ipcMain } from 'electron'
import {
  ajouterTableau,
  listerTableaux,
  modifierTableau,
  supprimerTableau
} from '../domaines/tableaux'
import type { TableauElectrique } from '../../partage/types'

/**
 * Branchement des tableaux électriques sur la fenêtre. **Aucune logique ici** :
 * elle vit dans `../domaines/tableaux.ts`, où le serveur multi-postes ira la
 * chercher.
 */
export function enregistrerHandlersTableaux(): void {
  ipcMain.handle('tableaux:lister', () => listerTableaux())

  ipcMain.handle('tableaux:ajouter', (_e, tableau: Omit<TableauElectrique, 'id'>) =>
    ajouterTableau(tableau)
  )

  ipcMain.handle('tableaux:modifier', (_e, tableau: TableauElectrique) => modifierTableau(tableau))

  ipcMain.handle('tableaux:supprimer', (_e, id: number) => supprimerTableau(id))
}
