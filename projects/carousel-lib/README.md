# carousel-lib

Reactive Angular carousel library with pagination, custom navigation hooks, and Storybook documentation.

![Carousel preview](../../docs/carousel-demo.svg)

## Demo / Storybook
- Hosted Storybook (GitHub Pages): https://babbage42.github.io/Carousel/?path=/docs/components-carousel--docs
- Local Storybook: `npm install` then `npm run storybook` (serves http://localhost:6006 for the library stories).
- Sample app demo: `npm start` and open http://localhost:4200 to see the carousel in context.

## Installation
- From npm (after publish): `npm i carousel-lib`
- From a local build:
  ```bash
  ng build carousel-lib
  npm i ./dist/carousel-lib
  ```

## Import and template usage
```ts
import { CarouselComponent } from 'carousel-lib';
```

```html
<app-carousel
  [slides]="slides"
  [slidesPerView]="2.5"
  [spaceBetween]="12"
  [pagination]="{ type: 'dynamic_dot', clickable: true, external: false }"
  [autoplay]="{ delay: 2500, pauseOnHover: true, stopOnInteraction: true }"
  [loop]="true"
  [freeMode]="false"
  [breakpoints]="{ 1200: { slidesPerView: 4 }, 768: { slidesPerView: 2 } }"
  [lazyLoading]="true"
  (slideUpdate)="onSlide($event)"
  (slideNext)="onNext($event)"
  (slidePrev)="onPrev($event)"
  (reachEnd)="onReachEnd()"
  (imagesLoaded)="onImagesReady()">
  <ng-container *ngFor="let slide of slides">
    <ng-template appSlide>
      <img [src]="slide.image" [alt]="slide.title" />
      <p>{{ slide.caption }}</p>
    </ng-template>
  </ng-container>
</app-carousel>
```

Primary inputs: `slides`, `slidesPerView`, `spaceBetween`, `stepSlides`, `pagination`, `autoplay`, `loop`, `rewind`, `center`, `freeMode`, `mouseWheel`, `deltaPosition`, `lazyLoading`, `breakpoints`.

Primary outputs: `slideUpdate`, `slideNext`, `slidePrev`, `reachEnd`, `reachStart`, `imagesLoaded`, `touched`.

## Key scripts
- `npm run storybook`: serves the interactive docs and component stories.
- `ng build carousel-lib`: emits the consumable package to `dist/carousel-lib`.
- `ng test carousel-lib`: runs the library test suite.
- `npm publish` (from `dist/carousel-lib`): publish once the build is ready.

## Versioning
Semantic Versioning. Increment `projects/carousel-lib/package.json` with `npm version patch|minor|major`, rebuild with `ng build carousel-lib`, then publish from `dist/carousel-lib`. Tag the release commit and push to keep the registry and repository aligned.

## FAQ / known limitations
- **Supported Angular versions**: peer dependencies target `^20.3.x`. For earlier Angular versions, rebuild locally and validate compatibility.
- **SSR / Angular Universal**: the component references `window`/`document`; wrap platform-specific code or disable certain interactions server-side.
- **Performance & media**: prefer `lazyLoading` and right-size `slidesPerView` for large image sets to limit layout shifts.
- **Custom navigation**: use `CarouselNavLeftDirective`/`CarouselNavRightDirective` to inject custom buttons while keeping keyboard focus and aria-labels consistent.
