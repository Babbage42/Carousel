import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Input, Output } from '@angular/core';

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
export class PaginationComponent implements OnInit {
  @Input() pagination!: Pagination;
  @Input() currentPosition: number = 0;
  @Input() totalSlides: number = 0;
  @Input() totalSlidesVisible: number = 0;

  @Output() goToSlide: EventEmitter<number> = new EventEmitter<number>();

  constructor() {}

  ngOnInit(): void {}

  public slideTo(slide: number) {
    this.goToSlide.emit(slide);
  }

  get range(): number[] {
    return Array.from({ length: this.totalSlidesVisible }, (_, i) => i + 1);
  }
  get currentPositionVisible(): number {
    return Math.min(this.currentPosition, this.totalSlidesVisible - 1);
  }
  get dotLeftPosition(): number {
    return 6.5 / 2 - this.currentPositionVisible * 1.5 - 0.5 / 2;
  }
}
