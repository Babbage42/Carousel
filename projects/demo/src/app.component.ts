import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
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
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'carousel';
}
