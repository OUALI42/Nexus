# Design system

## Couleurs

Les tokens sont définis dans `frontend/src/styles/tokens.css` avec `light-dark()`.
Le contraste AA (4,5:1 pour le texte, 3:1 pour les composants) est vérifié
automatiquement par `frontend/src/styles/tokens.test.ts` dans les deux thèmes.

| Rôle | Clair | Sombre |
| --- | --- | --- |
| Fond | #f6f7fb | #0b1026 |
| Surface | #ffffff | #141b3c |
| Texte | #0f1733 | #e8eaf6 |
| Texte secondaire | #4a5274 | #a9b0d0 |
| Principal (indigo) | #4338ca | #a5b4fc |
| IA (violet) | #6d28d9 | #c4b5fd |
| Erreur | #b91c1c | #fca5a5 |
| Succès | #166534 | #86efac |
| Bordure des champs | #7a819e | #7880b0 |

## Règles

- Cible cliquable minimale : 44 px (`--tap-target`).
- Focus visible au clavier sur tout élément interactif (`:focus-visible`).
- Une information n'est jamais portée par la couleur seule.
- Les animations sont désactivées si l'utilisateur l'a demandé (`prefers-reduced-motion`).
