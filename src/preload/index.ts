import { contextBridge, ipcRenderer } from 'electron'
import type {
  AppareilScene,
  Disponibilite,
  EtatLocation,
  LigneFacture,
  Location,
  Materiel,
  ResumeParc,
  TableauElectrique
} from '../partage/types'

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
  },
  locations: {
    lister: (): Promise<Location[]> => ipcRenderer.invoke('locations:lister'),
    disponibilites: (): Promise<Disponibilite[]> =>
      ipcRenderer.invoke('locations:disponibilites'),
    creer: (
      location: Omit<Location, 'id' | 'lignes'>,
      lignes: { materielId: number; quantite: number; prixUnitaire: number }[]
    ): Promise<Location> => ipcRenderer.invoke('locations:creer', location, lignes),
    changerEtat: (id: number, etat: EtatLocation): Promise<void> =>
      ipcRenderer.invoke('locations:changerEtat', id, etat),
    enregistrerRetour: (ligneId: number, quantite: number): Promise<void> =>
      ipcRenderer.invoke('locations:enregistrerRetour', ligneId, quantite),
    supprimer: (id: number): Promise<void> => ipcRenderer.invoke('locations:supprimer', id),
    lignesDeFacture: (id: number): Promise<LigneFacture[]> =>
      ipcRenderer.invoke('locations:lignesDeFacture', id)
  },
  tableaux: {
    lister: (): Promise<TableauElectrique[]> => ipcRenderer.invoke('tableaux:lister'),
    ajouter: (tableau: Omit<TableauElectrique, 'id'>): Promise<TableauElectrique> =>
      ipcRenderer.invoke('tableaux:ajouter', tableau),
    modifier: (tableau: TableauElectrique): Promise<TableauElectrique> =>
      ipcRenderer.invoke('tableaux:modifier', tableau),
    supprimer: (id: number): Promise<void> => ipcRenderer.invoke('tableaux:supprimer', id)
  },
  scene: {
    lister: (): Promise<AppareilScene[]> => ipcRenderer.invoke('scene:lister'),
    poser: (
      appareil: Omit<AppareilScene, 'id' | 'designation' | 'puissanceW' | 'canauxDmx'>
    ): Promise<AppareilScene> => ipcRenderer.invoke('scene:poser', appareil),
    deplacer: (
      appareil: Pick<AppareilScene, 'id' | 'etiquette' | 'x' | 'y' | 'univers' | 'adresseDmx'>
    ): Promise<AppareilScene> => ipcRenderer.invoke('scene:deplacer', appareil),
    retirer: (id: number): Promise<void> => ipcRenderer.invoke('scene:retirer', id),
    vider: (): Promise<void> => ipcRenderer.invoke('scene:vider')
  }
}

export type Api = typeof api

contextBridge.exposeInMainWorld('api', api)
