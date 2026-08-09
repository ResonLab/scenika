-- SOURCE DE VÉRITÉ du schéma de Scenika.
--
-- Une colonne ajoutée ici doit l'être aussi dans COLONNES_ATTENDUES de
-- migrations.ts : la base d'un utilisateur n'est jamais supprimée pour
-- appliquer un changement.

-- Le parc matériel : ce que la société possède.
CREATE TABLE IF NOT EXISTS materiel (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT NOT NULL UNIQUE,
  designation TEXT NOT NULL,
  -- 'son', 'lumiere', 'structure', 'cable', 'autre'
  categorie TEXT NOT NULL DEFAULT 'autre',
  marque TEXT NOT NULL DEFAULT '',
  modele TEXT NOT NULL DEFAULT '',
  quantite INTEGER NOT NULL DEFAULT 1,
  -- Puissance électrique en watts, pour le calcul de charge des circuits.
  puissance_w REAL NOT NULL DEFAULT 0,
  -- Nombre de canaux DMX du mode utilisé. 0 si l'appareil n'est pas piloté.
  canaux_dmx INTEGER NOT NULL DEFAULT 0,
  emplacement TEXT NOT NULL DEFAULT '',
  etat TEXT NOT NULL DEFAULT 'bon',
  notes TEXT NOT NULL DEFAULT '',
  ajoute_le TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS index_materiel_categorie ON materiel(categorie);
