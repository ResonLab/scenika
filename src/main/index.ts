import { app, BrowserWindow, shell } from 'electron'
import { join } from 'node:path'
import { definirContexte } from './contexte'
import { fermerBaseDeDonnees, ouvrirBaseDeDonnees } from './db/database'
import { enregistrerHandlersParc } from './ipc/parc'
import { enregistrerHandlersLocations } from './ipc/locations'

// Nom fixé explicitement : sans cela le dossier de données change selon le mode
// de lancement. Bug réel vécu sur Ohmnia.
app.setName('Scenika')

function creerFenetrePrincipale(): void {
  const fenetre = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#14110d',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  fenetre.once('ready-to-show', () => fenetre.show())

  // Les liens externes s'ouvrent dans le navigateur système, jamais dans l'app.
  fenetre.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    fenetre.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    fenetre.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  // Seul endroit où Electron dicte où vivent les données. Tout le reste lit ces
  // valeurs depuis `contexte`, ce qui permettra au serveur multi-postes de
  // réutiliser la même couche métier.
  definirContexte({ dossierDonnees: app.getPath('userData'), version: app.getVersion() })

  ouvrirBaseDeDonnees()
  enregistrerHandlersParc()
  enregistrerHandlersLocations()

  creerFenetrePrincipale()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) creerFenetrePrincipale()
  })
})

app.on('window-all-closed', () => {
  fermerBaseDeDonnees()
  if (process.platform !== 'darwin') app.quit()
})
