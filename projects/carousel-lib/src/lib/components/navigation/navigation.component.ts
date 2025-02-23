import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.scss',
})
export class NavigationComponent {
  @Output() slidePrev = new EventEmitter<void>();
  @Output() slideNext = new EventEmitter<void>();
  @Output() slideTo = new EventEmitter<number>();

  @Input() loop = false;
  @Input() rewind = false;
  @Input() currentPosition = 0;
  @Input() hasReachedStart = false;
  @Input() hasReachedEnd = false;
  @Input() totalSlides = 0;
  @Input() iconSize = 0;

  public slideToPrev() {
    this.slidePrev.emit();
    let newPos = this.currentPosition;
    if (this.rewind || this.loop) {
      newPos =
        this.currentPosition - 1 < 0
          ? this.totalSlides - 1
          : this.currentPosition - 1;
    } else {
      newPos = Math.max(0, this.currentPosition - 1);
    }
    this.slideTo.emit(newPos);
  }

  public slideToNext() {
    this.slideNext.emit();
    let newPos = this.currentPosition;
    if (this.rewind || this.loop) {
      newPos =
        this.currentPosition + 1 > this.totalSlides - 1
          ? 0
          : this.currentPosition + 1;
    } else {
      newPos = Math.min(this.totalSlides - 1, this.currentPosition + 1);
    }
    this.slideTo.emit(newPos);
  }
}
