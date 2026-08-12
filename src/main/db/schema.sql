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

-- Les tableaux électriques dont on dispose réellement sur le lieu.
--
-- Un tableau a un disjoncteur de tête et des prises. **Les deux limitent**, et
-- c'est le premier qu'on oublie : six prises de 16 A derrière un général de
-- 32 A ne donnent pas 96 A. calibre_general_a valant 0 signifie « non
-- déclaré » — on ne suppose alors aucune limite de tête, plutôt que d'en
-- inventer une fausse.
CREATE TABLE IF NOT EXISTS tableau (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nom TEXT NOT NULL,
  calibre_general_a REAL NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  cree_le TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Les prises d'un tableau, chacune avec son propre calibre : un tableau de
-- chantier a souvent une 32 A à côté de ses 16 A, et forcer un calibre unique
-- obligerait à mentir sur l'installation.
CREATE TABLE IF NOT EXISTS tableau_prise (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tableau_id INTEGER NOT NULL REFERENCES tableau(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL,
  calibre_a REAL NOT NULL DEFAULT 16
);

CREATE INDEX IF NOT EXISTS index_tableau_prise_tableau ON tableau_prise(tableau_id);

-- La vue de scène : où les appareils sont posés sur le plan.
--
-- x et y sont des **fractions du plan**, entre 0 et 1, pas des pixels : le
-- plan se redimensionne avec la fenêtre, et des pixels feraient dériver tous
-- les projecteurs dès qu'on change d'écran.
--
-- adresse_dmx vaut 0 quand l'appareil n'est pas adressé. L'adresse n'est pas
-- recalculée à l'affichage : elle est posée une fois et mémorisée, sinon deux
-- ouvertures du plan donneraient deux patchs différents.
CREATE TABLE IF NOT EXISTS scene_appareil (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  materiel_id INTEGER NOT NULL REFERENCES materiel(id) ON DELETE CASCADE,
  etiquette TEXT NOT NULL DEFAULT '',
  x REAL NOT NULL DEFAULT 0.5,
  y REAL NOT NULL DEFAULT 0.5,
  univers INTEGER NOT NULL DEFAULT 1,
  adresse_dmx INTEGER NOT NULL DEFAULT 0,
  pose_le TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS index_scene_appareil_materiel ON scene_appareil(materiel_id);

CREATE INDEX IF NOT EXISTS index_location_etat ON location(etat);
CREATE INDEX IF NOT EXISTS index_location_ligne_location ON location_ligne(location_id);
CREATE INDEX IF NOT EXISTS index_location_ligne_materiel ON location_ligne(materiel_id);
