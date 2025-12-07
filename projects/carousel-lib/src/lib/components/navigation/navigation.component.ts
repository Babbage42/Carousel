import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  ContentChild,
  effect,
  EventEmitter,
  inject,
  input,
  Input,
  OnInit,
  Output,
  TemplateRef,
  viewChild,
  ViewChild,
} from '@angular/core';
import { CarouselRegistryService } from '../carousel/carousel-registry.service';
import { CarouselStore } from '../../carousel.store';

@Component({
  selector: 'app-navigation',
  imports: [CommonModule],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.scss',
})
export class NavigationComponent {
  public readonly store = inject(CarouselStore);
  public readonly carouselRegistry = inject(CarouselRegistryService);

  @Input() customLeftArrow?: TemplateRef<any>;
  @Input() customRightArrow?: TemplateRef<any>;

  @Output() slidePrev = new EventEmitter<void>();
  @Output() slideNext = new EventEmitter<void>();
  @Output() slideTo = new EventEmitter<number>();

  @Input() alwaysShowControls = false;
  @Input() loop = false;
  @Input() rewind = false;
  @Input() currentPosition = 0;
  @Input() totalSlides = 0;
  iconSize = input(0);

  public readonly hasReachedStart = computed(() => {
    if (this.store.navigateSlideBySlide()) {
      return this.store.currentRealPosition() === 0;
    }
    return this.store.hasReachedStart();
  });

  public readonly hasReachedEnd = computed(() => {
    if (this.store.navigateSlideBySlide()) {
      return this.store.currentRealPosition() === this.store.totalSlides() - 1;
    }
    return this.store.hasReachedEnd();
  });

  public readonly showPrevControl = computed(() => {
    return this.store.currentPosition() > 0 && !this.hasReachedStart();
  });
  public readonly showNextControl = computed(() => {
    return (
      this.store.currentPosition() < this.store.totalSlides() - 1 &&
      !this.hasReachedEnd()
    );
  });

  public readonly showLeftControl = computed(() => {
    return this.store.isRtl() ? this.showNextControl() : this.showPrevControl();
  });
  public readonly showRightControl = computed(() => {
    return this.store.isRtl() ? this.showPrevControl() : this.showNextControl();
  });

  public readonly topLeftControl = computed(() => {
    if (this.carouselRegistry.hasExternalControls()) {
      return null;
    }
    if (this.store.isVertical()) {
      return 0;
    }
    return 'calc(50% - ' + this.iconSize() / 2 + 'px)';
  });
  public readonly topRightControl = computed(() => {
    if (!this.store.isVertical()) {
      return this.topLeftControl();
    }
    if (this.carouselRegistry.hasExternalControls()) {
      return null;
    }
    return 'calc(100% - ' + this.iconSize() + 'px)';
  });
  public readonly leftLeftControl = computed(() => {
    if (this.carouselRegistry.hasExternalControls()) {
      return null;
    }
    if (this.store.isVertical()) {
      return 'calc(50% - ' + this.iconSize() / 2 + 'px)';
    }
    return 0;
  });
  public readonly rightRightControl = computed(() => {
    if (this.carouselRegistry.hasExternalControls()) {
      return null;
    }
    if (this.store.isVertical()) {
      return 'calc(50% - ' + this.iconSize() / 2 + 'px)';
    }
    return 0;
  });

  public leftControl = viewChild<TemplateRef<any>>('leftControl');
  public rightControl = viewChild<TemplateRef<any>>('rightControl');

  public slideToPrev() {
    this.store.isRtl() ? this.slideNext.emit() : this.slidePrev.emit();
  }

  public slideToNext() {
    this.store.isRtl() ? this.slidePrev.emit() : this.slideNext.emit();
  }
}
