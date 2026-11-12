# Accessibilité

Objectif : WCAG 2.2 niveau AA, plus des cibles de 44 px (critère 2.5.5, niveau AAA).

## Vérifications automatiques (CI)

| Vérification | Outil | Fichier |
| --- | --- | --- |
| Contraste AA des couleurs, dans les deux thèmes | Calcul WCAG sur les tokens | `src/styles/tokens.test.ts` |
| Règles WCAG A/AA (noms, rôles, ARIA, labels…) | axe-core | `RootLayout.test.tsx`, `DesignSystemPage.test.tsx` |
| Lien d'évitement, page active, focus après navigation | Testing Library | `RootLayout.test.tsx` |
| Piège de focus, Échap, retour du focus de la modale | Testing Library | `Modal.test.tsx` |
| Annonce des toasts, pause, erreurs persistantes | Testing Library | `ToastProvider.test.tsx` |
| Labels, aides et erreurs des champs | Testing Library | `Input.test.tsx` |
| Délai d'inactivité ajustable (WCAG 2.2.1) | Testing Library, faux minuteurs | `IdleSessionManager.test.tsx` |

## Vérifications manuelles

À refaire avant chaque démonstration, dans les deux thèmes.

| Vérification | Méthode | Résultat attendu |
| --- | --- | --- |
| Lien d'évitement | Tab au chargement, puis Entrée, puis Tab | Le focus passe directement au contenu |
| Navigation au clavier | Parcourir toute l'interface avec Tab et Maj+Tab | Tout est atteignable, focus toujours visible, ordre logique |
| Cibles de 44 px | Script de la console (ci-dessous) | Aucun élément listé, hors liens dans du texte |
| Audit Lighthouse | F12, onglet Lighthouse, catégorie Accessibilité | Score de 100 |
| Lecteur d'écran | NVDA : navigation, modale, toasts | Titres, pages actives, fenêtres et notifications annoncés |
| Zoom à 200 % | Ctrl + molette | Pas de texte coupé, pas de défilement horizontal |
| Mobile | Mode appareil de F12, 390 px de large | Barre du bas utilisable, contenu jamais caché |
| Animations réduites | Paramètres Windows, Accessibilité, Effets visuels, Effets d'animation désactivés | Aucune animation |
| Formulaire d'inscription | Envoi vide, puis correction au clavier | Focus sur le premier champ en erreur, erreurs annoncées sous chaque champ |
| Mot de passe | Bouton afficher/masquer au clavier, saisie | État du bouton annoncé, force annoncée en mots |
| Vérification de l'e-mail | Résultat de la confirmation | Focus sur le nouveau titre, action adaptée au cas |
| Formulaire de connexion | Envoi vide, échec, blocage, au clavier | Focus sur le champ à corriger, messages annoncés, aucun champ désigné comme faux |
| Avertissement d'inactivité | Durées courtes en développement, NVDA | Titre et délai annoncés, Échap et « Rester connecté » prolongent la session |

### Script de vérification des cibles

À coller dans la console du navigateur (F12, onglet Console) :

    [...document.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])')]
      .map((el) => ({ el, box: el.getBoundingClientRect() }))
      .filter(({ box }) => box.width > 1 && (box.width < 44 || box.height < 44))
      .map(({ el, box }) => [el, Math.round(box.width), Math.round(box.height)]);

Les éléments de 1 px de large sont exclus : ce sont les champs masqués du sélecteur de
thème, dont la cible réelle est le label de 44 px. Les liens placés dans une phrase
sont exemptés par la WCAG (critère 2.5.5).
