# API — Nexus `/api/v1/`

Documentation interactive générée par drf-spectacular :

- `GET /api/schema/` : schéma OpenAPI 3 (YAML)
- `GET /api/docs/` : Swagger UI (activé en développement, réservé au staff en production)

## Conventions

**Authentification** : `Authorization: Bearer <access_token>`, sauf pour les endpoints marqués `Public`.

**Permissions**

| Code     | Signification                                                                                        |
| -------- | ---------------------------------------------------------------------------------------------------- |
| `Public` | `AllowAny`                                                                                           |
| `Auth`   | `IsAuthenticated`                                                                                    |
| `Owner`  | `IsAuthenticated` + queryset filtré par propriétaire (404 si la ressource n'est pas à l'utilisateur) |
| `Quota`  | `Owner` + vérification du quota (crédits IA ou stockage)                                             |
| `Staff`  | `IsAdminUser`                                                                                        |

**Pagination** : toutes les listes, sauf mention contraire.

```json
{
  "count": 42,
  "next": "https://…/api/v1/documents/?page=3",
  "previous": "https://…/api/v1/documents/?page=1",
  "results": []
}
```

Paramètres : `?page=` et `?page_size=` (20 par défaut, 100 au maximum).

**Format d'erreur unique**

```json
{
  "error": {
    "code": "validation_error",
    "message": "Les données envoyées sont invalides.",
    "details": {
      "email": ["Un compte existe déjà avec cet e-mail."]
    }
  }
}
```

| HTTP | `code`                   | Cas                                                    |
| ---- | ------------------------ | ------------------------------------------------------ |
| 400  | `validation_error`       | Payload invalide (`details` par champ)                 |
| 400  | `parse_error`            | JSON mal formé                                         |
| 401  | `not_authenticated`      | Jeton absent                                           |
| 401  | `authentication_failed`  | Jeton invalide ou expiré                               |
| 403  | `permission_denied`      | Action non autorisée                                   |
| 403  | `quota_exceeded`         | Quota atteint (`details`: `used`, `limit`, `resource`) |
| 404  | `not_found`              | Ressource inexistante ou d'un autre utilisateur        |
| 405  | `method_not_allowed`     |                                                        |
| 409  | `conflict`               | Doublon (ex. même fichier déjà déposé)                 |
| 413  | `file_too_large`         | Fichier au-delà de la limite de l'offre                |
| 415  | `unsupported_media_type` | Type de fichier refusé                                 |
| 429  | `throttled`              | Trop de requêtes (`details.retry_after`)               |
| 500  | `server_error`           | Erreur interne (aucun détail technique exposé)         |

**Traitements asynchrones** : `202 Accepted` + `{"job": {"id": "<uuid>", "status": "queued"}}`, puis polling de `GET /ai-jobs/{id}/`.

---

## Authentification & compte

| Méthode | Endpoint                        | Perm.           | Payload                                                  | Réponse                                                               |
| ------- | ------------------------------- | --------------- | -------------------------------------------------------- | --------------------------------------------------------------------- |
| POST    | `/auth/register/`               | Public          | `email`, `password`, `first_name`, `last_name`, `track?` | 201 `User`                                                            |
| POST    | `/auth/login/`                  | Public          | `email`, `password`                                      | 200 `{access}` + cookie refresh                                       |
| POST    | `/auth/refresh/`                | Public (cookie) | —                                                        | 200 `{access}` + cookie renouvelé                                     |
| POST    | `/auth/logout/`                 | Auth            | —                                                        | 204, refresh blacklisté, cookie supprimé                              |
| POST    | `/auth/password-reset/`         | Public          | `email`                                                  | 202 (toujours, pour ne pas révéler l'existence du compte)             |
| POST    | `/auth/password-reset/confirm/` | Public          | `uid`, `token`, `new_password`                           | 204                                                                   |
| GET     | `/me/`                          | Auth            | —                                                        | 200 `User`                                                            |
| PATCH   | `/me/`                          | Auth            | `first_name?`, `last_name?`, `track?`, `timezone?`       | 200 `User`                                                            |
| POST    | `/me/change-password/`          | Auth            | `current_password`, `new_password`                       | 204                                                                   |
| DELETE  | `/me/`                          | Auth            | `password`                                               | 204, suppression RGPD                                                 |
| GET     | `/me/usage/`                    | Auth            | —                                                        | 200 `{plan, storage:{used,limit}, ai_credits:{used,limit,resets_at}}` |
| GET     | `/plans/`                       | Public          | —                                                        | 200 `Plan[]` (non paginé)                                             |

## Matières (casiers)

| Méthode | Endpoint          | Perm. | Payload                        | Réponse                                              |
| ------- | ----------------- | ----- | ------------------------------ | ---------------------------------------------------- |
| GET     | `/subjects/`      | Owner | —                              | 200 `Subject[]` (non paginé, ordonné par `position`) |
| POST    | `/subjects/`      | Owner | `name`, `color`, `position?`   | 201                                                  |
| GET     | `/subjects/{id}/` | Owner | —                              | 200                                                  |
| PATCH   | `/subjects/{id}/` | Owner | `name?`, `color?`, `position?` | 200                                                  |
| DELETE  | `/subjects/{id}/` | Owner | —                              | 204, contenus passés en « non classé »               |

## Documents

| Méthode | Endpoint                    | Perm. | Payload                                               | Réponse                                      |
| ------- | --------------------------- | ----- | ----------------------------------------------------- | -------------------------------------------- |
| GET     | `/documents/`               | Owner | filtres `?subject=`, `?kind=`, `?status=`, `?search=` | 200 paginé                                   |
| POST    | `/documents/`               | Quota | `multipart` : `file`, `title?`, `subject?`, `kind`    | 201, `status: pending`, ingestion lancée     |
| GET     | `/documents/{id}/`          | Owner | —                                                     | 200                                          |
| PATCH   | `/documents/{id}/`          | Owner | `title?`, `subject?`, `kind?`                         | 200                                          |
| DELETE  | `/documents/{id}/`          | Owner | —                                                     | 204                                          |
| GET     | `/documents/{id}/download/` | Owner | —                                                     | 200 fichier (ou 302 vers une URL pré-signée) |

## Fiches de révision

| Méthode | Endpoint            | Perm. | Payload                                       | Réponse               |
| ------- | ------------------- | ----- | --------------------------------------------- | --------------------- |
| GET     | `/sheets/`          | Owner | `?subject=`, `?source=`, `?search=`           | 200 paginé            |
| POST    | `/sheets/`          | Owner | `title`, `content`, `subject?`                | 201                   |
| POST    | `/sheets/generate/` | Quota | `document_ids[]`, `subject?`, `instructions?` | 202 job               |
| GET     | `/sheets/{id}/`     | Owner | —                                             | 200                   |
| PATCH   | `/sheets/{id}/`     | Owner | `title?`, `content?`, `subject?`              | 200                   |
| DELETE  | `/sheets/{id}/`     | Owner | —                                             | 204                   |
| GET     | `/sheets/{id}/pdf/` | Owner | —                                             | 200 `application/pdf` |

## QCM

| Méthode | Endpoint                   | Perm. | Payload                                                                                                                               | Réponse                                                           |
| ------- | -------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| GET     | `/quizzes/`                | Owner | `?subject=`, `?source=`                                                                                                               | 200 paginé                                                        |
| POST    | `/quizzes/`                | Owner | `title`, `subject?`, `difficulty`                                                                                                     | 201                                                               |
| POST    | `/quizzes/generate/`       | Quota | `document_ids[]`, `question_count` (5–30), `difficulty`, `question_types` (`single`\|`multiple`\|`mixed`, défaut `mixed`), `subject?` | 202 job                                                           |
| GET     | `/quizzes/{id}/`           | Owner | —                                                                                                                                     | 200 avec questions et choix (`is_correct` inclus, mode édition)   |
| PATCH   | `/quizzes/{id}/`           | Owner | `title?`, `subject?`, `difficulty?`                                                                                                   | 200                                                               |
| DELETE  | `/quizzes/{id}/`           | Owner | —                                                                                                                                     | 204                                                               |
| GET     | `/quizzes/{id}/play/`      | Owner | —                                                                                                                                     | 200 questions avec `kind`, **sans** `is_correct` ni `explanation` |
| POST    | `/quizzes/{id}/questions/` | Owner | `kind`, `statement`, `explanation?`, `choices[{label,is_correct}]`                                                                    | 201                                                               |
| PATCH   | `/questions/{id}/`         | Owner | idem, champs optionnels ; `choices` remplace la liste                                                                                 | 200                                                               |
| DELETE  | `/questions/{id}/`         | Owner | —                                                                                                                                     | 204                                                               |
| POST    | `/quizzes/{id}/attempts/`  | Owner | `answers[{question, choices[]}]`                                                                                                      | 201 `{score, max_score, corrections[]}`                           |

**Règles QCM**

- Création ou modification d'une question : au moins 2 choix ; `single` → exactement 1 choix correct ; `multiple` → au moins 1 choix correct et au moins 1 incorrect. Sinon : `400 validation_error`.
- Tentative : pour une question `single`, `choices` contient au plus 1 id ; une liste vide signifie que la question est sautée. Un id de choix qui n'appartient pas à la question renvoie `400`.
- Notation MVP en tout-ou-rien : 1 point si la sélection est exactement l'ensemble des bonnes réponses, 0 sinon.
- `corrections[]` : `{question, selected[], correct[], points, explanation}`.
  | GET | `/attempts/` | Owner | `?quiz=` | 200 paginé |
  | GET | `/attempts/{id}/` | Owner | — | 200 avec corrections |

## Calendrier

| Méthode | Endpoint            | Perm. | Payload                                                                                                             | Réponse                                          |
| ------- | ------------------- | ----- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| GET     | `/events/`          | Owner | **obligatoire** : `?from=&to=` (62 jours max), `?subject=`, `?kind=`                                                | 200 `Event[]` (non paginé, borné par la période) |
| POST    | `/events/`          | Owner | `title`, `kind`, `starts_at`, `ends_at?`, `all_day`, `subject?`, `description?`, `reminders[{remind_at, channel}]?` | 201                                              |
| GET     | `/events/{id}/`     | Owner | —                                                                                                                   | 200 avec rappels                                 |
| PATCH   | `/events/{id}/`     | Owner | champs optionnels ; `reminders` remplace la liste                                                                   | 200                                              |
| DELETE  | `/events/{id}/`     | Owner | —                                                                                                                   | 204                                              |
| GET     | `/events/upcoming/` | Owner | `?limit=` (5 par défaut)                                                                                            | 200, prochaines échéances                        |

## Assistant (questions sur les cours)

| Méthode | Endpoint                        | Perm. | Payload                                 | Réponse                                    |
| ------- | ------------------------------- | ----- | --------------------------------------- | ------------------------------------------ |
| GET     | `/conversations/`               | Owner | `?subject=`                             | 200 paginé                                 |
| POST    | `/conversations/`               | Owner | `title?`, `subject?`, `document_ids[]?` | 201                                        |
| GET     | `/conversations/{id}/`          | Owner | —                                       | 200                                        |
| DELETE  | `/conversations/{id}/`          | Owner | —                                       | 204                                        |
| GET     | `/conversations/{id}/messages/` | Owner | —                                       | 200 paginé (du plus ancien au plus récent) |
| POST    | `/conversations/{id}/messages/` | Quota | `content`                               | 202 `{message, job}`                       |

## Jobs IA

| Méthode | Endpoint           | Perm. | Payload              | Réponse                                   |
| ------- | ------------------ | ----- | -------------------- | ----------------------------------------- |
| GET     | `/ai-jobs/`        | Owner | `?status=`, `?kind=` | 200 paginé                                |
| GET     | `/ai-jobs/{uuid}/` | Owner | —                    | 200 `{id, kind, status, result?, error?}` |

`result` contient l'identifiant de l'objet produit, par exemple `{"sheet_id": 12}` ou `{"quiz_id": 4}`.

## Notifications

| Méthode | Endpoint                    | Perm. | Payload        | Réponse    |
| ------- | --------------------------- | ----- | -------------- | ---------- |
| GET     | `/notifications/`           | Owner | `?unread=true` | 200 paginé |
| POST    | `/notifications/{id}/read/` | Owner | —              | 204        |
| POST    | `/notifications/read-all/`  | Owner | —              | 204        |

## Progression

| Méthode | Endpoint                   | Perm. | Payload                    | Réponse                                                           |
| ------- | -------------------------- | ----- | -------------------------- | ----------------------------------------------------------------- |
| GET     | `/progress/overview/`      | Auth  | `?period=week\|month\|all` | 200 : QCM joués, score moyen, fiches créées, prochaines échéances |
| GET     | `/progress/subjects/{id}/` | Owner | `?period=`                 | 200 : évolution du score par QCM, documents, fiches               |

## Throttling

| Scope                           | Limite       |
| ------------------------------- | ------------ |
| `anon`                          | 30/min       |
| `user`                          | 120/min      |
| `auth` (login, register, reset) | 5/min par IP |
| `ai` (endpoints `Quota` IA)     | 10/min       |

### Authentification — inscription (S4)

| Méthode | Endpoint                            | Permission | CSRF  | Débit  | Réponse                                    |
| ------- | ----------------------------------- | ---------- | ----- | ------ | ------------------------------------------ |
| GET     | `/api/v1/auth/csrf/`                | Public     | —     | —      | 204, cookie `csrftoken`                    |
| POST    | `/api/v1/auth/register/`            | Public     | Exigé | `auth` | 201 `{email, username, track}`             |
| GET     | `/api/v1/auth/tracks/`              | Public     | —     | —      | 200 `[{label, options: [{value, label}]}]` |
| GET     | `/api/v1/auth/privacy-policy/`      | Public     | —     | —      | 200 `{version}`                            |
| POST    | `/api/v1/auth/verify-email/`        | Public     | Exigé | `auth` | 204                                        |
| POST    | `/api/v1/auth/resend-verification/` | Public     | Exigé | `auth` | 202, quelle que soit l'adresse             |

**Inscription — corps de la requête :** `email`, `password`, `username`, `track`,
`privacy_policy_accepted` (doit valoir `true`), `privacy_policy_version` (doit être la
version en vigueur). Le mot de passe n'est jamais renvoyé.

**Erreurs de validation :** format unique, une entrée par champ dans `details`.

**Vérification — codes d'erreur :** `token_invalid`, `token_used`, `token_expired` (400).

### Authentification — connexion et session (S5)

| Méthode | Endpoint                            | Permission | CSRF  | Débit         | Réponse                             |
| ------- | ----------------------------------- | ---------- | ----- | ------------- | ----------------------------------- |
| POST    | `/api/v1/auth/login/`               | Public     | Exigé | `auth` + axes | 200, session (voir ci-dessous)      |
| POST    | `/api/v1/auth/logout/`              | Public     | Exigé | —             | 204, session supprimée côté serveur |
| GET     | `/api/v1/auth/session/`             | Public     | —     | —             | 200, toujours (connecté ou non)     |
| POST    | `/api/v1/auth/onboarding/complete/` | Connecté   | Exigé | —             | 204                                 |

**Session :** `{authenticated, user: {email, username, track, plan: {code, name},
needs_onboarding} | null, idle_timeout, idle_warning}` (durées en secondes).

**Codes d'erreur de la connexion :**

| Code                  | Statut | Situation                                                  |
| --------------------- | ------ | ---------------------------------------------------------- |
| `invalid_credentials` | 401    | E-mail inconnu ou mauvais mot de passe (réponse identique) |
| `email_not_verified`  | 403    | Mot de passe correct, adresse non vérifiée                 |
| `too_many_attempts`   | 429    | Blocage par axes, en-tête `Retry-After`                    |
| `not_authenticated`   | 403    | Session absente ou expirée, sur un endpoint qui l'exige    |

## Casiers

Toutes les routes de cette section exigent une session : sans session, elles répondent `403` avec le code `not_authenticated`. Un élève ne voit et ne manipule que ses propres casiers.

| Méthode | URL                     | Rôle                                     |
| ------- | ----------------------- | ---------------------------------------- |
| `GET`   | `/api/lockers/`         | Lister mes casiers                       |
| `POST`  | `/api/lockers/`         | Créer un casier                          |
| `GET`   | `/api/lockers/<id>/`    | Consulter un de mes casiers              |
| `GET`   | `/api/lockers/choices/` | Lister les couleurs et icônes autorisées |

### Objet « casier »

```json
{
  "id": 12,
  "name": "Mathématiques",
  "color": "#4338ca",
  "icon": "sigma",
  "position": 0,
  "course_count": 3
}
```

| Champ          | Description                                                                                   |
| -------------- | --------------------------------------------------------------------------------------------- |
| `id`           | Identifiant du casier                                                                         |
| `name`         | Nom choisi par l'élève, unique parmi ses casiers sans tenir compte de la casse ni des accents |
| `color`        | Couleur de la palette (voir `/choices/`)                                                      |
| `icon`         | Icône de la liste fermée (voir `/choices/`)                                                   |
| `position`     | Ordre d'affichage, à partir de 0                                                              |
| `course_count` | Nombre de cours déposés dans le casier                                                        |

### `GET /api/lockers/`

Renvoie mes casiers, triés par position puis par nom. Il n'y a pas de pagination : un élève a peu de casiers.

**Réponses**

| Code  | Cas                                                     |
| ----- | ------------------------------------------------------- |
| `200` | Tableau d'objets « casier », vide si l'élève n'en a pas |
| `403` | Pas de session (`not_authenticated`)                    |

### `POST /api/lockers/`

Crée un casier à la fin de ma liste. Le propriétaire est toujours l'élève connecté : un champ `owner` ou `position` envoyé dans la requête est ignoré.

Il faut envoyer l'en-tête `X-CSRFToken`, comme pour toutes les requêtes qui modifient des données.

**Corps**

```json
{
  "name": "Philosophie",
  "color": "#4338ca",
  "icon": "book-open"
}
```

| Champ   | Obligatoire | Règle                                                                                                 |
| ------- | ----------- | ----------------------------------------------------------------------------------------------------- |
| `name`  | Oui         | Non vide, espaces de début et de fin supprimés, longueur maximale du modèle, unique parmi mes casiers |
| `color` | Oui         | Une valeur de `colors` renvoyée par `/choices/`                                                       |
| `icon`  | Non         | Une valeur de `icons` renvoyée par `/choices/` (`folder` par défaut)                                  |

**Réponses**

| Code  | Cas                                                                             |
| ----- | ------------------------------------------------------------------------------- |
| `201` | Casier créé, l'objet « casier » est renvoyé (`course_count` à 0)                |
| `400` | Données invalides (`validation_error`), avec le détail par champ dans `details` |
| `403` | Pas de session (`not_authenticated`) ou jeton CSRF absent ou invalide           |

Exemple de `400` quand le nom est déjà pris :

```json
{
  "error": {
    "code": "validation_error",
    "message": "Certaines informations sont invalides.",
    "details": {
      "name": ["Tu as déjà un casier avec ce nom."]
    }
  }
}
```

### `GET /api/lockers/<id>/`

Renvoie un de mes casiers.

**Réponses**

| Code  | Cas                                                                     |
| ----- | ----------------------------------------------------------------------- |
| `200` | L'objet « casier »                                                      |
| `403` | Pas de session (`not_authenticated`)                                    |
| `404` | Le casier n'existe pas **ou** appartient à un autre élève (`not_found`) |

Les deux cas renvoient volontairement la même réponse pour ne pas révéler l'existence du casier d'un autre élève (ADR-009).

### `GET /api/lockers/choices/`

Renvoie les couleurs et icônes acceptées à la création, avec leurs libellés. Le front n'affiche que ces valeurs ; les libellés servent aux lecteurs d'écran.

**Réponse `200`**

```json
{
  "colors": [
    { "value": "#4338ca", "label": "Indigo" },
    { "value": "#1d4ed8", "label": "Bleu" }
  ],
  "icons": [
    { "value": "folder", "label": "Dossier" },
    { "value": "book-open", "label": "Livre" }
  ]
}
```

Les couleurs ont toutes un contraste d'au moins 4,5:1 avec un texte blanc (RGAA, niveau AA). La couleur n'est jamais le seul repère : un casier s'affiche toujours avec son nom et son icône.

| Code  | Cas                                  |
| ----- | ------------------------------------ |
| `200` | Listes des couleurs et des icônes    |
| `403` | Pas de session (`not_authenticated`) |

## Casiers et cours (S7)

Toutes les routes de cette section exigent une session : sans session, la réponse est `403 not_authenticated`. Les requêtes `POST` exigent en plus l'en-tête `X-CSRFToken` (`403` sinon).

Un élève n'accède qu'à ses propres casiers et cours. La ressource d'un autre élève répond `404`, exactement comme une ressource inexistante : son existence n'est jamais révélée (ADR-009).

### Liste de mes casiers

`GET /api/v1/lockers/`

Réponse `200` : les casiers de l'élève, triés par position puis par nom.

```json
[
  {
    "id": 9,
    "name": "Mathématiques",
    "color": "#4338ca",
    "icon": "sigma",
    "position": 0,
    "course_count": 3
  }
]
```

`course_count` ne compte que les documents de type cours (`kind = "course"`).

### Créer un casier

`POST /api/v1/lockers/`

```json
{ "name": "Philosophie", "color": "#0e7490", "icon": "book-open" }
```

| Champ | Règle |
| --- | --- |
| `name` | Obligatoire, espaces de début et de fin supprimés, unique par élève **sans tenir compte de la casse ni des accents** |
| `color` | Une valeur de la palette (`/choices/`) |
| `icon` | Une valeur de la liste d'icônes (`/choices/`), `folder` par défaut |

Tout autre champ envoyé (`owner`, `position`…) est ignoré. Le propriétaire est toujours l'élève connecté, et le casier est placé en fin de liste.

| Code | Cas |
| --- | --- |
| `201` | Casier créé (même format que la liste, `course_count` à 0) |
| `400` | `details.name` (vide, ou « Tu as déjà un casier avec ce nom. »), `details.color`, `details.icon` |

### Détail d'un casier

`GET /api/v1/lockers/<id>/`

| Code | Cas |
| --- | --- |
| `200` | Le casier (même format que la liste) |
| `404` | Casier inexistant ou appartenant à un autre élève |

### Couleurs et icônes autorisées

`GET /api/v1/lockers/choices/`

```json
{
  "colors": [{ "value": "#4338ca", "label": "Indigo" }],
  "icons": [{ "value": "folder", "label": "Dossier" }]
}
```

Les libellés servent aux lecteurs d'écran. Le front ne propose que ces valeurs.

### Cours d'un casier

`GET /api/v1/lockers/<id>/courses/`

Réponse `200` : les cours du casier, du plus récent au plus ancien.

```json
[
  {
    "id": 7,
    "title": "Suites numériques",
    "size_bytes": 1258291,
    "analysis_status": "pending",
    "created_at": "2026-11-17T10:00:00Z",
    "file_url": "/api/v1/courses/7/file/"
  }
]
```

`analysis_status` vaut `pending`, `processing`, `ready` ou `failed`. Le chemin de stockage du fichier n'est jamais exposé : on y accède uniquement par `file_url`.

`404` si le casier est inexistant ou appartient à un autre élève.

### Déposer un cours

`POST /api/v1/lockers/<id>/courses/`, en `multipart/form-data`, avec le fichier dans le champ `file`.

Contrôles, dans l'ordre :

1. Le casier appartient à l'élève (`404` sinon).
2. L'en-tête `Content-Length` ne dépasse pas la limite de l'offre (`413` sinon, sans lire le corps de la requête).
3. Le fichier n'est pas vide et sa taille réelle respecte la limite de l'offre.
4. Le fichier commence par la signature `%PDF-`. L'extension et le `Content-Type` envoyés par le navigateur sont ignorés.

| Code | Cas |
| --- | --- |
| `201` | Cours créé (même format que la liste) |
| `400` | `details.file` : « Ce fichier n'est pas un PDF. », fichier vide, ou taille maximale dépassée |
| `413` | `file_too_large` : requête refusée avant lecture |
| `404` | Casier inexistant ou appartenant à un autre élève |

Le titre affiché est le nom d'origine sans son extension. Le fichier est stocké sous un nom aléatoire (UUID).

### Ouvrir ou télécharger un cours

`GET /api/v1/courses/<id>/file/`

| Paramètre | Effet |
| --- | --- |
| *(aucun)* | Affichage dans le navigateur (`Content-Disposition: inline`) |
| `?download=1` | Téléchargement (`Content-Disposition: attachment`) avec le nom d'origine |

En-têtes de la réponse : `Content-Type: application/pdf`, `X-Content-Type-Options: nosniff`, `Cache-Control: private, no-store`.

| Code | Cas |
| --- | --- |
| `200` | Le fichier, envoyé en flux |
| `404` | Cours inexistant, appartenant à un autre élève, ou fichier absent du disque (journalisé côté serveur) |

### Session : limite de taille

`GET /api/v1/auth/session/` expose maintenant la limite de l'offre, qui permet au front d'annoncer « 10 Mo maximum » et de refuser un fichier trop gros sans l'envoyer :

```json
"plan": { "code": "basic", "name": "Basique", "max_file_size_bytes": 10485760 }
```
