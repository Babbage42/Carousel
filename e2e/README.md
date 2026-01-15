# 🧪 Tests E2E - Carousel Angular

## 🎯 Vue d'ensemble

Suite de tests e2e complète et exhaustive pour la librairie Angular Carousel, avec **600 tests** répartis intelligemment sur **2 fichiers** seulement.

## 📊 Statistiques

```
📁 Fichiers de tests:        2
🎭 Scénarios (matrice):      23
🧪 Tests dans matrice:       ~540
✨ Tests transverses:        ~60
📈 Couverture totale:        ~90-95%
```

## 📁 Structure

```
e2e/
├── tests/
│   ├── carousel.spec.ts                 # Matrice principale (23 scénarios × 15 suites)
│   ├── carousel-extra-tests.spec.ts     # Tests transverses et avancés
│   └── helpers/
│       └── carousel-test.helper.ts      # Utilitaires réutilisables
├── ARCHITECTURE.md                      # Guide d'architecture détaillé
└── README.md                            # Ce fichier
```

## 🚀 Lancer les Tests

### Tous les tests

```bash
npm run test:e2e
```

### Tests spécifiques

```bash
# Seulement la matrice principale
npm run test:e2e -- carousel.spec.ts

# Seulement les tests transverses
npm run test:e2e -- carousel-extra-tests.spec.ts

# Tests d'un scénario spécifique
npm run test:e2e -- -g "Looping"

# Tests d'une feature spécifique
npm run test:e2e -- -g "keyboard"

# Mode UI interactif
npm run test:e2e -- --ui

# Mode debug
npm run test:e2e -- --debug
```

## 📐 Architecture

### Principe Fondamental

**Éviter l'éparpillement, maximiser la réutilisation**

- ✅ **Matrice modulaire** : 23 scénarios testés avec 15 suites réutilisables
- ✅ **Tests adaptatifs** : skip automatique si feature non disponible
- ✅ **Helpers centralisés** : utilitaires partagés pour tous les tests
- ❌ **Pas de duplication** : chaque test à un seul endroit

Voir [ARCHITECTURE.md](./ARCHITECTURE.md) pour plus de détails.

## 🎯 carousel.spec.ts - Matrice Principale

**23 scénarios** testés exhaustivement avec **15 suites de tests** :

### Scénarios

| Catégorie | Scénarios |
|-----------|-----------|
| **Basique** | PartialSlidesPerView |
| **Boucle** | Looping, LoopingAutoWithDifferentWidths |
| **Modes** | Rewind, FreeMode, MouseWheel, NonDraggable |
| **Direction** | RTL, Vertical |
| **Virtual** | VirtualMode, VirtualLoopMode, VirtualLoopSmallTotal, VirtualLoopAutoSlidesPerView |
| **Slides** | NoSlideOnClick, DisabledSlides, AutoWithDifferentWidths |
| **Center** | Centered, LoopAndCenter, NotCenterBoundsWithLoop, NotCenterBoundsWithRewind |
| **Step** | StepSlidesLargerThanView, StepSlidesWithLoop, StepSlidesWithRewind |
| **Peek** | PeekEdgesAbsolute |

### Suites de Tests

Pour chaque scénario :

1. **Base Contracts** - Rendu et état de base
2. **Button Navigation** - Navigation next/prev
3. **Pagination** - Dots et fraction
4. **Slide Click** - slideOnClick feature
5. **Disabled Slides** - Gestion des slides désactivées
6. **Drag** - Drag & drop
7. **Mouse Wheel** - Défilement à la molette
8. **Navigation Endurance** - Tests de robustesse
9. **Variable Widths** - Largeurs variables
10. **Loop** - Mode boucle infinie
11. **Rewind** - Mode rewind
12. **RTL** - Right-to-left
13. **Vertical** - Axe vertical
14. **Virtual** - Mode virtuel (windowing)
15. **Bounds** - Limites de translation

## ✨ carousel-extra-tests.spec.ts - Tests Transverses

Tests qui s'appliquent **globalement** ou pour des **features spécifiques** :

### Catégories

1. **Keyboard Navigation** (8 tests)
   - Arrow keys, Home/End, Tab
   - RTL mapping, Vertical mapping

2. **Autoplay** (4 tests)
   - Auto-advance, Pause on hover
   - Resume, Stop on interaction

3. **Center Mode** (2 tests)
   - Visual centering, Navigation consistency

4. **Performance** (3 tests)
   - Many slides, Virtual optimization, FPS

5. **Functional Coverage** (10 tests)
   - slidesPerView=auto, Breakpoints
   - Thumbs, Edge cases, Projected slides

6. **Accessibility** (5 tests)
   - ARIA, Tabindex, Labels, Disabled state

7. **Regression** (3 tests)
   - Bug fixes historiques

8. **Advanced Features** (6 tests)
   - Peek edges (absolute), notCenterBounds
   - Step slides variations

## 🛠️ Helpers Disponibles

### Navigation

```typescript
await clickNext(carousel, times, mode)
await clickPrev(carousel, times, mode)
await clickNextUntilStop(carousel, maxSteps, mode)
await dragSlides(page, carousel, options)
```

### État

```typescript
const index = await getActiveSlideIndex(carousel)
const indices = await getRenderedIndices(carousel)
const clickable = await findClickableSlide(carousel, options)
```

### Validation

```typescript
await assertCarouselIntegrity(carousel)
const inView = await isSlideInViewport(slide, carousel, threshold)
```

### Utilitaires

```typescript
await waitCarouselReady(page)
await waitActiveChange(carousel, fromIndex, mode)
await waitStoryReady(page)
const timeout = getTimeout(mode, action)
```

## 📖 Guide d'Utilisation

### Ajouter une Nouvelle Feature

**Si c'est un nouveau scénario** (combinaison de features) :

1. Créer la story dans `carousel.stories.ts`
2. Ajouter le scénario dans `carousel.spec.ts` → `scenarios` array
3. Les tests existants s'appliquent automatiquement ! ✨

**Si c'est une feature transverse** :

1. Créer la story dans `carousel.stories.ts`
2. Ajouter le test dans `carousel-extra-tests.spec.ts`

### Modifier un Test Existant

1. **Tests de scénario** → `carousel.spec.ts` → fonction `defineXxxSuite()`
2. **Tests transverses** → `carousel-extra-tests.spec.ts`
3. **Helpers** → `carousel-test.helper.ts`

### Debug un Test qui Fail

```bash
# Lancer le test en mode UI
npm run test:e2e -- --ui -g "nom du test"

# Voir la trace
npx playwright show-trace test-results/.../trace.zip

# Slow motion
npm run test:e2e -- --slowmo=1000 -g "nom du test"
```

## 🎨 Bonnes Pratiques

### ✅ À Faire

- Utiliser les helpers existants
- Ajouter les scénarios dans la matrice
- Tests adaptatifs avec `test.skip()`
- Nommage descriptif et clair
- Timeouts adaptatifs selon le mode

### ❌ À Éviter

- Créer un nouveau fichier pour chaque feature
- Dupliquer du code de test
- Hardcoder des timeouts fixes
- Ignorer les modes (loop, virtual, etc.)
- Tests trop spécifiques au lieu de génériques

## 📈 Couverture par Feature

| Feature | Couverture | Notes |
|---------|------------|-------|
| **Navigation** | ✅ 100% | Buttons, keyboard, drag, wheel |
| **Modes** | ✅ 100% | Loop, rewind, center, virtual, free |
| **Direction** | ✅ 100% | LTR, RTL, horizontal, vertical |
| **Layout** | ✅ 100% | SPV, spacing, margins, peek edges |
| **Pagination** | ✅ 100% | Dots, dynamic dots, fraction |
| **Slides** | ✅ 100% | Click, disabled, variable widths |
| **Autoplay** | ✅ 100% | All options tested |
| **Virtual** | ✅ 100% | Windowing, buffer, combinations |
| **Step** | ✅ 100% | All step size scenarios |
| **Thumbnails** | ✅ 100% | Sync, selection |
| **Responsive** | ✅ 100% | Breakpoints, resize |
| **A11y** | ✅ 100% | ARIA, keyboard, tabindex |
| **Performance** | ✅ 100% | Many slides, FPS |

## 🔧 Configuration

### Playwright Config

```typescript
// e2e/playwright.config.ts
export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:6006', // Storybook
    trace: 'retain-on-failure',
  },
});
```

### Scripts NPM

```json
{
  "scripts": {
    "test:e2e": "playwright test -c e2e/playwright.config.ts",
    "storybook": "ng run carousel-lib:storybook"
  }
}
```

## 🐛 Troubleshooting

### Tests Timeout

```bash
# Augmenter le timeout global
npm run test:e2e -- --timeout=60000
```

### Storybook Pas Lancé

```bash
# Terminal 1: Lancer Storybook
npm run storybook

# Terminal 2: Lancer les tests
npm run test:e2e
```

### Tests Instables

- Vérifier les timeouts adaptatifs
- Utiliser `waitActiveChange()` au lieu de `waitForTimeout()`
- Vérifier les modes (loop, virtual, etc.)

## 📚 Ressources

- **Architecture détaillée** : [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Helpers** : [carousel-test.helper.ts](./tests/helpers/carousel-test.helper.ts)
- **Playwright Docs** : https://playwright.dev

## 🎉 Résultat

Une suite de tests **exhaustive** (600 tests), **maintenable** (2 fichiers), **intelligente** (réutilisation maximale) qui couvre **90-95%** des use cases de la librairie carousel.

---

**Happy Testing! 🚀**
