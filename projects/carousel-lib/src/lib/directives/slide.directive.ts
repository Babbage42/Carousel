import { Directive, Input, TemplateRef } from '@angular/core';

@Directive({
  selector: '[slide]',
})
export class SlideDirective {
  @Input('slide') slideId?: string;
  @Input() slideDisabled = false;

  constructor(public templateRef: TemplateRef<any>) {}
}
