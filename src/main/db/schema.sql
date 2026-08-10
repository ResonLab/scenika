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

-- Les locations : qui a quoi, depuis quand, jusqu'à quand.
--
-- Une location est un dossier — un client, des dates, un état — et des lignes
-- qui disent quel matériel part et en quelle quantité. Le matériel n'est pas
-- « retiré » du parc : il est *sorti*, et ce qui compte à tout moment, c'est ce
-- qui est dehors. Décrémenter la quantité du parc ferait perdre la trace de ce
-- qu'on possède.
CREATE TABLE IF NOT EXISTS location (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client TEXT NOT NULL,
  reference TEXT NOT NULL DEFAULT '',
  -- 'prevue', 'sortie', 'rentree', 'annulee'
  etat TEXT NOT NULL DEFAULT 'prevue',
  date_depart TEXT NOT NULL,
  date_retour TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  creee_le TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Le matériel d'une location. La quantité rentrée peut être inférieure à la
-- quantité sortie : c'est ce qui manque au retour, et c'est précisément ce
-- qu'on veut voir.
CREATE TABLE IF NOT EXISTS location_ligne (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  location_id INTEGER NOT NULL REFERENCES location(id) ON DELETE CASCADE,
  materiel_id INTEGER NOT NULL REFERENCES materiel(id),
  quantite INTEGER NOT NULL DEFAULT 1,
  quantite_rentree INTEGER NOT NULL DEFAULT 0,
  -- Prix de location de la ligne, pour l'export vers Ohmnia.
  prix_unitaire REAL NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS index_location_etat ON location(etat);
CREATE INDEX IF NOT EXISTS index_location_ligne_location ON location_ligne(location_id);
CREATE INDEX IF NOT EXISTS index_location_ligne_materiel ON location_ligne(materiel_id);
