import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  OnInit,
  Input,
  Output,
  computed,
  input,
  inject,
} from '@angular/core';
import { CarouselStore } from '../../carousel.store';

type PaginationType = 'number' | 'dot' | 'dynamic_dot' | 'fraction';
export interface Pagination {
  type: PaginationType;
  clickable?: boolean;
  external?: boolean;
}

@Component({
  imports: [CommonModule],
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.scss'],
})
export class PaginationComponent {
  public readonly store = inject(CarouselStore);

  @Output() goToSlide: EventEmitter<number> = new EventEmitter<number>();

  public readonly dotWidth = 0.5;

  constructor() {}

  public readonly maxWidth = computed(() => {
    if (this.store.totalSlidesVisible() >= 5) {
      return 5 * 0.5 + 4 * 1;
    }

    if (this.store.totalSlidesVisible() === 4) {
      return 4 * 0.5 + 3 * 1;
    }

    return 3 * 0.5 + 2 * 1;
  });

  public slideTo(slide: number) {
    this.goToSlide.emit(slide);
  }

  public readonly range = computed(() =>
    Array.from({ length: this.store.totalSlidesVisible() }, (_, i) => i + 1)
  );
  public readonly currentPositionVisible = computed(() => {
    const realPaginationPosition = Math.max(
      0,
      this.store.currentPosition() - this.store.firstSlideAnchor()
    );
    return Math.min(
      realPaginationPosition,
      this.store.totalSlidesVisible() - 1
    );
  });

  private computedLeftPosition() {
    // maxwidth: 5 * 0.5rem + 4 * 1rem = 6.5

    // Default case : totalSlides >= 5
    // * - -   - * - -   - - * - -   - - * -  - - *
    if (this.store.totalSlidesVisible() >= 5) {
      return (
        (this.maxWidth() -
          (this.currentPositionVisible() * (this.maxWidth() - 0.5)) / 2 -
          0.5) /
        2
      );
    }
    // totalSlides = 4
    // maxwidth: 5
    // * - -   - * - -   - - * -   - - *
    // @todo
    if (this.store.totalSlidesVisible() === 4) {
      const middle = this.maxWidth() / 2;
      const firstLeft = middle - this.dotWidth / 2;
      const step = 1.5;
      return firstLeft - step * this.currentPositionVisible();
      // (
      //   (this.maxWidth() -
      //     (this.currentPositionVisible * (this.maxWidth() - 0.5)) / 2 -
      //     0.5) /
      //   2
      // );
    }

    // totalSlides = 3
    // maxWidth: 3.5
    //  * -    - * -    - *
    if (this.store.totalSlidesVisible() === 3) {
      return (
        (this.maxWidth() -
          this.currentPositionVisible() * (this.maxWidth() - 0.5) -
          0.5) /
        2
      );
    }

    return 0;
  }

  public readonly dotLeftPosition = computed(() => {
    const left = this.computedLeftPosition();
    return this.store.isRtl() ? -left : left;
  });
}
