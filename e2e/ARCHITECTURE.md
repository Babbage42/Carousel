# Test Architecture - Carousel E2E

## 📐 Philosophy

**Principe fondamental** : Éviter l'éparpillement, maximiser la réutilisation.

## 📁 Structure des Fichiers

```
e2e/tests/
├── carousel.spec.ts                 # ✅ MATRICE PRINCIPALE (scenarios x test suites)
├── carousel-extra-tests.spec.ts     # ✅ TESTS TRANSVERSES (keyboard, a11y, perf, advanced)
└── helpers/
    └── carousel-test.helper.ts      # ✅ UTILITAIRES RÉUTILISABLES
```

## 🎯 carousel.spec.ts - Matrice Principale

**Objectif** : Tester tous les scénarios avec les mêmes batteries de tests.

### Architecture Modulaire

```typescript
const scenarios: Scenario[] = [
  { name: 'Looping', id: '...', caps: { loop: true, buttons: true, ... } },
  { name: 'Rewind', id: '...', caps: { rewind: true, ... } },
  { name: 'VirtualMode', id: '...', caps: { virtual: true, ... } },
  // ... 23 scénarios au total
];

// Pour chaque scénario, on applique toutes les suites de tests
for (const scenario of scenarios) {
  test.describe(scenario.name, () => {
    defineBaseContracts(scenario);
    defineButtonsNavigationSuite(scenario);
    definePaginationSuite(scenario);
    defineSlideClickSuite(scenario);
    defineDragSuite(scenario);
    // ... 15 suites de tests
  });
}
```

### Suites de Tests Réutilisables

Chaque suite vérifie un aspect spécifique et skip automatiquement si le scénario ne supporte pas la feature :

```typescript
function defineButtonsNavigationSuite(s: Scenario) {
  test('buttons: next/prev changes active slide', async ({ page }) => {
    test.skip(!s.caps.buttons, 'No buttons expected');
    // ... test
  });
}
```

### Scénarios Actuels (23)

| Catégorie | Scénarios |
|-----------|-----------|
| **Basique** | PartialSlidesPerView |
| **Boucle** | Looping, LoopingAutoWithDifferentWidths |
| **Modes** | Rewind, FreeMode, MouseWheel |
| **Direction** | RTL, Vertical |
| **Virtual** | VirtualMode, VirtualLoopMode, VirtualLoopSmallTotal, VirtualLoopAutoSlidesPerView |
| **Slides** | NoSlideOnClick, DisabledSlides, NonDraggable, AutoWithDifferentWidths |
| **Center** | Centered, LoopAndCenter, NotCenterBoundsWithLoop, NotCenterBoundsWithRewind |
| **Step** | StepSlidesLargerThanView, StepSlidesWithLoop, StepSlidesWithRewind |
| **Peek** | PeekEdgesAbsolute |

### Quand Ajouter un Scénario ?

✅ **OUI** : Quand c'est une **combinaison de features** qui mérite d'être testée exhaustivement
- Exemple : Loop + Center, Virtual + Loop, Step + Rewind

❌ **NON** : Pour tester une feature isolée (mettre dans extra-tests)

## 🌟 carousel-extra-tests.spec.ts - Tests Transverses

**Objectif** : Tests qui ne rentrent pas dans la matrice (transverses ou spécifiques).

### Catégories

1. **Keyboard Navigation** (global, cross-scenario)
   - ArrowRight/Left, Home/End, Tab
   - RTL keyboard mapping
   - Vertical keyboard mapping

2. **Autoplay** (fonctionnalité complète)
   - Advances automatically
   - Pause on hover
   - Resume after mouse leave
   - Stop on interaction

3. **Center Mode** (vérification visuelle)
   - Active slide is centered
   - Maintains centering after navigation

4. **Performance** (métriques)
   - Many slides (100+)
   - Virtual mode optimization
   - Smooth animations (FPS)

5. **Functional Coverage** (features spécifiques)
   - slidesPerView=auto
   - Responsive breakpoints
   - Thumbs synchronization
   - One/two slide edge cases
   - Projected slides

6. **Accessibility** (a11y)
   - ARIA roles
   - Tabindex management
   - Button labels
   - Disabled state

7. **Regression Tests** (bugs historiques)
   - BUG-001, BUG-002, BUG-003

8. **Advanced Features** (nouvelles features)
   - Peek edges (absolute)
   - notCenterBounds combinations
   - Step slides variations

### Quand Ajouter un Test ici ?

✅ **OUI** pour :
- Tests qui s'appliquent **globalement** (pas liés à un scénario)
- Features **complexes** nécessitant des tests dédiés
- **Edge cases** très spécifiques
- Tests de **régression** pour bugs connus

## 🛠️ helpers/carousel-test.helper.ts

**Objectif** : Utilitaires réutilisables pour tous les tests.

### Catégories

```typescript
// Navigation
clickNext(carousel, times, mode)
clickPrev(carousel, times, mode)
dragSlides(page, carousel, options)

// State
getActiveSlideIndex(carousel)
getRenderedIndices(carousel)
findClickableSlide(carousel, options)

// Validation
assertCarouselIntegrity(carousel)
isSlideInViewport(slide, carousel, threshold)

// Utilities
waitCarouselReady(page)
waitActiveChange(carousel, fromIndex, mode)
getTimeout(mode, action)
getDragDistance(mode)
```

## 📊 Statistiques Actuelles

```
Fichiers: 2
Scénarios (matrice): 23
Suites par scénario: ~15
Tests (matrice): ~345
Tests (extra): ~60
Total: ~405 tests
```

## 🎯 Guidelines pour Maintenir l'Architecture

### 1. Éviter l'Éparpillement

❌ **Mauvais** : Créer un nouveau fichier pour chaque feature
```
carousel-autoplay.spec.ts
carousel-center.spec.ts
carousel-step.spec.ts
...
```

✅ **Bon** : Intégrer dans la structure existante
- Scénario → Matrice
- Feature transverse → Extra tests

### 2. Principe DRY (Don't Repeat Yourself)

❌ **Mauvais** : Dupliquer du code de test
```typescript
// Dans carousel-autoplay.spec.ts
test('autoplay with loop', async () => {
  // 50 lignes de test
});

// Dans carousel-loop.spec.ts
test('loop with autoplay', async () => {
  // 50 lignes similaires
});
```

✅ **Bon** : Créer un scénario dans la matrice
```typescript
{
  name: 'LoopWithAutoplay',
  caps: { loop: true, autoplay: true }
}
// Les suites de tests s'appliquent automatiquement
```

### 3. Tests Conditionnels

Utiliser `test.skip()` pour rendre les tests adaptatifs :

```typescript
test('my feature test', async ({ page }) => {
  test.skip(!scenario.caps.myFeature, 'Feature not enabled');
  // ... test
});
```

### 4. Nommage Cohérent

- **Scénarios** : PascalCase, descriptif (ex: `VirtualLoopMode`)
- **Stories** : kebab-case (ex: `virtual-loop-mode`)
- **Tests** : phrase descriptive (ex: `'virtual: does not render all slides'`)

## 🔄 Workflow pour Ajouter des Tests

### Nouvelle Feature Simple

1. Créer story dans `carousel.stories.ts`
2. Ajouter test dans `carousel-extra-tests.spec.ts` → section "Advanced Features"

### Nouvelle Combinaison de Features

1. Créer story dans `carousel.stories.ts`
2. Ajouter scénario dans `carousel.spec.ts` → array `scenarios`
3. Les tests existants s'appliquent automatiquement

### Nouveau Type de Test (ex: events)

1. Créer nouvelle section dans `carousel-extra-tests.spec.ts`
2. Utiliser les helpers existants
3. Si besoin, ajouter helper dans `carousel-test.helper.ts`

## 📈 Avantages de cette Architecture

✅ **Maintenabilité**
- Un seul endroit pour chaque type de test
- Modifications localisées

✅ **Couverture**
- 23 scénarios × 15 suites = 345 tests automatiques
- Couverture exhaustive garantie

✅ **Lisibilité**
- Structure claire et prévisible
- Facile de trouver un test

✅ **Évolutivité**
- Ajouter un scénario = +15 tests automatiquement
- Ajouter une suite = appliquée à 23 scénarios

✅ **Performance**
- Pas de duplication de code
- Tests bien organisés = exécution optimale

## 🚫 Anti-Patterns à Éviter

❌ Créer un fichier par feature
❌ Dupliquer des tests similaires
❌ Tester la même chose dans plusieurs endroits
❌ Ignorer les helpers existants
❌ Écrire des tests trop spécifiques au lieu de génériques

## 🎉 Résultat

Une architecture de tests **propre**, **maintenable** et **exhaustive** qui couvre 90-95% des use cases sans éparpillement ni duplication.
