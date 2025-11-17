# Carousel

An Angular carousel component packaged as `carousel-lib`, ready for Storybook docs, demos, and publishing.

![Carousel preview](docs/carousel-demo.svg)

## Demo / Storybook
- Hosted Storybook (GitHub Pages): https://babbage42.github.io/Carousel/?path=/docs/components-carousel--docs
- Local Storybook: `npm install` then `npm run storybook`, open http://localhost:6006.
- Demo app: `npm start` to run the sample application at http://localhost:4200.

## Installation
- From npm (once published): `npm i carousel-lib`
- From a local build:
  ```bash
  ng build carousel-lib
  npm i ./dist/carousel-lib
  ```

## Import and quick usage
1. Import the carousel component in your Angular module or standalone component:

```ts
import { CarouselComponent } from 'carousel-lib';
```

2. Provide data and drop the component into your template:

```ts
slides = [
  { image: 'assets/covers/cover-1.jpg', title: 'First slide', caption: 'Custom caption' },
  { image: 'assets/covers/cover-2.jpg', title: 'Second slide', caption: 'Secondary callout' },
  { image: 'assets/covers/cover-3.jpg', title: 'Third slide', caption: 'Another highlight' }
];

onSlide(event: any) {
  console.log('Slide index', event?.activeIndex);
}
```

```html
<app-carousel
  [slides]="slides"
  [slidesPerView]="3"
  [spaceBetween]="16"
  [pagination]="{ type: 'dynamic_dot', clickable: true }"
  [autoplay]="{ delay: 3500, pauseOnHover: true }"
  [loop]="true"
  [breakpoints]="{ 1024: { slidesPerView: 4 }, 768: { slidesPerView: 2 } }"
  (slideUpdate)="onSlide($event)"
  (reachEnd)="onReachEnd()"
  (imagesLoaded)="onImagesReady()">
  <ng-container *ngFor="let slide of slides">
    <ng-template appSlide>
      <img [src]="slide.image" [alt]="slide.title" />
      <h3>{{ slide.title }}</h3>
      <p>{{ slide.caption }}</p>
    </ng-template>
  </ng-container>
</app-carousel>
```

Key `@Input()` options: `slides`, `slidesPerView`, `spaceBetween`, `stepSlides`, `pagination`, `autoplay`, `loop`, `rewind`, `center`, `freeMode`, `mouseWheel`, `lazyLoading`, `breakpoints`.

Key `@Output()` events: `slideUpdate`, `slideNext`, `slidePrev`, `reachEnd`, `reachStart`, `imagesLoaded`, `touched`.

## Key scripts
- `npm run storybook`: builds and serves Storybook for the library.
- `ng build carousel-lib`: builds the library package into `dist/carousel-lib`.
- `ng test carousel-lib`: runs the library unit tests.
- `npm publish` (from `dist/carousel-lib`): publishes the package after a build.

## Versioning
The project follows Semantic Versioning. Bump `projects/carousel-lib/package.json` with `npm version patch|minor|major`, rebuild (`ng build carousel-lib`), then publish from `dist/carousel-lib`. Tag and push the release commit to keep Git history aligned with the published package.

## FAQ / known limitations
- **Angular support**: tested with Angular 20 (`peerDependencies` on ^20.3.x). For earlier versions, rebuild locally and verify compatibility.
- **SSR / Angular Universal**: the component touches `window`/`document`; add platform guards or disable interactive features on the server.
- **Accessibility**: provide meaningful `alt` text on images and label your custom navigation controls.
- **Performance and assets**: enable `lazyLoading` and tune `slidesPerView`/`spaceBetween` for large image sets to reduce layout shifts.
