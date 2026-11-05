# Design system

## Couleurs

Palette issue de la maquette, ajustée pour atteindre le niveau AA. Tokens définis dans
`frontend/src/styles/tokens.css`, exposés à Tailwind par `@theme inline`. Le contraste
(4,5:1 texte, 3:1 composants) est vérifié automatiquement par `tokens.test.ts`.
La palette par défaut de Tailwind est désactivée.

| Rôle | Classe Tailwind | Clair | Sombre |
| --- | --- | --- | --- |
| Fond | `bg-canvas` | #f1f0ff | #0b1020 |
| Surface (cartes) | `bg-surface` | #ffffff | #161b33 |
| Texte | `text-fg` | #0f172a | #f1f5f9 |
| Texte secondaire | `text-fg-muted` | #475569 | #b6c0d4 |
| Liens, contours | `text-primary` | #4338ca | #a5b4fc |
| IA | `text-ai` | #6d28d9 | #c4b5fd |
| Bordure des champs | `border-control` | #767ea3 | #6b76a3 |
| Focus | `outline-focus` | #6d28d9 | #a78bfa |
| Dégradé principal | `from-brand-from to-brand-to` | #4f46e5 → #7c3aed | identique |
| Navigation | `from-nav-from via-nav-via to-nav-to` | #1e1b4b → #3730a3 → #5b21b6 | identique |

### Écarts avec la maquette

- Bordure des champs en thème clair : #8a93b8 → #767ea3 (2,7:1 → 3,5:1).
- Focus en thème clair : #a78bfa → #6d28d9 (2,4:1 → 6,3:1).
- Page active de la barre latérale : signalée aussi par une barre et du gras.
- Entrée « Amis » retirée (chat hors périmètre du MVP).

## Règles

- Cible cliquable minimale : 44 px (`--tap-target`).
- Focus visible au clavier sur tout élément interactif (`:focus-visible`).
- Une information n'est jamais portée par la couleur seule.
- Les animations sont désactivées si l'utilisateur l'a demandé (`prefers-reduced-motion`).
