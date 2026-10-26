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