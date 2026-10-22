# API — Nexus `/api/v1/`

Documentation interactive générée par drf-spectacular :
- `GET /api/schema/` : schéma OpenAPI 3 (YAML)
- `GET /api/docs/` : Swagger UI (activé en développement, réservé au staff en production)

## Conventions

**Authentification** : `Authorization: Bearer <access_token>`, sauf pour les endpoints marqués `Public`.

**Permissions**
| Code | Signification |
|---|---|
| `Public` | `AllowAny` |
| `Auth` | `IsAuthenticated` |
| `Owner` | `IsAuthenticated` + queryset filtré par propriétaire (404 si la ressource n'est pas à l'utilisateur) |
| `Quota` | `Owner` + vérification du quota (crédits IA ou stockage) |
| `Staff` | `IsAdminUser` |

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

| HTTP | `code` | Cas |
|---|---|---|
| 400 | `validation_error` | Payload invalide (`details` par champ) |
| 400 | `parse_error` | JSON mal formé |
| 401 | `not_authenticated` | Jeton absent |
| 401 | `authentication_failed` | Jeton invalide ou expiré |
| 403 | `permission_denied` | Action non autorisée |
| 403 | `quota_exceeded` | Quota atteint (`details`: `used`, `limit`, `resource`) |
| 404 | `not_found` | Ressource inexistante ou d'un autre utilisateur |
| 405 | `method_not_allowed` | |
| 409 | `conflict` | Doublon (ex. même fichier déjà déposé) |
| 413 | `file_too_large` | Fichier au-delà de la limite de l'offre |
| 415 | `unsupported_media_type` | Type de fichier refusé |
| 429 | `throttled` | Trop de requêtes (`details.retry_after`) |
| 500 | `server_error` | Erreur interne (aucun détail technique exposé) |

**Traitements asynchrones** : `202 Accepted` + `{"job": {"id": "<uuid>", "status": "queued"}}`, puis polling de `GET /ai-jobs/{id}/`.

---

## Authentification & compte

| Méthode | Endpoint | Perm. | Payload | Réponse |
|---|---|---|---|---|
| POST | `/auth/register/` | Public | `email`, `password`, `first_name`, `last_name`, `track?` | 201 `User` |
| POST | `/auth/login/` | Public | `email`, `password` | 200 `{access}` + cookie refresh |
| POST | `/auth/refresh/` | Public (cookie) | — | 200 `{access}` + cookie renouvelé |
| POST | `/auth/logout/` | Auth | — | 204, refresh blacklisté, cookie supprimé |
| POST | `/auth/password-reset/` | Public | `email` | 202 (toujours, pour ne pas révéler l'existence du compte) |
| POST | `/auth/password-reset/confirm/` | Public | `uid`, `token`, `new_password` | 204 |
| GET | `/me/` | Auth | — | 200 `User` |
| PATCH | `/me/` | Auth | `first_name?`, `last_name?`, `track?`, `timezone?` | 200 `User` |
| POST | `/me/change-password/` | Auth | `current_password`, `new_password` | 204 |
| DELETE | `/me/` | Auth | `password` | 204, suppression RGPD |
| GET | `/me/usage/` | Auth | — | 200 `{plan, storage:{used,limit}, ai_credits:{used,limit,resets_at}}` |
| GET | `/plans/` | Public | — | 200 `Plan[]` (non paginé) |

## Matières (casiers)

| Méthode | Endpoint | Perm. | Payload | Réponse |
|---|---|---|---|---|
| GET | `/subjects/` | Owner | — | 200 `Subject[]` (non paginé, ordonné par `position`) |
| POST | `/subjects/` | Owner | `name`, `color`, `position?` | 201 |
| GET | `/subjects/{id}/` | Owner | — | 200 |
| PATCH | `/subjects/{id}/` | Owner | `name?`, `color?`, `position?` | 200 |
| DELETE | `/subjects/{id}/` | Owner | — | 204, contenus passés en « non classé » |

## Documents

| Méthode | Endpoint | Perm. | Payload | Réponse |
|---|---|---|---|---|
| GET | `/documents/` | Owner | filtres `?subject=`, `?kind=`, `?status=`, `?search=` | 200 paginé |
| POST | `/documents/` | Quota | `multipart` : `file`, `title?`, `subject?`, `kind` | 201, `status: pending`, ingestion lancée |
| GET | `/documents/{id}/` | Owner | — | 200 |
| PATCH | `/documents/{id}/` | Owner | `title?`, `subject?`, `kind?` | 200 |
| DELETE | `/documents/{id}/` | Owner | — | 204 |
| GET | `/documents/{id}/download/` | Owner | — | 200 fichier (ou 302 vers une URL pré-signée) |

## Fiches de révision

| Méthode | Endpoint | Perm. | Payload | Réponse |
|---|---|---|---|---|
| GET | `/sheets/` | Owner | `?subject=`, `?source=`, `?search=` | 200 paginé |
| POST | `/sheets/` | Owner | `title`, `content`, `subject?` | 201 |
| POST | `/sheets/generate/` | Quota | `document_ids[]`, `subject?`, `instructions?` | 202 job |
| GET | `/sheets/{id}/` | Owner | — | 200 |
| PATCH | `/sheets/{id}/` | Owner | `title?`, `content?`, `subject?` | 200 |
| DELETE | `/sheets/{id}/` | Owner | — | 204 |
| GET | `/sheets/{id}/pdf/` | Owner | — | 200 `application/pdf` |

## QCM

| Méthode | Endpoint | Perm. | Payload | Réponse |
|---|---|---|---|---|
| GET | `/quizzes/` | Owner | `?subject=`, `?source=` | 200 paginé |
| POST | `/quizzes/` | Owner | `title`, `subject?`, `difficulty` | 201 |
| POST | `/quizzes/generate/` | Quota | `document_ids[]`, `question_count` (5–30), `difficulty`, `question_types` (`single`\|`multiple`\|`mixed`, défaut `mixed`), `subject?` | 202 job |
| GET | `/quizzes/{id}/` | Owner | — | 200 avec questions et choix (`is_correct` inclus, mode édition) |
| PATCH | `/quizzes/{id}/` | Owner | `title?`, `subject?`, `difficulty?` | 200 |
| DELETE | `/quizzes/{id}/` | Owner | — | 204 |
| GET | `/quizzes/{id}/play/` | Owner | — | 200 questions avec `kind`, **sans** `is_correct` ni `explanation` |
| POST | `/quizzes/{id}/questions/` | Owner | `kind`, `statement`, `explanation?`, `choices[{label,is_correct}]` | 201 |
| PATCH | `/questions/{id}/` | Owner | idem, champs optionnels ; `choices` remplace la liste | 200 |
| DELETE | `/questions/{id}/` | Owner | — | 204 |
| POST | `/quizzes/{id}/attempts/` | Owner | `answers[{question, choices[]}]` | 201 `{score, max_score, corrections[]}` |

**Règles QCM**
- Création ou modification d'une question : au moins 2 choix ; `single` → exactement 1 choix correct ; `multiple` → au moins 1 choix correct et au moins 1 incorrect. Sinon : `400 validation_error`.
- Tentative : pour une question `single`, `choices` contient au plus 1 id ; une liste vide signifie que la question est sautée. Un id de choix qui n'appartient pas à la question renvoie `400`.
- Notation MVP en tout-ou-rien : 1 point si la sélection est exactement l'ensemble des bonnes réponses, 0 sinon.
- `corrections[]` : `{question, selected[], correct[], points, explanation}`.
| GET | `/attempts/` | Owner | `?quiz=` | 200 paginé |
| GET | `/attempts/{id}/` | Owner | — | 200 avec corrections |

## Calendrier

| Méthode | Endpoint | Perm. | Payload | Réponse |
|---|---|---|---|---|
| GET | `/events/` | Owner | **obligatoire** : `?from=&to=` (62 jours max), `?subject=`, `?kind=` | 200 `Event[]` (non paginé, borné par la période) |
| POST | `/events/` | Owner | `title`, `kind`, `starts_at`, `ends_at?`, `all_day`, `subject?`, `description?`, `reminders[{remind_at, channel}]?` | 201 |
| GET | `/events/{id}/` | Owner | — | 200 avec rappels |
| PATCH | `/events/{id}/` | Owner | champs optionnels ; `reminders` remplace la liste | 200 |
| DELETE | `/events/{id}/` | Owner | — | 204 |
| GET | `/events/upcoming/` | Owner | `?limit=` (5 par défaut) | 200, prochaines échéances |

## Assistant (questions sur les cours)

| Méthode | Endpoint | Perm. | Payload | Réponse |
|---|---|---|---|---|
| GET | `/conversations/` | Owner | `?subject=` | 200 paginé |
| POST | `/conversations/` | Owner | `title?`, `subject?`, `document_ids[]?` | 201 |
| GET | `/conversations/{id}/` | Owner | — | 200 |
| DELETE | `/conversations/{id}/` | Owner | — | 204 |
| GET | `/conversations/{id}/messages/` | Owner | — | 200 paginé (du plus ancien au plus récent) |
| POST | `/conversations/{id}/messages/` | Quota | `content` | 202 `{message, job}` |

## Jobs IA

| Méthode | Endpoint | Perm. | Payload | Réponse |
|---|---|---|---|---|
| GET | `/ai-jobs/` | Owner | `?status=`, `?kind=` | 200 paginé |
| GET | `/ai-jobs/{uuid}/` | Owner | — | 200 `{id, kind, status, result?, error?}` |

`result` contient l'identifiant de l'objet produit, par exemple `{"sheet_id": 12}` ou `{"quiz_id": 4}`.

## Notifications

| Méthode | Endpoint | Perm. | Payload | Réponse |
|---|---|---|---|---|
| GET | `/notifications/` | Owner | `?unread=true` | 200 paginé |
| POST | `/notifications/{id}/read/` | Owner | — | 204 |
| POST | `/notifications/read-all/` | Owner | — | 204 |

## Progression

| Méthode | Endpoint | Perm. | Payload | Réponse |
|---|---|---|---|---|
| GET | `/progress/overview/` | Auth | `?period=week\|month\|all` | 200 : QCM joués, score moyen, fiches créées, prochaines échéances |
| GET | `/progress/subjects/{id}/` | Owner | `?period=` | 200 : évolution du score par QCM, documents, fiches |

## Throttling

| Scope | Limite |
|---|---|
| `anon` | 30/min |
| `user` | 120/min |
| `auth` (login, register, reset) | 5/min par IP |
| `ai` (endpoints `Quota` IA) | 10/min |
