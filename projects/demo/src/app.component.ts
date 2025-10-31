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

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CarouselComponent,
    NavigationLeftExternalComponent,
    NavigationRightExternalComponent,
    CommonModule,
    SlideDirective,
    CarouselNavLeftDirective,
    CarouselNavRightDirective,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'carousel';
}
