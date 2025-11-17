# Angular Carousel Library

A lightweight, dependency-free carousel component for Angular.  
Designed to be easy to drop into your app, with sensible defaults and a clear, documented API.

👉 **Live docs & interactive examples (Storybook)**  
[https://babbage42.github.io/Carousel/?path=/docs/components-carousel--docs](https://babbage42.github.io/Carousel/?path=/docs/components-carousel--docs)

---

## Features

- 🖱️ Mouse & touch drag with smooth animations
- 🔁 Loop or rewind navigation
- 🆓 Optional “free mode” scrolling with inertia
- 🔢 Built‑in navigation controls and pagination dots
- 📐 Responsive layout via CSS media queries (SSR‑friendly)
- 🎨 Works with simple image arrays **or** fully custom slide templates
- ⚙️ Rich configuration via strongly‑typed inputs and outputs

---

## 1. Installation

```bash
npm install carousel-lib
# or
yarn add carousel-lib
# or
pnpm add carousel-lib
```

Then import the components / directives you need from the library:

```ts
import { CarouselComponent, PaginationComponent, NavigationComponent, SlideDirective, CarouselNavLeftDirective, CarouselNavRightDirective } from "carousel-lib";
```

All components are **standalone**, so you can add them directly to `imports` in your Angular components.

---

## 2. Quick start

### 2.1. Basic carousel with image URLs

The simplest usage is to pass an array of image URLs through the `slides` input:

```ts
import { Component } from "@angular/core";
import { CarouselComponent } from "carousel-lib";

@Component({
  selector: "app-home",
  standalone: true,
  imports: [CarouselComponent],
  template: ` <app-carousel [slides]="slides" [slidesPerView]="3" [spaceBetween]="10"></app-carousel> `,
})
export class HomeComponent {
  slides = ["https://via.placeholder.com/400x250?text=Slide+1", "https://via.placeholder.com/400x250?text=Slide+2", "https://via.placeholder.com/400x250?text=Slide+3", "https://via.placeholder.com/400x250?text=Slide+4"];
}
```

This gives you:

- Horizontal carousel
- Drag support (mouse and touch)
- Default navigation arrows
- Pagination dots (dynamic) if enabled

---

### 2.2. Custom slide content with `*slide`

If you want more than images (cards, buttons, text, etc.), you can project custom content using `SlideDirective` (`*slide`):

```ts
import { Component } from "@angular/core";
import { CarouselComponent, SlideDirective } from "carousel-lib";

@Component({
  selector: "app-custom-slides",
  standalone: true,
  imports: [CarouselComponent, SlideDirective],
  template: `
    <app-carousel [slidesPerView]="3" [spaceBetween]="10">
      <div *slide class="my-slide">
        <img src="https://via.placeholder.com/300x200?text=A" />
        <h3>Slide A</h3>
      </div>

      <div *slide class="my-slide">
        <img src="https://via.placeholder.com/300x200?text=B" />
        <h3>Slide B</h3>
      </div>

      <div *slide class="my-slide">
        <img src="https://via.placeholder.com/300x200?text=C" />
        <h3>Slide C</h3>
      </div>
    </app-carousel>
  `,
})
export class CustomSlidesComponent {}
```

Rules:

- If `slides` input is provided and non‑empty, it is used.
- Otherwise, projected `*slide` content is used.
- If neither is provided, raw `<ng-content>` is rendered (not recommended for normal usage).

---

## 3. Core inputs

Below is a list of the main inputs you will typically configure.  
Types and defaults come directly from `carousel.component.ts`.

### 3.1. Data & layout

| Input           | Type                               | Default | Description                                                                                                                  |
| --------------- | ---------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `slides`        | `Slide[]` (`string[]` in examples) | `[]`    | Array of slide values. In the default template, each slide is treated as an image URL.                                       |
| `slidesPerView` | `number \| 'auto'`                 | `4.5`   | Number of slides visible at once. Use `'auto'` to let slides size based on their content (`grid-auto-columns: max-content`). |
| `spaceBetween`  | `number`                           | `5`     | Horizontal space (in pixels) between slides.                                                                                 |
| `stepSlides`    | `number`                           | `1`     | How many slides to move on each `Prev` / `Next` navigation.                                                                  |
| `marginStart`   | `number`                           | `0`     | Extra margin before the first slide, in pixels.                                                                              |
| `marginEnd`     | `number`                           | `0`     | Extra margin after the last slide, in pixels.                                                                                |
| `initialSlide`  | `number`                           | `0`     | Initial logical slide index when the carousel initializes.                                                                   |

---

### 3.2. Controls & UI

| Input                | Type                      | Default                                                     | Description                                                                                     |
| -------------------- | ------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `showControls`       | `boolean`                 | `true`                                                      | Show / hide built‑in navigation arrows.                                                         |
| `alwaysShowControls` | `boolean`                 | `false`                                                     | When `true`, arrows are always visible (no auto‑hide).                                          |
| `iconSize`           | `number`                  | `50`                                                        | Size of arrow icons, passed to `NavigationComponent`.                                           |
| `pagination`         | `Pagination \| undefined` | `{ type: 'dynamic_dot', clickable: true, external: false }` | Controls pagination behavior and whether dots are rendered inside the carousel or externally.   |
| `slideOnClick`       | `boolean`                 | `true`                                                      | When `true`, clicking a slide moves the carousel to that slide.                                 |
| `debug`              | `boolean`                 | `true`                                                      | When `true`, exposes a debug object on `window` and logs state changes (disable in production). |
| `showProgress`       | `boolean`                 | `true`                                                      | Enables internal progress tracking (used by navigation/pagination).                             |
| `dotsControl`        | `boolean`                 | `true`                                                      | Enables dots control (used by pagination).                                                      |

**Internal vs external pagination**

If `pagination.external === false` (default), dots are rendered inside the carousel.  
If you set `pagination.external === true`, you can render `<app-pagination>` yourself elsewhere and wire its `(goToSlide)` output to `slideTo()`.

---

### 3.3. Scrolling, loop & behavior

| Input             | Type                                                      | Default | Description                                                                                                  |
| ----------------- | --------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------ |
| `loop`            | `boolean`                                                 | `false` | Enables true infinite loop mode by inserting loop slides.                                                    |
| `rewind`          | `boolean`                                                 | `false` | When `true`, going past the end rewinds to the beginning (and vice versa) without loop slides.               |
| `freeMode`        | `boolean`                                                 | `false` | When `true`, behaves like a free scroll strip with inertia. Swipes do not necessarily snap to single slides. |
| `mouseWheel`      | `boolean \| { horizontal?: boolean; vertical?: boolean }` | `false` | Enable navigation with the mouse wheel. Use `true` or specify axes.                                          |
| `deltaPosition`   | `number`                                                  | `0.6`   | Threshold controlling when a swipe should change slide. Swipes smaller than this value may snap back.        |
| `center`          | `boolean`                                                 | `false` | Center the active slide within the carousel.                                                                 |
| `notCenterBounds` | `boolean`                                                 | `false` | Adjusts how bounds are computed when `center` is true (advanced layout tuning).                              |
| `resistance`      | `boolean`                                                 | `true`  | When `true`, dragging beyond bounds applies a resistance effect instead of clamping immediately.             |
| `lazyLoading`     | `boolean`                                                 | `true`  | Used internally to control loading strategy together with the `ImagesReady` directive.                       |

You normally only need `loop`, `rewind`, `freeMode`, `mouseWheel`, `center` and maybe `resistance`.  
The other options are useful for fine‑tuning behavior.

---

### 3.4. Autoplay

```ts
autoplay = input(false, {
  transform: (value: boolean | AutoplayOptions) => { ... },
});
```

- **Type:** `boolean | AutoplayOptions`
- **Default:** `false`

When `autoplay` is:

- `false` → autoplay disabled
- `true` → default options are applied:

  ```ts
  const base: AutoplayOptions = {
    delay: 2500,
    pauseOnHover: true,
    pauseOnFocus: true,
    stopOnInteraction: true,
    disableOnHidden: true,
    resumeOnMouseLeave: true,
  };
  ```

- `{ delay?: number; pauseOnHover?: boolean; ... }` → merged with the base config

Autoplay starts automatically once the layout is ready and images are loaded.

---

### 3.5. Responsive `breakpoints`

```ts
breakpoints = input<CarouselResponsiveConfig>();
```

- **Type:** object keyed by media query strings
- **Purpose:** change carousel options based on viewport width using CSS media queries (SSR‑friendly).

Example:

```ts
<app-carousel
  [slides]="slides"
  [breakpoints]="{
    '(max-width: 768px)': { slidesPerView: 1.5, spaceBetween: 2 },
    '(min-width: 769px) and (max-width: 1024px)': {
      slidesPerView: 2.5,
      spaceBetween: 5
    },
    '(min-width: 1025px)': { slidesPerView: 3.5, spaceBetween: 1 }
  }"
></app-carousel>
```

For each media query you can provide a partial carousel configuration (e.g. `slidesPerView`, `spaceBetween`, `loop`, etc.).  
The library generates CSS based on these breakpoints and applies them both on the server and in the browser.

---

## 4. Outputs

All outputs are declared in `carousel.component.ts` and can be used to react to navigation events.

```ts
@Output() slideUpdate = new EventEmitter<number>();
@Output() slideNext = new EventEmitter<void>();
@Output() slidePrev = new EventEmitter<void>();
@Output() touched = new EventEmitter<void>();
@Output() reachEnd = new EventEmitter<void>();
@Output() reachStart = new EventEmitter<void>();
imagesLoaded = output<void>();
```

### 4.1. `slideUpdate: EventEmitter<number>`

Emitted whenever the current logical slide index changes.

```html
<app-carousel [slides]="slides" (slideUpdate)="onSlideUpdate($event)"></app-carousel>
```

```ts
onSlideUpdate(index: number) {
  console.log('Current slide index:', index);
}
```

### 4.2. `slideNext` / `slidePrev`

Emitted when navigation moves to the next / previous slide (e.g. via arrows or programmatic calls):

```html
<app-carousel [slides]="slides" (slideNext)="log('next')" (slidePrev)="log('prev')"></app-carousel>
```

### 4.3. `touched`

Emitted once, on the first user interaction (drag, wheel, etc.). Useful for analytics or lazy loading extra data:

```html
<app-carousel [slides]="slides" (touched)="onUserInteracted()"></app-carousel>
```

### 4.4. `reachEnd` / `reachStart`

Emitted when the carousel reaches the logical end or start (considering loop/rewind settings):

```html
<app-carousel [slides]="slides" (reachEnd)="onReachEnd()" (reachStart)="onReachStart()"></app-carousel>
```

### 4.5. `imagesLoaded`

`imagesLoaded` is an Angular signal output (`output<void>()`) emitted when all images have been reported as ready.

```html
<app-carousel [slides]="slides" (imagesLoaded)="onCarouselImagesLoaded()"></app-carousel>
```

You can use this to:

- Hide a skeleton loader or placeholder
- Start autoplay only after images are ready
- Measure performance

---

## 5. Advanced examples

### 5.1. Infinite loop with autoplay

```ts
<app-carousel
  [slides]="slides"
  [loop]="true"
  [autoplay]="{
    delay: 3000,
    pauseOnHover: true,
    stopOnInteraction: false
  }"
></app-carousel>
```

### 5.2. Centered carousel with custom step

```ts
<app-carousel
  [slides]="slides"
  [center]="true"
  [slidesPerView]="3"
  [stepSlides]="2"
  [spaceBetween]="20"
></app-carousel>
```

### 5.3. Free‑mode + mouse wheel

```ts
<app-carousel
  [slides]="slides"
  [freeMode]="true"
  [mouseWheel]="{ horizontal: true }"
  [slidesPerView]="'auto'"
  [spaceBetween]="12"
></app-carousel>
```

---

## 6. Keyboard support & accessibility

The carousel listens to keyboard events on its host:

- `ArrowRight` → next slide
- `ArrowLeft` → previous slide
- `Home` → first slide
- `End` → last slide

To make it keyboard accessible in your app:

1. Ensure the carousel host is focusable (e.g. via `tabindex` on the host element if needed).
2. Surround it with appropriate ARIA roles / labels (e.g. region with an accessible name).

---

## 7. Styling

The library ships with default styles for:

- Carousel container (`.carousel`)
- Slides wrapper (`.slides`)
- Slide items (`.slide`)
- Centered mode (`.carousel--center`)
- Debug overlays (only visible when `debug` is enabled)

Key points:

- Layout is implemented using CSS grid with horizontal flow.
- When `slidesPerView === 'auto'`, slides use `grid-auto-columns: max-content`.
- Styles are applied with `ViewEncapsulation.None`, so you can override them from your app’s global styles.

You can customize:

- Slide sizes (e.g. setting fixed width/height on `.slide` or its content)
- Colors and typography
- Spacing, backgrounds, hover states, etc.

---

## 8. Storybook & live documentation

For a complete set of real‑world examples, including all combinations of:

- `loop`, `rewind`
- `center`, `notCenterBounds`
- `freeMode`, `mouseWheel`
- `marginStart`, `marginEnd`
- `breakpoints`
- Pagination and navigation options

visit the Storybook:

👉 **https://babbage42.github.io/Carousel/?path=/docs/components-carousel--docs**

This is the best place to visually see how each option behaves.

---

## 9. Public exports

The library currently exports at least:

```ts
import { CarouselComponent, CarouselNavLeftDirective, CarouselNavRightDirective, SlideDirective, PaginationComponent, NavigationComponent, RandomSrcPipe, randomSrc } from "carousel-lib";
```

- `CarouselComponent` – main carousel component.
- `SlideDirective` – structural directive enabling `*slide` projected slides.
- `CarouselNavLeftDirective`, `CarouselNavRightDirective` – directives used for custom navigation arrow templates.
- `PaginationComponent`, `NavigationComponent` – internal UI components that can also be used externally if you want full layout control.
- `RandomSrcPipe`, `randomSrc` – utilities primarily used in Storybook demos to generate placeholder images.

---

## 10. License

Add your license information here (MIT, etc.).
