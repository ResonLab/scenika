import { ipcMain } from 'electron'
import {
  changerEtat,
  creerLocation,
  disponibilites,
  enregistrerRetour,
  lignesDeFacture,
  listerLocations,
  supprimerLocation
} from '../domaines/locations'
import type { EtatLocation, Location } from '../../partage/types'

/**
 * Branchement des locations sur la fenêtre. **Aucune logique ici** : elle vit
 * dans `../domaines/locations.ts`, où Nexika ira la chercher.
 */
export function enregistrerHandlersLocations(): void {
  ipcMain.handle('locations:lister', () => listerLocations())

  ipcMain.handle('locations:disponibilites', () => disponibilites())

  // Le nom du canal reste sur la même ligne qu'`ipcMain.handle(` : le garde-fou
  // qui apparie le registre et l'IPC le cherche d'un seul tenant. Une mise en
  // forme sur plusieurs lignes rend le canal invisible et fait échouer la
  // suite, alors que le code est juste. Piège déjà payé sur Ohmnia.
  ipcMain.handle('locations:creer', (
    _e,
    location: Omit<Location, 'id' | 'lignes'>,
    lignes: { materielId: number; quantite: number; prixUnitaire: number }[]
  ) => creerLocation(location, lignes))

  ipcMain.handle('locations:changerEtat', (_e, id: number, etat: EtatLocation) =>
    changerEtat(id, etat)
  )

  ipcMain.handle('locations:enregistrerRetour', (_e, ligneId: number, quantite: number) =>
    enregistrerRetour(ligneId, quantite)
  )

  ipcMain.handle('locations:supprimer', (_e, id: number) => supprimerLocation(id))

  ipcMain.handle('locations:lignesDeFacture', (_e, id: number) => lignesDeFacture(id))
}
