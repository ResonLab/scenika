import { ipcMain } from 'electron'
import {
  deplacerAppareil,
  listerScene,
  poserAppareil,
  retirerAppareil,
  viderScene
} from '../domaines/scene'
import type { AppareilScene } from '../../partage/types'

type AppareilPose = Omit<AppareilScene, 'id' | 'designation' | 'puissanceW' | 'canauxDmx'>
type AppareilDeplace = Pick<
  AppareilScene,
  'id' | 'etiquette' | 'x' | 'y' | 'univers' | 'adresseDmx'
>

/**
 * Branchement du plan de scène sur la fenêtre. **Aucune logique ici** : elle
 * vit dans `../domaines/scene.ts`, où le serveur multi-postes ira la chercher.
 */
export function enregistrerHandlersScene(): void {
  ipcMain.handle('scene:lister', () => listerScene())

  // Le nom du canal doit rester sur la même ligne qu'`ipcMain.handle(` : le
  // garde-fou qui apparie le registre et l'IPC le cherche d'un seul tenant.
  // Une mise en forme sur plusieurs lignes le rend invisible et fait échouer
  // la suite, alors que le code est correct. Piège déjà payé sur Ohmnia.
  ipcMain.handle('scene:poser', (_e, appareil: AppareilPose) => poserAppareil(appareil))

  ipcMain.handle('scene:deplacer', (_e, appareil: AppareilDeplace) =>
    deplacerAppareil(appareil)
  )

  ipcMain.handle('scene:retirer', (_e, id: number) => retirerAppareil(id))

  ipcMain.handle('scene:vider', () => viderScene())
}
