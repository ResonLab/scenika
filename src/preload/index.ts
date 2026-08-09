import { contextBridge, ipcRenderer } from 'electron'
import type { Materiel, ResumeParc } from '../partage/types'

/** Le pont sécurisé : seule porte entre l'interface et le système. */
const api = {
  parc: {
    lister: (): Promise<Materiel[]> => ipcRenderer.invoke('parc:lister'),
    ajouter: (materiel: Omit<Materiel, 'id'>): Promise<Materiel> =>
      ipcRenderer.invoke('parc:ajouter', materiel),
    modifier: (materiel: Materiel): Promise<Materiel> =>
      ipcRenderer.invoke('parc:modifier', materiel),
    supprimer: (id: number): Promise<void> => ipcRenderer.invoke('parc:supprimer', id),
    resume: (): Promise<ResumeParc> => ipcRenderer.invoke('parc:resume')
  }
}

export type Api = typeof api

contextBridge.exposeInMainWorld('api', api)
