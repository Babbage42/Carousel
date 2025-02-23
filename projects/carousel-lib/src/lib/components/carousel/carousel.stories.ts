import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { fn } from '@storybook/test';
import { CarouselComponent, SlideDirective } from 'carousel-lib';
import { NavigationComponent } from '../navigation/navigation.component';
import { PaginationComponent } from '../pagination/pagination.component';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories
const modules = {
  imports: [SlideDirective, NavigationComponent, PaginationComponent],
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
    centerBounds: {
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
  //args: { slideNext: fn() },
};

const Template = (args: CarouselComponent) => ({
  props: args,
  template: `
    <app-carousel
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
export const Default = Template.bind({});

export default meta;

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
