Nexus, interface de suivi scolaire en ligne, VS CODE PYTHON TYPESCRIPT MYSQL
[![CI](https://github.com/<OUALI42>/nexus/actions/workflows/ci.yml/badge.svg)](https://github.com/<OUALI42>/nexus/actions/workflows/ci.yml)

## Prérequis

| Outil | Version |
| --- | --- |
| Docker Desktop | récent, avec Docker Compose v2 |
| Python | 3.12 (voir `.python-version`) |
| Node.js | 24 LTS (voir `.nvmrc`) |
| VS Code | extensions recommandées dans `.vscode/extensions.json` |

## Démarrage

    cp .env.example .env   # PowerShell : Copy-Item .env.example .env
    docker compose up -d
    - Design system (développement) : http://localhost:5173/design

- API : http://localhost:8000/api/v1/health/
- Documentation API : http://localhost:8000/api/docs/
- Mailpit : http://localhost:8025


## Avant la mise en production

Points relevés pendant le développement, à traiter lors du déploiement :

| Sujet              | Action                                                                                                | Origine |
| ------------------ | ----------------------------------------------------------------------------------------------------- | ------- |
| Bundle             | Charger l'éditeur TipTap à la demande (`React.lazy`) si le poids de l'application devient gênant      | S8      |
| Listes blanches HTML | Garder identiques `apps/revision/sanitizer.py` et `features/sheets/safe-html.ts`                    | S8      |
| Taille des envois  | `client_max_body_size` dans nginx, aligné sur la plus grande offre                                    | S7      |
| Fichiers des cours | **Aucun** bloc `location /media` dans nginx : les cours ne passent que par l'API                      | S7      |
| API navigable      | N'activer que `JSONRenderer` dans DRF (désactiver la page HTML de DRF)                                | S7      |
| CSP                | Autoriser les styles inline des couleurs de casier (`style-src-attr`) ou passer par des variables CSS | S7      |
| IP réelle          | Configurer l'IP du client derrière le proxy, pour que django-axes bloque la bonne adresse             | S5      |
| Purges             | Tâches périodiques : journaux d'axes, sessions expirées, jetons de vérification d'e-mail              | S4, S5  |

## Hors périmètre de la S7

- Supprimer et renommer un casier ou un cours (la suppression est exigée par le RGPD).
- Prévenir clairement l'élève quand un cours est envoyé à l'IA (story de l'analyse).
- Barre de progression pendant l'envoi (`XMLHttpRequest`) et glisser-déposer.

