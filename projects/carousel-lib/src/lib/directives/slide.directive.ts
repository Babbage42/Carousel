import { Directive, Input, TemplateRef } from '@angular/core';

@Directive({
  selector: '[slide]',
})
export class SlideDirective {
  @Input('slide') slideId?: string;

  constructor(public templateRef: TemplateRef<any>) {}
}
