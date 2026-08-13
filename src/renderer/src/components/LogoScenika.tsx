interface Props {
  taille?: number
}

/**
 * Logo Scenika : le faisceau d'un projecteur qui descend sur le plateau,
 * inscrit dans l'écusson arrondi de la maison.
 *
 * **Il n'existait pas.** Le menu affichait le nom en gras et rien d'autre, alors
 * qu'Ohmnia porte le sien depuis toujours — défaut signalé par l'utilisateur,
 * qui cherchait un logo en haut à gauche. Ce n'était pas un affichage cassé :
 * c'était une pièce jamais écrite.
 *
 * **Le dessin est repris de `Identite/scenika.svg`, trait pour trait.** Il n'est
 * pas redessiné ici : les cinq marques de la maison partagent le même écusson,
 * le même trait sombre et les mêmes nœuds de circuit, et un dessin recopié de
 * mémoire aurait divergé au premier ajustement. Seuls le dégradé et le glyphe
 * changent d'une marque à l'autre — c'est ce qui fait qu'on les reconnaît
 * comme une famille.
 *
 * L'identifiant du dégradé est préfixé : deux SVG affichés sur la même page qui
 * déclareraient `fond` chacun de leur côté se voleraient leur couleur, et le
 * second prendrait celle du premier sans que rien ne le signale.
 */
export default function LogoScenika({ taille = 32 }: Props): React.JSX.Element {
  return (
    <svg width={taille} height={taille} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <defs>
        <linearGradient
          id="scenika-fond"
          x1="0"
          y1="0"
          x2="64"
          y2="64"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FFC961" />
          <stop offset="1" stopColor="#F2751A" />
        </linearGradient>
      </defs>

      <rect x="2" y="2" width="60" height="60" rx="16" fill="url(#scenika-fond)" />

      {/* Le faisceau d'un projecteur qui descend sur le plateau. */}
      <path d="M27 21h10l9 22H18z" stroke="#3D1B02" strokeWidth="4.2" strokeLinejoin="round" />

      {/* La lentille, au-dessus du faisceau. */}
      <path d="M26 18h12" stroke="#3D1B02" strokeWidth="4.4" strokeLinecap="round" />

      {/* Le plateau : la ligne sur laquelle la lumière tombe. */}
      <path d="M14 50h36" stroke="#3D1B02" strokeWidth="4.4" strokeLinecap="round" />

      {/* Signature de famille : les nœuds de circuit. */}
      <circle cx="12" cy="20" r="2.6" fill="#3D1B02" />
      <path d="M12 20h5" stroke="#3D1B02" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="52" cy="20" r="2.6" fill="#3D1B02" />
      <path d="M52 20h-5" stroke="#3D1B02" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}
