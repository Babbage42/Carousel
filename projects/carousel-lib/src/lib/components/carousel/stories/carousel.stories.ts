import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { fn, userEvent, within } from 'storybook/test';
import {
  CarouselComponent,
  CarouselNavLeftDirective,
  CarouselNavRightDirective,
  SlideDirective,
  PaginationComponent,
  NavigationComponent,
  RandomSrcPipe,
  randomSrc,
} from 'carousel-lib';
import { buildSlides, img } from './utils.helper';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories
const modules = {
  imports: [
    SlideDirective,
    NavigationComponent,
    PaginationComponent,
    CarouselNavLeftDirective,
    CarouselNavRightDirective,
    RandomSrcPipe,
  ],
};

const meta: Meta<CarouselComponent> = {
  title: 'Components/Carousel',
  component: CarouselComponent,
  decorators: [
    moduleMetadata({
      imports: [
        SlideDirective,
        NavigationComponent,
        PaginationComponent,
        CarouselNavLeftDirective,
        CarouselNavRightDirective,
        RandomSrcPipe,
      ],
    }),
  ],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
**Carousel** — Options clés:
- \`slidesPerView: number | 'auto'\`
- \`stepSlides: number\` (nb de slides avancées par navigation)
- \`freeMode\`, \`loop\`, \`rewind\`, \`center\`, \`notCenterBounds\`
- \`mouseWheel: boolean | { horizontal?: boolean; vertical?: boolean }\`
- \`pagination\` (ex: { type: 'dynamic_dot', clickable: true, external: false })
- \`imagesLoaded\` émis quand les images initiales sont prêtes
        `.trim(),
      },
    },
  },
  argTypes: {
    slides: {
      control: 'object',
      description: 'Liste de slides (dans tes tests: URLs)',
    },
    slidesPerView: {
      control: 'text',
      table: { type: { summary: '"auto" | number' } },
      description: 'Nombre de slides visibles ou "auto"',
    },
    stepSlides: { control: 'number', description: 'Avance par N slides' },
    spaceBetween: { control: 'number' },
    showControls: { control: 'boolean' },
    alwaysShowControls: { control: 'boolean' },
    iconSize: { control: 'number' },
    pagination: { control: 'object' },
    freeMode: { control: 'boolean' },
    mouseWheel: { control: 'object' }, // accepte boolean ou objet
    deltaPosition: { control: 'number' },
    showProgress: { control: 'boolean' },
    dotsControl: { control: 'boolean' },
    rewind: { control: 'boolean' },
    loop: { control: 'boolean' },
    center: { control: 'boolean' },
    notCenterBounds: { control: 'boolean' },
    slideOnClick: { control: 'boolean' },
    marginEnd: { control: 'number' },
    marginStart: { control: 'number' },
    lazyLoading: { control: 'boolean' },
    breakpoints: { control: 'object' },
    // outputs -> actions
    indexSelected: { action: 'indexSelected' },
    slideUpdate: { action: 'slideUpdate' },
    slideNext: { action: 'slideNext' },
    slidePrev: { action: 'slidePrev' },
    reachEnd: { action: 'reachEnd' },
    reachStart: { action: 'reachStart' },
    touched: { action: 'touched' },
    imagesLoaded: { action: 'imagesLoaded' },
    autoplay: { control: 'object' },
    resistance: { control: 'boolean' },
    initialSlide: { control: 'number' },
    draggable: { control: 'boolean' },
    direction: { control: 'text' },
    axis: { control: 'text' },
  },
  args: {
    slides: buildSlides(10),
    slidesPerView: '3',
    stepSlides: 1,
    spaceBetween: 5,
    freeMode: false,
    showControls: true,
    alwaysShowControls: false,
    iconSize: 50,
    pagination: { type: 'dynamic_dot', clickable: true, external: false },
    deltaPosition: 0.6,
    showProgress: true,
    dotsControl: true,
    rewind: false,
    loop: false,
    center: false,
    notCenterBounds: false,
    slideOnClick: true,
    marginEnd: 0,
    marginStart: 0,
    lazyLoading: true,
    autoplay: false,
    initialSlide: 0,
    resistance: true,
    draggable: true,
    peekEdges: undefined,
    debug: false,
    direction: 'ltr',
    axis: 'horizontal',
  },
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<CarouselComponent>;
// helpers inchangés...
const TemplateProjected = (args: any) => ({
  props: args,
  template: `
    <app-carousel
      [slidesPerView]="slidesPerView"
      [stepSlides]="stepSlides"
      [spaceBetween]="spaceBetween"
      [showControls]="showControls"
      [alwaysShowControls]="alwaysShowControls"
      [iconSize]="iconSize"
      [pagination]="pagination"
      [freeMode]="freeMode"
      [mouseWheel]="mouseWheel"
      [deltaPosition]="deltaPosition"
      [showProgress]="showProgress"
      [dotsControl]="dotsControl"
      [rewind]="rewind"
      [loop]="loop"
      [center]="center"
      [notCenterBounds]="notCenterBounds"
      [slideOnClick]="slideOnClick"
      [marginEnd]="marginEnd"
      [marginStart]="marginStart"
      [lazyLoading]="lazyLoading"
      [autoplay]="autoplay"
      [resistance]="resistance"
      [initialSlide]="initialSlide"
      [draggable]="draggable"
      [peekEdges]="peekEdges"
      [direction]="direction"
      [axis]="axis"
      (touched)="touched($event)"
      (slideUpdate)="slideUpdate($event)"
      (slidePrev)="slidePrev($event)"
      (slideNext)="slideNext($event)"
      (reachEnd)="reachEnd($event)"
      (reachStart)="reachStart($event)"
      (imagesLoaded)="imagesLoaded()"
      (indexSelected)="indexSelected($event)"
      [debug]="debug">
      <div *slide><img [src]="300 | randomSrc:200" /></div>
      <div *slide><img [src]="300 | randomSrc:200" /></div>
      <div *slide><img [src]="300 | randomSrc:200" /></div>
      <div *slide><img [src]="300 | randomSrc:200" /></div>
      <div *slide><img [src]="300 | randomSrc:200" /></div>
      <div *slide><img [src]="300 | randomSrc:200" /></div>
      <div *slide><img [src]="300 | randomSrc:200" /></div>
      <div *slide><img [src]="300 | randomSrc:200" /></div>
      <div *slide><img [src]="300 | randomSrc:200" /></div>
    </app-carousel>
  `,
  moduleMetadata: modules,
});

const TemplateWithSlides = (args: any) => ({
  props: args,
  template: `
    <app-carousel
      [slidesPerView]="slidesPerView"
      [stepSlides]="stepSlides"
      [spaceBetween]="spaceBetween"
      [showControls]="showControls"
      [alwaysShowControls]="alwaysShowControls"
      [iconSize]="iconSize"
      [pagination]="pagination"
      [freeMode]="freeMode"
      [mouseWheel]="mouseWheel"
      [deltaPosition]="deltaPosition"
      [showProgress]="showProgress"
      [dotsControl]="dotsControl"
      [rewind]="rewind"
      [loop]="loop"
      [center]="center"
      [notCenterBounds]="notCenterBounds"
      [slideOnClick]="slideOnClick"
      [marginEnd]="marginEnd"
      [marginStart]="marginStart"
      [lazyLoading]="lazyLoading"
      [autoplay]="autoplay"
      [resistance]="resistance"
      [initialSlide]="initialSlide"
      [draggable]="draggable"
      [peekEdges]="peekEdges"
      [direction]="direction"
      [axis]="axis"
      (touched)="touched($event)"
      (slideUpdate)="slideUpdate($event)"
      (slidePrev)="slidePrev($event)"
      (slideNext)="slideNext($event)"
      (reachEnd)="reachEnd($event)"
      (reachStart)="reachStart($event)"
      (imagesLoaded)="imagesLoaded()"
      (indexSelected)="indexSelected($event)"
      [slides]="slides"
      [debug]="debug">
    </app-carousel>
  `,
  moduleMetadata: modules,
});

const TemplateWithThumbs = (args: any) => ({
  props: args,
  template: `
    <div
      style="
        width: 80%;
        margin: 40px auto;
        padding: 24px 0;
        display: flex;
        flex-direction: column;
        gap: 24px;
      "
    >
      <app-carousel
        #master
        [slides]="slides"
        [slidesPerView]="3"
        [stepSlides]="3"
        [spaceBetween]="16"
        [showControls]="true"
        [alwaysShowControls]="false"
        [loop]="false"
        [center]="false"
        [freeMode]="false"
        [pagination]="null"
        [dotsControl]="false"
        [slideOnClick]="true"
        [debug]="debug"
        (touched)="touched($event)"
        (slideUpdate)="slideUpdate($event)"
        (slidePrev)="slidePrev($event)"
        (slideNext)="slideNext($event)"
        (reachEnd)="reachEnd($event)"
        (reachStart)="reachStart($event)"
        (imagesLoaded)="imagesLoaded()"
        (indexSelected)="indexSelected($event)"
      >
      </app-carousel>

      <div style="width: 50%; margin: 0 auto;">
        <app-carousel
          [slides]="slides"
          [slidesPerView]="5"
          [spaceBetween]="8"
          [thumbsFor]="master"
          [showControls]="true"
          [alwaysShowControls]="false"
          [loop]="false"
          [center]="false"
          [freeMode]="false"
          [pagination]="null"
          [dotsControl]="false"
          [slideOnClick]="true"
          [debug]="debug"
          (touched)="touched($event)"
          (slideUpdate)="slideUpdate($event)"
          (slidePrev)="slidePrev($event)"
          (slideNext)="slideNext($event)"
          (reachEnd)="reachEnd($event)"
          (reachStart)="reachStart($event)"
          (imagesLoaded)="imagesLoaded()"
          (indexSelected)="indexSelected($event)"
        >
        </app-carousel>
      </div>
    </div>
  `,
  moduleMetadata: modules,
});

const TemplateVerticalWithSlides = (args: any) => ({
  props: args,
  template: `
  <div
      style="
        height: 400px;
        display: flex;
        flex-direction: column;
        gap: 24px;
      "
    >
    <app-carousel
      [slidesPerView]="slidesPerView"
      [stepSlides]="stepSlides"
      [spaceBetween]="spaceBetween"
      [showControls]="showControls"
      [alwaysShowControls]="alwaysShowControls"
      [iconSize]="iconSize"
      [pagination]="pagination"
      [freeMode]="freeMode"
      [mouseWheel]="mouseWheel"
      [deltaPosition]="deltaPosition"
      [showProgress]="showProgress"
      [dotsControl]="dotsControl"
      [rewind]="rewind"
      [loop]="loop"
      [center]="center"
      [notCenterBounds]="notCenterBounds"
      [slideOnClick]="slideOnClick"
      [marginEnd]="marginEnd"
      [marginStart]="marginStart"
      [lazyLoading]="lazyLoading"
      [autoplay]="autoplay"
      [resistance]="resistance"
      [initialSlide]="initialSlide"
      [draggable]="draggable"
      [peekEdges]="peekEdges"
      [direction]="direction"
      [axis]="axis"
      (touched)="touched($event)"
      (slideUpdate)="slideUpdate($event)"
      (slidePrev)="slidePrev($event)"
      (slideNext)="slideNext($event)"
      (reachEnd)="reachEnd($event)"
      (reachStart)="reachStart($event)"
      (imagesLoaded)="imagesLoaded()"
      (indexSelected)="indexSelected($event)"
      [slides]="slides"
      [debug]="debug">
    </app-carousel>
    </div>
  `,
  moduleMetadata: modules,
});

export const ProjectedSlides: Story = {
  render: TemplateProjected,
  args: {
    slides: [],
  },
};

export const ExactSlidesPerView: Story = {
  render: TemplateWithSlides,
  args: { slides: buildSlides(10), slidesPerView: '4', freeMode: false },
};

export const PartialSlidesPerView: Story = {
  render: TemplateWithSlides,
  args: { slides: buildSlides(10), slidesPerView: '3.5', freeMode: false },
};

export const StepBy3: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(12),
    slidesPerView: '3',
    stepSlides: 3,
    freeMode: false,
  },
};

export const NoResistance: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(10),
    slidesPerView: '3',
    loop: false,
    resistance: false,
  },
};

export const NoResistanceFreeMode: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(20),
    slidesPerView: '3',
    freeMode: true,
    mouseWheel: true,
    loop: false,
    resistance: false,
  },
};

export const NoSlideOnClik: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(20),
    slidesPerView: '3',
    slideOnClick: false,
  },
};

export const FreeMode: Story = {
  render: TemplateWithSlides,
  args: { slides: buildSlides(12), slidesPerView: '3', freeMode: true },
};

export const NoSpace: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(12),
    slidesPerView: '3',
    spaceBetween: 0,
  },
};

export const FreeModeNoSpace: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(12),
    slidesPerView: '3',
    freeMode: true,
    spaceBetween: 0,
  },
};

export const InitialSlideMiddle: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(10),
    slidesPerView: '3',
    initialSlide: 4,
    loop: false,
  },
};

export const InitialSlideWithCenter: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(10),
    slidesPerView: '3',
    loop: false,
    center: true,
    initialSlide: 7,
  },
};

export const InitialSlideWithLoop: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(10),
    slidesPerView: '3',
    loop: true,
    initialSlide: 7,
  },
};

export const Looping: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(8),
    slidesPerView: '3',
    stepSlides: 2,
    loop: true,
    freeMode: false,
  },
};

export const Rewind: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(8),
    slidesPerView: '3',
    rewind: true,
    freeMode: false,
  },
};

export const Centered: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(9),
    slidesPerView: '3',
    center: true,
    freeMode: false,
  },
};

export const NotCenterBounds: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(9),
    slidesPerView: '3',
    center: true,
    notCenterBounds: true,
    freeMode: false,
  },
};

export const MouseWheelBool: Story = {
  render: TemplateWithSlides,
  args: { slides: buildSlides(12), slidesPerView: '3', mouseWheel: true },
};

export const MouseWheelHorizontal: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(12),
    slidesPerView: '3',
    mouseWheel: { horizontal: true, vertical: true },
  },
};

export const PaginationDynamicDots: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(10),
    slidesPerView: '3',
    pagination: { type: 'dynamic_dot', clickable: true, external: false },
  },
};

export const ResponsiveBreakpoints: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(12),
    freeMode: false,
    breakpoints: {
      '(max-width: 768px)': { slidesPerView: 1.5, spaceBetween: 2 },
      '(min-width: 769px) and (max-width: 1024px)': {
        slidesPerView: 2.5,
        spaceBetween: 5,
      },
      '(min-width: 1025px)': { slidesPerView: 3.5, spaceBetween: 1 },
    },
  },
};

export const SlidesPerViewAuto: Story = {
  render: TemplateWithSlides,
  args: {
    slides: Array.from({ length: 12 }, (_, i) =>
      img(i, 200 + (i % 4) * 60, 160)
    ),
    slidesPerView: 'auto' as any,
    freeMode: false,
  },
};

export const Margins: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(10),
    slidesPerView: '3',
    marginStart: 100,
    marginEnd: 150,
    freeMode: false,
  },
};

export const SpaceBetween: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(10),
    slidesPerView: '3',
    spaceBetween: 30,
    freeMode: false,
  },
};

export const OneSlide: Story = {
  render: TemplateWithSlides,
  args: { slides: buildSlides(1), slidesPerView: '1', freeMode: false },
};

export const TwoSlides: Story = {
  render: TemplateWithSlides,
  args: { slides: buildSlides(2), slidesPerView: '2', freeMode: false },
};

export const AutoPlay: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(8),
    slidesPerView: 3,
    stepSlides: 1,
    loop: true,
    autoplay: { delay: 1800, pauseOnHover: true, stopOnInteraction: true },
  },
  play: async ({ canvasElement, step }) => {
    const c = within(canvasElement);
    const nextBtn = await c
      .findByRole('button', { name: /next/i })
      .catch(() => null);
    if (!nextBtn) return;
    await step('Hover to pause', async () => {
      await userEvent.hover(canvasElement);
    });
    await new Promise((r) => setTimeout(r, 1000));
    await step('Unhover to resume', async () => {
      await userEvent.unhover(canvasElement);
    });
    await new Promise((r) => setTimeout(r, 1000));
  },
};

export const FewSlidesLessThanSlidesPerView: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(2),
    slidesPerView: '4',
    freeMode: false,
    loop: false,
  },
};

export const FewSlidesLoop: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(3),
    slidesPerView: '3',
    loop: true,
    rewind: false,
    freeMode: false,
  },
};

export const LoopAndCenter: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(10),
    slidesPerView: '3',
    loop: true,
    center: true,
    notCenterBounds: false,
    freeMode: false,
  },
};

export const CenterWithSpaceBetween: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(10),
    slidesPerView: '3',
    center: true,
    spaceBetween: 30,
    freeMode: false,
  },
};

export const CenterWithPartialSlidesPerView: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(10),
    slidesPerView: '2.5',
    center: true,
    freeMode: false,
  },
};

export const CenterWithMargins: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(10),
    slidesPerView: '3',
    center: true,
    marginStart: 40,
    marginEnd: 40,
  },
};

export const NonDraggable: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(10),
    slidesPerView: '3',
    draggable: false,
  },
};

export const WithRelativePeekEdges: Story = {
  render: TemplateWithSlides,
  args: {
    peekEdges: {
      relativeOffset: 0.25,
    },
    slides: buildSlides(10),
    slidesPerView: '3',
  },
};

export const DisabledSlides: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(10).map((el, index) => ({
      image: el,
      disabled: index === 2 || index === 5,
    })),
    slidesPerView: '3',
  },
};

export const RightToLeftCarousel: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(10),
    slidesPerView: '3.5',
    direction: 'rtl',
  },
};

export const VerticalCarousel: Story = {
  render: TemplateVerticalWithSlides,
  args: {
    slides: buildSlides(10),
    axis: 'vertical',
    slidesPerView: '4',
  },
};

export const VerticalCarouselWithPeek: Story = {
  render: TemplateVerticalWithSlides,
  args: {
    slides: buildSlides(10),
    axis: 'vertical',
    peekEdges: {
      relativeOffset: 0.25,
    },
    slidesPerView: '3',
  },
};

export const VerticalCenterCarousel: Story = {
  render: TemplateVerticalWithSlides,
  args: {
    slides: buildSlides(10),
    axis: 'vertical',
    center: true,
    slidesPerView: '3',
  },
};

export const Thumbs: Story = {
  render: TemplateWithThumbs,
  args: {
    slides: buildSlides(16),
  },
};

export const Interaction_NextPrev: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(9),
    slidesPerView: '3',
    stepSlides: 2,
    freeMode: false,
  },
  play: async ({ canvasElement, step }) => {
    const c = within(canvasElement);
    const nextBtn = await c.findByRole('button', { name: /next/i });
    const prevBtn = await c.findByRole('button', { name: /prev/i });

    await step('Next twice', async () => {
      await userEvent.click(nextBtn);
      await userEvent.click(nextBtn);
    });

    await step('Prev once', async () => {
      await userEvent.click(prevBtn);
    });
  },
};

export const Interaction_ClickDots: Story = {
  render: TemplateWithSlides,
  args: {
    slides: buildSlides(10),
    slidesPerView: '3',
    pagination: { type: 'dynamic_dot', clickable: true, external: false },
    freeMode: false,
  },
  play: async ({ canvasElement, step }) => {
    const c = within(canvasElement);
    const dots = await c
      .findAllByRole('button', { name: /dot/i })
      .catch(() => []);
    if (dots.length >= 3) {
      await step('Go to dot #3', async () => {
        await userEvent.click(dots[2]);
      });
    }
  },
};
