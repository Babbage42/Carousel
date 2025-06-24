import { CommonModule } from '@angular/common';
import {
  Component,
  ContentChild,
  effect,
  EventEmitter,
  forwardRef,
  Host,
  Inject,
  Input,
  OnInit,
  Optional,
  Output,
  TemplateRef,
  viewChild,
  ViewChild,
} from '@angular/core';
import { CarouselComponent } from '../carousel/carousel.component';
import { CarouselRegistryService } from '../carousel/carousel-registry.service';

@Component({
  selector: 'app-navigation-right-external',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navigation-right-external.component.html',
  styleUrl: './navigation-right-external.component.scss',
})
export class NavigationRightExternalComponent implements OnInit {
  @Input() carousel?: CarouselComponent;
  template?: TemplateRef<any>;

  ngOnInit(): void {
    if (this.carousel) {
      this.template =
        this.carousel.carouselRegistry.carouselNavigationRightSignal();
      this.carousel.carouselRegistry.hasExternalControls.set(true);
    }
  }
}
