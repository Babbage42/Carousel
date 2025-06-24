import { Directive, TemplateRef } from '@angular/core';

@Directive({
  selector: '[carouselNavRight]',
  standalone: true,
})
export class CarouselNavRightDirective {
  constructor(public templateRef: TemplateRef<any>) {}
}
