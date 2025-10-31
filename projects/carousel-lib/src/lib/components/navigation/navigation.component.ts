import { CommonModule } from '@angular/common';
import {
  Component,
  ContentChild,
  effect,
  EventEmitter,
  Input,
  OnInit,
  Output,
  TemplateRef,
  viewChild,
  ViewChild,
} from '@angular/core';
import { CarouselRegistryService } from '../carousel/carousel-registry.service';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.scss',
})
export class NavigationComponent implements OnInit {
  ngOnInit(): void {}

  @Input() customLeftArrow?: TemplateRef<any>;
  @Input() customRightArrow?: TemplateRef<any>;

  @Output() slidePrev = new EventEmitter<void>();
  @Output() slideNext = new EventEmitter<void>();
  @Output() slideTo = new EventEmitter<number>();

  @Input() alwaysShowControls = false;
  @Input() loop = false;
  @Input() rewind = false;
  @Input() currentPosition = 0;
  @Input() hasReachedStart = false;
  @Input() hasReachedEnd = false;
  @Input() totalSlides = 0;
  @Input() iconSize = 0;

  public leftControl = viewChild<TemplateRef<any>>('leftControl');
  public rightControl = viewChild<TemplateRef<any>>('rightControl');

  constructor(public readonly carouselRegistry: CarouselRegistryService) {}

  public slideToPrev() {
    this.slidePrev.emit();
    // let newPos = this.currentPosition;
    // if (this.rewind || this.loop) {
    //   newPos =
    //     this.currentPosition - 1 < 0
    //       ? this.totalSlides - 1
    //       : this.currentPosition - 1;
    // } else {
    //   newPos = Math.max(0, this.currentPosition - 1);
    // }
    // this.slideTo.emit(newPos);
  }

  public slideToNext() {
    this.slideNext.emit();
    // let newPos = this.currentPosition;
    // if (this.rewind || this.loop) {
    //   newPos =
    //     this.currentPosition + 1 > this.totalSlides - 1
    //       ? 0
    //       : this.currentPosition + 1;
    // } else {
    //   newPos = Math.min(this.totalSlides - 1, this.currentPosition + 1);
    // }
    // this.slideTo.emit(newPos);
  }
}
