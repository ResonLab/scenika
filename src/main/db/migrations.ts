import type { DatabaseSync } from 'node:sqlite'

/**
 * Complète une base créée par une version antérieure de Scenika.
 *
 * Règle héritée d'Ohmnia : **on n'efface jamais la base d'un utilisateur pour
 * appliquer un changement**. Toute colonne ajoutée à `schema.sql` doit
 * apparaître ici, sinon les bases existantes ne la recevront pas.
 */
interface ColonneAttendue {
  table: string
  colonne: string
  definition: string
}

const COLONNES_ATTENDUES: ColonneAttendue[] = [
  // Les autres modes d'un même projecteur : « 8,12,16 ».
  { table: 'materiel', colonne: 'modes_dmx', definition: "TEXT NOT NULL DEFAULT ''" },
  // Le mode réellement réglé sur l'appareil posé, qui peut différer du mode
  // habituel de la référence.
  { table: 'scene_appareil', colonne: 'canaux_dmx', definition: 'INTEGER NOT NULL DEFAULT 0' }
]

function tableExiste(db: DatabaseSync, table: string): boolean {
  const ligne = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
    .get(table)
  return ligne !== undefined
}

function colonnesExistantes(db: DatabaseSync, table: string): Set<string> {
  const lignes = db.prepare(`PRAGMA table_info("${table}")`).all() as unknown as { name: string }[]
  return new Set(lignes.map((l) => l.name))
}

export function appliquerMigrations(db: DatabaseSync): void {
  for (const { table, colonne, definition } of COLONNES_ATTENDUES) {
    if (!tableExiste(db, table)) continue
    if (colonnesExistantes(db, table).has(colonne)) continue

    db.exec(`ALTER TABLE "${table}" ADD COLUMN "${colonne}" ${definition}`)
    console.log(`Migration : colonne ${table}.${colonne} ajoutée.`)
  }
}
