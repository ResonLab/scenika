import { DatabaseSync } from 'node:sqlite'
import { cheminBase } from '../contexte'
import schema from './schema.sql?raw'
import { appliquerMigrations } from './migrations'

/**
 * La base SQLite de Scenika.
 *
 * `node:sqlite` et pas `better-sqlite3` : intégré à Node 24, donc aucune
 * dépendance native à recompiler à chaque montée de version d'Electron. Le
 * choix a fait ses preuves sur Ohmnia.
 */
let db: DatabaseSync | null = null

export function ouvrirBaseDeDonnees(): DatabaseSync {
  if (db) return db

  db = new DatabaseSync(cheminBase())
  // WAL : écritures plus robustes face à un arrêt brutal.
  db.exec('PRAGMA journal_mode = WAL')
  db.exec('PRAGMA foreign_keys = ON')
  db.exec(schema)
  appliquerMigrations(db)

  const resultat = db.prepare('PRAGMA integrity_check').get() as { integrity_check: string }
  if (resultat.integrity_check !== 'ok') {
    throw new Error(`Intégrité de la base compromise : ${resultat.integrity_check}`)
  }
  return db
}

export function getDb(): DatabaseSync {
  if (!db) throw new Error("La base de données n'est pas ouverte.")
  return db
}

export function fermerBaseDeDonnees(): void {
  if (!db) return
  // Le journal WAL est vidé avant fermeture : sans cela une copie de la base
  // pourrait ne pas contenir les dernières écritures. Bug grave vécu sur Ohmnia.
  db.exec('PRAGMA wal_checkpoint(TRUNCATE)')
  db.close()
  db = null
}

/** Toute opération qui touche plusieurs tables passe par ici. */
export function dansUneTransaction<T>(action: () => T): T {
  const base = getDb()
  base.exec('BEGIN')
  try {
    const resultat = action()
    base.exec('COMMIT')
    return resultat
  } catch (erreur) {
    base.exec('ROLLBACK')
    throw erreur
  }
}
