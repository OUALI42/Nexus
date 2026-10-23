# Base de données — Nexus

MySQL 8.4 · InnoDB · `utf8mb4` / `utf8mb4_0900_ai_ci` · dates en UTC.
Toutes les clés primaires sont des `BIGINT` auto-incrémentés (`DEFAULT_AUTO_FIELD = BigAutoField`).

## Diagramme entité-relation

```mermaid
erDiagram
    USER ||--|| SUBSCRIPTION : has
    PLAN ||--o{ SUBSCRIPTION : "applies to"
    USER ||--o{ SUBJECT : owns
    USER ||--o{ DOCUMENT : owns
    SUBJECT |o--o{ DOCUMENT : classifies
    DOCUMENT ||--o{ CHUNK : "split into"
    USER ||--o{ REVISION_SHEET : owns
    SUBJECT |o--o{ REVISION_SHEET : classifies
    REVISION_SHEET }o--o{ DOCUMENT : "generated from"
    USER ||--o{ QUIZ : owns
    SUBJECT |o--o{ QUIZ : classifies
    QUIZ }o--o{ DOCUMENT : "generated from"
    QUIZ ||--o{ QUESTION : contains
    QUESTION ||--o{ CHOICE : offers
    QUIZ ||--o{ QUIZ_ATTEMPT : "played in"
    USER ||--o{ QUIZ_ATTEMPT : makes
    QUIZ_ATTEMPT ||--o{ ATTEMPT_ANSWER : records
    QUESTION ||--o{ ATTEMPT_ANSWER : "answered by"
    ATTEMPT_ANSWER }o--o{ CHOICE : selects
    USER ||--o{ EVENT : owns
    SUBJECT |o--o{ EVENT : classifies
    EVENT ||--o{ REMINDER : triggers
    USER ||--o{ CONVERSATION : owns
    SUBJECT |o--o{ CONVERSATION : "scoped to"
    CONVERSATION }o--o{ DOCUMENT : "scoped to"
    CONVERSATION ||--o{ MESSAGE : contains
    USER ||--o{ AI_JOB : requests
    AI_JOB |o--o{ REVISION_SHEET : produces
    AI_JOB |o--o{ QUIZ : produces
    AI_JOB |o--o{ MESSAGE : produces
    USER ||--o{ NOTIFICATION : receives

    USER {
        bigint id PK
        varchar email UK
        varchar password
        varchar first_name
        varchar last_name
        varchar track
        varchar timezone
        bool is_email_verified
        bool is_active
        bool is_staff
        datetime date_joined
    }
    PLAN {
        bigint id PK
        varchar code UK
        varchar name
        int monthly_price_cents
        bigint storage_quota_bytes
        bigint max_file_size_bytes
        int monthly_ai_credits
        bool is_active
    }
    SUBSCRIPTION {
        bigint id PK
        bigint user_id FK,UK
        bigint plan_id FK
        varchar status
        datetime started_at
        datetime current_period_end
    }
    SUBJECT {
        bigint id PK
        bigint owner_id FK
        varchar name
        char color
        smallint position
    }
    DOCUMENT {
        bigint id PK
        bigint owner_id FK
        bigint subject_id FK
        varchar title
        varchar kind
        varchar file
        varchar original_filename
        varchar mime_type
        bigint size_bytes
        char sha256
        varchar status
        int page_count
        text error_message
    }
    CHUNK {
        bigint id PK
        bigint document_id FK
        int position
        text content
        int token_count
    }
    REVISION_SHEET {
        bigint id PK
        bigint owner_id FK
        bigint subject_id FK
        bigint ai_job_id FK
        varchar title
        longtext content
        varchar source
    }
    QUIZ {
        bigint id PK
        bigint owner_id FK
        bigint subject_id FK
        bigint ai_job_id FK
        varchar title
        varchar difficulty
        varchar source
    }
    QUESTION {
        bigint id PK
        bigint quiz_id FK
        smallint position
        varchar kind
        text statement
        text explanation
    }
    CHOICE {
        bigint id PK
        bigint question_id FK
        smallint position
        varchar label
        bool is_correct
    }
    QUIZ_ATTEMPT {
        bigint id PK
        bigint quiz_id FK
        bigint user_id FK
        decimal score
        smallint max_score
        datetime finished_at
    }
    ATTEMPT_ANSWER {
        bigint id PK
        bigint attempt_id FK
        bigint question_id FK
        decimal points
        bool is_correct
    }
    EVENT {
        bigint id PK
        bigint owner_id FK
        bigint subject_id FK
        varchar title
        varchar kind
        datetime starts_at
        datetime ends_at
        bool all_day
        text description
    }
    REMINDER {
        bigint id PK
        bigint event_id FK
        datetime remind_at
        varchar channel
        datetime sent_at
    }
    CONVERSATION {
        bigint id PK
        bigint owner_id FK
        bigint subject_id FK
        varchar title
    }
    MESSAGE {
        bigint id PK
        bigint conversation_id FK
        bigint ai_job_id FK
        varchar role
        longtext content
        json sources
    }
    AI_JOB {
        bigint id PK
        char public_id UK
        bigint user_id FK
        varchar kind
        varchar status
        smallint cost
        json input
        json result
        text error
        int prompt_tokens
        int completion_tokens
        datetime started_at
        datetime finished_at
    }
    NOTIFICATION {
        bigint id PK
        bigint user_id FK
        varchar kind
        varchar title
        text body
        varchar link
        datetime read_at
    }
```

Toutes les tables métier ont aussi `created_at` et `updated_at` (via un modèle abstrait `TimeStampedModel`). Ces colonnes ne figurent pas dans le diagramme pour le garder lisible.

## Détail des tables

### `accounts_user`
| Colonne | Type | Contraintes |
|---|---|---|
| email | VARCHAR(254) | UNIQUE, NOT NULL, identifiant de connexion |
| track | VARCHAR(50) | NULL — filière (ex. « ECG ») |
| timezone | VARCHAR(64) | défaut `Europe/Paris` |
| is_email_verified | BOOL | défaut `false` |

### `billing_plan` / `billing_subscription`
- `plan.code` UNIQUE (`basic`, `intermediate`, `premium`) ; tarifs en **centimes** (entier, jamais de float pour de l'argent).
- `subscription.user_id` UNIQUE : une souscription par utilisateur, créée automatiquement à l'inscription sur l'offre `basic`.
- `subscription.plan_id` en **PROTECT** : impossible de supprimer une offre encore utilisée.
- `status` ∈ `active`, `canceled`, `expired`.

### `subjects_subject` (casiers)
- `UNIQUE (owner_id, name)` : pas deux matières du même nom pour un utilisateur.
- `color` CHAR(7) au format `#RRGGBB`, validé par `RegexValidator`.
- Index `(owner_id, position)` pour l'ordre d'affichage.

### `documents_document`
- `kind` ∈ `course`, `report_card`, `other`.
- `status` ∈ `pending`, `processing`, `ready`, `failed` (pipeline d'ingestion).
- `subject_id` NULL : un bulletin n'appartient pas à une matière.
- `owner_id` reste obligatoire même quand une matière est renseignée : c'est lui qui sert au filtrage de sécurité et au calcul du quota de stockage.
- Index : `(owner_id, subject_id)`, `(owner_id, created_at)`, `(owner_id, sha256)`.

### `documents_chunk`
- `UNIQUE (document_id, position)`.
- L'`id` du chunk sert d'identifiant au point Qdrant : on peut ainsi citer les sources d'une réponse et reconstruire l'index vectoriel.

### `revision_sheet` + `revision_sheet_documents` (M2M)
- `content` en Markdown (LONGTEXT).
- `source` ∈ `manual`, `ai`.

### `quizzes_*`
- `UNIQUE (quiz_id, position)` sur `question` ; `UNIQUE (question_id, position)` sur `choice`.
- `question.kind` ∈ `single` (réponse unique), `multiple` (choix multiples). Un même QCM peut mélanger les deux types.
- Règles de cohérence, vérifiées dans le service car elles portent sur plusieurs lignes (impossible avec une contrainte SQL simple) :
  - toute question a au moins 2 choix ;
  - `single` : exactement 1 choix correct ;
  - `multiple` : au moins 1 choix correct et au moins 1 choix incorrect.
- `attempt_answer` : `UNIQUE (attempt_id, question_id)`.
- `attempt_answer_selected_choices` (M2M `attempt_answer` ↔ `choice`) : choix cochés par l'utilisateur, aucun si la question est sautée. Le service vérifie que chaque choix appartient bien à la question, et qu'une question `single` n'a qu'un seul choix sélectionné.
- **Notation** : `attempt_answer.points` DECIMAL(5,2) et `quiz_attempt.score` DECIMAL(6,2). Pour le MVP, la notation est en tout-ou-rien : 1 point si la sélection correspond exactement aux bonnes réponses, 0 sinon. Le type décimal permettra d'introduire plus tard une notation partielle pour les choix multiples **sans migration**.
- Les `points` et `is_correct` sont figés au moment de la tentative : l'historique des scores reste juste même si le QCM est modifié ensuite.
- `quiz_attempt` : index `(user_id, finished_at)` pour les statistiques de progression.
- `CHECK (score <= max_score)`.

### `planning_event` / `planning_reminder`
- `kind` ∈ `exam`, `test`, `homework`, `other`.
- `CHECK (ends_at IS NULL OR ends_at >= starts_at)`.
- Index `(owner_id, starts_at)` pour l'affichage du calendrier sur une période.
- `reminder` : `UNIQUE (event_id, remind_at, channel)` ; index `(sent_at, remind_at)` pour la tâche Beat qui recherche les rappels à envoyer.

### `assistant_conversation` / `assistant_message`
- `role` ∈ `user`, `assistant`.
- `sources` (JSON) : liste des `chunk_id` cités dans la réponse.
- Index `(conversation_id, created_at)`.

### `ai_job`
- `public_id` (UUID) exposé dans l'API pour le polling, plutôt que l'id séquentiel.
- `kind` ∈ `sheet_generation`, `quiz_generation`, `chat_answer`, `document_ingestion`.
- `status` ∈ `queued`, `running`, `succeeded`, `failed`.
- `cost` : nombre de crédits consommés (0 pour l'ingestion).
- Index `(user_id, created_at)` pour le calcul de la consommation mensuelle.

### `notifications_notification`
- Index `(user_id, read_at)` pour le compteur de notifications non lues.

## Règles de suppression

| Relation | `on_delete` | Raison |
|---|---|---|
| Toute FK → `user` | CASCADE | Droit à l'effacement (RGPD) |
| `subscription.plan` | PROTECT | Ne pas casser les abonnements existants |
| `*.subject` | SET_NULL | Supprimer un casier ne détruit jamais de contenu |
| `chunk.document` | CASCADE | Un chunk n'a pas de sens sans son document |
| `question.quiz`, `choice.question` | CASCADE | Composition |
| `attempt.quiz`, `attempt_answer.*` | CASCADE | L'historique suit le QCM |
| M2M `attempt_answer` ↔ `choice` | CASCADE sur la table de liaison | Un choix supprimé disparaît de la sélection ; les points déjà figés sont conservés |
| `reminder.event` | CASCADE | Composition |
| `message.conversation` | CASCADE | Composition |
| `*.ai_job` | SET_NULL | Le contenu généré survit à la purge des jobs |
| M2M → `document` | CASCADE sur la table de liaison uniquement | La fiche ou le QCM reste, seul le lien disparaît |

**Effets hors base**, déclenchés par un signal `post_delete` puis `transaction.on_commit` : suppression du fichier dans le stockage et des points Qdrant du document.
