# Angular Carousel Library

A lightweight, dependency-free carousel component for Angular.  
Designed to be easy to drop into your app, with sensible defaults and a clear, documented API.

👉 **Live docs & interactive examples (Storybook)**  
[https://babbage42.github.io/Carousel/?path=/docs/components-carousel--docs](https://babbage42.github.io/Carousel/?path=/docs/components-carousel--docs)

---

## Features

### Core Features
- 🖱️ **Mouse & touch drag** with smooth animations and momentum
- 🔁 **Loop or rewind** navigation for infinite scrolling
- 🆓 **Free mode** scrolling with inertia (no snapping)
- 🎯 **Center mode** to highlight the active slide
- 🔢 **Built-in UI** with navigation arrows and pagination dots
- ⌨️ **Keyboard navigation** with accessibility support

### Advanced Features
- 🚀 **Virtual scrolling** (windowing) for massive datasets (1000+ slides)
- 🖼️ **Thumbnail carousel** - sync two carousels together
- 🌍 **RTL support** for right-to-left languages
- ↕️ **Vertical mode** for up/down scrolling
- 🎬 **Autoplay** with pause on hover/focus
- 🖱️ **Mouse wheel** navigation
- 📐 **Responsive breakpoints** via CSS media queries (SSR-friendly)
- 🎨 **Custom templates** with `*slide` directive or simple image arrays
- ⚙️ **TypeScript** with strongly-typed inputs and outputs

### Quality
- ✅ **373 e2e tests** covering all features and edge cases
- 📦 **Standalone components** - works with Angular 14+
- 🎨 **Customizable styling** via CSS
- 🔧 **Well-tested** - notCenterBounds, virtual+loop, RTL+vertical, etc.

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
| `debug`              | `boolean`                 | `false`                                                     | When `true`, shows debug info overlay with slide indices and state.                             |
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
| `notCenterBounds` | `boolean`                                                 | `false` | When `true` with `center`, prevents empty space at carousel edges. The first/last slides won't be centered if it would create gaps. |
| `resistance`      | `boolean`                                                 | `true`  | When `true`, dragging beyond bounds applies a resistance effect instead of clamping immediately.             |
| `virtual`         | `boolean`                                                 | `false` | Enables virtual scrolling (windowing) for performance with large lists (100+ slides).                        |
| `direction`       | `'ltr' \| 'rtl'`                                          | `'ltr'` | Text direction. Use `'rtl'` for right-to-left languages (automatically flips navigation).                    |
| `vertical`        | `boolean`                                                 | `false` | When `true`, carousel scrolls vertically instead of horizontally.                                            |
| `lazyLoading`     | `boolean`                                                 | `true`  | Used internally to control loading strategy together with the `ImagesReady` directive.                       |

**Mode comparison guide:**

| Use case | Recommended settings |
|----------|---------------------|
| **Simple gallery** | Default settings work great |
| **Infinite scrolling** | `loop="true"` |
| **Wrap to start** | `rewind="true"` (no loop clones) |
| **Hero/spotlight** | `center="true"` + `slidesPerView="3"` |
| **Hero (no gaps)** | `center="true"` + `notCenterBounds="true"` |
| **Free scrolling** | `freeMode="true"` + `slidesPerView="auto"` |
| **Large dataset** | `virtual="true"` (100+ slides) |
| **Product thumbs** | Use two carousels with `thumbsFor` |
| **Vertical stories** | `vertical="true"` + `autoplay` |
| **RTL language** | `direction="rtl"` |

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

### 3.6. Advanced features

#### Virtual scrolling (windowing)

For carousels with many slides (100+), enable `virtual` mode for better performance:

```ts
<app-carousel
  [slides]="manySlides"
  [virtual]="true"
  [slidesPerView]="3"
></app-carousel>
```

Virtual mode renders only the visible slides plus a buffer, dramatically reducing DOM size and improving performance.

**Notes:**
- Works with `loop` mode for infinite virtual scrolling
- Automatically manages slide rendering as you navigate
- Best for uniform slide sizes

#### Thumbnails carousel

Link two carousels together (main + thumbnails) using `thumbsFor`:

```ts
<app-carousel
  #mainCarousel
  [slides]="slides"
  [slidesPerView]="1"
></app-carousel>

<app-carousel
  [slides]="slides"
  [slidesPerView]="5"
  [thumbsFor]="mainCarousel"
></app-carousel>
```

The thumbnail carousel automatically:
- Highlights the active thumbnail
- Syncs with main carousel navigation
- Allows clicking thumbnails to change main slide

#### Right-to-left (RTL) support

For RTL languages, set `direction="rtl"`:

```ts
<app-carousel
  [slides]="slides"
  [direction]="'rtl'"
></app-carousel>
```

This automatically:
- Reverses navigation direction (next/prev buttons)
- Flips keyboard shortcuts
- Mirrors the visual layout

#### Vertical carousel

For vertical scrolling:

```ts
<app-carousel
  [slides]="slides"
  [vertical]="true"
  [slidesPerView]="3"
></app-carousel>
```

Keyboard navigation adapts: `ArrowUp`/`ArrowDown` instead of left/right.

---

## 4. Outputs

The carousel provides a comprehensive event system similar to SwiperJS, allowing you to react to all lifecycle, interaction, and navigation events.

### 4.1. Navigation Events

```ts
@Output() slideUpdate = new EventEmitter<number>();    // Emitted when active slide changes
@Output() slideNext = new EventEmitter<void>();        // Emitted when navigating next
@Output() slidePrev = new EventEmitter<void>();        // Emitted when navigating previous
```

**Example:**
```html
<app-carousel
  [slides]="slides"
  (slideUpdate)="onSlideUpdate($event)"
  (slideNext)="log('next')"
  (slidePrev)="log('prev')">
</app-carousel>
```

```ts
onSlideUpdate(index: number) {
  console.log('Current slide index:', index);
}
```

### 4.2. Lifecycle Events

```ts
@Output() afterInit = new EventEmitter<void>();        // Emitted after carousel initialization
@Output() beforeDestroy = new EventEmitter<void>();    // Emitted before carousel destruction
imagesLoaded = output<void>();                         // Emitted when all images are loaded
```

**Example:**
```html
<app-carousel
  [slides]="slides"
  (afterInit)="onCarouselReady()"
  (beforeDestroy)="cleanup()">
</app-carousel>
```

### 4.3. Interaction Events

```ts
@Output() touched = new EventEmitter<void>();                      // First user interaction (once)
@Output() touchStart = new EventEmitter<MouseEvent | TouchEvent>(); // Touch/mouse down
@Output() touchMove = new EventEmitter<MouseEvent | TouchEvent>();  // Touch/mouse move
@Output() touchEnd = new EventEmitter<MouseEvent | TouchEvent>();   // Touch/mouse up
@Output() sliderMove = new EventEmitter<number>();                  // Emits translate value during drag
```

**Example:**
```html
<app-carousel
  [slides]="slides"
  (touched)="trackFirstInteraction()"
  (touchStart)="onDragStart($event)"
  (touchEnd)="onDragEnd($event)"
  (sliderMove)="onSlide($event)">
</app-carousel>
```

```ts
onDragStart(event: MouseEvent | TouchEvent) {
  console.log('Drag started', event);
}

onSlide(translate: number) {
  console.log('Current translation:', translate);
}
```

### 4.4. Transition Events

```ts
@Output() transitionStart = new EventEmitter<void>();  // Emitted when CSS transition starts
@Output() transitionEnd = new EventEmitter<void>();    // Emitted when CSS transition ends
```

**Example:**
```html
<app-carousel
  [slides]="slides"
  (transitionStart)="showSpinner()"
  (transitionEnd)="hideSpinner()">
</app-carousel>
```

### 4.5. Progress Event

```ts
@Output() progress = new EventEmitter<number>();  // Emits 0-1 normalized progress value
```

This event emits the current scroll progress as a value between 0 and 1, where:
- `0` = at the start
- `0.5` = halfway through
- `1` = at the end

**Example - Progress bar:**
```html
<app-carousel
  [slides]="slides"
  (progress)="updateProgressBar($event)">
</app-carousel>

<div class="progress-bar">
  <div class="progress-fill" [style.width.%]="carouselProgress * 100"></div>
</div>
```

```ts
carouselProgress = 0;

updateProgressBar(progress: number) {
  this.carouselProgress = progress;
}
```

### 4.6. Click Events

```ts
@Output() slideClick = new EventEmitter<{ index: number; event: MouseEvent }>(); // Emitted when slide is clicked
indexSelected = output<number>();  // Alternative: emits the newly selected real index
```

**Example:**
```html
<app-carousel
  [slides]="slides"
  (slideClick)="onSlideClick($event)"
  (indexSelected)="onIndexChanged($event)">
</app-carousel>
```

```ts
onSlideClick(data: { index: number; event: MouseEvent }) {
  console.log('Clicked slide:', data.index);
  // Custom handling (e.g., open modal, navigate, etc.)
}
```

### 4.7. Boundary Events

```ts
@Output() reachEnd = new EventEmitter<void>();    // Emitted when reaching the end
@Output() reachStart = new EventEmitter<void>();  // Emitted when reaching the start
```

**Example:**
```html
<app-carousel
  [slides]="slides"
  (reachEnd)="loadMoreSlides()"
  (reachStart)="onReachStart()">
</app-carousel>
```

### 4.8. Autoplay Events

```ts
@Output() autoplayStart = new EventEmitter<void>();  // Emitted when autoplay starts
@Output() autoplayStop = new EventEmitter<void>();   // Emitted when autoplay stops
@Output() autoplayPause = new EventEmitter<void>();  // Emitted when autoplay pauses
```

**Example:**
```html
<app-carousel
  [slides]="slides"
  [autoplay]="true"
  (autoplayStart)="log('Autoplay started')"
  (autoplayPause)="log('Autoplay paused')"
  (autoplayStop)="log('Autoplay stopped')">
</app-carousel>
```

### 4.9. Complete Event Monitoring Example

```ts
@Component({
  selector: 'app-monitored-carousel',
  template: `
    <app-carousel
      [slides]="slides"
      (afterInit)="log('Carousel initialized')"
      (slideUpdate)="log('Slide changed to: ' + $event)"
      (progress)="updateProgress($event)"
      (transitionStart)="log('Transition started')"
      (transitionEnd)="log('Transition ended')"
      (touchStart)="log('Touch started')"
      (touchEnd)="log('Touch ended')"
      (slideClick)="handleSlideClick($event)"
      (reachEnd)="log('Reached end')"
      (beforeDestroy)="log('Carousel destroyed')">
    </app-carousel>

    <div class="progress">{{ (currentProgress * 100).toFixed(0) }}%</div>
  `
})
export class MonitoredCarouselComponent {
  slides = ['slide1.jpg', 'slide2.jpg', 'slide3.jpg'];
  currentProgress = 0;

  log(message: string) {
    console.log(`[Carousel Event] ${message}`);
  }

  updateProgress(progress: number) {
    this.currentProgress = progress;
  }

  handleSlideClick(data: { index: number; event: MouseEvent }) {
    console.log('Slide clicked:', data);
    // Custom logic here
  }
}

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

### 5.4. Virtual scrolling with loop

For large datasets with infinite loop:

```ts
<app-carousel
  [slides]="largeDataset"
  [virtual]="true"
  [loop]="true"
  [slidesPerView]="3"
  [spaceBetween]="10"
></app-carousel>
```

### 5.5. Center mode with notCenterBounds

Prevent empty space at edges while keeping slides centered:

```ts
<app-carousel
  [slides]="slides"
  [center]="true"
  [notCenterBounds]="true"
  [slidesPerView]="3"
></app-carousel>
```

**Behavior:**
- Middle slides: centered as normal
- First slides: aligned to start (no gap on left)
- Last slides: aligned to end (no gap on right)
- Perfect for hero carousels or featured content

### 5.6. Vertical RTL carousel with thumbnails

Combine multiple features:

```ts
<app-carousel
  #main
  [slides]="slides"
  [vertical]="true"
  [direction]="'rtl'"
  [slidesPerView]="1"
  [autoplay]="{ delay: 3000 }"
></app-carousel>

<app-carousel
  [slides]="slides"
  [thumbsFor]="main"
  [slidesPerView]="5"
></app-carousel>
```

---

## 6. Keyboard support & accessibility

The carousel listens to keyboard events on its host:

**Horizontal mode:**
- `ArrowRight` → next slide (or prev in RTL)
- `ArrowLeft` → previous slide (or next in RTL)
- `Home` → first slide
- `End` → last slide

**Vertical mode:**
- `ArrowDown` → next slide
- `ArrowUp` → previous slide
- `Home` → first slide
- `End` → last slide

**Accessibility features:**
- Navigation buttons have proper `aria-label` attributes
- Active slide has `slide--active` class
- Disabled slides have `slide--disabled` class
- Keyboard navigation respects `loop` and `rewind` modes
- `aria-live="polite"` on slides container announces changes

**To improve accessibility:**

1. Add a descriptive label to the carousel:
   ```html
   <app-carousel [slides]="slides" aria-label="Product gallery"></app-carousel>
   ```

2. Ensure slides have meaningful alt text for images

3. Test with screen readers (NVDA, JAWS, VoiceOver)

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

## 10. Troubleshooting

### Carousel not visible or slides overlap

**Problem:** Slides don't display correctly or overlap.

**Solution:** Ensure slides have explicit dimensions. The carousel uses CSS Grid, so slides need a defined size:

```css
.slide {
  width: 100%;
  height: 300px; /* or use aspect-ratio */
}

.slide img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

### Navigation buttons don't appear

**Problem:** Prev/next arrows are missing.

**Solutions:**
1. Check `showControls` is `true` (default)
2. In non-loop/non-rewind mode, buttons hide at boundaries
3. Set `alwaysShowControls="true"` to always show them
4. Check your CSS isn't hiding `.carousel-nav-button`

### Autoplay doesn't start

**Problem:** Carousel doesn't auto-advance.

**Solutions:**
1. Verify `autoplay` is configured: `[autoplay]="true"` or `[autoplay]="{ delay: 3000 }"`
2. Autoplay starts after images load - wait for `imagesLoaded` event
3. Check if `stopOnInteraction` stopped it after user interaction
4. Ensure carousel is visible (autoplay pauses on hidden elements)

### Drag/swipe not working

**Problem:** Can't drag slides.

**Solutions:**
1. Check `draggable` isn't set to `false` (it's `true` by default)
2. Ensure there's no CSS `pointer-events: none` blocking interactions
3. For touch devices, verify viewport meta tag: `<meta name="viewport" content="width=device-width, initial-scale=1">`

### Virtual mode shows blank slides

**Problem:** In virtual mode, some slides are blank.

**Solution:** Virtual mode requires slides to have uniform sizes. Use fixed dimensions:

```css
.slide {
  width: 300px;
  height: 200px;
}
```

### Performance issues with many slides

**Problem:** Carousel is slow with 100+ slides.

**Solution:** Enable virtual mode:
```ts
<app-carousel [slides]="manySlides" [virtual]="true"></app-carousel>
```

This renders only visible slides, dramatically improving performance.

### Slides don't center correctly

**Problem:** With `center="true"`, slides aren't centered.

**Solution:**
- For edge slides, use `notCenterBounds="true"` to prevent empty space
- Check `slidesPerView` - decimal values (e.g. `3.5`) work best with center mode
- Verify slide widths are consistent

### TypeScript errors with inputs

**Problem:** Type errors when setting carousel options.

**Solution:** Import types from the library:

```ts
import { CarouselComponent, AutoplayOptions, Pagination } from 'carousel-lib';

// Then use proper types
autoplayConfig: AutoplayOptions = {
  delay: 3000,
  pauseOnHover: true
};

paginationConfig: Pagination = {
  type: 'bullets',
  clickable: true
};
```

---

## 11. Performance tips

1. **Use virtual mode** for 100+ slides
2. **Optimize images**: Use appropriate sizes, consider lazy loading
3. **Limit `slidesPerView`**: More slides = more DOM elements
4. **Disable debug mode** in production: `[debug]="false"`
5. **Use `freeMode`** sparingly: It's more CPU-intensive than snap mode
6. **Avoid complex slide content**: Keep slide templates simple
7. **Consider pagination over thumbnails**: Thumbnails double the carousel count

---

## 12. License

Add your license information here (MIT, etc.).
