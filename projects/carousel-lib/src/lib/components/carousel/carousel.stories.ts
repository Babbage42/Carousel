import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { fn } from '@storybook/test';
import {
  CarouselComponent,
  CarouselNavLeftDirective,
  CarouselNavRightDirective,
  SlideDirective,
  PaginationComponent,
  NavigationComponent,
} from 'carousel-lib';

const slides = [
  'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
  'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
  'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
  'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
  'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
];

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories
const modules = {
  imports: [
    SlideDirective,
    NavigationComponent,
    PaginationComponent,
    CarouselNavLeftDirective,
    CarouselNavRightDirective,
  ],
};

const actions = {
  slideNext: {
    action: 'slide next',
  },
  slidePrev: {
    action: 'slide prev',
  },
  slideUpdate: {
    action: 'slide update',
  },
  reachStart: {
    action: 'has reached start',
  },
  reachEnd: {
    action: 'has reached end',
  },
  touched: {
    action: 'has been touched',
  },
};
const meta: Meta<CarouselComponent> = {
  title: 'Carousel',
  component: CarouselComponent,
  tags: ['autodocs'],
  argTypes: {
    slides: {
      control: 'object',
    },
    slidesPerView: {
      control: 'text',
    },
    spaceBetween: {
      control: 'number',
    },
    showControls: {
      control: 'boolean',
    },
    iconSize: {
      control: 'number',
    },
    pagination: {
      control: 'object',
    },
    initialSlide: {
      control: 'number',
    },
    freeMode: {
      control: 'boolean',
    },
    deltaPosition: {
      control: 'number',
    },
    showProgress: {
      control: 'boolean',
    },
    dotsControl: {
      control: 'boolean',
    },
    rewind: {
      control: 'boolean',
    },
    loop: {
      control: 'boolean',
    },
    center: {
      control: 'boolean',
    },
    notCenterBounds: {
      control: 'boolean',
    },
    slideOnClick: {
      control: 'boolean',
    },
    marginEnd: {
      control: 'number',
    },
    marginStart: {
      control: 'number',
    },
    lazyLoading: {
      control: 'boolean',
    },
    breakpoints: {
      control: 'object',
    },
    ...actions,
  },
  args: {
    slides,
  },
  //args: { slideNext: fn() },
};
export default meta;

const slidesDefault = [
  'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
  'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
  'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
  'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
  'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
  'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
  'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
  'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
  'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
  'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
];

const Template = (args: CarouselComponent) => ({
  props: args,
  template: `
    <app-carousel
      (touched)="touched($event)"
      (slideUpdate)="slideUpdate($event)"
      (slidePrev)="slidePrev($event)"
      (slideNext)="slideNext($event)"
      (reachEnd)="reachEnd($event)"
      (reachStart)="reachStart($event)"
    >
      <div *slide>
      <img src='https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif'>
      </div>
      <div *slide>
      <img src='https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif'>
      </div>
      <div *slide>
      <img src='https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif'>
      </div>
      <div *slide>
      <img src='https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif'>
      </div>
      <div *slide>
      <img src='https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif'>
      </div>
      <div *slide>
      <img src='https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif'>
      </div>
      <div *slide>
      <img src='https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif'>
      </div>
      <div *slide>
      <img  src='https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif'>
      </div>
      <div *slide>
      <img src='https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif'>
      </div>
    </app-carousel>
  `,
  moduleMetadata: modules,
});
const TemplateWithProjectedNavigation = (args: CarouselComponent) => ({
  props: args,
  template: `
    <app-carousel
      [slides]="${JSON.stringify(slidesDefault).replaceAll('"', "'")}"
      (touched)="touched($event)"
      (slideUpdate)="slideUpdate($event)"
      (slidePrev)="slidePrev($event)"
      (slideNext)="slideNext($event)"
      (reachEnd)="reachEnd($event)"
      (reachStart)="reachStart($event)"
    >
      <ng-template carouselNavLeft>
<span>TEST LEFT</span></ng-template>

      <div *carouselNavLeft><span>TEST LEFT</span></div>
      <div *carouselNavRight><span>TEST RIGHT</span></div>
    </app-carousel>
  `,
  moduleMetadata: modules,
});

export const Default = Template.bind({});

export const CarouselWithProjectedNavigation =
  TemplateWithProjectedNavigation.bind({ slides: slidesDefault });

type Story = StoryObj<CarouselComponent>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args

export const PrimaryExactSlidesPerView: Story = {
  args: {
    slidesPerView: 4,
    freeMode: false,
    slides: [
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
    ],
  },
};

export const PrimaryPartialSlidesPerView: Story = {
  args: {
    slidesPerView: 3.5,
    freeMode: false,
    slides: [
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
    ],
  },
};

export const Freemode: Story = {
  args: {
    freeMode: true,
    slides: [
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
    ],
  },
};

export const FreemodeNoSpace: Story = {
  args: {
    freeMode: true,
    spaceBetween: 0,
    slides: [
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
    ],
  },
};

export const SingleSlide: Story = {
  args: {
    slidesPerView: 1,
    freeMode: false,
    slides: [
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
    ],
  },
};

export const SingleSlideFreemode: Story = {
  args: {
    slidesPerView: 1,
    freeMode: true,
    slides: [
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
    ],
  },
};

export const SingleSlideFreemodeNoSpace: Story = {
  args: {
    spaceBetween: 0,
    slidesPerView: 1,
    freeMode: true,
    slides: [
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
      'https://images.justwatch.com/poster/176304604/s166/pirates-des-caraibes-i-la-malediction-du-black-pearl.avif',
    ],
  },
};

export const MouseWheel: StoryObj<CarouselComponent> = {
  args: {
    slidesPerView: 3,
    mouseWheel: true,
  },
};

export const PaginationDynamique: StoryObj<CarouselComponent> = {
  args: {
    slidesPerView: 3,
    pagination: { type: 'dynamic_dot', clickable: true, external: false },
  },
};

export const Responsive: StoryObj<CarouselComponent> = {
  args: {
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

export const Centre: StoryObj<CarouselComponent> = {
  args: {
    center: true,
    freeMode: false,
  },
};

export const NgContent: StoryObj<CarouselComponent> = {
  render: () => ({
    template: `
      <app-carousel>
        <div *slide><span>Slide 1</span></div>
        <div *slide><img src="${slides[0]}" width="50"/></div>
        <div *slide><span>Slide 3</span></div>
      </app-carousel>
    `,
  }),
};

export const Loop: StoryObj<CarouselComponent> = {
  args: {
    slidesPerView: 3,
    loop: true,
  },
};

export const Rewind: StoryObj<CarouselComponent> = {
  args: {
    slidesPerView: 3,
    rewind: true,
  },
};

export const LazyLoading: StoryObj<CarouselComponent> = {
  args: {
    slidesPerView: 3,
    lazyLoading: true,
  },
};

export const SlidesPerViewAuto: StoryObj<CarouselComponent> = {
  args: {
    slidesPerView: 'auto',
  },
};

export const Marges: StoryObj<CarouselComponent> = {
  args: {
    slidesPerView: 3,
    marginStart: 50,
    marginEnd: 150,
  },
};

export const SpaceBetween: StoryObj<CarouselComponent> = {
  args: {
    slidesPerView: 3,
    spaceBetween: 30,
  },
};

export const ManySlides: StoryObj<CarouselComponent> = {
  args: {
    slides: Array(20).fill(slides[0]),
    slidesPerView: 5,
  },
};
