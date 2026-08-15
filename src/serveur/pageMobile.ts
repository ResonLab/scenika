/**
 * La page de consultation mobile, servie par Nexika sur le réseau local.
 *
 * **Ce qu'elle répond, et pourquoi elle existe.** Un inventaire se consulte
 * debout dans un dépôt, un téléphone à la main : « est-ce qu'il nous reste des
 * PAR 64 ? », « les six lyres sont-elles rentrées ? ». Ouvrir un portable,
 * démarrer l'application et chercher la ligne n'est pas une réponse à cette
 * question-là.
 *
 * **Elle consulte, elle ne modifie rien.** Aucun bouton n'écrit. Ce n'est pas
 * une limitation à lever plus tard : une saisie faite debout dans un dépôt, sur
 * un clavier de téléphone, entre deux caisses, est une saisie fausse. Le parc
 * se tient depuis l'application.
 *
 * **Un seul fichier, rien de chargé d'ailleurs.** Pas de police distante, pas
 * de bibliothèque, pas de feuille de style externe. Le serveur tourne sur le
 * réseau d'une entreprise, souvent sans accès à l'internet, et une page qui
 * dépend d'un CDN est une page qui ne s'affiche pas le jour du montage. Nexika
 * l'annonce d'ailleurs avec une politique de sécurité qui interdit tout le
 * reste.
 *
 * **Elle ne porte aucune donnée.** Elle demande l'identifiant et le mot de
 * passe, ouvre une session par `session:ouvrir`, puis appelle exactement les
 * mêmes canaux qu'un poste, avec le même jeton et les mêmes droits. Le serveur
 * ne lui accorde rien de particulier — c'est ce qui rend acceptable de la
 * servir sans session.
 *
 * **L'identifiant est retenu sur l'appareil, jamais le mot de passe.** Un champ
 * a remplir au lieu de deux. L'identifiant n'est pas un secret : c'est le mot
 * de passe qui l'est, et il n'est ecrit nulle part.
 *
 * **Le jeton aussi est garde sur l'appareil, et c'est un compromis assume.**
 * Nexika delivre une session de douze heures ; la jeter a la fermeture de
 * l'onglet obligeait a se reconnecter a chaque consultation, six fois par jour.
 * Ce qui finit toujours de la meme facon : un mot de passe court, note quelque
 * part. Garde, c'est **une connexion le matin en arrivant**, et le serveur
 * borne lui-meme la duree — la page ne peut pas la prolonger.
 *
 * Le prix, dit franchement : un telephone perdu dans la journee donne acces a
 * la consultation jusqu'a l'expiration. Le bouton « Sortir » efface le jeton
 * tout de suite, et un compte se desactive depuis l'application. C'est le seul
 * endroit ou l'on troque un peu de surete contre du confort, et c'est ecrit ici
 * pour que personne ne le decouvre plus tard.
 */
export const PAGE_MOBILE = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="color-scheme" content="dark light" />
<title>Scenika — parc</title>
<style>
  :root {
    --ambre: #ffc961;
    --orange: #f2751a;
    --fond: #14110d;
    --carte: #1e1a15;
    --trait: #3a3227;
    --texte: #f4efe6;
    --discret: #a89b86;
    --rouge: #ff6b5e;
    --vert: #57d99a;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--fond);
    color: var(--texte);
    font: 17px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    padding: env(safe-area-inset-top) 0 env(safe-area-inset-bottom);
  }
  header {
    position: sticky; top: 0; z-index: 2;
    background: var(--fond);
    border-bottom: 1px solid var(--trait);
    padding: 0.7rem 1rem;
  }
  h1 { font-size: 1.05rem; margin: 0 0 0.5rem; }
  h1 span { color: var(--ambre); }
  main { padding: 0.8rem 1rem 3rem; }
  /* **Les cibles font au moins 44 px** : on tape dessus avec des gants, ou une
     main occupée par une caisse. */
  input, button, select {
    font: inherit;
    min-height: 44px;
    width: 100%;
    border-radius: 8px;
    border: 1px solid var(--trait);
    background: var(--carte);
    color: var(--texte);
    padding: 0.5rem 0.7rem;
  }
  button {
    background: linear-gradient(120deg, var(--ambre), var(--orange));
    color: #2a1c05; border: none; font-weight: 700;
  }
  label { display: block; margin-bottom: 0.7rem; font-size: 0.85rem; color: var(--discret); }
  label input { margin-top: 0.25rem; }
  .ligne {
    display: flex; justify-content: space-between; align-items: baseline; gap: 0.6rem;
    padding: 0.7rem 0; border-bottom: 1px solid var(--trait);
  }
  .ligne b { font-weight: 600; }
  .ligne .ref { color: var(--discret); font-size: 0.78rem; display: block; }
  /* Le chiffre qui compte se lit d'un coup d'œil, en chasse fixe pour que les
     lignes s'alignent quand on parcourt la liste. */
  .dispo { font-variant-numeric: tabular-nums; white-space: nowrap; font-weight: 700; }
  .dispo.zero { color: var(--ambre); }
  .dispo.negatif { color: var(--rouge); }
  .sorti { color: var(--discret); font-size: 0.78rem; }
  .erreur { color: var(--rouge); }
  .discret { color: var(--discret); font-size: 0.85rem; }
  .barre { display: flex; gap: 0.5rem; align-items: center; }
  .barre button { width: auto; padding: 0 0.9rem; }
</style>
</head>
<body>
<header>
  <h1>Scenika <span>— parc</span></h1>
  <div id="barre"></div>
</header>
<main id="corps"><p class="discret">Chargement…</p></main>

<script>
/*
  Aucune donnée de parc n'est conservée : la page interroge le serveur, affiche,
  et oublie. Seuls l'identifiant et le jeton de session restent sur l'appareil —
  voir l'en-tête du module pour ce que cela coûte et ce que cela évite.
*/
(function () {
  /*
    Le stockage peut manquer — navigation privée, réglage restrictif. Dans ce
    cas la page marche exactement comme avant : on se reconnecte à chaque fois.
    Un stockage indisponible ne doit pas casser la consultation.
  */
  function retenir(cle, valeur) {
    try { valeur === null ? localStorage.removeItem(cle) : localStorage.setItem(cle, valeur) }
    catch (e) { /* sans stockage, on oublie — ce n'est pas une panne */ }
  }
  function souvenir(cle) {
    try { return localStorage.getItem(cle) } catch (e) { return null }
  }

  var jeton = souvenir('scenika.jeton')

  function appeler(canal, args) {
    return fetch('/api/' + encodeURIComponent(canal), {
      method: 'POST',
      headers: Object.assign(
        { 'content-type': 'application/json' },
        jeton ? { authorization: 'Bearer ' + jeton } : {}
      ),
      body: JSON.stringify({ arguments: args || [] })
    }).then(function (r) {
      return r.json().then(function (charge) {
        if (!r.ok) throw new Error(charge && charge.erreur ? charge.erreur : 'Erreur ' + r.status)
        return charge.resultat
      })
    })
  }

  var barre = document.getElementById('barre')
  var corps = document.getElementById('corps')

  function echapper(texte) {
    return String(texte == null ? '' : texte).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
    })
  }

  /* ── L'écran de connexion ────────────────────────────────────────────── */

  function demanderConnexion(message) {
    barre.innerHTML = ''
    corps.innerHTML =
      '<label>Identifiant<input id="ident" autocomplete="username" autocapitalize="none" value="' +
      echapper(souvenir('scenika.identifiant') || '') + '" /></label>' +
      '<label>Mot de passe<input id="motdepasse" type="password" autocomplete="current-password" /></label>' +
      '<button id="entrer">Se connecter</button>' +
      '<p class="discret" id="message">' + echapper(message || '') + '</p>'

    var entrer = document.getElementById('entrer')
    var message2 = document.getElementById('message')
    // L'identifiant étant déjà là, c'est le mot de passe qu'on veut sous le
    // doigt en ouvrant la page.
    var champMotDePasse = document.getElementById('motdepasse')
    if (souvenir('scenika.identifiant')) champMotDePasse.focus()
    else document.getElementById('ident').focus()
    entrer.onclick = function () {
      entrer.disabled = true
      message2.className = 'discret'
      message2.textContent = 'Connexion…'
      appeler('session:ouvrir', [
        document.getElementById('ident').value,
        document.getElementById('motdepasse').value
      ])
        .then(function (session) {
          jeton = session.jeton
          retenir('scenika.identifiant', document.getElementById('ident').value)
          retenir('scenika.jeton', jeton)
          charger()
        })
        .catch(function (e) {
          entrer.disabled = false
          message2.className = 'erreur'
          message2.textContent = e.message
        })
    }
  }

  /* ── La consultation ─────────────────────────────────────────────────── */

  var tout = []

  function afficher(filtre) {
    var mots = filtre.trim().toLowerCase()
    var vus = tout.filter(function (d) {
      if (!mots) return true
      return (d.reference + ' ' + d.designation).toLowerCase().indexOf(mots) >= 0
    })

    if (vus.length === 0) {
      corps.innerHTML = '<p class="discret">Rien ne correspond.</p>'
      return
    }

    corps.innerHTML = vus
      .map(function (d) {
        var classe = d.disponible < 0 ? 'negatif' : d.disponible === 0 ? 'zero' : ''
        // Ce qui est sorti n'est affiché que s'il y en a : une colonne de
        // « 0 sortis » remplirait l'écran sans rien apprendre.
        var sorti = d.sorti > 0 ? '<span class="sorti">' + d.sorti + ' dehors</span>' : ''
        return (
          '<div class="ligne"><span><b>' + echapper(d.designation) + '</b>' +
          '<span class="ref">' + echapper(d.reference) + '</span>' + sorti + '</span>' +
          '<span class="dispo ' + classe + '">' + d.disponible + ' / ' + d.possede + '</span></div>'
        )
      })
      .join('')
  }

  function charger() {
    corps.innerHTML = '<p class="discret">Lecture du parc…</p>'
    appeler('locations:disponibilites')
      .then(function (donnees) {
        tout = donnees
        barre.innerHTML =
          '<div class="barre"><input id="chercher" placeholder="Chercher une référence…" ' +
          'autocapitalize="none" autocomplete="off" /><button id="quitter">Sortir</button></div>'
        var chercher = document.getElementById('chercher')
        chercher.oninput = function () { afficher(chercher.value) }
        document.getElementById('quitter').onclick = function () {
          jeton = null
          tout = []
          // L'identifiant reste : ce n'est pas lui qu'on ferme.
          retenir('scenika.jeton', null)
          demanderConnexion('Session fermée.')
        }
        afficher('')
      })
      .catch(function (e) {
        // Une session expirée ramène à la connexion plutôt que d'afficher un
        // message technique dont personne ne peut rien faire. Le jeton périmé
        // est effacé au passage : le garder ferait échouer chaque ouverture.
        jeton = null
        retenir('scenika.jeton', null)
        demanderConnexion(e.message)
      })
  }

  // Un jeton gardé de la veille peut avoir expiré : on ne le croit pas sur
  // parole : on s'en sert, et charger() renvoie a la connexion s'il est refuse.
  if (jeton) charger()
  else demanderConnexion('')
})()
</script>
</body>
</html>
`
