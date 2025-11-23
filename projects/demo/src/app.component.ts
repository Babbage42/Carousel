import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  CarouselComponent,
  CarouselNavLeftDirective,
  CarouselNavRightDirective,
  SlideDirective,
  NavigationLeftExternalComponent,
  NavigationRightExternalComponent,
} from 'carousel-lib';
import { RandomSrcPipe } from '../../carousel-lib/src/lib/pipes/random-src.pipe';

@Component({
  selector: 'app-root',
  imports: [
    CarouselComponent,
    NavigationLeftExternalComponent,
    NavigationRightExternalComponent,
    CommonModule,
    SlideDirective,
    CarouselNavLeftDirective,
    CarouselNavRightDirective,
    RandomSrcPipe,
  ],
  providers: [RandomSrcPipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  randomSrc = inject(RandomSrcPipe);
  title = 'carousel';

  updateRandomSlides() {
    const random = Math.round((Math.random() + 1) * 20);
    const slides = [];
    for (let i = 0; i < random; i++) {
      slides.push(this.randomSrc.transform(300, 200));
    }
    this.randomSlides.set(slides);
  }

  updateForceSlideTo(value: number) {
    this.slideTo.set(value);
  }

  randomSlides = signal([
    this.randomSrc.transform(300, 200),
    this.randomSrc.transform(300, 200),
  ]);

  slideTo = signal<number | undefined>(undefined);
}
