/**
 * Traductions de l'application.
 *
 * **Repris tel quel d'Ohmnia** (`APP/src/shared/i18n.ts`), délibérément : deux
 * mécanismes de traduction différents dans la même maison, ce serait deux
 * façons d'oublier une chaîne.
 *
 * Fonctionnement : `t('cle')` renvoie le texte dans la langue courante. Si une
 * clé manque en anglais, le texte français est utilisé — l'interface reste donc
 * lisible même pendant une traduction partielle.
 *
 * Pour ajouter une chaîne : l'ajouter dans TEXTES avec ses deux versions, puis
 * remplacer le texte en dur par `t('ma.cle')` dans le composant.
 * `npm run typecheck` rejette une clé inconnue.
 */

export type Langue = 'fr' | 'en'

type Traduction = { fr: string; en: string }

const TEXTES = {
  // --- Navigation ---
  'menu.sousTitre': { fr: 'Son & lumière', en: 'Audio & lighting' },
  'menu.parc': { fr: 'Parc matériel', en: 'Inventory' },
  'menu.dmx': { fr: 'Calculateur DMX', en: 'DMX calculator' },

  // --- Actions communes ---
  'action.enregistrer': { fr: 'Enregistrer', en: 'Save' },
  'action.annuler': { fr: 'Annuler', en: 'Cancel' },
  'action.supprimer': { fr: 'Supprimer', en: 'Delete' },
  'action.ajouterMateriel': { fr: '+ Ajouter du matériel', en: '+ Add equipment' },

  // --- Catégories de matériel ---
  'categorie.son': { fr: 'Son', en: 'Audio' },
  'categorie.lumiere': { fr: 'Lumière', en: 'Lighting' },
  'categorie.structure': { fr: 'Structure', en: 'Rigging' },
  'categorie.cable': { fr: 'Câblage', en: 'Cabling' },
  'categorie.autre': { fr: 'Autre', en: 'Other' },

  // --- Parc matériel ---
  'parc.titre': { fr: 'Parc matériel', en: 'Inventory' },
  'parc.references': { fr: 'références', en: 'references' },
  'parc.appareils': { fr: 'appareils', en: 'units' },
  'parc.siToutAllume': { fr: 'si tout est allumé', en: 'if everything is on' },
  'parc.pilotesDmx': { fr: 'pilotés en DMX', en: 'DMX-controlled' },
  'parc.reference': { fr: 'Référence', en: 'Reference' },
  'parc.designation': { fr: 'Désignation', en: 'Description' },
  'parc.categorie': { fr: 'Catégorie', en: 'Category' },
  'parc.quantite': { fr: 'Quantité', en: 'Quantity' },
  'parc.quantiteCourt': { fr: 'Qté', en: 'Qty' },
  'parc.puissance': { fr: 'Puissance (W)', en: 'Power (W)' },
  'parc.puissanceCourt': { fr: 'Puissance', en: 'Power' },
  'parc.canauxDmx': { fr: 'Canaux DMX', en: 'DMX channels' },
  'parc.emplacement': { fr: 'Emplacement', en: 'Location' },
  'parc.vide': { fr: 'Le parc est vide.', en: 'The inventory is empty.' },
  'parc.canaux': { fr: 'canaux', en: 'channels' },

  // --- Locations ---
  'menu.locations': { fr: 'Locations', en: 'Rentals' },
  'loc.titre': { fr: 'Locations', en: 'Rentals' },
  'loc.nouvelle': { fr: '+ Nouvelle location', en: '+ New rental' },
  'loc.client': { fr: 'Client', en: 'Client' },
  'loc.reference': { fr: 'Référence', en: 'Reference' },
  'loc.depart': { fr: 'Départ', en: 'Out' },
  'loc.retour': { fr: 'Retour', en: 'Back' },
  'loc.notes': { fr: 'Notes', en: 'Notes' },
  'loc.materiel': { fr: 'Matériel', en: 'Equipment' },
  'loc.prixUnitaire': { fr: 'Prix unitaire', en: 'Unit price' },
  'loc.aucune': { fr: 'Aucune location.', en: 'No rental.' },
  'loc.ajouterLigne': { fr: '+ Ajouter du matériel', en: '+ Add equipment' },
  'loc.rentre': { fr: 'Rentré', en: 'Returned' },
  'loc.manquant': { fr: '{nombre} manquant(s)', en: '{nombre} missing' },
  'loc.exporter': { fr: 'Lignes de facture', en: 'Invoice lines' },
  'loc.exporteVers': {
    fr: 'Copié. Collez-le dans Ohmnia — Scenika ne facture pas, elle prépare.',
    en: 'Copied. Paste it into Ohmnia — Scenika does not invoice, it prepares.'
  },

  // --- États d'une location ---
  'etatLoc.prevue': { fr: 'Prévue', en: 'Planned' },
  'etatLoc.sortie': { fr: 'Sortie', en: 'Out' },
  'etatLoc.rentree': { fr: 'Rentrée', en: 'Returned' },
  'etatLoc.annulee': { fr: 'Annulée', en: 'Cancelled' },

  // --- Disponibilité ---
  'dispo.titre': { fr: 'Disponible aujourd’hui', en: 'Available today' },
  'dispo.explication': {
    fr: 'Le parc dit ce que vous possédez ; ce qui est dehors se calcule à partir des locations sorties. Une location prévue ne retient rien.',
    en: 'The inventory says what you own; what is out is computed from the rentals marked out. A planned rental holds nothing back.'
  },
  'dispo.possede': { fr: 'Possédé', en: 'Owned' },
  'dispo.sorti': { fr: 'Sorti', en: 'Out' },
  'dispo.disponible': { fr: 'Disponible', en: 'Available' },
  'dispo.negatif': {
    fr: 'Plus de matériel est sorti que vous n’en possédez.',
    en: 'More equipment is out than you own.'
  },

  // --- Calculateur DMX ---
  'dmx.titre': { fr: 'Calculateur DMX', en: 'DMX calculator' },
  'dmx.aucunAppareil': {
    fr: "Aucun appareil piloté en DMX dans le parc. Ajoutez du matériel avec un nombre de canaux supérieur à zéro, et il apparaîtra ici.",
    en: 'No DMX-controlled unit in the inventory. Add equipment with a channel count above zero and it will appear here.'
  },
  'dmx.combien': { fr: 'Combien en emmenez-vous ?', en: 'How many are you taking?' },
  'dmx.appareil': { fr: 'Appareil', en: 'Unit' },
  'dmx.canaux': { fr: 'Canaux', en: 'Channels' },
  'dmx.enStock': { fr: 'En stock', en: 'In stock' },
  'dmx.univers': { fr: 'Univers', en: 'Universe' },
  'dmx.universPluriel': { fr: 'univers', en: 'universes' },
  'dmx.adresse': { fr: 'Adresse', en: 'Address' },
  'dmx.occupe': { fr: 'Occupe', en: 'Occupies' },
  'dmx.puissanceAppelee': { fr: 'puissance appelée', en: 'power drawn' },
  'dmx.circuitsMin': { fr: 'circuits 16 A minimum', en: '16 A circuits minimum' },
  'dmx.resteLibre': { fr: "Ce qu'il reste de libre", en: 'What is still free' },
  'dmx.complet': { fr: 'complet', en: 'full' },
  'dmx.patchCoherent': {
    fr: 'Patch cohérent : aucun chevauchement.',
    en: 'Patch is consistent: no overlap.'
  },
  'dmx.avertissementCircuit': {
    fr: "Un circuit 16 A en 230 V tient environ 3 680 W en théorie ; ce calcul en réserve 20 %.",
    en: 'A 16 A circuit at 230 V holds about 3,680 W in theory; this calculation holds back 20%.'
  },
  'dmx.avertissementCertitude': {
    fr: " Ce n'est pas une certitude électrique",
    en: ' This is not electrical certainty'
  },
  'dmx.avertissementSuite': {
    fr: " : la longueur des câbles, les appels de courant à l'allumage et l'état de l'installation comptent aussi.",
    en: ': cable length, inrush current at switch-on and the state of the installation all count too.'
  },

  // --- Problèmes de patch, renvoyés par `commun/dmx.js` ---
  // Le module rend un `code` et ses `donnees` : on reformule ici plutôt que de
  // découper son message français, ce qui se tromperait au premier changement.
  'probleme.canauxInvalides': {
    fr: '', // le module fournit déjà le français
    en: '« {nom} »: the channel count must be a whole number of at least 1.'
  },
  'probleme.adresseInvalide': {
    fr: '',
    en: '« {nom} »: the address must be a whole number of at least 1.'
  },
  'probleme.universInvalide': {
    fr: '',
    en: '« {nom} »: the universe must be a whole number of at least 1.'
  },
  'probleme.depassement': {
    fr: '',
    en: '« {nom} » addressed at {adresse} over {canaux} channels runs past the end of universe {univers} ({dernier} > {limite}). The last possible address for this unit is {derniereAdressePossible}.'
  },
  'probleme.chevauchement': {
    fr: '',
    en: '« {premier} » ({premierDebut}–{premierFin}) and « {second} » ({secondDebut}–{secondFin}) overlap in universe {univers}. Both units will respond together.'
  },

  // --- Messages refusés par le processus principal ---
  // Il ne renvoie qu'une clé : il ne sait pas quelle langue la fenêtre affiche.
  'erreur.referenceVide': {
    fr: 'La référence est obligatoire.',
    en: 'A reference is required.'
  },
  'erreur.designationVide': {
    fr: 'La désignation est obligatoire.',
    en: 'A description is required.'
  },
  'erreur.quantiteNegative': {
    fr: 'La quantité doit être un nombre entier positif.',
    en: 'The quantity must be a positive whole number.'
  },
  'erreur.puissanceNegative': {
    fr: 'La puissance ne peut pas être négative.',
    en: 'The power cannot be negative.'
  },
  'erreur.canauxNegatifs': {
    fr: 'Le nombre de canaux DMX doit être un entier positif ou nul.',
    en: 'The DMX channel count must be zero or a positive whole number.'
  },
  'erreur.canauxTropGrands': {
    fr: "Un appareil ne peut pas occuper plus de 512 canaux : c'est un univers entier.",
    en: 'A unit cannot occupy more than 512 channels: that is a whole universe.'
  },
  'erreur.clientVide': {
    fr: 'Le nom du client est obligatoire.',
    en: 'The client name is required.'
  },
  'erreur.dateDepartVide': { fr: 'La date de départ est obligatoire.', en: 'The out date is required.' },
  'erreur.dateRetourVide': { fr: 'La date de retour est obligatoire.', en: 'The return date is required.' },
  'erreur.retourAvantDepart': {
    fr: 'Le retour ne peut pas être avant le départ.',
    en: 'The return cannot be before the departure.'
  },
  'erreur.locationSansMateriel': {
    fr: 'Une location doit contenir au moins un matériel.',
    en: 'A rental must contain at least one piece of equipment.'
  },
  'erreur.ligneIntrouvable': { fr: 'Cette ligne n’existe plus.', en: 'This line no longer exists.' },
  'erreur.rentrePlusQueSorti': {
    fr: 'On ne peut pas rendre plus que ce qui est parti.',
    en: 'You cannot return more than what went out.'
  },
  'erreur.locationIntrouvable': {
    fr: 'Cette location n’existe plus.',
    en: 'This rental no longer exists.'
  },
  'erreur.referenceExiste': {
    fr: 'La référence « {reference} » existe déjà.',
    en: 'The reference « {reference} » already exists.'
  },

  // --- Paramètres ---
  'param.langue': { fr: 'Langue', en: 'Language' }
} satisfies Record<string, Traduction>

export type CleTraduction = keyof typeof TEXTES

let langueCourante: Langue = 'fr'

export function definirLangue(langue: Langue): void {
  langueCourante = langue
}

export function langue(): Langue {
  return langueCourante
}

/**
 * Traduit une clé, en remplaçant `{nom}` par `valeurs.nom`.
 *
 * Repli sur le français si la traduction anglaise manque — l'interface reste
 * lisible pendant une traduction partielle. Une entrée dont le français est
 * vide n'est pas un oubli : c'est un texte dont la version française vit
 * ailleurs (dans `commun/dmx.js` ou dans un domaine), et dont seule la version
 * anglaise a besoin d'exister ici.
 */
export function t(cle: CleTraduction, valeurs?: Record<string, string | number>): string {
  const entree = TEXTES[cle]
  if (!entree) return cle
  // Le repli ne va que de l'anglais vers le français, jamais l'inverse.
  // Un repli symétrique paraît plus robuste et ne l'est pas : les clés dont le
  // français vit ailleurs — les problèmes de `commun/dmx.js`, les erreurs du
  // processus principal — ont ici un français vide **exprès**. Avec un repli
  // dans les deux sens, un francophone recevait le texte anglais. Trouvé en
  // affichant réellement les deux langues, pas en relisant le code.
  const texte = langueCourante === 'en' ? entree.en || entree.fr : entree.fr
  if (!valeurs) return texte
  return texte.replace(/\{(\w+)\}/g, (entier, nom) =>
    nom in valeurs ? String(valeurs[nom]) : entier
  )
}

export const LANGUES: { code: Langue; nom: string }[] = [
  { code: 'fr', nom: 'Français' },
  { code: 'en', nom: 'English' }
]
