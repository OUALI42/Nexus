# Architecture Decision Records — Nexus
**Statut : remplacé par l'ADR-013.**

Chaque entrée suit le format : **Contexte → Décision → Alternatives écartées → Conséquences**.
Statuts possibles : `Accepté`, `Proposé`, `Remplacé par ADR-XXX`.

| #   | Décision                                   | Statut   |
|-----|--------------------------------------------|----------|
| 001 | Monorepo + Docker Compose                  | Accepté  |
| 002 | Authentification JWT (refresh en cookie)   | Accepté  |
| 003 | Traitements asynchrones avec Celery        | Accepté  |
| 004 | Base vectorielle Qdrant                    | Accepté  |
| 005 | Fournisseur IA Mistral, derrière une abstraction | Accepté |
| 006 | Export PDF avec WeasyPrint                 | Accepté  |
| 007 | Stockage des fichiers via django-storages  | Accepté  |
| 008 | Quotas par offre, en crédits IA            | Accepté  |
| 009 | Conventions API (versioning, erreurs, pagination) | Accepté |
| 010 | MySQL 8.4, InnoDB, utf8mb4                 | Accepté  |
| 011 | Suppression physique et cascade RGPD       | Accepté  |
| 012 | Cible de déploiement                       | Proposé  |

---

## ADR-001 — Monorepo + Docker Compose

**Contexte.** Développeur unique, deux applications (API Django, SPA React) et plusieurs services (MySQL, Redis, Qdrant, worker Celery).

**Décision.** Un seul dépôt Git (`backend/`, `frontend/`, `docs/`). Un `docker-compose.yml` lance l'environnement complet de développement :
`db` (MySQL 8.4), `redis`, `qdrant`, `backend`, `worker`, `beat`, `frontend`.

**Alternatives écartées.**
- Deux dépôts séparés : synchronisation des versions front/back et des PR plus lourde pour une seule personne.
- Installation locale de chaque service : environnement non reproductible et difficile à faire tourner le jour du jury.

**Conséquences.** `docker compose up` suffit pour démarrer. Une branche et une PR par story, chacune pouvant toucher le front et le back.

---

## ADR-002 — Authentification JWT, refresh token en cookie httpOnly

**Contexte.** SPA React consommant une API REST. Il faut se protéger du vol de jeton par XSS et garder une API réutilisable par une future app mobile.

**Décision.**
- `djangorestframework-simplejwt`.
- **Access token** : durée de vie de 15 min, conservé **en mémoire** côté front (jamais dans `localStorage`), envoyé dans `Authorization: Bearer`.
- **Refresh token** : durée de vie de 7 jours, stocké dans un cookie `httpOnly`, `Secure` et `SameSite=Lax`, limité au chemin `/api/v1/auth/`. Rotation à chaque utilisation et blacklist (`token_blacklist`) au logout.
- **Modèle `User` personnalisé dès le départ**, avec l'email comme identifiant. Changer de modèle utilisateur après les premières migrations est très coûteux.
- Hachage des mots de passe avec **Argon2** (`argon2-cffi`).

**Alternatives écartées.**
- Sessions Django + CSRF : solution tout aussi sûre pour un front sur le même domaine, mais moins adaptée à un client mobile.
- JWT dans `localStorage` : lisible par n'importe quel script injecté (XSS).

**Conséquences.** Au chargement, le front appelle `/auth/refresh/` pour récupérer un access token. L'endpoint de refresh, qui repose sur un cookie, est protégé par `SameSite` et par la vérification de l'en-tête `Origin`.

---

## ADR-003 — Traitements asynchrones : Celery + Redis

**Contexte.** Les appels IA (génération de fiches ou de QCM, réponses du chat) prennent de 5 à 60 s. L'ingestion d'un document (extraction du texte, découpage, embeddings) est elle aussi longue. Les rappels d'échéance doivent partir à heure fixe.

**Décision.** Celery avec Redis comme broker. Celery Beat gère les tâches planifiées (rappels, réinitialisation des compteurs).
Chaque traitement IA crée une ligne `AIJob`. L'API répond **`202 Accepted`** avec l'id du job, et le front interroge `GET /ai-jobs/{id}/` (polling).

**Alternatives écartées.**
- Appels synchrones : timeouts HTTP et workers web bloqués.
- Django-Q2 / Huey / RQ : plus légers, mais Celery est le standard de l'écosystème Django, le mieux documenté et le plus facile à défendre.
- WebSockets (Channels) pour le suivi en temps réel : complexité supérieure. Le polling suffit pour le MVP et pourra évoluer plus tard.

**Conséquences.** Deux conteneurs supplémentaires (`worker`, `beat`). Les tâches doivent être idempotentes et se déclencher via `transaction.on_commit`.

---

## ADR-004 — Base vectorielle : Qdrant

**Contexte.** Les questions-réponses sur les cours et la génération à partir des documents s'appuient sur du RAG : recherche des passages pertinents par similarité vectorielle. MySQL Community ne propose pas de recherche vectorielle exploitable.

**Décision.** Qdrant dans un conteneur dédié. Les **chunks** (texte et métadonnées) sont stockés dans MySQL (`documents_chunk`) et leur **vecteur** dans Qdrant, avec le même identifiant. Le payload Qdrant contient `user_id`, `document_id` et `subject_id`, et **chaque recherche est filtrée par `user_id`** pour isoler les données des utilisateurs.

**Alternatives écartées.**
- PostgreSQL + pgvector : solution excellente, mais elle obligerait à changer de SGBD alors que MySQL est imposé ou retenu.
- ChromaDB : plus simple, mais moins robuste en mode serveur persistant.
- Vecteurs stockés en JSON dans MySQL avec similarité calculée en Python : ne tient pas la charge.

**Conséquences.** MySQL reste la source de vérité. Qdrant peut être reconstruit à partir des chunks. Supprimer un document entraîne la suppression de ses points dans Qdrant (tâche asynchrone).

---

## ADR-005 — Fournisseur IA : Mistral, derrière une couche d'abstraction

**Contexte.** Les données traitées sont des cours et des bulletins d'étudiants. Le projet s'inscrit dans une démarche de numérique responsable et de RGPD, avec un budget étudiant.

**Décision.** Mistral AI, pour les modèles de chat et d'embeddings (`mistral-embed`).
- Entreprise européenne, hébergement dans l'UE : argument RGPD fort pour des données d'élèves, souvent mineurs.
- Très bonnes performances en français.
- Une seule API pour la génération et les embeddings.

Tout le code métier passe par une interface `AIProvider` (`apps/ai/providers/`) : `generate()`, `embed()`. Changer de fournisseur revient à écrire un nouvel adaptateur.

**Alternatives écartées.**
- OpenAI / Anthropic : qualité de raisonnement parfois supérieure, mais transferts hors UE à justifier.
- Modèle local (Ollama) : pas de coût par appel, mais exigeant en matériel serveur et moins bon en qualité.

**Conséquences.** Les tarifs et quotas gratuits sont à vérifier sur le site de Mistral avant la mise en production. La fonctionnalité de recherche d'actualité nécessitera une source web, qui fera l'objet d'un ADR dédié dans la story concernée.

---

## ADR-006 — Export PDF : WeasyPrint

**Contexte.** Les fiches de révision doivent pouvoir être exportées en PDF propre et fidèle au design.

**Décision.** WeasyPrint convertit en PDF un template Django HTML/CSS. Le PDF est généré **à la demande** (`GET /sheets/{id}/pdf/`) et n'est pas stocké.

**Alternatives écartées.**
- ReportLab : API bas niveau, mise en page codée à la main.
- Export côté navigateur (`window.print`, jsPDF) : rendu inégal selon les navigateurs.

**Conséquences.** Dépendances système (Pango) à installer dans l'image Docker. Les styles PDF sont centralisés dans un seul template.

---

## ADR-007 — Stockage des fichiers : django-storages

**Contexte.** Les utilisateurs déposent des cours et des bulletins (données personnelles). La cible de déploiement n'est pas encore choisie.

**Décision.**
- Abstraction `django-storages` : volume Docker local en développement, stockage objet compatible S3 hébergé dans l'UE en production. Changer de backend ne demande qu'une modification de configuration.
- **Aucun fichier public** : téléchargement via `GET /documents/{id}/download/`, qui vérifie le propriétaire (stream du fichier en local, URL pré-signée de courte durée en S3).
- Validation à l'upload : type réel détecté par les *magic bytes* (`python-magic`), liste blanche (PDF, DOCX, TXT, PNG, JPG), taille maximale selon l'offre. Le fichier est renommé avec un UUID ; le nom d'origine n'est conservé qu'en base.
- Empreinte `sha256` pour détecter les doublons.

**Conséquences.** Le quota de stockage est calculé à partir de `SUM(size_bytes)` des documents de l'utilisateur.

---

## ADR-008 — Quotas par offre, en crédits IA

**Contexte.** Le modèle économique prévoit trois paliers (Basique 0 €, Intermédiaire 4,99 €, Premium 9,99 €/mois). Chaque appel IA a un coût réel.

**Décision.**
- Table `billing_plan` contenant les limites, et `billing_subscription` (une par utilisateur).
- Consommation IA exprimée en **crédits** : chaque type de job a un coût (message de chat = 1, fiche = 5, QCM = 5). Consommation du mois = `SUM(AIJob.cost)` pour le mois courant, hors jobs échoués.
- Le quota est vérifié **avant** la mise en file du job. En cas de dépassement : `403` avec le code `quota_exceeded`.
- Throttling DRF en complément, contre les abus en rafale (`429`).
- Valeurs initiales provisoires :

| Offre         | Stockage | Taille max/fichier | Crédits IA/mois |
|---------------|----------|--------------------|-----------------|
| Basique       | 500 Mo   | 10 Mo              | 30              |
| Intermédiaire | 5 Go     | 25 Mo              | 300             |
| Premium       | 20 Go    | 50 Mo              | 1 500           |

**Alternatives écartées.** Une table de compteurs dédiée : risque de désynchronisation, alors que les `AIJob` contiennent déjà l'information.

**Conséquences.** Le paiement (Stripe) est hors périmètre du MVP : l'offre est attribuée en base ou depuis l'admin.

---

## ADR-009 — Conventions API

**Décision.**
- Préfixe versionné `/api/v1/`.
- **Format d'erreur unique** pour toutes les erreurs, via un exception handler DRF personnalisé (voir `API.md`).
- **Pagination** `PageNumberPagination` : `?page=` et `?page_size=` (20 par défaut, 100 au maximum).
- Ressources toujours filtrées par propriétaire : une ressource d'un autre utilisateur renvoie **404** (et non 403), pour ne pas révéler son existence.
- Documentation OpenAPI 3 générée par `drf-spectacular` (`/api/schema/`, Swagger sur `/api/docs/`).

---

## ADR-010 — MySQL 8.4 LTS, InnoDB, utf8mb4

**Décision.** MySQL 8.4 (version LTS), moteur InnoDB, jeu de caractères `utf8mb4` et collation `utf8mb4_0900_ai_ci` (insensible à la casse et aux accents pour les recherches). Mode SQL strict. Toutes les dates en UTC (`USE_TZ = True`) ; le fuseau de l'utilisateur sert uniquement à l'affichage et aux rappels.

**Conséquences.** `utf8mb4` prend en charge les emojis et tous les caractères Unicode. Les index sur `VARCHAR(255)` restent sous la limite InnoDB de 3 072 octets.

---

## ADR-011 — Suppression physique et cascade RGPD

**Contexte.** Le RGPD impose le droit à l'effacement.

**Décision.**
- Suppression physique, sans *soft delete*.
- Supprimer un utilisateur supprime en cascade toutes ses données. Un signal `post_delete` déclenche le nettoyage des fichiers du stockage et des vecteurs Qdrant (Django ne supprime pas les fichiers tout seul).
- Supprimer une **matière** ne détruit **jamais** de contenu : documents, fiches, QCM et événements passent en « non classé » (`SET_NULL`).
- Django applique les cascades au niveau de l'ORM : toujours supprimer via l'ORM, jamais en SQL brut.

---

## ADR-012 — Cible de déploiement *(Proposé)*

**Contexte.** Pas encore décidée.

**Décision provisoire.** Tout est conteneurisé et configuré par variables d'environnement (principes 12-factor). Le projet reste donc déployable sur un VPS (Docker Compose + reverse proxy Caddy) comme sur un PaaS. La décision sera prise avant la story de déploiement, en privilégiant un hébergeur européen (données d'élèves).

## ADR-013 — Authentification par session Django et protection CSRF

**Statut :** accepté — remplace l'ADR-002.

**Contexte.** L'ADR-002 prévoyait des JWT avec refresh token en cookie httpOnly.
La story S2 impose une authentification DRF par session avec CSRF. Le front React
est servi sur la même origine que l'API (proxy Vite en développement, même domaine
en production).

**Décision.** Authentification par `SessionAuthentication` de DRF. Cookie de session
httpOnly, `SameSite=Lax`, `Secure` en production. Jeton CSRF transmis dans l'en-tête
`X-CSRFToken`, lu par le front depuis le cookie `csrftoken`, initialisé par
`GET /api/v1/auth/csrf/`.

**Alternatives écartées.**
- JWT + refresh token en cookie : même protection contre le XSS sur une origine
  unique, mais complexité supplémentaire (rotation, liste noire, révocation).
- JWT stocké en localStorage : vulnérable au vol de jeton par XSS.

**Conséquences.**
- Révocation immédiate : supprimer la session déconnecte l'utilisateur.
- Pas de CORS nécessaire : django-cors-headers n'est pas installé.
- DRF n'impose le CSRF qu'aux utilisateurs authentifiés : les vues de connexion et
  d'inscription appliqueront `csrf_protect` explicitement (protection contre le
  login CSRF).
- Une future application mobile nécessiterait un mécanisme par jeton
  supplémentaire, qui fera l'objet d'un nouvel ADR.


  ## ADR-014 — Tailwind CSS v4 et tokens de design à deux thèmes

**Statut :** accepté.

**Contexte.** La story S3 exige une interface cohérente, en thème clair ou sombre,
avec un contraste AA vérifié dans les deux thèmes, le thème système par défaut et
un choix mémorisé. La maquette définit la palette (bleu nuit, indigo, violet IA),
la typographie (Manrope) et les formes.

**Décision.**
- Tailwind CSS v4, configuré directement en CSS (`@theme`), sans fichier de configuration JavaScript.
- Les couleurs sont des variables CSS déclarées une seule fois avec `light-dark(<clair>, <sombre>)`,
  puis exposées à Tailwind par `@theme inline`. Le thème actif dépend de `color-scheme` :
  système par défaut, forcé par l'attribut `data-theme` de `<html>`.
- La palette par défaut de Tailwind est désactivée (`--color-*: initial`) : seules les
  couleurs du design system existent.
- Un test calcule le contraste WCAG de chaque paire de couleurs utilisée, dans les deux
  thèmes, à partir du fichier de tokens lui-même. Il tourne dans la CI.
- Manrope est auto-hébergée (Fontsource) au lieu d'être chargée depuis Google Fonts.

**Alternatives écartées.**
- CSS Modules : aucune dépendance, mais une feuille de style par composant et une
  cohérence plus difficile à garantir sur un projet mené seul.
- Variante `dark:` de Tailwind dans chaque composant : chaque couleur serait écrite
  deux fois, avec un risque d'oubli. `light-dark()` règle le thème une fois pour toutes
  dans les tokens.
- Bibliothèque de composants (MUI, Chakra) : style imposé, difficile à aligner sur la maquette.
- Google Fonts : requête vers un serveur tiers à chaque visite, contraire à l'approche
  européenne retenue pour le RGPD (ADR-005).

**Conséquences.**
- Un composant écrit `bg-surface` et fonctionne dans les deux thèmes sans code supplémentaire.
- Une couleur ajoutée sans paire de contraste testée n'est pas vérifiée : toute nouvelle
  combinaison texte/fond doit être ajoutée à `tokens.test.ts`.
- `light-dark()` exige un navigateur publié après mai 2024.
- Le script qui applique le thème avant le premier affichage est un script en ligne :
  il devra être autorisé par une empreinte dans la Content Security Policy.

## ADR-015 — Composants accessibles construits sur les éléments HTML natifs

**Statut :** accepté.

**Contexte.** La story S3 exige des composants Button, Input, Modal et Toast accessibles
(labels, focus visible, piège de focus), des cibles de 44 px, une navigation entièrement
au clavier et une page active signalée autrement que par la couleur.

**Décision.**
- Chaque composant repose d'abord sur l'élément HTML natif qui porte déjà la sémantique :
  `<button>`, `<input>` et `<label>`, `<dialog>` ouvert par `showModal()`, régions
  `role="status"` et `role="alert"`, boutons radio pour le choix du thème.
- Le comportement natif est complété là où il ne suffit pas : piège de focus et retour
  du focus de la modale, pause des toasts au survol, focus sur le titre après un
  changement de page.
- La taille minimale des cibles est un token (`--spacing-tap`, 44 px), utilisé par
  tous les éléments interactifs.
- Un état n'est jamais signalé par la seule couleur : forme (barre, coche, icône) et
  graisse s'y ajoutent.
- L'accessibilité est testée automatiquement (axe-core, Testing Library) et suivant un
  protocole manuel documenté dans `docs/ACCESSIBILITY.md`.

**Alternatives écartées.**
- Bibliothèques de composants sans style (Radix UI, React Aria) : très robustes, mais
  une dépendance supplémentaire pour quatre composants que le HTML natif couvre en grande partie.
- Modale construite sur une `<div>` : inertie de la page, Échap et annonce du rôle
  seraient à recoder entièrement.

**Conséquences.**
- Moins de code et de dépendances, et un comportement familier aux utilisateurs de
  technologies d'assistance.
- Une modale ouverte passe au-dessus de tout, toasts compris : un toast de confirmation
  doit être affiché après la fermeture de la modale.
- Des composants plus complexes (liste déroulante avec recherche, sélecteur de date)
  pourront justifier une bibliothèque comme React Aria, via un nouvel ADR.


## ADR-016 — Vérification de l'e-mail par jeton haché, à usage unique et expirant

**Statut :** accepté.

**Contexte.** La story S4 exige un e-mail de vérification contenant un lien à usage unique
et expirant.

**Décision.**
- Un jeton aléatoire de 256 bits est généré avec le module `secrets`. Seule son empreinte
  SHA-256 est stockée en base ; le jeton en clair n'existe que dans l'e-mail.
- Le jeton expire au bout de 24 heures. Il est marqué comme utilisé lors de la vérification,
  sous verrou de ligne (`select_for_update`), pour qu'une double requête ne puisse pas
  l'utiliser deux fois. Demander un nouveau lien révoque les précédents.
- Le lien ouvre une page du front-end. La vérification n'a lieu qu'au clic sur
  « Confirmer mon adresse », par une requête POST protégée par CSRF.
- L'e-mail n'est envoyé qu'après la validation de la transaction d'inscription (`on_commit`).
- Le renvoi d'un lien répond de la même façon, que l'adresse existe ou non.

**Alternatives écartées.**
- Jeton signé sans stockage (`PasswordResetTokenGenerator` de Django) : pas de trace en
  base, révocation des anciens liens et usage unique moins explicites.
- Hachage du jeton avec Argon2 : inutile pour une valeur aléatoire de 256 bits, et
  incompatible avec une recherche directe par empreinte.
- Validation directe à l'ouverture du lien (GET) : les outils d'analyse des messageries
  ouvrent les liens et consommeraient le jeton à la place de l'utilisateur.

**Conséquences.**
- Une fuite de la base ne permet pas de valider le compte d'un autre utilisateur.
- L'envoi de l'e-mail ralentit la requête d'inscription : il passera par une tâche Celery
  lorsque Celery sera en place.
- Les jetons expirés s'accumulent : une purge périodique sera ajoutée avec Celery.

## ADR-017 — Données d'inscription : minimisation et consentement versionné

**Statut :** accepté.

**Contexte.** La story S4 demande un profil (nom d'utilisateur unique, filière, plan) et un
consentement RGPD dont la date et la version sont enregistrées.

**Décision.**
- L'inscription ne demande que l'e-mail, le mot de passe, le nom d'utilisateur et la
  filière. Le prénom et le nom deviennent facultatifs (principe de minimisation du RGPD).
- Le profil (`Profile`) porte le nom d'utilisateur, unique sans tenir compte de la casse,
  et la filière, choisie dans une liste fermée. La filière est retirée du modèle `User`,
  où elle était un texte libre depuis la S1.
- Le plan reste dans `billing.Subscription` (créée automatiquement à l'inscription depuis
  la S1) et sera exposé dans l'API du profil en lecture seule, pour éviter deux sources de vérité.
- Chaque acceptation de la politique de confidentialité est un enregistrement
  `PrivacyConsent` (version, date). La version en vigueur est définie côté serveur ;
  une inscription faite avec une version périmée est refusée.

**Alternatives écartées.**
- Champ `plan` dans `Profile` : duplication de l'abonnement, avec un risque d'incohérence.
- Date et version du consentement en champs de `Profile` : l'historique des versions
  acceptées serait perdu à chaque mise à jour de la politique.

**Conséquences.**
- Une nouvelle version de

## ADR-018 — Connexion : protection contre les attaques et conditions d'accès

**Statut :** accepté.

**Contexte.** La story S5 exige un message générique en cas d'identifiants invalides, un
blocage temporaire après 5 échecs avec un message neutre, et la journalisation des tentatives.

**Décision.**
- django-axes bloque le couple **e-mail + adresse IP** pendant 15 minutes après 5 échecs.
  Le compteur est remis à zéro après une connexion réussie. L'e-mail est mis en minuscules
  avant la vérification, pour qu'une variation de casse ne crée pas un second compteur.
- La réponse de blocage est un JSON au format d'erreur unique (`too_many_attempts`, 429,
  en-tête `Retry-After`), identique que l'adresse existe ou non.
- Un e-mail inconnu et un mauvais mot de passe reçoivent la même réponse
  (`invalid_credentials`, 401).
- Chaque échec est journalisé (e-mail saisi, IP, navigateur, date). Les journaux sont
  conservés 30 jours, ce qu'indique la politique de confidentialité.
- La connexion est refusée tant que l'adresse e-mail n'est pas vérifiée
  (`email_not_verified`, 403). Ce message n'est renvoyé qu'après un mot de passe correct.
- Les vues de connexion et de déconnexion imposent la protection CSRF (engagement de l'ADR-013).

**Alternatives écartées.**
- Blocage par e-mail seul : n'importe qui pourrait bloquer le compte d'un autre utilisateur.
- Blocage par IP seule : bloquerait tous les utilisateurs d'un même réseau (lycée, CDI).
- Connexion autorisée avec un e-mail non vérifié : la récupération de mot de passe, qui
  repose sur l'adresse, ne serait pas fiable.

**Conséquences.**
- Un attaquant qui change d'adresse IP à chaque essai n'est pas arrêté par axes ; la
  limitation de débit de DRF et les règles de mot de passe de la S4 compensent.
- Les journaux d'axes doivent être purgés régulièrement (`axes_reset_logs`), avec Celery.
- En production, axes devra lire l'adresse IP réelle derrière le reverse proxy.

## ADR-019 — Durée de session et déconnexion après inactivité

**Statut :** accepté.

**Contexte.** La story S5 exige une déconnexion manuelle, avec une session invalidée côté
serveur, et une déconnexion automatique après inactivité, avec un avertissement.

**Décision.**
- Côté serveur : expiration glissante de 30 minutes (`SESSION_SAVE_EVERY_REQUEST`).
  Les sessions sont stockées dans Redis avec une copie en base (`cached_db`).
- Côté front : un minuteur mesure l'inactivité réelle de l'utilisateur (clic, frappe,
  défilement, toucher). Il affiche un avertissement 2 minutes avant l'échéance, avec un
  bouton « Rester connecté », puis déconnecte. Pendant l'activité, la session serveur est
  prolongée toutes les 5 minutes. Les onglets partagent l'heure de la dernière activité.
- Les durées sont définies une seule fois côté serveur et transmises au front par
  l'endpoint de session.
- La déconnexion supprime la session côté serveur, puis vide le cache du front.

**Alternatives écartées.**
- Expiration côté serveur seule : les requêtes automatiques du front prolongeraient une
  session alors que personne n'est devant l'écran.
- Minuteur côté front seul : inopérant quand l'onglet est fermé ou l'ordinateur en veille.
- Minuteur basé sur `setTimeout` : suspendu pendant la veille de l'ordinateur ; le calcul
  repose donc sur l'heure réelle.

**Conséquences.**
- L'avertissement satisfait le critère WCAG 2.2.1 (réglage du délai).
- La session n'a pas de durée maximale absolue : une utilisation continue n'impose jamais
  de reconnexion.
- Les sessions expirées restent en base jusqu'à la commande `clearsessions`, à planifier avec Celery.

## ADR-020 — Données de démo réservées au développement

**Statut :** accepté.

**Contexte.** La story S6 demande des comptes et des données de démo, pour présenter
l'application sans passer par l'inscription, sans jamais exposer de mot de passe dans le dépôt.

**Décision.**
- Une commande `manage.py seed_demo` crée 3 élèves (adresses en `.test`, domaine réservé),
  leurs casiers et des cours au format PDF générés par la commande.
- Elle est relançable : chaque élément est recherché avant d'être créé. L'option `--reset`
  supprime d'abord les comptes de démo.
- Elle refuse de s'exécuter si `ALLOW_DEMO_SEED` (défini uniquement dans `dev.py`) et
  `DEBUG` ne sont pas tous deux actifs.
- Le mot de passe est lu dans `DEMO_ACCOUNT_PASSWORD` (fichier `.env`), validé par les mêmes
  règles qu'un vrai compte, et jamais affiché.
- Après la connexion, l'utilisateur arrive sur « Mes casiers ». L'onboarding (S5) est
  désactivé par un interrupteur (`ONBOARDING_ENABLED`), et non supprimé ; ses tests le
  réactivent pour qu'il reste vérifié.

**Alternatives écartées.**
- Fixtures Django (`loaddata`) : mots de passe hachés figés dans le dépôt, fichiers PDF à
  versionner, et aucune protection contre une exécution en production.
- Test sur `DEBUG` seul : une seule erreur de configuration suffirait à créer des comptes
  au mot de passe connu en production.
- Mot de passe par défaut dans le code : connu de quiconque lit le dépôt.

**Conséquences.**
- Les cours de démo passent la vérification de signature PDF prévue en S7.
- La S7 devra compléter les données de démo avec les icônes des casiers.

## ADR-021 — Icônes et couleurs des casiers en listes fermées

- **Date** : 17/11/2026
- **Statut** : Acceptée
- **Story** : S7

### Contexte

L'élève personnalise ses casiers avec une couleur et une icône. Deux exigences RGAA s'appliquent : la couleur ne doit jamais être le seul moyen de distinguer un casier, et le texte blanc posé sur la couleur doit rester lisible (contraste AA, 4,5:1). Une valeur libre (n'importe quel code hexadécimal, n'importe quel nom d'icône) ne permet de garantir ni l'un ni l'autre.

### Décision

- **Icônes** : une liste fermée de 16 icônes de la bibliothèque lucide (`LockerIcon`, `TextChoices`), protégée par une contrainte `CHECK` en base. Le nom du casier est toujours affiché à côté de l'icône.
- **Couleurs** : une palette fermée de 12 couleurs, toutes à au moins 4,5:1 avec le blanc, vérifiée par le serializer uniquement.
- **Source unique de vérité** : l'API expose les deux listes et leurs libellés (`GET /lockers/choices/`). Le front ne propose que ces valeurs.

La différence de traitement est volontaire : une icône inconnue **casse l'affichage** (le front ne sait pas la dessiner), alors qu'une couleur hors palette **s'affiche quand même**. La palette relève du design et doit pouvoir évoluer sans migration ni blocage des casiers existants.

### Conséquences

- Ajouter une icône demande une migration et son ajout dans `frontend/src/features/lockers/icons.tsx`. En attendant, le front affiche un dossier pour toute icône inconnue.
- Les couleurs venant de l'API, elles sont appliquées par l'attribut `style`. La future politique CSP devra l'autoriser (`style-src-attr`) ou passer par des variables CSS.

### Alternatives écartées

- **Sélecteur de couleur libre** : contraste impossible à garantir.
- **Contrainte `CHECK` sur la couleur** : chaque changement de palette imposerait une migration.

---

## ADR-022 — Contrôle des fichiers déposés

- **Date** : 17/11/2026
- **Statut** : Acceptée
- **Story** : S7

### Contexte

Les élèves déposent leurs cours en PDF. Le nom, l'extension et le type annoncés par le navigateur sont entièrement contrôlés par le client : un exécutable renommé en `cours.pdf` arrive avec `Content-Type: application/pdf`. La taille maximale dépend de l'offre de l'élève.

### Décision

Contrôles dans cet ordre :

1. **Propriétaire** : le casier doit appartenir à l'élève, sinon `404`. Ce contrôle passe en premier pour qu'aucune autre erreur ne révèle l'existence du casier d'un autre élève.
2. **Taille annoncée** : si l'en-tête `Content-Length` dépasse la limite (plus une marge de 64 Kio pour l'enveloppe multipart), la réponse est `413` sans lire le corps. Sinon, Django écrirait d'abord le fichier entier sur le disque.
3. **Taille réelle** : comparée à `billing_plan.max_file_size_bytes` (10 Mo par défaut pour un compte sans offre).
4. **Signature** : les 5 premiers octets doivent être `%PDF-`.
5. **Stockage** : nom aléatoire (UUID), nom d'origine conservé à part pour l'affichage et le téléchargement, empreinte SHA-256 calculée par morceaux, type forcé à `application/pdf`.
6. **Atomicité** : si l'insertion en base échoue, le fichier déjà écrit est supprimé.

### Conséquences

- La signature prouve qu'un fichier **commence** comme un PDF, pas qu'il est sain : un PDF peut contenir du JavaScript. La protection porte sur la façon de le servir (ADR-023). Un antivirus n'est pas prévu dans cette version.
- En production, le proxy devra aussi limiter la taille des requêtes (`client_max_body_size` dans nginx).

### Alternatives écartées

- **`python-magic`** : dépend de la bibliothèque système `libmagic`, inutile pour un seul format.
- **Limite fixe dans le code** : la limite varie selon l'offre et existe déjà en base depuis la S1.

---

## ADR-023 — Accès aux cours réservé à leur propriétaire

- **Date** : 17/11/2026
- **Statut** : Acceptée
- **Story** : S7

### Contexte

Un fichier placé dans `MEDIA_ROOT` et servi directement est accessible à quiconque connaît son URL. Le nom aléatoire rend l'URL difficile à deviner, mais ce n'est pas un contrôle d'accès : une URL fuit (historique, capture d'écran, lien partagé). Les cours sont des données personnelles.

### Décision

- **Aucune URL publique** : ni `static()` sur `MEDIA_URL` en développement, ni bloc `location /media` dans nginx en production.
- **Un seul accès** : `GET /api/v1/courses/<id>/file/`, qui filtre sur le propriétaire (`404` sinon) et envoie le fichier en flux (`FileResponse`).
- **En-têtes** :
  - `Content-Type: application/pdf` forcé, avec `nosniff`, pour qu'un fichier ne soit jamais interprété comme une page HTML ;
  - `Cache-Control: private, no-store`, pour qu'aucun cache partagé ni le navigateur ne garde de copie.
- **Affichage** : `inline` par défaut, `attachment` avec `?download=1`. Le nom d'origine est proposé au téléchargement.
- L'API ne renvoie jamais le chemin de stockage, seulement `file_url`.

### Conséquences

- Le front ouvre les cours avec de simples liens `<a href>` : le navigateur envoie le cookie de session tout seul.
- **Compromis** : l'en-tête `Content-Security-Policy: sandbox` aurait isolé davantage le PDF, mais il empêche l'affichage par le lecteur PDF de Chrome. On s'appuie sur l'isolation des lecteurs PDF intégrés aux navigateurs.

### Alternatives écartées

- **URL signées temporaires** : utiles avec un stockage objet (S3), superflues avec le disque local.
- **`X-Accel-Redirect` (nginx)** : décharge Django de l'envoi des gros fichiers. À envisager en production si la charge le justifie.

---

## ADR-024 — Formulaires des casiers accessibles grâce aux éléments natifs

- **Date** : 17/11/2026
- **Statut** : Acceptée
- **Story** : S7

### Contexte

La création d'un casier (nom, couleur, icône) et le dépôt d'un cours doivent être utilisables au clavier et avec un lecteur d'écran, avec des cibles de 44 px.

### Décision

- **Création sur une page dédiée** (`/casiers/nouveau`) plutôt que dans une modale. Une modale accessible impose de gérer le piège du focus, la touche Échap et le retour du focus, et elle est pénible sur mobile avec le clavier virtuel. La page dédiée a son URL et fonctionne avec le bouton Retour.
- **Contrôles natifs masqués visuellement** : les couleurs et les icônes sont de vrais `<input type="radio">` regroupés dans un `<fieldset>` avec sa `<legend>`, et le dépôt est un vrai `<input type="file">`. Ils sont masqués avec `sr-only` mais restent dans la page. On hérite ainsi de la navigation aux flèches, de l'ouverture avec Entrée ou Espace, et des annonces des lecteurs d'écran, sans rien recoder.
- **Sélection jamais portée par la teinte seule** : une coche sur la couleur choisie, le remplissage de l'icône choisie, et un aperçu du casier.

### Conséquences

- L'anneau de focus est porté par le libellé (`has-[:focus-visible]`), puisque le contrôle lui-même est invisible.
- Le glisser-déposer n'est pas proposé : il n'est pas utilisable au clavier et ne pourra venir qu'en complément.

### Alternatives écartées

- **Boutons personnalisés avec `role="radio"`** : il faudrait recoder la navigation aux flèches et la gestion du focus.
- **Bibliothèque de composants** : une dépendance de plus pour deux groupes de boutons radio.
