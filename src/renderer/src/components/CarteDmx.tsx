import { useMemo } from 'react'
import { CANAUX_PAR_UNIVERS, occupationUnivers } from '../../../../commun/dmx.js'
import type { Appareil } from '../../../../commun/dmx'
import { t } from '../../../partage/i18n'

/**
 * Les 512 canaux d'un univers, vus d'un coup d'œil.
 *
 * **Ce qu'une liste ne donne pas : la forme du patch.** Les trous entre deux
 * blocs, la place qui reste au bout, et surtout les chevauchements — l'erreur
 * classique — se voient ici sans rien lire.
 *
 * **L'occupation est calculée par `commun/dmx.js`**, comme la liste des
 * problèmes affichée à côté. Recomptée ici, la carte finirait par contredire
 * cette liste, et on ne saurait plus laquelle croire.
 *
 * **La couleur ne porte jamais l'information seule.** Vert et rouge sont
 * indistinguables pour près d'un homme sur douze, et un plan de feu se lit
 * dans l'urgence. Chaque case porte donc aussi une forme — un creux pour le
 * libre, un plein pour l'occupé, une barre pour le chevauchement — et son
 * infobulle nomme ce qui l'occupe.
 */
interface Props {
  appareils: Appareil[]
  univers: number
}

export default function CarteDmx({ appareils, univers }: Props): React.JSX.Element {
  const canaux = useMemo(() => occupationUnivers(appareils, univers), [appareils, univers])

  const comptes = useMemo(() => {
    const total = { libre: 0, occupe: 0, chevauchement: 0 }
    for (const canal of canaux) total[canal.etat] += 1
    return total
  }, [canaux])

  return (
    <div className="carte-dmx">
      <div className="carte-dmx-legende">
        <span className="dmx-case libre" /> {t('carteDmx.libre', { nombre: comptes.libre })}
        <span className="dmx-case occupe" /> {t('carteDmx.occupe', { nombre: comptes.occupe })}
        <span className="dmx-case chevauchement" />{' '}
        {t('carteDmx.chevauchement', { nombre: comptes.chevauchement })}
      </div>

      <div
        className="carte-dmx-grille"
        role="img"
        aria-label={t('carteDmx.resume', {
          univers,
          occupe: comptes.occupe,
          total: CANAUX_PAR_UNIVERS,
          chevauchement: comptes.chevauchement
        })}
      >
        {canaux.map((canal) => (
          <span
            key={canal.canal}
            className={`dmx-case ${canal.etat}`}
            // Le titre est le seul moyen de retrouver *qui* occupe un canal
            // sans quitter la carte. Sur 512 cases, une étiquette permanente
            // serait illisible.
            title={
              canal.appareils.length === 0
                ? t('carteDmx.canalLibre', { canal: canal.canal })
                : t('carteDmx.canalPris', {
                    canal: canal.canal,
                    appareils: canal.appareils.join(', ')
                  })
            }
          />
        ))}
      </div>

      {comptes.chevauchement > 0 && (
        <p className="texte-alerte">
          {t('carteDmx.alerte', { nombre: comptes.chevauchement })}
        </p>
      )}
    </div>
  )
}
