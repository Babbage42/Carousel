import { Directive, TemplateRef } from '@angular/core';

@Directive({
  selector: '[carouselNavLeft]',
  standalone: true,
})
export class CarouselNavLeftDirective {
  constructor(public templateRef: TemplateRef<any>) {}
}
