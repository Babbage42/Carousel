import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  OnInit,
  Input,
  Output,
  computed,
  input,
} from '@angular/core';

type PaginationType = 'number' | 'dot' | 'dynamic_dot' | 'fraction';
export interface Pagination {
  type: PaginationType;
  clickable?: boolean;
  external?: boolean;
}

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.scss'],
})
export class PaginationComponent {
  @Input() pagination!: Pagination;
  @Input() currentPosition: number = 0;
  @Input() firstSlideAnchor: number = 0;
  @Input() lastSlideAnchor: number = 0;
  @Input() totalSlides: number = 0;
  totalSlidesVisible = input(0);

  @Output() goToSlide: EventEmitter<number> = new EventEmitter<number>();

  public readonly dotWidth = 0.5;

  constructor() {}

  public readonly maxWidth = computed(() => {
    if (this.totalSlidesVisible() >= 5) {
      return 5 * 0.5 + 4 * 1;
    }

    if (this.totalSlidesVisible() === 4) {
      return 4 * 0.5 + 3 * 1;
    }

    return 3 * 0.5 + 2 * 1;
  });

  public slideTo(slide: number) {
    this.goToSlide.emit(slide);
  }

  get range(): number[] {
    return Array.from({ length: this.totalSlidesVisible() }, (_, i) => i + 1);
  }
  get currentPositionVisible(): number {
    const realPaginationPosition = Math.max(
      0,
      this.currentPosition - this.firstSlideAnchor
    );
    return Math.min(realPaginationPosition, this.totalSlidesVisible() - 1);
  }
  get dotLeftPosition(): number {
    // maxwidth: 5 * 0.5rem + 4 * 1rem = 6.5

    // Default case : totalSlides >= 5
    // * - -   - * - -   - - * - -   - - * -  - - *
    if (this.totalSlidesVisible() >= 5) {
      return (
        (this.maxWidth() -
          (this.currentPositionVisible * (this.maxWidth() - 0.5)) / 2 -
          0.5) /
        2
      );
    }
    // totalSlides = 4
    // maxwidth: 5
    // * - -   - * - -   - - * -   - - *
    // @todo
    if (this.totalSlidesVisible() === 4) {
      const middle = this.maxWidth() / 2;
      const firstLeft = middle - this.dotWidth / 2;
      const step = 1.5;
      return firstLeft - step * this.currentPositionVisible;
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
    if (this.totalSlidesVisible() === 3) {
      return (
        (this.maxWidth() -
          this.currentPositionVisible * (this.maxWidth() - 0.5) -
          0.5) /
        2
      );
    }

    return 0;
  }
}
