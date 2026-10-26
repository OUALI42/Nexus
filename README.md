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

- API : http://localhost:8000/api/v1/health/
- Documentation API : http://localhost:8000/api/docs/
- Mailpit : http://localhost:8025
