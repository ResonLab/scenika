import { getDb } from '../db/database'
import type { AppareilScene, CleErreur } from '../../partage/types'

/**
 * Le plan de scène — logique métier, **sans Electron**.
 *
 * Ce que le plan apporte et que les tableaux ne donnent pas : **où** est
 * chaque projecteur. Une feuille de patch dit qu'un appareil est en 145 ;
 * elle ne dit pas qu'il est en face cour, ni qu'il est le voisin de celui qui
 * partage son circuit. C'est en le voyant qu'on s'aperçoit qu'on a mis les
 * deux plus gourmands côte à côte sur la même prise.
 *
 * **Aucune adresse DMX n'est calculée ici.** Le calcul vit dans
 * `commun/dmx.js`, partagé avec la page web gratuite : deux calculateurs qui
 * divergent, c'est un patch juste à l'écran et faux en salle.
 */

interface LigneScene {
  id: number
  materiel_id: number
  etiquette: string
  x: number
  y: number
  univers: number
  adresse_dmx: number
  canaux_dmx: number
  designation: string
  puissance_w: number
  modes_dmx: string
  canaux_reference: number
}

function versAppareil(ligne: LigneScene): AppareilScene {
  return {
    id: ligne.id,
    materielId: ligne.materiel_id,
    etiquette: ligne.etiquette,
    x: ligne.x,
    y: ligne.y,
    univers: ligne.univers,
    adresseDmx: ligne.adresse_dmx,
    // 0 veut dire « le mode habituel de la référence » : c'est ce que reçoit
    // un appareil posé avant que les modes multiples existent, et c'est ce
    // qu'on veut — pas un appareil qui cesse brusquement d'être piloté.
    canauxDmx: ligne.canaux_dmx > 0 ? ligne.canaux_dmx : ligne.canaux_reference,
    designation: ligne.designation,
    puissanceW: ligne.puissance_w,
    modesDmx: ligne.modes_dmx
  }
}

const COLONNES_JOINTES = `scene_appareil.*,
         materiel.designation,
         materiel.puissance_w,
         materiel.modes_dmx,
         materiel.canaux_dmx AS canaux_reference`

/**
 * Vérifie un appareil posé et rend **une clé**, pas une phrase.
 *
 * La position est bornée à [0, 1] : x et y sont des fractions du plan, et un
 * appareil posé à 1,4 disparaîtrait hors du cadre sans qu'on sache pourquoi.
 */
function valider(
  appareil: Pick<AppareilScene, 'x' | 'y' | 'univers' | 'adresseDmx' | 'canauxDmx'>
): CleErreur | null {
  if (!(appareil.x >= 0 && appareil.x <= 1)) return 'positionHorsPlan'
  if (!(appareil.y >= 0 && appareil.y <= 1)) return 'positionHorsPlan'
  // 0 veut dire « pas encore adressé ». Au-delà de 512, l'adresse ne tient
  // dans aucun univers.
  if (!Number.isInteger(appareil.adresseDmx) || appareil.adresseDmx < 0) return 'adresseInvalide'
  if (appareil.adresseDmx > 512) return 'adresseInvalide'
  if (!Number.isInteger(appareil.univers) || appareil.univers < 1) return 'adresseInvalide'
  // 0 = on reprend le mode habituel de la référence. Un mode plus large qu'un
  // univers entier ne tiendrait nulle part.
  if (!Number.isInteger(appareil.canauxDmx) || appareil.canauxDmx < 0) return 'modeInvalide'
  if (appareil.canauxDmx > 512) return 'modeInvalide'
  // Une adresse posée doit laisser la place au mode : un appareil de 16 canaux
  // adressé en 500 déborde de l'univers, et c'est exactement l'erreur qu'on
  // découvre en salle.
  if (appareil.adresseDmx > 0 && appareil.canauxDmx > 0) {
    if (appareil.adresseDmx + appareil.canauxDmx - 1 > 512) return 'modeDebordeUnivers'
  }
  return null
}

const REQUETE_LISTE = `
  SELECT ${COLONNES_JOINTES}
    FROM scene_appareil
    JOIN materiel ON materiel.id = scene_appareil.materiel_id
   ORDER BY scene_appareil.univers, scene_appareil.adresse_dmx, scene_appareil.id`

export function listerScene(): AppareilScene[] {
  const lignes = getDb().prepare(REQUETE_LISTE).all() as unknown as LigneScene[]
  return lignes.map(versAppareil)
}

function relire(id: number): AppareilScene {
  const ligne = getDb()
    .prepare(
      `SELECT ${COLONNES_JOINTES}
         FROM scene_appareil
         JOIN materiel ON materiel.id = scene_appareil.materiel_id
        WHERE scene_appareil.id = ?`
    )
    .get(id) as unknown as LigneScene | undefined
  if (!ligne) throw new Error('materielIntrouvable')
  return versAppareil(ligne)
}

export function poserAppareil(
  appareil: Omit<AppareilScene, 'id' | 'designation' | 'puissanceW' | 'modesDmx'>
): AppareilScene {
  const erreur = valider(appareil)
  if (erreur) throw new Error(erreur)

  const existe = getDb().prepare('SELECT 1 FROM materiel WHERE id = ?').get(appareil.materielId)
  if (!existe) throw new Error('materielIntrouvable')

  const resultat = getDb()
    .prepare(
      `INSERT INTO scene_appareil
        (materiel_id, etiquette, x, y, univers, adresse_dmx, canaux_dmx)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      appareil.materielId,
      appareil.etiquette,
      appareil.x,
      appareil.y,
      appareil.univers,
      appareil.adresseDmx,
      appareil.canauxDmx
    )

  return relire(Number(resultat.lastInsertRowid))
}

/**
 * Déplace un appareil, ou change son étiquette et son adresse.
 *
 * Le matériel d'origine ne change jamais : un projecteur posé reste ce
 * projecteur-là. Le changer reviendrait à en poser un autre, et l'historique
 * de ce qui était accroché où serait perdu.
 */
export function deplacerAppareil(
  appareil: Pick<
    AppareilScene,
    'id' | 'etiquette' | 'x' | 'y' | 'univers' | 'adresseDmx' | 'canauxDmx'
  >
): AppareilScene {
  const erreur = valider(appareil)
  if (erreur) throw new Error(erreur)

  const resultat = getDb()
    .prepare(
      `UPDATE scene_appareil
          SET etiquette = ?, x = ?, y = ?, univers = ?, adresse_dmx = ?, canaux_dmx = ?
        WHERE id = ?`
    )
    .run(
      appareil.etiquette,
      appareil.x,
      appareil.y,
      appareil.univers,
      appareil.adresseDmx,
      appareil.canauxDmx,
      appareil.id
    )

  if (resultat.changes === 0) throw new Error('materielIntrouvable')
  return relire(appareil.id)
}

export function retirerAppareil(id: number): void {
  getDb().prepare('DELETE FROM scene_appareil WHERE id = ?').run(id)
}

/** Vide le plan sans toucher au parc : on range la scène, on ne vend rien. */
export function viderScene(): void {
  getDb().prepare('DELETE FROM scene_appareil').run()
}
