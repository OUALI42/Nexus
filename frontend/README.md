# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Données de démo (développement uniquement)

1. Dans votre `.env`, définissez `DEMO_ACCOUNT_PASSWORD` (10 caractères minimum, pas de
   mot de passe courant). Il n'est jamais versionné.
2. Recréez le conteneur pour charger la variable :
   `docker compose up -d --force-recreate backend`
3. Créez les données : `docker compose exec backend python manage.py seed_demo`

| Compte                  | Filière | Offre         |
| ----------------------- | ------- | ------------- |
| `demo.ines@nexus.test`  | MPSI    | Premium       |
| `demo.lucas@nexus.test` | BCPST   | Basique       |
| `demo.emma@nexus.test`  | ECG     | Intermédiaire |

Mot de passe : la valeur de `DEMO_ACCOUNT_PASSWORD`.

La commande peut être relancée sans créer de doublons. Pour repartir de zéro :
`docker compose exec backend python manage.py seed_demo --reset`.
Elle refuse de s'exécuter en dehors des réglages de développement.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://npmx.dev/package/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://npmx.dev/package/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

## Avant la mise en production

Points relevés pendant le développement, à traiter lors du déploiement :

| Sujet              | Action                                                                                                | Origine |
| ------------------ | ----------------------------------------------------------------------------------------------------- | ------- |
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
