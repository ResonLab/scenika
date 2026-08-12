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
  'parc.modesDmx': { fr: 'Autres modes', en: 'Other modes' },
  'parc.emplacement': { fr: 'Emplacement', en: 'Location' },
  'parc.vide': { fr: 'Le parc est vide.', en: 'The inventory is empty.' },
  'parc.canaux': { fr: 'canaux', en: 'channels' },

  // --- Conditions d'utilisation ---
  'conditions.titre': { fr: "Conditions d'utilisation", en: 'Terms of use' },
  'conditions.version': { fr: 'Version {version}', en: 'Version {version}' },
  'conditions.defilerJusquauBout': {
    fr: 'Faites défiler le texte jusqu’au bout pour pouvoir accepter.',
    en: 'Scroll to the end of the text to be able to accept.'
  },
  'conditions.jaiLu': {
    fr: 'J’ai lu et j’accepte ces conditions.',
    en: 'I have read and accept these terms.'
  },
  'conditions.accepter': { fr: 'Accepter et continuer', en: 'Accept and continue' },
  'conditions.lireSurLeSite': { fr: 'Lire sur le site', en: 'Read on the website' },

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

  // --- Plan de scène ---
  'menu.scene': { fr: 'Scène', en: 'Stage' },
  'scene.titre': { fr: 'Plan de scène', en: 'Stage plan' },
  'scene.explication': {
    fr: 'Posez vos appareils sur le plan et déplacez-les à la souris. Chacun montre son adresse DMX et sa puissance : c’est en les voyant côte à côte qu’on s’aperçoit qu’on a mis les deux plus gourmands sur la même prise.',
    en: 'Place your units on the plan and drag them with the mouse. Each shows its DMX address and power draw: seeing them side by side is how you notice you put the two greediest ones on the same outlet.'
  },
  'scene.aucunMateriel': {
    fr: 'Le parc est vide. Ajoutez du matériel, et vous pourrez le poser ici.',
    en: 'The inventory is empty. Add equipment and you will be able to place it here.'
  },
  'scene.aPoser': { fr: 'À poser', en: 'To place' },
  'scene.vide': {
    fr: 'Le plan est vide. Choisissez un appareil à gauche et posez-le.',
    en: 'The plan is empty. Pick a unit on the left and place it.'
  },
  'scene.retirer': { fr: 'Retirer', en: 'Remove' },
  'scene.vider': { fr: 'Vider le plan', en: 'Clear the plan' },
  'scene.viderConfirme': {
    fr: 'Retirer tous les appareils du plan ? Le parc n’est pas touché.',
    en: 'Remove every unit from the plan? The inventory is untouched.'
  },
  'scene.adresserAuto': { fr: 'Adresser automatiquement', en: 'Address automatically' },
  'scene.adresseCourt': { fr: 'Adr.', en: 'Addr.' },
  'scene.nonAdresse': { fr: 'non adressé', en: 'unaddressed' },
  'scene.universCourt': { fr: 'Univ.', en: 'Univ.' },
  'scene.poses': { fr: 'appareils posés', en: 'units placed' },
  'scene.puissancePlan': { fr: 'sur le plan', en: 'on the plan' },
  'scene.problemesPatch': { fr: 'Ce que le patch a de gênant', en: 'What is wrong with the patch' },
  'scene.patchSain': {
    fr: 'Aucun chevauchement ni dépassement d’univers.',
    en: 'No address overlap and no universe overrun.'
  },
  'scene.selection': { fr: 'Appareil choisi', en: 'Selected unit' },
  'scene.etiquette': { fr: 'Étiquette', en: 'Label' },
  'scene.adresse': { fr: 'Adresse DMX', en: 'DMX address' },
  'scene.mode': { fr: 'Mode', en: 'Mode' },
  'scene.modeCanaux': { fr: '{canaux} canaux', en: '{canaux} channels' },
  'scene.univers': { fr: 'Univers', en: 'Universe' },
  'scene.nonPilote': {
    fr: 'Cet appareil n’a aucun canal DMX déclaré : il n’est pas piloté, il se branche seulement.',
    en: 'This unit has no declared DMX channels: it is not controlled, it is only plugged in.'
  },
  'scene.reserve': {
    fr: 'Le plan est une aide à la préparation. Vérifiez le patch sur le matériel avant la représentation : un appareil qui répond à la mauvaise adresse se voit tout de suite en salle, et jamais dans un tableau.',
    en: 'The plan is a preparation aid. Check the patch on the actual equipment before the show: a unit answering the wrong address is obvious in the room, and never in a table.'
  },

  // --- Carte des 512 canaux ---
  'carteDmx.titre': { fr: 'Occupation de l’univers', en: 'Universe occupancy' },
  'carteDmx.libre': { fr: '{nombre} libres', en: '{nombre} free' },
  'carteDmx.occupe': { fr: '{nombre} occupés', en: '{nombre} used' },
  'carteDmx.chevauchement': { fr: '{nombre} en chevauchement', en: '{nombre} overlapping' },
  'carteDmx.canalLibre': { fr: 'Canal {canal} — libre', en: 'Channel {canal} — free' },
  'carteDmx.canalPris': { fr: 'Canal {canal} — {appareils}', en: 'Channel {canal} — {appareils}' },
  'carteDmx.resume': {
    fr: 'Univers {univers} : {occupe} canaux occupés sur {total}, {chevauchement} en chevauchement.',
    en: 'Universe {univers}: {occupe} channels used out of {total}, {chevauchement} overlapping.'
  },
  'carteDmx.alerte': {
    fr: '{nombre} canaux sont demandés par plusieurs appareils. Deux appareils sur la même adresse répondent ensemble, et le second ne s’allumera jamais seul.',
    en: '{nombre} channels are claimed by more than one unit. Two units on the same address answer together, and the second will never light on its own.'
  },

  // --- Tableaux électriques ---
  'menu.tableaux': { fr: 'Tableaux', en: 'Boards' },
  'tab.titre': { fr: 'Tableaux électriques', en: 'Electrical boards' },
  'tab.explication': {
    fr: 'Décrivez les tableaux dont vous disposez réellement. Le disjoncteur de tête compte autant que les prises : six prises de 16 A derrière un général de 32 A ne donnent pas 96 A.',
    en: 'Describe the boards you actually have. The main breaker matters as much as the outlets: six 16 A outlets behind a 32 A main do not give you 96 A.'
  },
  'tab.aucun': {
    fr: 'Aucun tableau. Ajoutez-en un, et la répartition automatique deviendra possible.',
    en: 'No boards yet. Add one and automatic distribution becomes possible.'
  },
  'tab.nouveau': { fr: 'Nouveau tableau', en: 'New board' },
  'tab.nom': { fr: 'Nom', en: 'Name' },
  'tab.nombreDePrises': { fr: 'Nombre de prises', en: 'Number of outlets' },
  'tab.calibrePrise': { fr: 'Calibre des prises', en: 'Outlet rating' },
  'tab.calibreGeneral': { fr: 'Disjoncteur de tête', en: 'Main breaker' },
  'tab.generalNonDeclare': { fr: 'non déclaré', en: 'not declared' },
  'tab.generalExplication': {
    fr: 'Laissez à « non déclaré » si vous l’ignorez : le calcul ne supposera alors aucune limite de tête, plutôt que d’en inventer une fausse.',
    en: 'Leave as “not declared” if you do not know it: the calculation will then assume no main limit, rather than inventing a wrong one.'
  },
  'tab.ajouter': { fr: 'Ajouter le tableau', en: 'Add the board' },
  'tab.supprimer': { fr: 'Supprimer', en: 'Delete' },
  'tab.supprimerConfirme': {
    fr: 'Supprimer ce tableau ? Les répartitions déjà calculées dessus n’auront plus de sens.',
    en: 'Delete this board? Distributions already calculated on it will no longer mean anything.'
  },
  'tab.prises': { fr: '{nombre} prises', en: '{nombre} outlets' },
  'tab.generalLimitant': {
    fr: 'Le disjoncteur de tête est la vraie limite : les prises additionnées demandent {somme} A pour un général de {general} A. C’est normal — on ne branche jamais tout à fond partout.',
    en: 'The main breaker is the real limit: the outlets added together ask for {somme} A behind a {general} A main. That is normal — you never run everything at full everywhere.'
  },
  'tab.repartition': { fr: 'Répartition automatique', en: 'Automatic distribution' },
  'tab.repartitionExplication': {
    fr: 'Les appareils posés sur le plan de scène, répartis sur vos prises réelles : le plus gourmand d’abord, la première prise qui l’accepte. Une règle simple exprès — vous devez pouvoir la refaire de tête sur le terrain, parce que c’est à la main que vous branchez.',
    en: 'The units placed on the stage plan, spread over your real outlets: the greediest first, the first outlet that takes it. A deliberately simple rule — you must be able to redo it in your head on site, because you plug in by hand.'
  },
  'tab.rienAPlacer': {
    fr: 'Aucun appareil sur le plan de scène. Posez-en, et la répartition apparaîtra ici.',
    en: 'No units on the stage plan. Place some and the distribution will appear here.'
  },
  'tab.priseNumero': { fr: 'Prise {numero}', en: 'Outlet {numero}' },
  'tab.priseLibre': { fr: 'libre', en: 'free' },
  'tab.chargeDe': { fr: '{charge} W — {taux} % du maximum', en: '{charge} W — {taux}% of maximum' },
  'tab.chargeTableau': {
    fr: '{charge} W sur le tableau, {taux} % du général',
    en: '{charge} W on the board, {taux}% of the main'
  },
  'tab.placee': { fr: 'placée', en: 'placed' },
  'tab.refuses': { fr: 'Ce qui ne rentre pas', en: 'What does not fit' },
  'tab.refusTropGourmand': {
    fr: '« {nom} » demande {puissance} W : aucune prise n’est assez grosse. Il faut une prise de calibre supérieur, ou un autre appareil.',
    en: '“{nom}” draws {puissance} W: no outlet is big enough. You need a higher-rated outlet, or a different unit.'
  },
  'tab.refusPlusDePlace': {
    fr: '« {nom} » ({puissance} W) rentrerait, mais tout est occupé. Il faut un tableau de plus.',
    en: '“{nom}” ({puissance} W) would fit, but everything is taken. You need another board.'
  },
  'tab.reserve': {
    fr: 'Cette répartition n’est pas un contrôle électrique. Elle ignore la longueur et la section des câbles, l’état du tableau, la simultanéité réelle et les appels de courant à l’allumage. Le raccordement relève d’un électricien.',
    en: 'This distribution is not an electrical inspection. It ignores cable length and section, the state of the board, real simultaneity and inrush current. Wiring is the work of an electrician.'
  },

  // --- Puissance ---
  'menu.puissance': { fr: 'Puissance', en: 'Power' },
  'pui.titre': { fr: 'Répartition de puissance', en: 'Power distribution' },
  'pui.aucunAppareil': {
    fr: 'Aucun appareil avec une puissance déclarée. Renseignez les watts dans le parc, et ils apparaîtront ici.',
    en: 'No equipment with a declared power draw. Enter the wattage in the inventory and it will appear here.'
  },
  'pui.combien': { fr: 'Combien en emmenez-vous ?', en: 'How many are you taking?' },
  'pui.calibre': { fr: 'Calibre des circuits', en: 'Circuit rating' },
  'pui.circuits': { fr: 'circuits', en: 'circuits' },
  'pui.totale': { fr: 'puissance totale', en: 'total power' },
  'pui.parCircuit': { fr: 'tenable par circuit', en: 'per circuit' },
  'pui.circuitNumero': { fr: 'Circuit {numero}', en: 'Circuit {numero}' },
  'pui.chargeDe': { fr: '{charge} W — {taux} % du tenable', en: '{charge} W — {taux}% of capacity' },
  'pui.refuses': {
    fr: 'Trop gourmands pour un circuit de ce calibre',
    en: 'Too demanding for a circuit of this rating'
  },
  'pui.refuseLigne': {
    fr: '{nom} — {puissance} W, alors qu’un circuit en tient {maximum} W',
    en: '{nom} — {puissance} W, while a circuit holds {maximum} W'
  },
  'pui.refuseQuoiFaire': {
    fr: 'Passez à un calibre supérieur, ou donnez-lui son propre circuit.',
    en: 'Move up a rating, or give it its own circuit.'
  },
  'pui.regle': {
    fr: 'Le plus gourmand d’abord, puis dans le premier circuit qui l’accepte. La règle est simple exprès : vous devez pouvoir refaire la répartition de tête sur le terrain, parce que c’est à la main que vous branchez.',
    en: 'Biggest first, then into the first circuit that takes it. The rule is deliberately simple: you must be able to redo the split in your head on site, because you patch it by hand.'
  },
  'pui.marge': {
    fr: 'Un circuit {calibre} A en {tension} V tient {theorique} W en théorie ; ce calcul en réserve {marge} %. On ne remplit jamais un circuit à fond : il déclencherait au premier appel de courant, et il déclencherait pendant le spectacle.',
    en: 'A {calibre} A circuit at {tension} V holds {theorique} W in theory; this calculation holds back {marge}%. You never fill a circuit completely: it would trip on the first inrush, and it would trip during the show.'
  },
  'pui.reserve': {
    fr: 'Ce calcul ne remplace pas un électricien. Il additionne des watts déclarés : il ne connaît ni la longueur des câbles, ni la section des conducteurs, ni l’état de l’installation, ni les appels de courant à l’allumage — une lampe à décharge peut tirer plusieurs fois sa puissance nominale pendant l’amorçage.',
    en: 'This calculation does not replace an electrician. It adds up declared wattage: it knows nothing of cable length, conductor section, the state of the installation, or inrush current at switch-on — a discharge lamp can draw several times its rated power while striking.'
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
  'erreur.tableauNomVide': {
    fr: 'Le tableau doit avoir un nom.',
    en: 'The board must have a name.'
  },
  'erreur.tableauSansPrise': {
    fr: 'Un tableau doit avoir au moins une prise.',
    en: 'A board must have at least one outlet.'
  },
  'erreur.calibreInvalide': {
    fr: 'Le calibre d’une prise doit être supérieur à zéro.',
    en: 'The rating of an outlet must be greater than zero.'
  },
  'erreur.generalNegatif': {
    fr: 'Le calibre du disjoncteur général ne peut pas être négatif.',
    en: 'The main breaker rating cannot be negative.'
  },
  'erreur.tableauIntrouvable': {
    fr: 'Ce tableau n’existe plus.',
    en: 'This board no longer exists.'
  },
  'erreur.materielIntrouvable': {
    fr: 'Ce matériel n’existe plus.',
    en: 'This equipment no longer exists.'
  },
  'erreur.positionHorsPlan': {
    fr: 'La position doit rester sur le plan.',
    en: 'The position must stay on the plan.'
  },
  'erreur.adresseInvalide': {
    fr: 'L’adresse DMX doit être comprise entre 1 et 512, ou 0 si l’appareil n’est pas adressé.',
    en: 'The DMX address must be between 1 and 512, or 0 if the unit is not addressed.'
  },
  'erreur.modeInvalide': {
    fr: 'Le mode doit valoir entre 1 et 512 canaux, ou 0 pour reprendre le mode habituel.',
    en: 'The mode must be between 1 and 512 channels, or 0 to use the usual mode.'
  },
  'erreur.modeDebordeUnivers': {
    fr: 'À cette adresse, ce mode dépasse la fin de l’univers. Reculez l’adresse ou choisissez un mode plus court.',
    en: 'At this address, this mode runs past the end of the universe. Lower the address or pick a shorter mode.'
  },
  'erreur.modesMalEcrits': {
    fr: 'Les autres modes s’écrivent en nombres de canaux séparés par des virgules, par exemple « 8,12,16 ».',
    en: 'The other modes are written as channel counts separated by commas, for example “8,12,16”.'
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

/**
 * Traduit une erreur remontée par le processus principal.
 *
 * Il n'envoie qu'une **clé** — il ne sait pas quelle langue cette fenêtre
 * affiche. Quand le message cite une valeur, la clé et la valeur voyagent en
 * JSON : un séparateur invisible dans le code serait plus court et illisible.
 *
 * Une clé inconnue s'affiche telle quelle, en toutes lettres : c'est laid,
 * donc remarqué, donc corrigé. Un message figé dans une langue passerait
 * inaperçu à l'inverse.
 *
 * **Elle vit ici et nulle part ailleurs.** Elle était recopiée à l'identique
 * dans chaque page qui affiche un refus ; deux copies d'une même règle
 * divergent au premier correctif, et c'est la règle numéro un de la maison.
 */
export function traduireErreur(brut: string): string {
  let cle = brut
  let valeurs: Record<string, string> | undefined

  if (brut.startsWith('{')) {
    try {
      const decode = JSON.parse(brut) as { cle: string } & Record<string, string>
      cle = decode.cle
      valeurs = decode
    } catch {
      // Ce n'était pas du JSON : on affichera le texte brut.
    }
  }

  const complete = `erreur.${cle}` as CleTraduction
  const traduit = t(complete, valeurs)
  return traduit === complete ? brut : traduit
}

export const LANGUES: { code: Langue; nom: string }[] = [
  { code: 'fr', nom: 'Français' },
  { code: 'en', nom: 'English' }
]
